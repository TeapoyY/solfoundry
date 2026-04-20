#!/usr/bin/env python3
"""
Fetch live Polymarket YES/NO prices from HTML __NEXT_DATA__.
Extracts tweetCount + binary market YES/NO prices + range bucket prices.
"""
import json
import re
import time
import urllib.request
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
PROXY = urllib.request.ProxyHandler({
    "http": "http://127.0.0.1:7890",
    "https": "http://127.0.0.1:7890"
})
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}

MARKET_SLUGS = [
    ("apr14-21", "elon-musk-of-tweets-april-14-april-21"),
    ("apr17-24", "elon-musk-of-tweets-april-17-april-24"),
    ("may2026",  "elon-musk-of-tweets-may-2026"),
]


def fetch_prices_for_slug(market_id: str, url_slug: str) -> dict:
    """Fetch prices + tweetCount for one market from Polymarket HTML."""
    url = f"https://polymarket.com/event/{url_slug}"
    try:
        opener = urllib.request.build_opener(PROXY)
        req = urllib.request.Request(url, headers=HEADERS)
        with opener.open(req, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        return {"yes": None, "no": None, "tweet_count": None, "error": str(e)}

    # Extract tweet count from event JSON
    tweet_count = None
    binary_yes = None
    binary_no = None
    bucket_prices = {}

    try:
        idx = html.find("__NEXT_DATA__")
        js_start = html.find(">", idx) + 1
        js_end = html.find("</script>", js_start)
        next_data = html[js_start:js_end]
        data = json.loads(next_data)

        queries = data["props"]["pageProps"]["dehydratedState"]["queries"]
        for q in queries:
            qkey = q.get("queryKey", [])
            if isinstance(qkey, list) and "/api/event/slug" in str(qkey):
                event = q["state"]["data"]
                tweet_count = event.get("tweetCount")
                markets = event.get("markets", [])

                # Separate binary market from range buckets
                binary_q = None
                for m in markets:
                    q_text = m.get("question", "")
                    ops = m.get("outcomePrices", [])
                    outs = m.get("outcomes", [])
                    if len(ops) != 2 or len(outs) != 2:
                        continue

                    yes_p = float(ops[0]) if outs[0] in ("Yes", "YES") else float(ops[1])
                    no_p = float(ops[1]) if outs[1] in ("No", "NO") else float(ops[0])

                    # Binary YES/NO market: question like "at least N tweets"
                    if "at least" in q_text.lower() or "over " in q_text.lower():
                        binary_yes = yes_p
                        binary_no = no_p
                        binary_q = q_text
                    else:
                        # Range bucket
                        slug_m = m.get("slug", "")
                        bucket_prices[slug_m] = {
                            "yes": yes_p, "no": no_p,
                            "question": q_text
                        }

                print(f"  [{market_id}] tweetCount={tweet_count}, binary='{binary_q[:50] if binary_q else None}'")
                break
    except Exception as e:
        return {"yes": None, "no": None, "tweet_count": None, "error": str(e)}

    return {
        "yes": binary_yes,
        "no": binary_no,
        "tweet_count": tweet_count,
        "bucket_prices": bucket_prices,
        "source": "polymarket_html",
        "fetched_at": time.time()
    }


def fetch_all_live_prices() -> dict:
    """Fetch prices for all tracked markets."""
    print("  Fetching all markets via Polymarket HTML...")
    results = {}
    for market_id, url_slug in MARKET_SLUGS:
        print(f"  [{market_id}] {url_slug}")
        r = fetch_prices_for_slug(market_id, url_slug)
        results[market_id] = r
        if r.get("bucket_prices"):
            bp_count = len(r["bucket_prices"])
            yes_p = r.get("yes")
            no_p = r.get("no")
            print(f"  [{market_id}] buckets={bp_count}, YES={yes_p}, NO={no_p}")

    return results


def save_prices(prices: dict):
    DATA_DIR.mkdir(exist_ok=True, parents=True)
    p = DATA_DIR / "live_prices.json"
    p.write_text(json.dumps(prices, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nSaved to {p}")


if __name__ == "__main__":
    print("Fetching live prices from Polymarket HTML...\n")
    p = fetch_all_live_prices()
    save_prices(p)

    for mid, d in p.items():
        yes = d.get("yes")
        no = d.get("no")
        tc = d.get("tweet_count")
        print(f"\n  [{mid}] tweetCount={tc}")
        if yes is not None:
            print(f"  [{mid}] YES={yes:.4f} NO={no:.4f}")
        else:
            print(f"  [{mid}] no live price (binary market may be resolved)")
        bp = d.get("bucket_prices", {})
        if bp:
            active = [(s, bd) for s, bd in bp.items() if bd["yes"] > 0.001]
            for s, bd in sorted(active, key=lambda x: -x[1]["yes"])[:5]:
                print(f"    {bd['question'][:70]}: YES={bd['yes']:.4f} NO={bd['no']:.4f}")
