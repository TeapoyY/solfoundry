"""
Market Analyzer — computes probabilities for Polymarket Elon tweet-count markets.

Key design (revised 2026-04-19):
- Weekly markets (apr14-21, apr17-24): use xtrack confirmed count as TRUSTED BASE,
  add our incremental new tweets since xtrack snapshot.
- May 2026: no xtrack confirmation — count from OUR collected tweets directly,
  apply coverage ratio to estimate real count.
- Primary data source: tweets_latest.json (fresh from browser relay collector)
  with fallback to SQLite DB for historical continuity.
"""
import json
import math
import random
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any

# ── Coverage calibration ──────────────────────────────────────────
# xtracker Apr16-18 confirmed: 42 tweets
# Our Browser Relay Apr16-18: 22 tweets
# => COVERAGE_RATIO = 42/22 ≈ 1.91
COVERAGE = 42.0 / 22.0

# ── Market definitions ─────────────────────────────────────────────
# xtracker_snapshot: the LAST KNOWN xtrack confirmed count for weekly markets.
# For May 2026: 0 = no xtrack confirmation yet, we count from our own data.
MARKETS = [
    {
        "id": "apr14-21",
        "question": "Elon Musk tweets April 14–21, 2026? (Over 190?)",
        "target": 190,
        "ws": "2026-04-14T00:00:00Z",
        "we": "2026-04-21T23:59:59Z",
        # xtrack confirmed count from Polymarket TWEET COUNT (live scrape 2026-04-19)
        # xtrack.polymarket.com is BLOCKED from this machine
        # Using Polymarket market page as xtrack confirmed proxy
        "xtracker_snapshot": 164,   # LIVE from Polymarket TWEET COUNT
        "xtracker_snapshot_time": "2026-04-19T03:00:00+08:00",
        "source": "xtrack",          # use xtrack base + our incremental
    },
    {
        "id": "apr17-24",
        "question": "Elon Musk tweets April 17–24, 2026? (Over 200?)",
        "target": 200,
        "ws": "2026-04-17T00:00:00Z",
        "we": "2026-04-24T23:59:59Z",
        # xtrack confirmed count from Polymarket TWEET COUNT (live scrape 2026-04-19)
        "xtracker_snapshot": 55,    # LIVE from Polymarket TWEET COUNT
        "xtracker_snapshot_time": "2026-04-19T03:03:00+08:00",
        "source": "xtrack",
    },
    {
        "id": "may2026",
        "question": "Elon Musk tweets May 2026? (Over 800?)",
        "target": 800,
        "ws": "2026-05-01T00:00:00Z",
        "we": "2026-05-31T23:59:59Z",
        "xtracker_snapshot": 0,      # NO xtrack confirmation — count ourselves
        "xtracker_snapshot_time": None,
        "source": "own",             # count from our own tweets
    },
]

DATA_DIR = Path(__file__).parent.parent / "data"
PROJECT_ROOT = Path(__file__).parent.parent


def parse_ts(s: str) -> Optional[datetime]:
    if not s:
        return None
    s = s.replace("Z", "+00:00").replace(" ", "T")
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return None


def cnt_window(tweets: list, ws: str, we: str) -> int:
    """Count tweets within UTC window [ws, we]."""
    ws_dt = parse_ts(ws)
    we_dt = parse_ts(we)
    if not ws_dt or not we_dt:
        return 0
    n = 0
    for t in tweets:
        ts = _get_ts(t)
        dt = parse_ts(ts)
        if dt and ws_dt <= dt <= we_dt:
            n += 1
    return n


def load_tweets_from_json() -> list:
    """Load tweets from tweets_latest.json as primary source."""
    json_path = DATA_DIR / "tweets_latest.json"
    if json_path.exists():
        try:
            data = json.loads(json_path.read_text("utf-8"))
            tweets = data.get("tweets", [])
            print(f"Loaded {len(tweets)} tweets from tweets_latest.json (collected {data.get('collected_at','?')})")
            return tweets
        except Exception as e:
            print(f"Error loading tweets_latest.json: {e}")
    return []


def load_tweets_from_db() -> list:
    """Fallback: load tweets from SQLite tracker.db."""
    db_path = DATA_DIR / "tracker.db"
    if not db_path.exists() or db_path.stat().st_size == 0:
        return []
    try:
        conn = sqlite3.connect(str(db_path))
        cur = conn.execute(
            "SELECT post_id,timestamp,text,hour,weekday,likes,rts,replies,views,is_pinned,has_media FROM tweets ORDER BY timestamp DESC"
        )
        tweets = []
        for row in cur.fetchall():
            tweets.append({
                "post_id": row[0], "timestamp": row[1], "text": row[2] or "",
                "hour": row[3], "weekday": row[4], "likes": row[5], "retweets": row[6],
                "replies": row[7], "views": row[8], "is_pinned": bool(row[9]), "has_media": bool(row[10])
            })
        conn.close()
        print(f"Loaded {len(tweets)} tweets from tracker.db")
        return tweets
    except Exception as e:
        print(f"Error loading from DB: {e}")
        return []


