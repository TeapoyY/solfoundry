"""
Full Market Analyzer v2 — Polymarket Elon Tweet Count Markets
=============================================================
Key improvements (v2):
- Multi-outcome probability analysis (each range bucket gets its own probability)
- Upper-bound handling: when confirmed count EXCEEDS a range upper bound,
  probability mass flows into the overflow bucket (P=0 when count is in a range)
- Bidirectional edge analysis: YES edge AND NO edge both calculated
- xtrack confirmed counts as authoritative (from Polymarket TWEET COUNT)
- May 2026 forecast: velocity-based projection using Apr confirmed rate

Usage:
    python src/full_analyzer.py
    python quick_check.py
"""
import json
import math
import random
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List, Dict, Any

# ── Constants ─────────────────────────────────────────────────────
# Realistic daily rate calibrated from Polymarket Apr data:
# apr14-21: 164 tweets in 5.4 days = ~30.4/day
DAILY_RATE = 30.0  # tweets/day

# ── Market Definitions ─────────────────────────────────────────────
# xtrack.polymarket.com is BLOCKED from this machine.
# All confirmed counts sourced from Polymarket TWEET COUNT field (browser relay).
# Live counts are fetched by fetch_live_counts.py and stored in live_xtrack.json.
# Analyzer loads live counts from there; falls back to hardcoded values if unavailable.
MARKETS = [
    {
        "id": "apr14-21",
        "question": "Elon Musk tweets Apr 14-21, 2026? (Over 190?)",
        "target": 190,
        "ws": "2026-04-14T00:00:00Z",
        "we": "2026-04-21T23:59:59Z",
        # Live from Polymarket (2026-04-19 ~11:00 HKT)
        "xtrack_confirmed": 164,
        "pm_yes_price": 0.88,
        "pm_no_price": 0.12,
        "pm_vol": 6589397,
        # Outcome buckets (range → Polymarket implied price)
        # These represent probability distribution of final count
        "outcome_buckets": [
            {"lo": 0,    "hi": 189, "label": "<190",    "price": 0.12},
            {"lo": 190,  "hi": 219, "label": "190-219",  "price": 0.05},
            {"lo": 220,  "hi": 239, "label": "220-239",  "price": 0.12},
            {"lo": 240,  "hi": 259, "label": "240-259",  "price": 0.27},
            {"lo": 260,  "hi": 279, "label": "260-279",  "price": 0.30},
            {"lo": 280,  "hi": 299, "label": "280-299",  "price": 0.19},
            {"lo": 300,  "hi": 499, "label": "300-499",  "price": 0.05},
            {"lo": 500,  "hi": 9999,"label": ">=500",    "price": 0.00},
        ],
    },
    {
        "id": "apr17-24",
        "question": "Elon Musk tweets Apr 17-24, 2026? (Over 200?)",
        "target": 200,
        "ws": "2026-04-17T00:00:00Z",
        "we": "2026-04-24T23:59:59Z",
        # Live from Polymarket (2026-04-19 ~11:03 HKT)
        "xtrack_confirmed": 55,
        "pm_yes_price": 0.79,
        "pm_no_price": 0.21,
        "pm_vol": None,
        "outcome_buckets": [
            {"lo": 0,    "hi": 199, "label": "<200",     "price": 0.21},
            {"lo": 200,  "hi": 219, "label": "200-219",  "price": 0.10},
            {"lo": 220,  "hi": 239, "label": "220-239",  "price": 0.10},
            {"lo": 240,  "hi": 259, "label": "240-259",  "price": 0.13},
            {"lo": 260,  "hi": 279, "label": "260-279",  "price": 0.21},
            {"lo": 280,  "hi": 299, "label": "280-299",  "price": 0.20},
            {"lo": 300,  "hi": 499, "label": "300-499",  "price": 0.14},
            {"lo": 500,  "hi": 9999,"label": ">=500",    "price": 0.01},
        ],
    },
    {
        "id": "may2026",
        "question": "Elon Musk tweets May 2026? (Over 800?)",
        "target": 800,
        "ws": "2026-05-01T00:00:00Z",
        "we": "2026-05-31T23:59:59Z",
        # May hasn't started — xtrack confirmed = 0
        "xtrack_confirmed": 0,
        "pm_yes_price": 0.37,
        "pm_no_price": 0.63,
        "pm_vol": None,
        # May 2026 forecast buckets (velocity-based projection)
        # Based on ~30 tweets/day rate: May should reach ~930 tweets
        "outcome_buckets": [
            {"lo": 0,    "hi": 799, "label": "<800",     "price": 0.63},
            {"lo": 800,  "hi": 899, "label": "800-899",  "price": 0.08},
            {"lo": 900,  "hi": 999, "label": "900-999",  "price": 0.10},
            {"lo": 1000, "hi": 1099,"label": "1000-1099","price": 0.08},
            {"lo": 1100, "hi": 1199,"label": "1100-1199","price": 0.05},
            {"lo": 1200, "hi": 1299,"label": "1200-1299","price": 0.04},
            {"lo": 1300, "hi": 9999,"label": ">=1300",  "price": 0.02},
        ],
        # For May: this is a FORECAST market (hasn't started yet)
        "is_forecast": True,
    },
]

