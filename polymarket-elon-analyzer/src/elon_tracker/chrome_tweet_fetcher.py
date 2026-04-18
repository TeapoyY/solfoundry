#!/usr/bin/env python3
"""
Chrome Session Tweet Fetcher
使用用户已登录的 Chrome profile 来抓取推文
"""
import asyncio
import json
import os
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
sys.path.insert(0, str(PROJECT_ROOT))

CHROME_USER_DATA = Path(os.environ.get(
    "LOCALAPPDATA",
    "C:\\Users\\Administrator\\AppData\\Local"
)) / "Google" / "Chrome" / "User Data" / "Default"

import os
if not CHROME_USER_DATA.exists():
    # fallback
    CHROME_USER_DATA = Path("C:/Users/Administrator/AppData/Local/Google/Chrome/User Data/Default")

from loguru import logger

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT = True
except ImportError:
    PLAYWRIGHT = False


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


def fetch_tweets_chrome(min_tweets=80, max_scrolls=30):
    """使用用户 Chrome profile 抓取推文"""
    if not PLAYWRIGHT:
        logger.error("Playwright not installed")
        return []

    logger.info(f"Launching Chrome with user data: {CHROME_USER_DATA}")

    with sync_playwright() as p:
        # 使用用户数据目录 + Default profile
        context = p.chromium.launch_persistent_context(
            user_data_dir=str(CHROME_USER_DATA.parent),  # "User Data" dir, Playwright auto-selects Default
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--profile-directory=Default",
            ],
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
        )

        page = context.new_page()
        page.set_default_timeout(30000)

        logger.info("Navigating to x.com/elonmusk")
        page.goto("https://x.com/elonmusk", wait_until="networkidle", timeout=20000)
        page.wait_for_timeout(3000)

        # 检查登录状态
        login_btn = page.query_selector('[data-testid="loginButton"]')
        if login_btn:
            logger.warning("Not logged in - using public view")
        else:
            logger.info("Logged in! Timeline should be full")

        collected = []
        seen_ids = set()
        last_height = 0
        no_change = 0

        for scroll_num in range(max_scrolls):
            page.wait_for_timeout(2000)

            articles = page.query_selector_all('article[role="article"]')
            new_this = 0

            for art in articles:
                try:
                    # ID
                    pid = ""
                    links = art.query_selector_all('a[href]')
                    for l in links:
                        href = l.get_attribute("href") or ""
                        m = re.search(r"/status/(\d+)", href)
                        if m:
                            pid = m.group(1)
                            break
                    if not pid or pid in seen_ids:
                        continue
                    seen_ids.add(pid)

                    # Time
                    time_el = art.query_selector("time")
                    ts_str = ""
                    ts = None
                    if time_el:
                        ts_str = time_el.get_attribute("datetime") or time_el.inner_text()
                        try:
                            ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                        except:
                            pass

                    if not ts:
                        continue

                    # Text
                    text_el = art.query_selector('[data-testid="tweetText"]')
                    text = text_el.inner_text() if text_el else ""

                    # Counts
                    def cnt(sel):
                        el = art.query_selector(sel)
                        return extract_count(el.inner_text) if el else 0

                    likes = cnt('[data-testid="like"]')
                    retweets = cnt('[data-testid="retweet"]')
                    replies = cnt('[data-testid="reply"]')
                    views_el = art.query_selector('[data-testid="viewCount"]')
                    views = extract_count(views_el.inner_text) if views_el else 0

                    is_pinned = bool(art.query_selector('[data-testid="pin"]'))
                    has_media = bool(art.query_selector('[data-testid="tweetPhoto"]') or
                                     art.query_selector('[data-testid="card"]'))

                    collected.append({
                        "post_id": pid,
                        "text": text,
                        "timestamp": ts.isoformat(),
                        "hour": ts.hour,
                        "weekday": ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][ts.weekday()],
                        "likes": likes,
                        "retweets": retweets,
                        "replies": replies,
                        "views": views,
                        "is_pinned": is_pinned,
                        "has_media": has_media,
                    })
                    new_this += 1
                except Exception as e:
                    logger.debug(f"Parse error: {e}")

            logger.info(f"Scroll {scroll_num+1}: +{new_this} new, total={len(collected)}")

            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1500)

            new_h = page.evaluate("document.documentElement.scrollHeight")
            if new_h == last_height:
                no_change += 1
                if no_change >= 3:
                    logger.info("No more content")
                    break
            else:
                no_change = 0
            last_height = new_h

            if len(collected) >= min_tweets:
                break

        context.close()

        # Sort by timestamp
        collected.sort(key=lambda x: x["timestamp"], reverse=True)
        return collected


