#!/usr/bin/env python3
"""
Async CDP Tweet Fetcher - 通过 WebSocket CDP 持续滚动抓取
使用 Python asyncio + websockets 直接连接 OpenClaw 浏览器 CDP
"""
import asyncio
import json
import re
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()

CDP_WS = "ws://127.0.0.1:18800/devtools/page/FEA78C3D731CF66DBD609CAA8D793537"
MAX_MSG_SIZE = 50 * 1024 * 1024  # 50MB


def extract_count(s):
    if not s:
        return 0
    s = s.strip().replace(",", "")
    m = re.match(r"([\d.]+)(万|亿|K|M|B)?", s)
    if not m:
        return 0
    num = float(m.group(1))
    unit = m.group(2) or ""
    multipliers = {"万": 10000, "亿": 100000000, "K": 1000, "M": 1000000, "B": 1000000000}
    return int(num * multipliers.get(unit, 1))


async def send_ws(ws, msg_id, method, params=None):
    payload = {"id": msg_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(payload))
    return msg_id


async def recv_ws(ws, expected_id):
    while True:
        msg = await ws.recv()
        data = json.loads(msg)
        if data.get("id") == expected_id:
            return data


async def cdp_evaluate(ws, expr, timeout=15):
    """执行 JS 并返回结果"""
    msg_id = 1
    await send_ws(ws, msg_id, "Runtime.evaluate", {
        "expression": expr,
        "returnByValue": True,
        "timeout": timeout * 1000,
    })
    resp = await asyncio.wait_for(recv_ws(ws, msg_id), timeout=timeout + 2)
    return resp.get("result", {}).get("result", {})


async def scroll_and_scrape(ws, n_scrolls=20, min_tweets=80):
    """滚动 + 抓取"""
    extract_js = r"""
    (function() {
        const seen = new Set();
        const results = [];
        const articles = document.querySelectorAll('article[role="article"]');
        for (const a of articles) {
            try {
                let pid = '';
                const links = a.querySelectorAll('a[href]');
                for (const l of links) {
                    const m = l.href.match(/\/status\/(\d+)/);
                    if (m) { pid = m[1]; break; }
                }
                if (!pid || seen.has(pid)) continue;
                seen.add(pid);

                const tEl = a.querySelector('time');
                const tsAttr = tEl ? (tEl.getAttribute('datetime') || '') : '';
                const tsText = tEl ? tEl.innerText : '';
                const txtEl = a.querySelector('[data-testid="tweetText"]');
                const txt = txtEl ? txtEl.innerText : '';

                const cnt = (sel) => {
                    const e = a.querySelector(sel);
                    if (!e) return 0;
                    const s = e.innerText.replace(/,/g,'');
                    const m2 = s.match(/^([\d.]+)(万|亿|K|M)?/);
                    if (!m2) return 0;
                    let n = parseFloat(m2[1]);
                    if (s.includes('万')) n *= 10000;
                    else if (s.includes('亿')) n *= 1e8;
                    else if (s.includes('K')) n *= 1000;
                    else if (s.includes('M')) n *= 1e6;
                    return Math.floor(n);
                };
                const likes = cnt('[data-testid="like"]');
                const rts = cnt('[data-testid="retweet"]');
                const rps = cnt('[data-testid="reply"]');
                const vEl = a.querySelector('[data-testid="viewCount"]');
                const views = vEl ? cnt('[data-testid="viewCount"]') : 0;
                const pinned = !!(a.querySelector('[data-testid="pin"]'));
                const media = !!(a.querySelector('[data-testid="tweetPhoto"]') || a.querySelector('[data-testid="card"]'));

                results.push({pid, tsAttr, tsText, txt, likes, rts, rps, views, pinned, media});
            } catch(e) {}
        }
        return JSON.stringify(results);
    })()
    """

    all_tweets = []
    seen_ids = set()
    ref_time = datetime.now()

    for scroll_num in range(n_scrolls):
        await asyncio.sleep(2)

        result = await cdp_evaluate(ws, extract_js, timeout=20)
        raw = result.get("value", "[]")
        try:
            tweets_js = json.loads(raw)
        except:
            tweets_js = []

        new_this = 0
        for t in tweets_js:
            pid = t.get("pid", "")
            if pid and pid not in seen_ids:
                seen_ids.add(pid)

                # Parse timestamp
                ts_str = t.get("tsAttr", "")
                dt = None
                if ts_str:
                    try:
                        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                    except:
                        pass

                if not dt:
                    ts_text = t.get("tsText", "")
                    m = re.search(r"(\d+)\s*(小时|天|周|分钟)\s*前", ts_text)
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

                parsed = {
                    "post_id": pid,
                    "text": t.get("txt", ""),
                    "timestamp": dt.isoformat(),
                    "hour": dt.hour,
                    "weekday": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][dt.weekday()],
                    "likes": t.get("likes", 0),
                    "retweets": t.get("rts", 0),
                    "replies": t.get("rps", 0),
                    "views": t.get("views", 0),
                    "is_pinned": t.get("pinned", False),
                    "has_media": t.get("media", False),
                }
                all_tweets.append(parsed)
                new_this += 1

        print(f"  Scroll {scroll_num+1:2d}: +{new_this:3d} new, total={len(all_tweets)}")

        if len(all_tweets) >= min_tweets:
            print(f"  Reached min_tweets={min_tweets}")
            break

        # 滚动
        await cdp_evaluate(ws, "window.scrollTo(0, document.body.scrollHeight)", timeout=5)
        await asyncio.sleep(1.5)

    all_tweets.sort(key=lambda x: x["timestamp"], reverse=True)
    return all_tweets