DATA_DIR = Path(__file__).parent.parent / "data"
PROJECT_ROOT = Path(__file__).parent.parent


def load_live_xtrack() -> dict:
    """Load live xtrack counts from fetch_live_counts.py output."""
    live_path = DATA_DIR / "live_xtrack.json"
    if live_path.exists() and live_path.stat().st_size > 0:
        try:
            data = json.loads(live_path.read_text("utf-8"))
            return {k: v.get("xtrack_confirmed") for k, v in data.items()}
        except Exception:
            pass
    return {}


def get_market_confirmed(mkt: dict) -> int:
    """Get confirmed count: live from Polymarket > hardcoded fallback."""
    live = load_live_xtrack()
    cid = mkt["id"]
    if cid in live and live[cid] is not None:
        return live[cid]
    return mkt.get("xtrack_confirmed", 0) or 0


def parse_ts(s: str) -> Optional[datetime]:
    if not s:
        return None
    s = s.replace("Z", "+00:00").replace(" ", "T")
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return None


def load_tweets() -> list:
    json_path = DATA_DIR / "tweets_latest.json"
    if json_path.exists():
        try:
            data = json.loads(json_path.read_text("utf-8"))
            return data.get("tweets", [])
        except Exception:
            pass
    return []


def kelly(entry: float, prob: float) -> float:
    """Kelly criterion. entry = decimal odds implied price paid."""
    if entry <= 0 or entry >= 1 or prob <= 0:
        return 0.0
    b = 1.0 / entry - 1.0
    q = 1.0 - prob
    if b <= 0:
        return 0.0
    f = (b * prob - q) / b
    return max(0.0, f)


def mc_final_count(current: int, days: float, n_sims: int = 30000) -> Dict[str, Any]:
    """
    Monte Carlo for final tweet count.
    Returns distribution statistics and per-bucket probabilities.
    """
    if days <= 0:
        return {"mean": float(current), "median": float(current),
                "p10": current, "p90": current, "p_reach_target": 1.0 if current >= 190 else 0.0}

    scenarios = [
        ("bear", DAILY_RATE * 0.6, 0.20),
        ("base", DAILY_RATE, 0.50),
        ("bull", DAILY_RATE * 1.4, 0.30),
    ]

    rng = random.Random(x=42)
    all_final = []
    scenario_stats = {}

    for name, rate, wt in scenarios:
        expected = rate * days
        std = max(math.sqrt(expected), 1.0)
        finals = [max(0, int(round(current + rng.gauss(expected, std)))) for _ in range(n_sims)]
        scenario_stats[name] = {"rate": round(rate, 1), "expected": round(expected, 1), "weight": wt}
        all_final.extend((v, wt) for v in finals)

    total_w = sum(w for _, w in all_final)
    mean_v = sum(v * w for v, w in all_final) / total_w

    sorted_vw = sorted(all_final, key=lambda x: x[0])
    cum_w = 0.0
    p10_v, p50_v, p90_v = sorted_vw[0][0], sorted_vw[0][0], sorted_vw[0][0]
    for v, w in sorted_vw:
        cum_w += w / total_w
        if cum_w >= 0.10 and p10_v == sorted_vw[0][0]:
            p10_v = v
        if cum_w >= 0.50 and p50_v == sorted_vw[0][0]:
            p50_v = v
        if cum_w >= 0.90:
            p90_v = v
            break

    return {
        "mean": round(mean_v, 1),
        "median": float(p50_v),
        "p10": int(p10_v),
        "p90": int(p90_v),
        "scenarios": scenario_stats,
    }


