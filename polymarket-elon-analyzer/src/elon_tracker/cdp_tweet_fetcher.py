#!/usr/bin/env python3
"""
CDP Tweet Fetcher - 通过 OpenClaw 浏览器 CDP 抓取推文
使用浏览器内 JavaScript 直接提取 DOM 数据，不依赖外部库
"""
import asyncio
import json
import math
import re
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
sys.path.insert(0, str(PROJECT_ROOT))

import httpx
from loguru import logger

# OpenClaw browser CDP
CDP_URL = "http://127.0.0.1:18800"
TARGET_ID = "D126B3E0FE8FC65D2D44E86B2AFEA227"  # X.com tab


def cdp_cmd(method: str, params: dict = None) -> dict:
    """发送 CDP 命令"""
    payload = {"method": method, "params": params or {}, "id": 1}
    try:
        r = httpx.post(f"{CDP_URL}/json", timeout=10)
        # Get the WebSocket URL for the target
        targets = r.json()
        target_ws = None
        for t in targets:
            if t.get("id") == TARGET_ID or "D126B3E0FE8FC65D2D44E86B2AFEA227" in str(t.get("id", "")):
                target_ws = t.get("webSocketDebuggerUrl")
                break
        if not target_ws:
            # Try first available target
            if targets:
                target_ws = targets[0].get("webSocketDebuggerUrl")
    except Exception as e:
        logger.error(f"CDP connect error: {e}")
        return {}


async def get_cdp_ws_url(target_id: str) -> Optional[str]:
    """获取 CDP WebSocket URL"""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{CDP_URL}/json")
            targets = r.json()
            for t in targets:
                if target_id in str(t.get("id", "")):
                    return t.get("webSocketDebuggerUrl")
            if targets:
                return targets[0].get("webSocketDebuggerUrl")
    except Exception as e:
        logger.error(f"CDP targets error: {e}")
    return None


async def cdp_evaluate(client, ws_url: str, expr: str) -> dict:
    """通过 CDP 执行 JS 并获取结果"""
    try:
        import websockets
        async with websockets.connect(ws_url, ping_interval=None) as ws:
            msg_id = 1
            await ws.send(json.dumps({
                "id": msg_id,
                "method": "Runtime.evaluate",
                "params": {"expression": expr, "returnByValue": True}
            }))
            async for msg in ws:
                data = json.loads(msg)
                if data.get("id") == msg_id:
                    return data.get("result", {})
    except Exception as e:
        logger.error(f"CDP eval error: {e}")
    return {}


async def scrape_via_cdp(target_id: str, min_tweets: int = 50) -> List[dict]:
    """通过 CDP WebSocket 抓取推文"""
    ws_url = await get_cdp_ws_url(target_id)
    if not ws_url:
        logger.error("No CDP WebSocket URL found")
        return []

    logger.info(f"Connected to CDP: {ws_url[:50]}...")

    try:
        import websockets
        async with websockets.connect(ws_url, ping_interval=None, max_size=10*1024*1024) as ws:
            msg_id = 0

            async def send(method, params=None):
                nonlocal msg_id
                msg_id += 1
                await ws.send(json.dumps({
                    "id": msg_id,
                    "method": method,
                    "params": params or {}
                }))

            async def recv():
                async for msg in ws:
                    return json.loads(msg)

            # 等待页面加载
            await send("Page.enable")
            await send("Runtime.enable")

            # JS: 提取推文的函数
            extract_js = """
            (function() {
                const articles = document.querySelectorAll('article[role="article"]');
                const results = [];
                for (const art of articles) {
                    try {
                        // ID
                        let postId = '';
                        const links = art.querySelectorAll('a[href*="/status/"]');
                        for (const l of links) {
                            const m = l.href.match(/\/status\/(\\d+)/);
                            if (m) { postId = m[1]; break; }
                        }
                        if (!postId) continue;

                        // Time
                        const timeEl = art.querySelector('time');
                        let ts = '';
                        let tsAttr = '';
                        if (timeEl) {
                            ts = timeEl.innerText;
                            tsAttr = timeEl.getAttribute('datetime') || '';
                        }

                        // Text
                        const textEl = art.querySelector('[data-testid="tweetText"]');
                        const text = textEl ? textEl.innerText : '';

                        // Engagement
                        const getCount = (sel) => {
                            const el = art.querySelector(sel);
                            if (!el) return 0;
                            const s = el.innerText.replace(/,/g, '').trim();
                            const m = s.match(/^[\\d.]+(万|亿|K|M)?/);
                            if (!m) return parseInt(s) || 0;
                            let n = parseFloat(m[0]);
                            if (s.includes('万')) n *= 10000;
                            else if (s.includes('亿')) n *= 100000000;
                            else if (s.includes('K')) n *= 1000;
                            else if (s.includes('M')) n *= 1000000;
                            return Math.floor(n);
                        };

                        const likes = getCount('[data-testid="like"]');
                        const retweets = getCount('[data-testid="retweet"]');
                        const replies = getCount('[data-testid="reply"]');
                        const viewsEl = art.querySelector('[data-testid="viewCount"]');
                        const views = viewsEl ? getCount('[data-testid="viewCount"]') : 0;

                        const isPinned = !!(art.querySelector('[data-testid="pin"]'));
                        const hasMedia = !!(art.querySelector('[data-testid="tweetPhoto"]') || art.querySelector('[data-testid="card"]'));
                        const isReply = !!(art.querySelector('[data-testid="socialContext"]') && art.innerText.includes('回复'));

                        results.push({
                            postId, text, ts, tsAttr,
                            likes, retweets, replies, views,
                            isPinned, hasMedia, isReply
                        });
                    } catch(e) {}
                }
                return results;
            })()
            """

            all_tweets = []
            seen_ids = set()
            last_count = 0

            for scroll_num in range(20):
                await asyncio.sleep(2)

                # 执行提取 JS
                msg_id += 1
                await ws.send(json.dumps({
                    "id": msg_id,
                    "method": "Runtime.evaluate",
                    "params": {"expression": extract_js, "returnByValue": True, "timeout": 10000}
                }))

                # 收集响应
                response = None
                while True:
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=5)
                        data = json.loads(msg)
                        if data.get("id") == msg_id:
                            response = data.get("result", {}).get("result", {})
                            break
                    except asyncio.TimeoutError:
                        break

                tweets_js = []
                if response and response.get("type") == "object":
                    tweets_js = response.get("value", [])

                new_count = 0
                for t in tweets_js:
                    pid = t.get("postId", "")
                    if pid and pid not in seen_ids:
                        seen_ids.add(pid)
                        all_tweets.append(t)
                        new_count += 1

                logger.info(f"Scroll {scroll_num+1}: +{new_count} new, total={len(all_tweets)}")

                if len(all_tweets) >= min_tweets:
                    break

                # 滚动
                msg_id += 1
                await ws.send(json.dumps({
                    "id": msg_id,
                    "method": "Runtime.evaluate",
                    "params": {
                        "expression": "window.scrollTo(0, document.body.scrollHeight)",
                        "returnByValue": False
                    }
                }))
                await asyncio.sleep(1.5)

            return all_tweets

    except Exception as e:
        logger.error(f"CDP WebSocket error: {e}")
        return []