def analyze_tweets(tweets):
    """分析推文数据"""
    if not tweets:
        return {}

    now = datetime.now()

    # 时间分布
    hourly = {h: 0 for h in range(24)}
    for t in tweets:
        hourly[t["hour"]] += 1

    dow_count = {d: 0 for d in range(7)}
    for t in tweets:
        try:
            dt = datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00"))
            dow_count[dt.weekday()] += 1
        except:
            pass

    # 速度
    velocities = {}
    for h in [1, 3, 6, 12, 24, 48, 72]:
        cutoff = now - timedelta(hours=h)
        recent = [t for t in tweets
                  if datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00")) >= cutoff]
        velocities[h] = {
            "count": len(recent),
            "rate_per_day": round(len(recent) / h * 24, 1) if h > 0 else 0
        }

    return {
        "hourly_dist": hourly,
        "dow_dist": dow_count,
        "velocities": velocities,
    }


def print_report(tweets, analysis):
    print(f"\n{'='*70}")
    print(f"  ELON TWEET ANALYSIS - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"  Total tweets collected: {len(tweets)}")
    if tweets:
        ts_newest = tweets[0]["timestamp"][:19].replace("T", " ")
        ts_oldest = tweets[-1]["timestamp"][:19].replace("T", " ")
        print(f"  Date range: {ts_oldest} -> {ts_newest}")
    print()

    print("  Posting Velocity:")
    for h, v in analysis["velocities"].items():
        label = f"{'Last':>8}h"
        bar = "█" * min(v["count"], 40)
        print(f"    {label}: {v['count']:3d} tweets, {v['rate_per_day']:5.1f}/day {bar}")

    print()
    print("  Hour Distribution (UTC):")
    h = analysis["hourly_dist"]
    max_h = max(h.values()) if h.values() else 1
    for hr in range(24):
        bar = "█" * int(h[hr] / max_h * 30) if max_h > 0 else ""
        print(f"    {hr:02d}:00  {h[hr]:3d}  {bar}")

    print()
    print("  Recent Tweets:")
    days_names = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    for t in tweets[:20]:
        ts = t["timestamp"][:16].replace("T", " ")
        txt = t["text"][:65] + "..." if len(t["text"]) > 65 else t["text"]
        dow = t.get("weekday","?")
        media = "🖼" if t["has_media"] else "  "
        pinned = "📌" if t["is_pinned"] else "   "
        print(f"    [{ts} {dow}] {pinned}{media} {txt}")
        print(f"       ❤️{t['likes']:>8,}  🔁{t['retweets']:>8,}  👁{t['views']:>12,}")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    import os

    tweets = fetch_tweets_chrome(min_tweets=80, max_scrolls=25)
    analysis = analyze_tweets(tweets)
    print_report(tweets, analysis)

    if tweets:
        out_dir = PROJECT_ROOT / "data" / "tweets"
        out_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        fp = out_dir / f"tweets_chrome_{ts}.json"
        save_data = {
            "fetched_at": datetime.now().isoformat(),
            "method": "chrome_session",
            "tweets": tweets,
            "analysis": analysis,
        }
        with open(fp, "w", encoding="utf-8") as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        print(f"Saved: {fp}")