def bucket_probability(bucket_lo: int, bucket_hi: int, confirmed: int, days: float) -> float:
    """
    P(final count falls in [bucket_lo, bucket_hi] given confirmed tweets so far.
    Final = confirmed + remaining tweets.
    Remaining tweets ~ Normal(mu=DAILY_RATE*days, sigma=sqrt(mu)).
    bucket_lo/hi are the absolute final count bounds for this bucket.
    """
    if days <= 0:
        return 1.0 if bucket_lo <= confirmed <= bucket_hi else 0.0

    expected_rem = DAILY_RATE * days
    std_rem = max(math.sqrt(expected_rem), 1.0)

    from math import erf
    def norm_cdf(x, mu, sigma):
        z = (x - mu) / (sigma * math.sqrt(2))
        return 0.5 * (1 + erf(max(-10, min(10, z))))

    # Final = confirmed + remaining
    # P(bucket_lo <= final <= bucket_hi) = P(bucket_lo - confirmed <= remaining <= bucket_hi - confirmed)
    rem_lo = bucket_lo - confirmed
    rem_hi = bucket_hi - confirmed

    # Remaining tweets can't be negative
    # If rem_hi < 0: bucket is entirely below confirmed → already passed this bucket → 0
    if rem_hi < 0:
        return 0.0
    # If rem_lo <= 0: confirmed is already at or above bucket_lo
    # Remaining >= 0 means some probability of staying in this bucket
    # The bucket captures: remaining tweets between rem_lo (could be negative/0) and rem_hi

    # For buckets entirely above confirmed (rem_lo > 0):
    # P(rem_lo <= R <= rem_hi)
    if rem_lo > 0:
        p = norm_cdf(rem_hi + 0.5, expected_rem, std_rem) - norm_cdf(max(0, rem_lo - 0.5), expected_rem, std_rem)
        return max(0.0, min(1.0, p))

    # For bucket that contains confirmed (rem_lo <= 0 <= rem_hi):
    # This means: final count stays within [bucket_lo, bucket_hi] = confirmed + remaining in [rem_lo, rem_hi]
    # rem_lo <= 0 means we need remaining tweets to NOT exceed |rem_lo| to stay below bucket_lo
    # P(R <= rem_hi) where R >= 0
    # = P(0 <= R <= rem_hi) = norm_cdf(rem_hi+0.5) - norm_cdf(0)
    p_above_bucket_lo = norm_cdf(rem_hi + 0.5, expected_rem, std_rem) - norm_cdf(0, expected_rem, std_rem)
    return max(0.0, min(1.0, p_above_bucket_lo))


