"""
Hourly analysis entry point for Polymarket Elon Tracker.
=======================================================
Flow:
1. Fetch live xtrack counts from Polymarket via browser relay
2. Run full analysis with live counts
3. Save snapshot to output/

Usage:
    python quick_check.py           # full: fetch + analyze
    python quick_check.py --no-fetch  # analyze only (use cached live_xtrack.json)
"""
import sys
import json
from pathlib import Path

TRACKER_DIR = Path(r"C:\Users\Administrator\.openclaw\workspace\polymarket-elon-tracker")
sys.path.insert(0, str(TRACKER_DIR / "src"))

from full_analyzer import analyze_market, MARKETS, print_report, save_report, load_live_xtrack
from datetime import datetime, timezone

FETCH_LIVE = "--no-fetch" not in sys.argv

if FETCH_LIVE:
    print("Step 1: Fetching live xtrack counts from Polymarket...")
    try:
        import subprocess
        result = subprocess.run(
            [r"C:\Program Files\nodejs\node.exe",
             str(TRACKER_DIR / "fetch_live_counts.py")],
            capture_output=True, text=True, timeout=120
        )
        print(result.stdout)
        if result.returncode != 0:
            print("WARNING: fetch failed:", result.stderr[:500])
    except Exception as e:
        print(f"WARNING: Could not fetch live counts: {e}")
        print("Using cached/hardcoded counts...")

print("\nStep 2: Running analysis...")
live = load_live_xtrack()
for cid, cnt in live.items():
    print(f"  {cid}: xtrack confirmed = {cnt}")

now_utc = datetime.now(timezone.utc)
results = [analyze_market(m, now_utc) for m in MARKETS]
print_report(results)
save_report(results)
