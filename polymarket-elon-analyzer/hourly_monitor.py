#!/usr/bin/env python3
"""
Hourly Elon Tweet Monitor
每小时运行: 抓取推文 → 深度分析 → 检测信号 → 告警
"""
import asyncio
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.resolve()
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "src"))

import loguru
from loguru import logger

# Configure logger
log_file = PROJECT_ROOT / "logs" / f"hourly_monitor_{datetime.now().strftime('%Y%m%d_%H')}.log"
log_file.parent.mkdir(exist_ok=True)
logger.add(str(log_file), rotation="1 hour", level="INFO")

# Import our modules
try:
    from elon_tracker.async_tweet_fetcher import main as scrape_tweets, analyze_tweets
    SCRAPER_OK = True
except ImportError as e:
    logger.warning(f"Tweet scraper not available: {e}")
    SCRAPER_OK = False


# CDP target for OpenClaw browser X tab
CDP_WS = "ws://127.0.0.1:18800/devtools/page/FEA78C3D731CF66DBD609CAA8D793537"


async def scrape_tweets_cdp():
    """抓取推文 via CDP WebSocket"""
    if not SCRAPER_OK:
        return [], {}

    try:
        import websockets
        from elon_tracker.async_tweet_fetcher import scroll_and_scrape

        async with websockets.connect(CDP_WS, max_size=50*1024*1024) as ws:
            await asyncio.sleep(0.5)
            tweets = await scroll_and_scrape(ws, n_scrolls=15, min_tweets=30)
            analysis = await analyze_tweets(tweets)
            logger.info(f"Scraped {len(tweets)} tweets")
            return tweets, analysis
    except Exception as e:
        logger.warning(f"CDP scrape failed: {e}")
        return [], {}


def run_deep_analysis():
    """运行深度分析"""
    try:
        from deep_analysis import deep_analyze_market, MARKETS, generate_report
        results = [deep_analyze_market(m) for m in MARKETS]
        logger.info("Deep analysis complete")
        return results
    except Exception as e:
        logger.error(f"Deep analysis failed: {e}")
        return []


def check_signals(results):
    """检查是否有高置信度信号"""
    signals = []
    for r in results:
        if r.get("decision") in ("STRONG_YES", "YES") and r.get("edge", 0) >= 0.05:
            signals.append({
                "market": r["question"],
                "decision": r["decision"],
                "confidence": r["final_confidence"],
                "edge": r["edge"],
                "kelly_quarter": r.get("kelly", {}).get("kelly_quarter", 0),
                "ev": r.get("edge", 0) * r.get("kelly", {}).get("kelly_quarter", 0) * 10000,
            })
    return signals


def save_hourly_report(tweets, analysis, results, signals):
    """保存每小时报告"""
    out_dir = PROJECT_ROOT / "output"
    out_dir.mkdir(exist_ok=True)

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    report = {
        "timestamp": datetime.now().isoformat(),
        "tweets": {
            "count": len(tweets),
            "velocities": analysis.get("velocities", {}),
        },
        "signals": signals,
        "markets": results,
    }

    fp = out_dir / f"hourly_report_{ts}.json"
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    # Save latest
    with open(out_dir / "hourly_report_latest.json", "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    logger.info(f"Report saved: {fp}")
    return fp


async def main():
    logger.info("=" * 60)
    logger.info("  HOURLY ELON TWEET MONITOR")
    logger.info(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 60)

    # 1. 抓取推文
    logger.info("[Step 1] Scraping tweets via CDP...")
    tweets, analysis = await scrape_tweets_cdp()

    # 2. 深度分析
    logger.info("[Step 2] Running deep market analysis...")
    results = run_deep_analysis()

    # 3. 检查信号
    logger.info("[Step 3] Checking for signals...")
    signals = check_signals(results)

    # 4. 保存报告
    logger.info("[Step 4] Saving report...")
    fp = save_hourly_report(tweets, analysis, results, signals)

    # 5. 告警
    if signals:
        logger.warning(f"*** {len(signals)} SIGNAL(S) DETECTED! ***")
        for s in signals:
            logger.warning(
                f"  {s['market']}\n"
                f"    Decision: {s['decision']} | Conf: {s['confidence']*100:.1f}% | "
                f"Edge: {s['edge']*100:+.1f}% | Kelly: {s['kelly_quarter']*100:.1f}% | EV: ${s['ev']:.2f}"
            )
    else:
        logger.info("No signals found this hour")

    logger.info("Hourly monitor complete")
    return tweets, analysis, results, signals


if __name__ == "__main__":
    tweets, analysis, results, signals = asyncio.run(main())

    # Print brief summary
    if tweets:
        print(f"\nTweets: {len(tweets)} collected")
        for h, v in analysis.get("velocities", {}).items():
            if v["count"] > 0:
                print(f"  Last {h}h: {v['count']} tweets, {v['rate_per_day']:.1f}/day")

    if signals:
        print(f"\n*** {len(signals)} SIGNAL(S) FOUND ***")
        for s in signals:
            print(f"  {s['market']}: {s['decision']} @ {s['confidence']*100:.0f}% conf, {s['edge']*100:+.0f}% edge, ${s['ev']:.0f} EV")
    else:
        print("\nNo signals this hour")