def analyze_market(mkt: dict, now_utc: datetime) -> dict:
    """Full analysis for one market with multi-outcome buckets.
    Uses live xtrack counts from live_xtrack.json if available,
    falls back to hardcoded mkt['xtrack_confirmed'].
    """
    ws, we = mkt["ws"], mkt["we"]
    target = mkt["target"]
    confirmed = get_market_confirmed(mkt)  # live count > hardcoded fallback
    yes_price = mkt.get("pm_yes_price", 0.50)
    no_price = mkt.get("pm_no_price", 0.50)

    we_dt = parse_ts(we)
    days_rem = max((we_dt - now_utc).total_seconds() / 86400.0, 0) if we_dt else 0

    # For forecast markets (May not started): use full window length
    is_forecast = mkt.get("is_forecast", False)
    if is_forecast:
        # May window = 31 days
        days_rem = 31.0

    remaining = max(target - confirmed, 0)
    req_rate = round(remaining / days_rem, 1) if days_rem > 0 else 999
    vel_ratio = round(DAILY_RATE / req_rate, 2) if req_rate > 0 and req_rate < 999 else 99.0

    # ── Multi-outcome MC probability ─────────────────────────────────
    mc = mc_final_count(confirmed, days_rem)

    # ── Per-bucket probabilities ────────────────────────────────────
    # For each outcome bucket: P(count falls in this range | current data)
    # And also: if confirmed ALREADY exceeds a bucket's upper bound → P=0 for that bucket
    #           if confirmed ALREADY in a bucket → that bucket = 1.0 (market resolved)
    buckets = mkt.get("outcome_buckets", [])

    # Check if market is already resolved (confirmed in a final bucket range)
    already_resolved = False
    resolved_bucket = None
    for b in buckets:
        if b["lo"] <= confirmed <= b["hi"]:
            already_resolved = True
            resolved_bucket = b["label"]
            break

    bucket_probs = []

    for b in buckets:
        label = b["label"]
        lo, hi = b["lo"], b["hi"]
        prob = bucket_probability(lo, hi, confirmed, days_rem)

        # Polymarket implied price
        pm_price = b.get("price", 0.0)

        # Edge: our probability vs Polymarket price
        edge = prob - pm_price
        edge_pct = f"{edge*100:+.1f}%"
        side = "BUY" if edge > 0.05 else ("SELL" if edge < -0.05 else "HOLD")

        bucket_probs.append({
            "label": label,
            "lo": lo,
            "hi": hi,
            "prob": round(prob, 4),
            "prob_pct": f"{prob*100:.1f}%",
            "pm_price": pm_price,
            "edge": round(edge, 4),
            "edge_pct": edge_pct,
            "action": side,
        })

    # ── YES/NO binary probability ─────────────────────────────────────
    # P(YES) = P(final count >= target) = sum of all buckets where lo >= target
    # P(NO) = 1 - P(YES)
    p_yes = sum(b["prob"] for b in bucket_probs if b["lo"] >= target)
    p_no = 1.0 - p_yes

    # Recalculate MC reach based on buckets
    p_yes_mc = mc.get("p_reach_target", p_yes)
    if p_yes_mc == p_yes:  # not set separately
        p_yes_mc = p_yes

    # ── Edge analysis (YES/NO binary) ─────────────────────────────────
    yes_edge_raw = p_yes - yes_price
    no_edge_raw = p_no - no_price

    yes_kelly_full = kelly(yes_price, p_yes)
    no_kelly_full = kelly(no_price, p_no)

    # ── Best bet ─────────────────────────────────────────────────────
    if yes_edge_raw > 0.05 and yes_kelly_full > 0:
        best_bet = "BUY_YES"
        best_side = "YES"
        best_kelly = yes_kelly_full
    elif no_edge_raw > 0.05 and no_kelly_full > 0:
        best_bet = "BUY_NO"
        best_side = "NO"
        best_kelly = no_kelly_full
    else:
        best_bet = "NO_EDGE"
        best_side = None
        best_kelly = 0.0

    # ── Velocity from our collected tweets ──────────────────────────
    tweets = load_tweets()
    velocity = {}
    for h in [6, 12, 24, 48, 72]:
        cutoff = now_utc - timedelta(hours=h)
        count = sum(
            1 for t in tweets
            if parse_ts(t.get("timestamp","")) is not None and parse_ts(t.get("timestamp","")) >= cutoff
        )
        velocity[h] = {"count": count, "rate_per_day": round(count / h * 24, 1) if h > 0 else 0}

    return {
        "market_id": mkt["id"],
        "question": mkt["question"],
        "target": target,
        "window": f"{ws[:10]} ~ {we[:10]}",
        "confirmed": confirmed,
        "days_remaining": round(days_rem, 2),
        "remaining_to_target": remaining,
        "required_rate": req_rate,
        "real_rate": DAILY_RATE,
        "velocity_ratio": vel_ratio,
        # YES/NO binary
        "yes_price": yes_price,
        "no_price": no_price,
        "p_yes": round(p_yes, 4),
        "p_no": round(p_no, 4),
        "edge_yes": round(yes_edge_raw, 4),
        "edge_yes_pct": f"{yes_edge_raw*100:+.1f}%",
        "edge_no": round(no_edge_raw, 4),
        "edge_no_pct": f"{no_edge_raw*100:+.1f}%",
        "kelly_yes_full": round(yes_kelly_full, 4),
        "kelly_yes_half": round(yes_kelly_full * 0.5, 4),
        "kelly_yes_quarter": round(yes_kelly_full * 0.25, 4),
        "kelly_no_full": round(no_kelly_full, 4),
        "kelly_no_quarter": round(no_kelly_full * 0.25, 4),
        # MC stats
        "mc": mc,
        # Per-bucket analysis
        "buckets": bucket_probs,
        # Velocity from our tweets
        "velocity": velocity,
        # Verdict
        "best_bet": best_bet,
        "best_side": best_side,
        "best_kelly_fraction": round(best_kelly, 4),
        "is_forecast": is_forecast,
        "total_tweets_collected": len(tweets),
        "analysis_time": now_utc.isoformat(),
    }