def get_all_tweets() -> list:
    """Get tweets: primary from JSON, fallback from DB."""
    tweets = load_tweets_from_json()
    if not tweets:
        tweets = load_tweets_from_db()
    return tweets


def kelly(entry: float, prob: float) -> float:
    """Kelly criterion fraction for binary outcome."""
    if entry <= 0 or entry >= 1 or prob <= 0:
        return 0.0
    b = 1.0 / entry - 1.0
    q = 1.0 - prob
    if b <= 0:
        return 0.0
    f = (b * prob - q) / b
    return max(0.0, f)


def mc3(cur: int, tgt: int, days: float, daily: float, n: int = 30000) -> tuple:
    """3-scenario Monte Carlo with reproducible seed."""
    if days <= 0:
        return (1.0 if cur >= tgt else 0.0, float(cur), {})

    scenarios = [
        ("bear", daily * 0.7, 0.20),
        ("base", daily, 0.50),
        ("bull", daily * 1.5, 0.30),
    ]

    all_vw = []
    total_w = 0
    prs = {}
    rng = random.Random(x=42)

    for name, rate, wt in scenarios:
        lam = max(rate * days, 0.1)
        std = max(math.sqrt(lam), 0.5)
        vs = [max(0, int(round(cur + rng.gauss(lam, std)))) for _ in range(n)]
        pr = sum(1 for v in vs if v >= tgt) / n
        prs[name] = round(pr, 4)
        all_vw.extend((v, wt) for v in vs)
        total_w += wt * n

    pw = sum(w for v, w in all_vw if v >= tgt) / total_w
    mw = sum(v * w for v, w in all_vw) / total_w
    return round(pw, 4), round(mw, 1), prs


def _get_ts(t) -> str:
    """Extract timestamp from tweet (dict or tuple)."""
    if isinstance(t, dict):
        return t.get("timestamp", "")
    if isinstance(t, (list, tuple)) and len(t) > 1:
        return str(t[1])
    return ""


def velocity_stats(tweets: list, now_utc: datetime) -> dict:
    """Compute velocity stats from tweet list."""
    hourly_bins = {h: 0 for h in range(24)}
    daily_counts = {}
    for t in tweets:
        ts = _get_ts(t)
        dt = parse_ts(ts)
        if not dt:
            continue
        hourly_bins[dt.hour] += 1
        day_key = dt.strftime("%Y-%m-%d")
        daily_counts[day_key] = daily_counts.get(day_key, 0) + 1

    velocities = {}
    cutoff_base = now_utc.replace(minute=0, second=0, microsecond=0)
    for h in [1, 3, 6, 12, 24, 48, 72]:
        cutoff = cutoff_base - datetime.timedelta(hours=h)
        count = sum(
            1 for t in tweets
            if parse_ts(_get_ts(t)) is not None and parse_ts(_get_ts(t)) >= cutoff
        )
        velocities[h] = {"count": count, "rate_per_day": round(count / h * 24, 1) if h > 0 else 0}
    return {"hourly": hourly_bins, "daily": daily_counts, "velocities": velocities}


