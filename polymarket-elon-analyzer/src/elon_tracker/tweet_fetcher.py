#!/usr/bin/env python3
"""
Elon Musk Tweet Fetcher - 使用 Playwright 持续滚动抓取
抓取内容: 时间戳, 文本, 互动数据 (likes/retweets/replies/views)
支持持续滚动模式: 一直滚到指定时间范围
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

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT = True
except ImportError:
    PLAYWRIGHT = False

from loguru import logger


@dataclass
class Tweet:
    """一条推文"""
    post_id: str
    text: str
    timestamp: datetime
    timestamp_str: str  # 原始字符串
    likes: int
    retweets: int
    replies: int
    views: int
    is_retweet: bool
    is_reply: bool
    is_pinned: bool
    has_media: bool
    hour: int  # 0-23


def extract_count(s: str) -> int:
    """从 '1.2万' / '5,319万' 等提取数字"""
    if not s:
        return 0
    s = s.strip().replace(",", "")
    m = re.match(r"([\d.]+)(万|亿|K|M|B)?", s)
    if not m:
        return 0
    num = float(m.group(1))
    unit = m.group(2) or ""
    if unit == "万":
        return int(num * 10000)
    elif unit == "亿":
        return int(num * 100000000)
    elif unit == "K":
        return int(num * 1000)
    elif unit == "M":
        return int(num * 1000000)
    elif unit == "B":
        return int(num * 1000000000)
    return int(num)


def parse_relative_time(time_str: str, ref_time: datetime) -> Optional[datetime]:
    """解析相对时间: '23小时 前', '3天 前', '2周 前'"""
    m = re.search(r"(\d+)\s*(小时|天|周|分钟|秒|月|年)\s*前", time_str)
    if not m:
        return None
    val = int(m.group(1))
    unit = m.group(2)
    delta_map = {
        "秒": timedelta(seconds=val),
        "分钟": timedelta(minutes=val),
        "小时": timedelta(hours=val),
        "天": timedelta(days=val),
        "周": timedelta(weeks=val),
        "月": timedelta(days=val * 30),
        "年": timedelta(days=val * 365),
    }
    return ref_time - delta_map.get(unit, timedelta())


def parse_absolute_date(date_str: str) -> Optional[datetime]:
    """解析绝对日期: '2024年10月31日', '2022年4月7日'"""
    formats = [
        "%Y年%m月%d日",
        "%Y年%m月%d日 %H:%M",
        "%b %d, %Y",
        "%b %d, %Y %I:%M %p",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return None


class TweetFetcher:
    BASE_URL = "https://x.com"
    ELON_HANDLE = "elonmusk"

    def __init__(self, headless: bool = True, timeout: int = 30000):
        self.headless = headless
        self.timeout = timeout
        self.tweets: List[Tweet] = []
        self.ref_time = datetime.now()

    def fetch(self, min_tweets: int = 50, max_scrolls: int = 30,
              stop_date: Optional[datetime] = None,
              collect_window_hours: Optional[float] = None) -> List[Tweet]:
        """
        主抓取入口

        Args:
            min_tweets: 最少抓取推文数
            max_scrolls: 最大滚动次数
            stop_date: 停止抓取日期 (超过此日期的推文不再继续)
            collect_window_hours: 只抓取此时间窗口内的推文 (优先于stop_date)

        Returns:
            抓到的 Tweet 列表
        """
        if not PLAYWRIGHT:
            logger.error("Playwright not installed. Run: pip install playwright && playwright install chromium")
            return []

        logger.info(f"Starting tweet fetch: min={min_tweets}, max_scrolls={max_scrolls}")

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=self.headless,
                args=["--no-sandbox", "--disable-setuid-sandbox"]
            )
            context = browser.new_context(
                viewport={"width": 1280, "height": 900},
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/122.0.0.0 Safari/537.36"
                ),
                locale="en-US",
            )
            page = context.new_page()
            page.set_default_timeout(self.timeout)

            # 访问 Elon 主页
            logger.info(f"Navigating to {self.BASE_URL}/{self.ELON_HANDLE}")
            page.goto(f"{self.BASE_URL}/{self.ELON_HANDLE}", wait_until="networkidle")
            page.wait_for_timeout(3000)

            # 检查是否被拦截
            if page.query_selector('[data-testid="loginButton"]'):
                logger.warning("Not logged in - some tweets may be hidden")

            collected: List[Tweet] = []
            last_height = 0
            scroll_count = 0
            no_change_count = 0

            # 如果限制了时间窗口，计算最旧可以接受的日期
            if collect_window_hours:
                stop_date = self.ref_time - timedelta(hours=collect_window_hours)
                logger.info(f"Stopping at tweets older than {stop_date}")

            while scroll_count < max_scrolls:
                scroll_count += 1

                # 等待推文加载
                page.wait_for_timeout(2000)

                # 提取当前可见推文
                articles = page.query_selector_all('article[role="article"]')
                new_this_scroll = 0

                for article in articles:
                    try:
                        tweet = self._parse_article(article)
                        if tweet is None:
                            continue

                        # 去重
                        if any(t.post_id == tweet.post_id for t in collected):
                            continue

                        # 时间窗口过滤
                        if stop_date and tweet.timestamp < stop_date:
                            logger.info(f"Reached stop date {stop_date}, stopping scroll")
                            collected.append(tweet)
                            browser.close()
                            self.tweets = collected
                            return collected

                        collected.append(tweet)
                        new_this_scroll += 1

                    except Exception as e:
                        logger.debug(f"Parse error: {e}")
                        continue

                logger.info(f"Scroll {scroll_count}: +{new_this_scroll} new tweets, total={len(collected)}")

                # 滚动
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(1500)

                new_height = page.evaluate("document.documentElement.scrollHeight")
                if new_height == last_height:
                    no_change_count += 1
                    if no_change_count >= 3:
                        logger.info("No more content to load")
                        break
                else:
                    no_change_count = 0
                last_height = new_height

                # 提前停止
                if len(collected) >= min_tweets:
                    logger.info(f"Reached min_tweets={min_tweets}")
                    break

            browser.close()
            self.tweets = collected
            logger.info(f"Done: fetched {len(collected)} tweets in {scroll_count} scrolls")
            return collected

    def _parse_article(self, article) -> Optional[Tweet]:
        """解析单个 article 元素"""
        try:
            # 推文ID
            links = article.query_selector_all('a[href*="/status/"]')
            post_id = ""
            for link in links:
                href = link.get_attribute("href") or ""
                m = re.search(r"/status/(\d+)", href)
                if m:
                    post_id = m.group(1)
                    break
            if not post_id:
                return None

            # 时间戳
            time_elem = article.query_selector("time")
            timestamp_str = ""
            timestamp: Optional[datetime] = None
            if time_elem:
                datetime_attr = time_elem.get_attribute("datetime") or ""
                if datetime_attr:
                    try:
                        # 2026-04-17T14:30:00.000Z
                        timestamp = datetime.fromisoformat(datetime_attr.replace("Z", "+00:00"))
                        timestamp_str = datetime_attr
                    except:
                        pass

                if not timestamp:
                    time_text = time_elem.inner_text()
                    timestamp_str = time_text
                    timestamp = parse_relative_time(time_text, self.ref_time)
                    if not timestamp:
                        timestamp = parse_absolute_date(time_text)

            if not timestamp:
                return None

            # 文本内容
            text_elem = article.query_selector('[data-testid="tweetText"]')
            text = text_elem.inner_text() if text_elem else ""

            # 判断类型
            is_retweet = bool(article.query_selector('[data-testid="socialContext"]'))
            is_reply = bool(article.query_selector('[data-testid="reply"]'))
            is_pinned = bool(article.query_selector('[data-testid="pin"]'))
            has_media = bool(article.query_selector('[data-testid="tweetPhoto"]')) or \
                        bool(article.query_selector('[data-testid="card"]'))

            # 互动数据
            def get_count(selector):
                try:
                    el = article.query_selector(selector)
                    return extract_count(el.inner_text()) if el else 0
                except:
                    return 0

            likes = get_count('[data-testid="like"]')
            retweets = get_count('[data-testid="retweet"]')
            replies = get_count('[data-testid="reply"]')

            views_el = article.query_selector('[data-testid="viewCount"]')
            views = extract_count(views_el.inner_text()) if views_el else 0

            return Tweet(
                post_id=post_id,
                text=text,
                timestamp=timestamp,
                timestamp_str=timestamp_str,
                likes=likes,
                retweets=retweets,
                replies=replies,
                views=views,
                is_retweet=is_retweet,
                is_reply=is_reply,
                is_pinned=is_pinned,
                has_media=has_media,
                hour=timestamp.hour,
            )
        except Exception as e:
            logger.debug(f"Article parse error: {e}")
            return None

    def save(self, path: Optional[Path] = None) -> Path:
        """保存为 JSON"""
        if path is None:
            out_dir = PROJECT_ROOT / "data" / "tweets"
            out_dir.mkdir(parents=True, exist_ok=True)
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            path = out_dir / f"tweets_{ts}.json"

        data = {
            "fetched_at": datetime.now().isoformat(),
            "ref_time": self.ref_time.isoformat(),
            "count": len(self.tweets),
            "tweets": [
                {
                    **asdict(t),
                    "timestamp": t.timestamp.isoformat(),
                }
                for t in self.tweets
            ],
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Saved {len(self.tweets)} tweets to {path}")
        return path

    def get_time_distribution(self) -> dict:
        """发帖时间分布 (小时)"""
        hourly = {h: 0 for h in range(24)}
        for t in self.tweets:
            hourly[t.hour] = hourly.get(t.hour, 0) + 1
        return hourly

    def get_day_distribution(self) -> dict:
        """星期分布"""
        days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
        dow = {d: 0 for d in range(7)}
        for t in self.tweets:
            dow[t.timestamp.weekday()] += 1
        return {days[k]: v for k, v in dow.items()}

    def get_velocity(self, window_hours: Optional[float] = None) -> float:
        """当前发帖速度 (posts/day)"""
        tweets = self.tweets
        if window_hours:
            cutoff = self.ref_time - timedelta(hours=window_hours)
            tweets = [t for t in tweets if t.timestamp >= cutoff]

        if not tweets:
            return 0.0
        sorted_t = sorted(tweets, key=lambda x: x.timestamp)
        span = (sorted_t[-1].timestamp - sorted_t[0].timestamp).total_seconds() / 3600
        span = max(span, 0.1)
        return len(tweets) / span * 24

    def print_summary(self):
        """打印摘要"""
        if not self.tweets:
            print("No tweets fetched")
            return

        print(f"\n{'='*60}")
        print(f"  Tweet Fetcher Summary")
        print(f"  Fetched: {len(self.tweets)} tweets")
        print(f"  Reference time: {self.ref_time}")
        print(f"  Date range: {self.tweets[-1].timestamp if self.tweets else 'N/A'} -> {self.tweets[0].timestamp if self.tweets else 'N/A'}")
        print()

        # 速度
        print(f"  Velocity:")
        for h in [1, 3, 6, 12, 24]:
            v = self.get_velocity(h)
            print(f"    Last {h}h: {v:.1f} posts/day" if v > 0 else f"    Last {h}h: no data")

        print()
        print(f"  Hour distribution (UTC):")
        hourly = self.get_time_distribution()
        max_h = max(hourly.values()) if hourly.values() else 1
        for h in range(24):
            bar = "█" * int(hourly[h] / max_h * 30) if max_h > 0 else ""
            print(f"    {h:02d}:00  {hourly[h]:3d}  {bar}")

        print()
        print(f"  Recent tweets:")
        for t in self.tweets[:10]:
            date_str = t.timestamp.strftime("%m-%d %H:%M")
            text_preview = t.text[:60] + "..." if len(t.text) > 60 else t.text
            print(f"    [{date_str}] {text_preview} | ❤️{t.likes} 🔁{t.retweets} 👁{t.views:,}")
        print(f"{'='*60}\n")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Fetch Elon Musk tweets")
    parser.add_argument("--min-tweets", type=int, default=100)
    parser.add_argument("--max-scrolls", type=int, default=30)
    parser.add_argument("--hours", type=float, default=None, help="Only fetch tweets from last N hours")
    parser.add_argument("--save", action="store_true", default=True)
    args = parser.parse_args()

    fetcher = TweetFetcher(headless=True)
    tweets = fetcher.fetch(
        min_tweets=args.min_tweets,
        max_scrolls=args.max_scrolls,
        collect_window_hours=args.hours,
    )
    fetcher.print_summary()

    if args.save and tweets:
        fetcher.save()