async def analyze_tweets(tweets):
    """分析推文"""
    now = datetime.now()

    hourly = {h: 0 for h in range(24)}
    dow = {d: 0 for d in range(7)}

    for t in tweets:
        try:
            dt = datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00"))
            hourly[dt.hour] += 1
            dow[dt.weekday()] += 1
        except:
            pass

    velocities = {}
    for h in [1, 3, 6, 12, 24, 48, 72]:
        cutoff = now - timedelta(hours=h)
        recent = []
        for t in tweets:
            try:
                dt = datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00"))
                if dt >= cutoff:
                    recent.append(t)
            except:
                pass
        velocities[h] = {"count": len(recent), "rate_per_day": round(len(recent)/h*24, 1) if h > 0 else 0}

    return {"hourly": hourly, "dow": dow, "velocities": velocities}


async def main():
    print("Connecting to OpenClaw browser CDP...")
    import websockets

    try:
        async with websockets.connect(CDP_WS, max_size=MAX_MSG_SIZE) as ws:
            print("Connected! Starting tweet scrape...")

            # Enable domains
            await send_ws(ws, 1, "Runtime.enable")
            await send_ws(ws, 2, "Page.enable")
            await asyncio.sleep(1)

            tweets = await scroll_and_scrape(ws, n_scrolls=25, min_tweets=80)
            analysis = await analyze_tweets(tweets)

            print(f"\n{'='*70}")
            print(f"  ELON TWEET SCRAPE RESULTS")
            print(f"  Collected: {len(tweets)} tweets")
            if tweets:
                newest = tweets[0]["timestamp"][:19].replace("T", " ")
                oldest = tweets[-1]["timestamp"][:19].replace("T", " ")
                print(f"  Range: {oldest} -> {newest}")

            print("\n  Posting Velocity:")
            for h, v in analysis["velocities"].items():
                bar = "█" * min(v["count"], 30)
                print(f"    Last {h:3}h: {v['count']:3d} tweets, {v['rate_per_day']:5.1f}/day {bar}")

            print("\n  Hour Distribution (UTC):")
            h = analysis["hourly"]
            max_h = max(h.values()) if h.values() else 1
            for hr in range(24):
                bar = "█" * int(h[hr]/max_h*28) if max_h > 0 else ""
                print(f"    {hr:02d}:00  {h[hr]:3d}  {bar}")

            print("\n  Recent Tweets:")
            for t in tweets[:20]:
                ts = t["timestamp"][:16].replace("T", " ")
                txt = t["text"][:65] + "..." if len(t["text"]) > 65 else t["text"]
                dow = t.get("weekday","?")
                pin = "📌" if t["is_pinned"] else "  "
                med = "🖼" if t["has_media"] else "  "
                print(f"    [{ts} {dow}] {pin}{med} {txt}")
                print(f"       ❤️{t['likes']:>8,}  🔁{t['retweets']:>8,}  👁{t['views']:>10,}")

            # Save
            out_dir = PROJECT_ROOT / "data" / "tweets"
            out_dir.mkdir(parents=True, exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            fp = out_dir / f"tweets_cdp_{ts}.json"
            save_data = {
                "fetched_at": datetime.now().isoformat(),
                "method": "cdp_websocket",
                "count": len(tweets),
                "tweets": tweets,
                "analysis": analysis,
            }
            with open(fp, "w", encoding="utf-8") as f:
                json.dump(save_data, f, ensure_ascii=False, indent=2)
            print(f"\n  Saved: {fp}")
            print(f"{'='*70}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
