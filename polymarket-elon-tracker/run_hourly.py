"""
Hourly Analysis Runner — Polymarket Elon Tracker v3
===================================================
v3 improvements:
- Live Polymarket prices fetched via browser relay
- xtrack count change detection with Feishu alerts
- Multi-bucket combo display (top 5 signals per market)
- All prices/edge/Kelly shown for YES and NO sides
"""
import json
import subprocess
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

TRACKER_DIR = Path(r"C:\Users\Administrator\.openclaw\workspace\polymarket-elon-tracker")
PY = "py"  # Use py launcher (Python 3.12, resolves WindowsApps python.exe confusion)
sys.path.insert(0, str(TRACKER_DIR / "src"))

from full_analyzer import (
    analyze_market, MARKETS, load_live_xtrack,
    load_live_prices, load_xtrack_snapshot,
    mc_final_count, DAILY_RATE, PEAK_HOURS, save_xtrack_snapshot
)

# ── xtrack Time-Series Logger ─────────────────────────────────────────────────
def record_xtrack_series(live_counts: dict, live_prices: dict, now_utc: datetime):
    """
    Append xtrack readings to a persistent JSONL log for historical analysis.
    File: data/xtrack_series.jsonl
    Each line: {"ts": "...", "market_id": "...", "xtrack": N, "source": "...", "price_yes": N}
    """
    series_path = TRACKER_DIR / "data" / "xtrack_series.jsonl"
    rows = []
    for mid, count_data in live_counts.items():
        tc = count_data.get("xtrack_confirmed")
        # Skip null readings (market ended or relay unavailable)
        if tc is None:
            continue
        live_p = live_prices.get(mid, {})
        rows.append({
            "ts": now_utc.isoformat(),
            "market_id": mid,
            "xtrack": tc,
            "source": count_data.get("source", "unknown"),
            "price_yes": live_p.get("yes"),
            "price_no": live_p.get("no"),
        })
    if not rows:
        return
    with open(series_path, "a", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    print(f"  → xtrack series logged: {len(rows)} rows to {series_path.name}")


# ── xtrack change detection ──────────────────────────────────────────────────
def check_xtrack_changes(now_utc: datetime) -> list:
    """
    Compare current xtrack_confirmed with previous snapshot.
    Returns list of alert dicts for markets where count changed.
    """
    alerts = []
    snapshot = load_xtrack_snapshot()
    prev_counts = snapshot.get("counts", {})

    for m in MARKETS:
        cid = m["id"]
        current = m.get("xtrack_confirmed", 0) or 0
        prev = prev_counts.get(cid, None)

        if prev is not None and current != prev:
            delta = current - prev
            direction = "↑" if delta > 0 else "↓"
            alerts.append({
                "market_id": cid,
                "previous": prev,
                "current": current,
                "delta": delta,
                "direction": direction,
                "msg": f"⚡ xtrack {cid}: {prev} → {current} ({direction}{abs(delta)})"
            })
            print(f"  [!] xtrack CHANGED: {cid}: {prev} → {current} ({direction}{abs(delta)})")

    return alerts


def send_feishu_alert(alerts: list):
    """Send xtrack change alerts to Feishu."""
    if not alerts:
        return
    lines = ["⚡ **xtrack数量变动告警**\n"]
    for a in alerts:
        lines.append(f"{a['direction']} **{a['market_id'].upper()}**: {a['previous']} → {a['current']} ({a['direction']}{abs(a['delta'])})")

    msg = "\n".join(lines)
    try:
        from importlib import import_module
        # Use openclaw message tool via subprocess
        msg_cmd = f'openclaw msg send --channel feishu --message {json.dumps(msg)}'
        subprocess.run(msg_cmd, shell=True, capture_output=True, timeout=10)
    except Exception as e:
        print(f"Feishu alert failed: {e}")


# ── Fetch live xtrack counts via browser relay ───────────────────────────────
def fetch_live_counts_now() -> dict:
    """
    Run fetch_live_counts.py to get real-time xtrack confirmed counts.
    Returns dict like {"apr14-21": {"xtrack_confirmed": 170, ...}, ...}
    """
    print("Fetching live xtrack counts from Polymarket...")
    result = subprocess.run(
        [PY, str(TRACKER_DIR / "fetch_live_counts.py")],
        capture_output=True, text=True, timeout=180
    )
    counts_path = TRACKER_DIR / "data" / "live_xtrack.json"
    if counts_path.exists():
        try:
            data = json.loads(counts_path.read_text("utf-8"))
            for mid, d in data.items():
                tc = d.get("xtrack_confirmed")
                print(f"  {mid}: xtrack confirmed = {tc}")
            return data
        except Exception:
            pass
    print("  No live xtrack data fetched (browser relay may be unavailable)")
    return {}


# ── Fetch live prices via browser ───────────────────────────────────────────
def fetch_live_prices_now() -> dict:
    """
    Run fetch_live_prices.py to get real-time Polymarket YES/NO prices.
    Returns dict like {"apr14-21": {"yes": 0.87, "no": 0.13}, ...}
    """
    print("Fetching live Polymarket prices...")
    result = subprocess.run(
        [PY, str(TRACKER_DIR / "fetch_live_prices.py")],
        capture_output=True, text=True, timeout=120
    )
    # Load what was saved
    prices_path = TRACKER_DIR / "data" / "live_prices.json"
    if prices_path.exists():
        try:
            return json.loads(prices_path.read_text("utf-8"))
        except:
            pass
    return {}


# ── Format Feishu message (v3: multi-bucket + live prices) ──────────────────
def format_feishu_message_v3(results: list, hourly_info: dict, live_prices: dict,
                               xtrack_alerts: list, tweets: list) -> str:
    """Format the full analysis as a Feishu-ready message (v3)."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    current_hour = hourly_info.get("current_hour_utc", 0)
    peak = hourly_info.get("is_peak_window", False)
    peak_hrs = hourly_info.get("peak_hours_utc", [])
    peak_label = f"{peak_hrs[0]:02d}-{peak_hrs[-1]:02d}" if peak_hrs else "?"

    msg_parts = []

    # Header
    msg_parts.append(
        f"🧠 POLYMARKET ELON TRACKER — HOURLY REPORT\n"
        f"📅 {now} | UTC {current_hour:02d}:00 ({'🌙 PEAK' if peak else '☀️ quiet'} ~{peak_label})\n"
    )

    # xtrack alerts
    if xtrack_alerts:
        alert_lines = ["⚡ **xtrack变动告警**"]
        for a in xtrack_alerts:
            alert_lines.append(
                f"  {a['direction']} **{a['market_id'].upper()}**: {a['previous']} → {a['current']} ({a['direction']}{abs(a['delta'])})"
            )
        msg_parts.append("\n".join(alert_lines) + "\n")

    msg_parts.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    for r in results:
        mid = r["market_id"]
        confirmed = r.get("xtrack_confirmed", 0)
        target = r.get("target", 0)
        remaining = r.get("remaining_to_target", 0)
        h_rem = r.get("hours_remaining", 0)
        per_hour_needed = r.get("tweets_needed_per_hour", 999)
        per_hour_real = r.get("tweets_per_hour_real_base", 0)
        in_peak = r.get("in_peak_window", False)
        peak_rate = r.get("tweets_per_hour_peak_adjusted", 0)

        combos = r.get("combos", [])
        verdict = r.get("best_bet", "NO_EDGE")
        p_yes = r.get("p_yes", 0)
        p_no = r.get("p_no", 0)
        yes_edge = r.get("edge_yes_pct", "N/A")
        no_edge = r.get("edge_no_pct", "N/A")
        kelly_yes = r.get("kelly_yes_quarter", 0)
        kelly_no = r.get("kelly_no_quarter", 0)

        # Live prices
        live = live_prices.get(mid, {})
        live_yes = live.get("yes")
        live_no = live.get("no")

        # Status emoji
        if verdict == "BUY_YES":
            emoji = "✅"
        elif verdict == "BUY_NO":
            emoji = "🚫"
        else:
            emoji = "⚠️"

        # Price line
        if live_yes is not None:
            price_str = f"YES={live_yes:.0%} NO={live_no:.0%}" if live_no else f"YES={live_yes:.0%}"
            price_src = " [LIVE]"
        else:
            pm_yes = r.get("yes_price", 0)
            price_str = f"YES={pm_yes:.0%}"
            price_src = " [hardcoded]"

        msg_parts.append(
            f"【{mid.upper()}】{emoji} {verdict}{price_src}\n"
            f"• xtrack: {confirmed}/{target} | 剩余: {remaining}帖\n"
            f"• ⏱️ {h_rem:.1f}h | 需要: {per_hour_needed:.1f}/h | 实际: {per_hour_real:.2f}/h\n"
            f"• {'🌙 PEAK时:' + str(peak_rate) + '/h [IN WINDOW]' if in_peak else '☀️ 非高峰'}\n"
            f"• PM: {price_str} | 我们的P: YES={p_yes:.0%} NO={p_no:.0%}\n"
        )

        # Binary edge summary
        msg_parts.append(
            f"• Edge: YES {yes_edge} | NO {no_edge}\n"
            f"• Kelly¼: YES={kelly_yes*100:.0f}% | NO={kelly_no*100:.0f}%"
        )

        # Multi-bucket combos (show top 5 by edge)
        valid_combos = [c for c in combos if c.get("combo_edge", 0) > 0 and not c.get("is_full")]
        valid_combos.sort(key=lambda x: x["combo_edge"], reverse=True)
        top_combos = valid_combos[:5]

        if top_combos:
            msg_parts.append("\n🎯 **Bucket信号 TOP5** (按Edge排序):")
            for i, c in enumerate(top_combos, 1):
                edge_val = c["combo_edge"] * 100
                kelly_val = c["kelly_quarter"] * 100
                cost_val = c["combo_cost"] * 100
                action = c.get("action", "HOLD")
                action_emoji = "🟢" if action == "BUY" else ("🔴" if action == "SELL" else "⚪")
                msg_parts.append(
                    f"{i}. [{action_emoji}{action}] {c['combo_label']}: "
                    f"P={c['combo_prob_pct']} | Cost={cost_val:.0f}% | "
                    f"Edge={edge_val:+.1f}% | Kelly¼={kelly_val:.0f}%"
                )

        msg_parts.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    # Hourly pattern
    quiet_hrs = hourly_info.get("quiet_hours_utc", [])
    quiet_str = ",".join(f"{h:02d}:00" for h in quiet_hrs[:3])
    peak_str = ",".join(f"{h:02d}:00" for h in peak_hrs[:4])

    msg_parts.append(
        f"📊 ELON发帖模式(UTC)\n"
        f"🌙 高峰: {peak_str} UTC\n"
        f"☀️ 低谷: {quiet_str} UTC\n"
        f"📌 当前{current_hour:02d}:00 UTC — {'🌙 高峰' if peak else '☀️ 低谷'}\n\n"
        f"📌 规则: 主贴+引用转发+转发=计入 | 纯回复不计入 | 社区转发不计入"
    )

    return "\n".join(msg_parts)


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    now_utc = datetime.now(timezone.utc)
    print(f"\n=== HOURLY REPORT {now_utc.isoformat()} ===")

    # 0. Fetch live xtrack counts FIRST (this is the main fix)
    print("\n[0/5] Fetching live xtrack counts from Polymarket...")
    live_counts = fetch_live_counts_now()

    # 0b. Apply live counts to MARKETS so subsequent functions get real data
    for m in MARKETS:
        cid = m["id"]
        if cid in live_counts:
            tc = live_counts[cid].get("xtrack_confirmed")
            if tc is not None:
                m["xtrack_confirmed"] = tc
                print(f"  Updated {cid} xtrack_confirmed = {tc}")

    # 1. Check xtrack changes BEFORE analysis (compare with previous snapshot)
    print("\n[1/5] Checking xtrack changes vs previous snapshot...")
    xtrack_alerts = check_xtrack_changes(now_utc)

    # 2. Fetch live prices via browser relay
    print("\n[2/5] Fetching live Polymarket prices...")
    live_prices = fetch_live_prices_now()
    if live_prices:
        for mid, data in live_prices.items():
            yes = data.get("yes")
            print(f"  {mid}: YES={yes:.2f}" if yes else f"  {mid}: no price")
    else:
        print("  No live prices fetched (browser relay may be unavailable)")

    # 2b. Record xtrack to time-series log for historical analysis
    print("\n[2b/5] Recording xtrack time-series...")
    record_xtrack_series(live_counts, live_prices, now_utc)

    # 3. Save current xtrack snapshot AFTER analysis (for next-run comparison)
    print("\n[4/6] Running analysis...")
    tweets_path = TRACKER_DIR / "data" / "tweets_latest.json"
    tweets = []
    if tweets_path.exists():
        with open(tweets_path, encoding="utf-8") as f:
            tweets = json.load(f).get("tweets", [])

    # Hourly pattern
    from collections import Counter
    hourly_rates = {}
    for t in tweets:
        ts_str = t.get("timestamp", "")
        if ts_str:
            try:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                hourly_rates[ts.hour] = hourly_rates.get(ts.hour, 0) + 1
            except:
                pass
    total = len(tweets) or 1
    peak_hrs = sorted([h for h, c in hourly_rates.items() if c > 0], key=lambda h: -hourly_rates[h])[:6]
    quiet_hrs = sorted([h for h in range(24) if h not in peak_hrs and hourly_rates.get(h, 0) == 0])[:6]
    current_hour = now_utc.hour
    hourly_info = {
        "current_hour_utc": current_hour,
        "is_peak_window": current_hour in PEAK_HOURS,
        "peak_hours_utc": peak_hrs,
        "quiet_hours_utc": quiet_hrs,
    }

    # Analyze each market
    results = []
    for m in MARKETS:
        # Override prices with live data if available
        live = live_prices.get(m["id"], {})
        if live.get("yes") is not None:
            m = {**m, "pm_yes_price": live["yes"], "pm_no_price": live.get("no", 1 - live["yes"])}

        r = analyze_market(m, now_utc)
        hl = {
            "hours_remaining": max((datetime.fromisoformat(m["we"].replace("Z", "+00:00")) - now_utc).total_seconds() / 3600, 0),
            "tweets_needed_per_hour": round((r["target"] - r["xtrack_confirmed"]) / max((datetime.fromisoformat(m["we"].replace("Z", "+00:00")) - now_utc).total_seconds() / 3600, 0.1), 2),
            "tweets_per_hour_real_base": round(DAILY_RATE / 24, 2),
            "tweets_per_hour_peak_adjusted": round(DAILY_RATE / 24 * (2.5 if current_hour in PEAK_HOURS else 1.0), 2),
            "in_peak_window": current_hour in PEAK_HOURS,
        }
        r.update(hl)
        results.append(r)

    # 4. Save snapshot AFTER analysis (for next-run change detection)
    print("\n[4/6] Saving xtrack snapshot...")
    save_xtrack_snapshot(now_utc)

    # Save output files
    out_dir = TRACKER_DIR / "output"
    out_dir.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    save = {
        "collected_at": now_utc.isoformat(),
        "live_prices": live_prices,
        "xtrack_alerts": xtrack_alerts,
        "hourly_pattern": hourly_info,
        "results": results,
        "total_tweets": len(tweets),
    }
    latest = out_dir / "latest_hourly_analysis.json"
    fp = out_dir / f"hourly_{ts}.json"
    fp.write_text(json.dumps(save, ensure_ascii=False, indent=2), encoding="utf-8")
    latest.write_text(json.dumps(save, ensure_ascii=False, indent=2), encoding="utf-8")

    # Format message
    msg = format_feishu_message_v3(results, hourly_info, live_prices, xtrack_alerts, tweets)

    # Console summary (ASCII-safe)
    print(f"\nAnalysis complete. {len(results)} markets.")
    for r in results:
        combos = r.get("combos", [])
        top3 = [c for c in combos if c.get("combo_edge", 0) > 0 and not c.get("is_full")][:3]
        print(f"  {r['market_id']}: xtrack={r['xtrack_confirmed']}/{r['target']} | "
              f"P(YES)={r['p_yes']:.0%} | top3: {[(c['combo_label'], c['combo_prob_pct']) for c in top3]}")

    # Send xtrack alerts to Feishu
    if xtrack_alerts:
        print("\nSending xtrack change alerts...")
        send_feishu_alert(xtrack_alerts)

    # Save Feishu message
    msg_file = out_dir / "latest_feishu_msg.txt"
    msg_file.write_text(msg, encoding="utf-8")
    print(f"\n[6/6] Saved: {fp.name}")
    print(f"Feishu msg: {msg_file}")

    try:
        print("\n" + "="*50)
        print(msg)
    except UnicodeEncodeError:
        pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