def parse_tweets_to_objects(tweets_raw: List[dict], ref_time: datetime) -> List[dict]:
    """将原始 JS 数据转换为结构化推文"""
    results = []
    for t in tweets_raw:
        ts_str = t.get("tsAttr", "") or t.get("ts", "")
        # 解析 ISO 时间
        dt = None
        if ts_str:
            try:
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
            except:
                pass

        if not dt:
            # 尝试解析相对时间
            m = re.search(r"(\d+)\s*(小时|天|周|分钟)\s*前", t.get("ts", ""))
            if m:
                val = int(m.group(1))
                unit = m.group(2)
                delta_map = {
                    "分钟": timedelta(minutes=val),
                    "小时": timedelta(hours=val),
                    "天": timedelta(days=val),
                    "周": timedelta(weeks=val),
                }
                dt = ref_time - delta_map.get(unit, timedelta())

        if not dt:
            continue

        results.append({
            "post_id": t.get("postId", ""),
            "text": t.get("text", ""),
            "timestamp": dt.isoformat(),
            "timestamp_str": t.get("ts", ""),
            "hour": dt.hour,
            "weekday": dt.strftime("%A"),
            "likes": t.get("likes", 0),
            "retweets": t.get("retweets", 0),
            "replies": t.get("replies", 0),
            "views": t.get("views", 0),
            "is_pinned": t.get("isPinned", False),
            "has_media": t.get("hasMedia", False),
        })
    return results


async def main():
    print("Starting CDP tweet fetch via OpenClaw browser...")
    ref_time = datetime.now()

    raw_tweets = await scrape_via_cdp(TARGET_ID, min_tweets=50)

    if not raw_tweets:
        print("No tweets retrieved")
        return

    tweets = parse_tweets_to_objects(raw_tweets, ref_time)
    tweets.sort(key=lambda x: x["timestamp"], reverse=True)

    print(f"\nFetched {len(tweets)} tweets")
    print(f"Date range: {tweets[-1]['timestamp'][:19] if tweets else 'N/A'} -> {tweets[0]['timestamp'][:19] if tweets else 'N/A'}")
    print()

    # 时间分布
    hourly = {h: 0 for h in range(24)}
    for t in tweets:
        hourly[t["hour"]] = hourly.get(t["hour"], 0) + 1

    print("Hour distribution (UTC):")
    max_h = max(hourly.values()) if hourly.values() else 1
    for h in range(24):
        bar = "█" * int(hourly[h] / max_h * 30)
        print(f"  {h:02d}:00  {hourly[h]:3d}  {bar}")
    print()

    # 速度分析
    now = ref_time
    recent_posts = []
    for h in [1, 3, 6, 12, 24]:
        cutoff = now - timedelta(hours=h)
        recent = [t for t in tweets if datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00")) >= cutoff]
        rate = len(recent) / h * 24 if h > 0 else 0
        print(f"  Last {h}h: {len(recent)} tweets -> {rate:.1f} posts/day")

    print()
    print("Recent tweets:")
    for t in tweets[:15]:
        ts = t["timestamp"][:16].replace("T", " ")
        text_p = t["text"][:70] + "..." if len(t["text"]) > 70 else t["text"]
        print(f"  [{ts}] {text_p}")
        print(f"    ❤️{t['likes']:,} 🔁{t['retweets']:,} 👁{t['views']:,} | {'📌' if t['is_pinned'] else ''}{'🖼' if t['has_media'] else ''}")

    # 保存
    out_dir = PROJECT_ROOT / "data" / "tweets"
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = ref_time.strftime("%Y%m%d_%H%M%S")
    fp = out_dir / f"tweets_cdp_{ts}.json"

    save_data = {
        "fetched_at": ref_time.isoformat(),
        "method": "cdp",
        "count": len(tweets),
        "tweets": tweets,
        "hourly_dist": hourly,
    }
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(save_data, f, ensure_ascii=False, indent=2)
    print(f"\nSaved: {fp}")


if __name__ == "__main__":
    asyncio.run(main())