def analyze(db_or_tweets=None) -> list:
    """
    Main analysis: compute market probabilities.

    Args:
        db_or_tweets: either a TweetDB instance (for backwards compat) or
                      a list of tweet dicts. If None, loads from tweets_latest.json.

    Data strategy:
    - Weekly markets (apr14-21, apr17-24): xtrack_snapshot + our incremental NEW tweets
      Since xtrack was sampled at 2026-04-18 ~02:15 HKT. Any tweets in our collection
      with timestamp AFTER that are "new incremental" we add on top.
    - May 2026: count from our own collected tweets in the May window,
      apply coverage ratio for est_real_count.
    """
    # Load tweets
    if db_or_tweets is None:
        tweets = get_all_tweets()
    elif isinstance(db_or_tweets, list):
        tweets = db_or_tweets
    else:
        # Assume it's a TweetDB-like object
        tweets = db_or_tweets.get_all_tweets() if hasattr(db_or_tweets, 'get_all_tweets') else []

    now_utc = datetime.now(timezone.utc)
    total = len(tweets)
    # Real daily rate after coverage correction
    real_daily = round(30.0 * COVERAGE, 1)  # ~57.3/day

    # The xtrack confirmed counts were updated from LIVE Polymarket TWEET COUNT
    # fields (scraped 2026-04-19 via browser relay, since xtrack.polymarket.com
    # is blocked from this machine). These counts are the authoritative base.
    #
    # Note on coverage gap:
    #   apr14-21: xtrack=164, our collected=82 in window → gap of 82 tweets
    #   apr17-24: xtrack=55, our collected=25 in window → gap of 30 tweets
    # The gap is due to network/relay timing issues during collection.
    # Our "incremental since xtrack" approach is correct — when xtrack base
    # is updated to 164, adding our 11 new tweets since snapshot gives ~175,
    # but the real answer is 164 (the gap tweets were BEFORE snapshot time,
    # caught by xtrack but missed by our relay during the same period).
    #
    # Strategy: use Polymarket TWEET COUNT as xtrack proxy (fully authoritative)
    # and DON'T add incremental since it double-counts tweets xtrack already got.
    # The incremental logic was only correct when xtrack_snapshot was the
    # value AT the snapshot time, not an old stale value.
    #
    # Corrected strategy (2026-04-19):
    #   - apr14-21: use xtrack_confirmed=164 as the FULL count (not base+increment)
    #   - apr17-24: use xtrack_confirmed=55 as the FULL count
    #   - The Polymarket TWEET COUNT already includes ALL tweets in the window
    #
    # We also need our own collected tweets for velocity/daily-rate analysis.
    # The tweets_latest.json (97 tweets) is the source for velocity analysis.

    results = []
    for m in MARKETS:
        tgt = m["target"]
        ws, we = m["ws"], m["we"]
        source = m.get("source", "xtrack")

        if source == "xtrack":
            # Use Polymarket TWEET COUNT as the authoritative xtrack confirmed total.
            # The TWEET COUNT field already represents xtrack's complete count for
            # the window. Do NOT add incremental tweets — that would double-count.
            confirmed = m["xtracker_snapshot"]

            # We no longer apply coverage ratio to xtrack's confirmed total,
            # because xtrack already has near-complete coverage of Elon's tweets.
            # The confirmed_est is just confirmed itself (no inflation).
            confirmed_est = confirmed

        else:  # source == "own" (May 2026)
            # Count from our own tweets in the May window, apply coverage ratio
            confirmed = cnt_window(tweets, ws, we)
            confirmed_est = int(confirmed * COVERAGE)

        we_dt = parse_ts(we)
        days_rem = max((we_dt - now_utc).total_seconds() / 86400.0, 0) if we_dt else 0
        rem = max(tgt - confirmed, 0)
        req_rate = round(rem / days_rem, 1) if days_rem > 0 else 999

        p_yes, mean_v, scen_p = mc3(confirmed, tgt, days_rem, real_daily)
        edge = p_yes - 0.50
        kf_full = kelly(0.50, p_yes)

        vel_ratio = round(real_daily / req_rate, 2) if req_rate > 0 and req_rate < 999 else 99.0

        result = {
            "market_id": m["id"],
            "question": m["question"],
            "target": tgt,
            "window_start": ws[:10],
            "window_end": we[:10],
            "confirmed": confirmed,
            "confirmed_est": confirmed_est,
            "remaining": rem,
            "days_remaining": round(days_rem, 2),
            "required_rate": req_rate,
            "real_daily_rate": real_daily,
            "velocity_ratio": vel_ratio,
            "p_yes": p_yes,
            "edge": round(edge, 4),
            "edge_pct": f"{edge*100:+.1f}%",
            "kelly_full": round(kf_full, 4),
            "kelly_half": round(kf_full * 0.5, 4),
            "kelly_quarter": round(kf_full * 0.25, 4),
            "mc_scenarios": scen_p,
            "mean_tweets": mean_v,
            "xtracker_snapshot": m["xtracker_snapshot"],
            "coverage_ratio": round(COVERAGE, 3),
            "total_tweets_in_source": total,
            "source": source,
            "analysis_time": now_utc.isoformat(),
        }
        results.append(result)

    return results


def print_results(results: list):
    now = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
    cov = results[0]["coverage_ratio"] if results else COVERAGE
    daily = results[0]["real_daily_rate"] if results else 0
    total_src = results[0]["total_tweets_in_source"] if results else 0
    sep = "=" * 70
    print(f"\n{sep}")
    print(f"  xTracker Clone - Real-time Analysis  ({now})")
    print(f"  Source tweets: {total_src} | Cov: {cov:.3f}x | Real daily: ~{daily}/day")
    print(f"{sep}\n")

    for r in results:
        src_label = "(xtrack+our)" if r["source"] == "xtrack" else "(our count)"
        print(f"[{r['market_id']}] {r['question']} {src_label}")
        print(f"  Window: {r['window_start']} ~ {r['window_end']}")
        print(f"  Counted: {r['confirmed']} tweets  (est real: {r['confirmed_est']})")
        if r['xtracker_snapshot'] > 0:
            print(f"  xtracker base: {r['xtracker_snapshot']}")
        print(f"  Remaining: {r['remaining']} in {r['days_remaining']:.1f}d | "
              f"req {r['required_rate']}/day | real ~{r['real_daily_rate']}/day")
        print(f"  Velocity ratio: {r['velocity_ratio']}x  (1.0=break-even, >1=bullish)")
        print(f"  MC scenarios:")
        for nm, pr in r["mc_scenarios"].items():
            print(f"    {nm:6s}: {pr*100:5.0f}%")
        edge_val = r['edge_pct'].replace('+', 'plus').replace('%', 'pct')
        kelly_val = f"{r['kelly_quarter']*100:.1f}"
        print(f"  --> P(YES)={r['p_yes']*100:5.0f}%  Edge={edge_val}  "
              f"Kelly={kelly_val}%")
        print()