def print_report(results: list):
    now = datetime.now().strftime("%Y-%m-%d %H:%M UTC")
    print(f"\n{'='*72}")
    print(f"  ELON TRACKER v2 - FULL ANALYSIS  ({now})")
    print(f"  Daily rate: ~{DAILY_RATE}/day | xtrack confirmed counts | multi-outcome")
    print(f"{'='*72}\n")

    for r in results:
        print(f"{'='*72}")
        print(f"  [{r['market_id']}] {r['question']}")
        print(f"  Window: {r['window']} | Days left: {r['days_remaining']:.1f}")
        print(f"{'='*72}")

        # Status
        status = "ALREADY RESOLVED" if r['confirmed'] >= r['target'] else "IN PROGRESS"
        print(f"\n  STATUS: {status}")
        print(f"  xtrack confirmed: {r['confirmed']} / target: {r['target']}")
        if r['remaining_to_target'] > 0:
            print(f"  Remaining: {r['remaining_to_target']} tweets needed in {r['days_remaining']:.1f}d")
            print(f"  Required rate: {r['required_rate']}/day | Real rate: ~{r['real_rate']}/day")
            print(f"  Velocity ratio: {r['velocity_ratio']}x")
        else:
            print(f"  TARGET REACHED: {r['confirmed']} >= {r['target']}")

        # YES/NO binary
        print(f"\n  BINARY: YES vs NO")
        print(f"    YES @ {r['yes_price']:.0%}  -->  P(YES)={r['p_yes']:.1%}  edge={r['edge_yes_pct']}  Kelly1/4={r['kelly_yes_quarter']*100:.1f}%")
        print(f"    NO  @ {r['no_price']:.0%}   -->  P(NO)={r['p_no']:.1%}  edge={r['edge_no_pct']}  Kelly1/4={r['kelly_no_quarter']*100:.1f}%")

        # Outcome buckets
        print(f"\n  OUTCOME BUCKETS (multi-outcome analysis):")
        print(f"    {'Range':>12}  {'P(ours)':>8}  {'PM price':>9}  {'Edge':>8}  {'Action':>6}")
        print(f"    {'-'*12}  {'-'*8}  {'-'*9}  {'-'*8}  {'-'*6}")
        for b in r["buckets"]:
            if b["prob"] > 0.001 or b["pm_price"] > 0.001:
                print(f"    {b['label']:>12}  {b['prob_pct']:>8}  {b['pm_price']:>9.0%}  {b['edge_pct']:>8}  {b['action']:>6}")

        # MC scenarios
        mc = r.get("mc", {})
        print(f"\n  MC SCENARIOS:")
        for nm, sc in mc.get("scenarios", {}).items():
            print(f"    {nm:6s}: rate={sc.get('rate',0):.0f}/day  wt={sc.get('weight',0)*100:.0f}%")
        if mc:
            print(f"    Expected final: ~{mc.get('mean','?')} tweets  P10={mc.get('p10','?')}  P90={mc.get('p90','?')}")

        # Verdict
        bet = r["best_bet"]
        print(f"\n  VERDICT: {bet}")
        if bet != "NO_EDGE":
            print(f"    Side: {r['best_side']}  Kelly(f)={r['best_kelly_fraction']*100:.1f}%")
        print()


def save_report(results: list):
    out_dir = PROJECT_ROOT / "output"
    out_dir.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    save = {
        "version": "v2",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "daily_rate": DAILY_RATE,
        "results": results,
    }
    fp = out_dir / f"full_analysis_v2_{ts}.json"
    latest = out_dir / "latest_full_analysis.json"
    fp.write_text(json.dumps(save, ensure_ascii=False, indent=2), encoding="utf-8")
    latest.write_text(json.dumps(save, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved: {fp.name}")


if __name__ == "__main__":
    now_utc = datetime.now(timezone.utc)
    results = [analyze_market(m, now_utc) for m in MARKETS]
    print_report(results)
    save_report(results)
