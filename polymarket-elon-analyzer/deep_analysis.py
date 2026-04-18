#!/usr/bin/env python3
"""
Deep Analysis Engine - 超越价格的多维度分析
分析维度:
  1. 价格结构 (market microstructure)
  2. 真实速度数据 (xtracker / 链上数据)
  3. 时间序列分解 (趋势/周期/节假日效应)
  4. 内容分析 (via OpenClaw browser)
  5. 市场结构 (流动性/资金分布/聪明钱信号)
  6. 统计推断 (贝叶斯 / Monte Carlo)
"""

import sys
import json
import math
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

PROJECT_ROOT = Path(__file__).parent.resolve()
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from elon_tracker.posting_analyzer import PostingAnalyzer
from elon_tracker.threshold_engine import ThresholdEngine


# ============================================================
# 数据 (从 xtracker.polymarket.com 快照 2026-04-18 02:15 HKT)
# ============================================================
XTRACKER = {
    "April 14-21": {"count": 116,  "start": "Apr 14", "end": "Apr 21", "resolved": False},
    "April 17-24": {"count": 7,    "start": "Apr 17", "end": "Apr 24", "resolved": False},
    "April 16-18": {"count": 42,   "start": "Apr 16", "end": "Apr 18", "resolved": True},   # 历史对照
    "May 2026":     {"count": 0,    "start": "May 1",  "end": "May 31", "resolved": False},
}

MARKETS = [
    {
        "id": "elon-apr14-21",
        "question": "Elon Musk # tweets April 14 - April 21, 2026?",
        "target": 190, "yes_price": 0.57, "volume": 500000,
        "end_date": "2026-04-21", "xt_key": "April 14-21",
        "funded_y": 285000, "funded_n": 215000,  # 资金分布估算
    },
    {
        "id": "elon-apr17-24",
        "question": "Elon Musk # tweets April 17 - April 24, 2026?",
        "target": 200, "yes_price": 0.50, "volume": 100000,
        "end_date": "2026-04-24", "xt_key": "April 17-24",
        "funded_y": 50000, "funded_n": 50000,
    },
    {
        "id": "elon-may2026",
        "question": "Elon Musk # tweets May 2026?",
        "target": 800, "yes_price": 0.50, "volume": 50000,
        "end_date": "2026-05-31", "xt_key": "May 2026",
        "funded_y": 25000, "funded_n": 25000,
    },
]

# Elon 历史发帖数据 (基于公开数据统计)
ELON_BASELINE = {
    "posts_per_day": 45.0,
    "posts_per_week": 300.0,
    "median_posts_per_day": 38,       # 中位数(更抗异常值)
    "std_dev_daily": 22.0,            # 标准差
    "peak_day_multiplier": 1.4,       # 高峰日(周末/周一)放大系数
    "hourly_pattern": {              # 24小时分布 (相对倍数)
        0: 0.6, 1: 0.4, 2: 0.3, 3: 0.3, 4: 0.3, 5: 0.4,
        6: 0.6, 7: 0.8, 8: 1.1, 9: 1.2, 10: 1.3, 11: 1.4,
        12: 1.5, 13: 1.4, 14: 1.3, 15: 1.2, 16: 1.1, 17: 1.0,
        18: 1.2, 19: 1.4, 20: 1.6, 21: 1.5, 22: 1.2, 23: 0.9,
    },
    "dow_pattern": {  # 0=周一, 6=周日
        0: 1.15, 1: 1.20, 2: 1.05, 3: 1.00, 4: 0.95, 5: 0.85, 6: 0.80
    },
}


def calc_days(date_str: str) -> float:
    now = datetime.now()
    try:
        target = datetime.strptime(date_str[:10], "%Y-%m-%d")
        delta = target - now
        return max(delta.total_seconds() / 86400, 0)
    except:
        return 0.0


def normal_cdf(x, mu=0, sigma=1):
    """标准正态CDF"""
    return 0.5 * (1 + math.erf((x - mu) / (sigma * math.sqrt(2))))


def bayes_prob(prior: float, likelihood_yes: float, likelihood_no: float) -> float:
    """贝叶斯更新: P(H|E) = P(E|H)*P(H) / (P(E|H)*P(H) + P(E|~H)*P(~H))"""
    norm = likelihood_yes * prior + likelihood_no * (1 - prior)
    if norm == 0:
        return prior
    return (likelihood_yes * prior) / norm


def monte_carlo_simulation(current_count: int, target: int, days: float,
                            n_sims: int = 30000) -> dict:
    """
    三情景 Monte Carlo: 解决"贝叶斯假设单一速度"的问题
    情景权重:
      - Bear (慢速, 0.7*EWMA): 20% 概率
      - Base (EWMA): 50% 概率
      - Bull (历史基线, 45/day): 30% 概率
    """
    import numpy as np

    if days <= 0:
        actual = current_count
        return {
            "mean": actual, "median": actual,
            "p_reach_target": 1.0 if actual >= target else 0.0,
            "p_2x": 1.0 if actual >= target * 2 else 0.0,
            "p_1_5x": 1.0 if actual >= target * 1.5 else 0.0,
            "scenarios": {},
        }

    # Apr14-21期间实测速度: 116/4 = 29/day
    # EWMA: 0.7*29 + 0.3*21 = 26.6/day
    ewma_rate = 26.6
    baseline_rate = ELON_BASELINE["posts_per_day"]  # 45/day

    scenarios = {}
    weights = {"bear": 0.20, "base": 0.50, "bull": 0.30}
    rates = {
        "bear": ewma_rate * 0.7,  # 18.6/day
        "base": ewma_rate,         # 26.6/day
        "bull": baseline_rate,     # 45/day
    }

    all_scenario_results = []
    scenario_summaries = {}

    for scenario_name, rate in rates.items():
        np.random.seed(42 if scenario_name == "bear" else (43 if scenario_name == "base" else 44))
        lam = rate * days
        results = [current_count + int(np.random.poisson(lam)) for _ in range(n_sims)]
        results.sort()

        p_reach = sum(1 for r in results if r >= target) / n_sims
        mean = sum(results) / len(results)
        ci_low = results[int(n_sims * 0.05)]
        ci_high = results[int(n_sims * 0.95)]

        scenario_summaries[scenario_name] = {
            "rate": round(rate, 1),
            "p_reach": round(p_reach, 4),
            "mean": round(mean, 1),
            "ci_90": [int(ci_low), int(ci_high)],
            "weight": weights[scenario_name],
        }
        all_scenario_results.extend([(r, weights[scenario_name]) for r in results])

    # 加权综合 P(达到目标)
    total_weight = sum(w for _, w in all_scenario_results)
    # 对于每个模拟结果，计算加权计数 (每个情景有n_sims个结果)
    # P(reach) = sum over all results of (result >= target ? weight : 0) / total_weight
    p_reach_weighted = sum(w for r, w in all_scenario_results if r >= target) / total_weight

    # 加权均值和中位数
    all_scenario_results.sort(key=lambda x: x[0])
    weighted_mean = sum(r * w for r, w in all_scenario_results) / total_weight
    median_idx = int(len(all_scenario_results) * 0.5)
    weighted_median = all_scenario_results[median_idx][0]

    # P(1.5x), P(2x)
    p_1_5x = sum(w for r, w in all_scenario_results if r >= target * 1.5) / total_weight
    p_2x = sum(w for r, w in all_scenario_results if r >= target * 2) / total_weight

    # 90% CI
    ci_low_w = all_scenario_results[int(len(all_scenario_results) * 0.05)][0]
    ci_high_w = all_scenario_results[int(len(all_scenario_results) * 0.95)][0]

    return {
        "mean": round(weighted_mean, 1),
        "median": int(weighted_median),
        "p_reach_target": round(p_reach_weighted, 4),
        "p_1_5x": round(p_1_5x, 4),
        "p_2x": round(p_2x, 4),
        "ci_90_lower": int(ci_low_w),
        "ci_90_upper": int(ci_high_w),
        "scenarios": scenario_summaries,
        "ewma_rate": ewma_rate,
        "baseline_rate": baseline_rate,
    }


def velocity_multifactor(current_count: int, target: int, days: float) -> dict:
    """
    多因子速度分析
    因子:
      - 基础速度比 (velocity ratio)
      - 趋势调整 (用历史同期数据线性回归斜率)
      - 周期性调整 (星期几/几点的影响)
      - 极端情况概率 (long-tail 风险)
    """
    needed = max(target - current_count, 0)
    if needed <= 0:
        return {"signal": "TARGET_REACHED", "confidence": 0.999,
                "reason": "Already past target", "factors": {}}

    required_rate = needed / days
    base_ratio = ELON_BASELINE["posts_per_day"] / required_rate if required_rate > 0 else 999

    factors = {}

    # 因子1: 基础速度比
    factors["velocity_ratio"] = round(base_ratio, 2)
    factors["velocity_signal"] = "STRONG" if base_ratio >= 2.0 else ("OK" if base_ratio >= 1.5 else ("WEAK" if base_ratio >= 1.0 else "VERY_WEAK"))

    # 因子2: 期限压力 (days越少越危险)
    factors["days_remaining"] = round(days, 1)
    if days <= 1:
        pressure = "EXTREME"
    elif days <= 2:
        pressure = "HIGH"
    elif days <= 3:
        pressure = "MEDIUM"
    else:
        pressure = "LOW"
    factors["deadline_pressure"] = pressure

    # 因子3: 距离目标的百分比
    pct_done = current_count / target if target > 0 else 1.0
    factors["pct_complete"] = round(pct_done, 3)

    # 因子4: 每日稳定性 (标准差变异系数)
    cv = ELON_BASELINE["std_dev_daily"] / ELON_BASELINE["posts_per_day"]
    factors["daily_cv"] = round(cv, 3)  # 变异系数
    factors["volatility_note"] = "HIGH" if cv > 0.5 else ("MODERATE" if cv > 0.3 else "LOW")

    # 因子5: 极端低估/高估风险
    # 使用正态分布计算 P(实际速度 << 需要的速度)
    if required_rate > 0:
        z_score = (ELON_BASELINE["posts_per_day"] - required_rate) / ELON_BASELINE["std_dev_daily"]
        p_too_slow = normal_cdf(0, mu=ELON_BASELINE["posts_per_day"] - required_rate,
                                 sigma=ELON_BASELINE["std_dev_daily"])
        factors["p_below_required"] = round(max(p_too_slow, 0), 4)
        factors["z_score"] = round(z_score, 2)
    else:
        factors["p_below_required"] = 0.0
        factors["z_score"] = 999

    # 综合置信度
    # 期限压力加权
    pressure_weights = {"LOW": 1.0, "MEDIUM": 0.9, "HIGH": 0.75, "EXTREME": 0.5}
    pressure_factor = pressure_weights.get(pressure, 1.0)

    # 速度比加权 (对数尺度)
    if base_ratio >= 3.0:
        ratio_factor = 1.0
    elif base_ratio >= 2.0:
        ratio_factor = 0.90
    elif base_ratio >= 1.5:
        ratio_factor = 0.80
    elif base_ratio >= 1.0:
        ratio_factor = 0.60
    else:
        ratio_factor = 0.30

    # 进度加权
    progress_factor = 0.5 + 0.5 * min(pct_done, 1.0)

    composite_conf = ratio_factor * pressure_factor * progress_factor
    composite_conf = min(0.95, max(0.30, composite_conf))

    if base_ratio >= 2.0 and days > 3:
        signal = "YES_STRONG"
    elif base_ratio >= 1.5 and days > 1:
        signal = "YES"
    elif base_ratio < 0.6:
        signal = "NO"
    else:
        signal = "NO_EDGE"

    return {
        "signal": signal,
        "confidence": round(composite_conf, 4),
        "velocity_ratio": factors["velocity_ratio"],
        "factors": factors,
        "reason": f"VR={base_ratio:.2f}, pressure={pressure}, progress={pct_done:.0%}",
    }


def market_microstructure(mkt: dict) -> dict:
    """
    市场微观结构分析
    - 资金分布 (聪明钱方向)
    - 流动性信号
    - 价差分析
    - 资金费率推断
    """
    yes_price = mkt["yes_price"]
    no_price = 1 - yes_price
    volume = mkt["volume"]
    funded_y = mkt.get("funded_y", 0)
    funded_n = mkt.get("funded_n", 0)

    # 资金比率 -> 反映群体智慧偏向
    total_funded = funded_y + funded_n
    if total_funded > 0:
        funding_ratio = funded_y / total_funded
    else:
        funding_ratio = yes_price  # fallback

    # 隐含概率 vs 当前价格
    implied_prob = yes_price
    funding_signal = abs(implied_prob - funding_ratio)

    # 流动性评分 (相对于volume)
    # 高volume市场更高效，低volume可能有定价错误
    liquidity_score = min(1.0, volume / 1000000)  # 归一化到 1M

    # 价差 (spread) - Polymarket 通常 1-2%
    spread = 0.02
    mid_price = 0.5  # 价格中性
    effective_spread = spread / mid_price

    # 资金效率 (volume / days_remaining)
    days = calc_days(mkt["end_date"])
    vol_per_day = volume / max(days, 1)
    activity_level = "HIGH" if vol_per_day > 50000 else ("MEDIUM" if vol_per_day > 10000 else "LOW")

    # 杠杆失衡估算 (如果YES价格远低于50%，说明资金在看空)
    imbalance = abs(yes_price - 0.5)

    return {
        "funding_ratio_yes": round(funding_ratio, 3),
        "funding_imbalance": round(imbalance, 3),
        "liquidity_score": round(liquidity_score, 3),
        "volume_per_day": round(vol_per_day, 0),
        "activity_level": activity_level,
        "smart_money_signal": "BEARISH" if funding_ratio < 0.45 else ("BULLISH" if funding_ratio > 0.55 else "NEUTRAL"),
        "spread_estimate": spread,
        "misprice_risk": "HIGH" if (imbalance > 0.15 and volume < 100000) else "LOW",
    }


def time_series_decomposition(current_count: int, target: int, days: float, xt_key: str) -> dict:
    """
    时间序列分解分析
    - 历史对照 (如果有)
    - 趋势检测
    - 周期性发帖模式
    """
    # 历史对照: Apr 16-18 (42 posts in 2 days = 21/day)
    historical_16_18_rate = 21.0  # posts/day
    historical_14_21_rate = 116 / 4.0  # ~29/day (from xtracker)

    # 用指数加权移动平均预测今天的速度
    # 越近期的数据权重越高
    recent_rates = [
        ("Apr 16-18", 21.0, 0.3),   # 历史, 低权重
        ("Apr 14-21 so far", 116/4, 0.7),  # 当前期间, 高权重
    ]

    ewma = sum(rate * w for _, rate, w in recent_rates) / sum(w for _, _, w in recent_rates)

    # 趋势判断: 如果 Apr 14-21 速度 > 历史基线，说明近期在加速
    trend_multiplier = ewma / ELON_BASELINE["posts_per_day"]
    trend_direction = "ACCELERATING" if trend_multiplier > 1.1 else ("DECELERATING" if trend_multiplier < 0.9 else "STABLE")

    # 当前期间剩余计算
    remaining_needed = max(target - current_count, 0)
    required_rate = remaining_needed / days if days > 0 else 999

    # 星期效应 (如果有7天以上)
    dow_estimate = 1.0  # 默认中性
    if days >= 7:
        # 检查剩余天数覆盖几个工作日/周末
        now = datetime.now()
        total_dow_factor = 0
        for d in range(int(days)):
            dt = now + timedelta(days=d)
            dow_factor = ELON_BASELINE["dow_pattern"].get(dt.weekday(), 1.0)
            total_dow_factor += dow_factor
        dow_estimate = total_dow_factor / days
        days_adjusted_rate = ELON_BASELINE["posts_per_day"] * dow_estimate
    else:
        days_adjusted_rate = ELON_BASELINE["posts_per_day"]

    return {
        "ewma_velocity": round(ewma, 1),
        "trend_multiplier": round(trend_multiplier, 2),
        "trend_direction": trend_direction,
        "days_adjusted_rate": round(days_adjusted_rate, 1),
        "dow_adjustment": round(dow_estimate, 3),
        "required_vs_baseline": round(required_rate / ELON_BASELINE["posts_per_day"], 2),
        "historical_comparison": {
            "apr16_18_rate": historical_16_18_rate,
            "apr14_21_rate": round(historical_14_21_rate, 1),
            "baseline": ELON_BASELINE["posts_per_day"],
        }
    }


def bayesian_inference(current_count: int, target: int, days: float, market_prob: float) -> dict:
    """
    贝叶斯推断: 结合先验(市场隐含概率) + 似然(速度分析) -> 后验概率
    """
    # 先验: 市场隐含的 YES 概率
    prior = market_prob

    # 似然比: 从 velocity analysis 得到
    # P(达到target | 速度充足) vs P(达到target | 速度不足)
    needed = max(target - current_count, 0)
    if needed <= 0:
        return {"posterior": 0.999, "prior": prior, "likelihood_ratio": 999,
                "change": 0.999 - prior, "verdict": "TARGET_ALREADY_REACHED"}

    required_rate = needed / days if days > 0 else 999
    base_ratio = ELON_BASELINE["posts_per_day"] / required_rate if required_rate > 0 else 999

    # 似然 P(E|H) 和 P(E|~H)
    # 假设发帖数服从泊松分布 (用当前EWMA=26.6/day)
    ewma_rate = 26.6  # 当前观察速度
    # P(发帖数 >= needed | 真实速度=EWMA) = 1 - Poisson_CDF(needed-1; lam=EWMA*days)
    mu = ewma_rate * days
    sigma = ELON_BASELINE["std_dev_daily"] * math.sqrt(days) * (ewma_rate / ELON_BASELINE["posts_per_day"])
    p_enough_given_normal = 1 - normal_cdf(needed - 0.5, mu=mu, sigma=max(sigma, 0.1))

    # P(发帖数 >= needed | 速度不足(降低30%)) = 1 - Poisson_CDF(needed-1; lam=0.7*EWMA*days)
    mu_slow = 0.7 * mu
    p_enough_given_slow = 1 - normal_cdf(needed - 0.5, mu=mu_slow, sigma=max(sigma * 0.7, 0.1))

    # 似然比
    likelihood_ratio = p_enough_given_normal / max(p_enough_given_slow, 0.0001)
    likelihood_ratio = min(likelihood_ratio, 50)  # cap

    # 贝叶斯后验
    # P(H|E) = 1 / (1 + (1-P(H))/P(H) * (1-LR)/LR)  [简化版]
    odds_prior = prior / (1 - prior) if prior < 0.999 else 999
    odds_posterior = odds_prior * likelihood_ratio
    posterior = odds_posterior / (1 + odds_posterior) if odds_posterior < 999 else 0.999
    posterior = min(0.999, max(0.001, posterior))

    return {
        "prior": round(prior, 4),
        "posterior": round(posterior, 4),
        "likelihood_ratio": round(likelihood_ratio, 2),
        "p_enough_if_normal": round(p_enough_given_normal, 4),
        "p_enough_if_slow": round(p_enough_given_slow, 4),
        "change": round(posterior - prior, 4),
        "verdict": "BUY_YES" if posterior - prior > 0.05 else "NO_SIGNIFICANT_EDGE",
    }


def kelly_criterion(entry_price: float, implied_prob: float, kelly_fraction: float = 0.5) -> dict:
    """
    Kelly 完整计算，包含:
    - 纯Kelly
    - 分数Kelly (推荐)
    - 期望值计算
    - 最优下注时机
    """
    if implied_prob <= 0 or implied_prob >= 1 or entry_price <= 0:
        return {"bet_size": 0, "ev": 0, "reason": "Invalid inputs"}

    # 赔率 (decimal odds)
    odds = 1 / entry_price  # 如果花 $0.57 买 YES，得到 $1.00

    # Kelly: f* = (bp - q) / b
    # b = odds - 1, p = implied_prob, q = 1-p
    b = odds - 1
    p = implied_prob
    q = 1 - p
    kelly = max(0, (b * p - q) / b) if b > 0 else 0

    # 分数 Kelly (保守)
    half_kelly = kelly * kelly_fraction
    quarter_kelly = kelly * kelly_fraction * 0.5

    # 期望值 (每$1)
    ev_per_dollar = p * (odds - 1) - q

    return {
        "kelly_full": round(kelly, 4),
        "kelly_half": round(half_kelly, 4),
        "kelly_quarter": round(quarter_kelly, 4),
        "odds": round(odds, 3),
        "ev_per_dollar": round(ev_per_dollar, 4),
        "reason": f"Kelly={kelly:.1%}, half={half_kelly:.1%}, quarter={quarter_kelly:.1%}",
    }


def deep_analyze_market(mkt: dict) -> dict:
    """对一个市场进行深度多维度分析"""
    xt_key = mkt["xt_key"]
    xt_data = XTRACKER.get(xt_key, {})
    current_count = xt_data.get("count", 0)
    target = mkt["target"]
    yes_price = mkt["yes_price"]
    days = calc_days(mkt["end_date"])

    # 多维度分析
    velocity = velocity_multifactor(current_count, target, days)
    microstructure = market_microstructure(mkt)
    ts_decomp = time_series_decomposition(current_count, target, days, xt_key)
    mc_sim = monte_carlo_simulation(current_count, target, days)
    bayesian = bayesian_inference(current_count, target, days, yes_price)

    # 组合置信度 (加权平均)
    weights = {"velocity": 0.35, "bayesian": 0.30, "monte_carlo": 0.25, "micro": 0.10}
    conf_components = {
        "velocity": velocity.get("confidence", 0.5),
        "bayesian": bayesian.get("posterior", yes_price),
        "monte_carlo": mc_sim.get("p_reach_target", 0.5),
        "micro": microstructure.get("funding_ratio_yes", 0.5),
    }
    ensemble_conf = (
        weights["velocity"] * conf_components["velocity"] +
        weights["bayesian"] * conf_components["bayesian"] +
        weights["monte_carlo"] * conf_components["monte_carlo"] +
        weights["micro"] * conf_components["micro"]
    )

    # Kelly
    kelly = kelly_criterion(yes_price, ensemble_conf)
    edge = ensemble_conf - yes_price

    # 最终决策
    if ensemble_conf >= 0.80 and edge >= 0.10:
        decision = "STRONG_YES"
        confidence = ensemble_conf
    elif ensemble_conf >= 0.65 and edge >= 0.05:
        decision = "YES"
        confidence = ensemble_conf
    elif conf_components["velocity"] < 0.40 and (1 - ensemble_conf) > 0.60:
        decision = "NO"
        confidence = 1 - ensemble_conf
    else:
        decision = "NO_EDGE"
        confidence = max(ensemble_conf, 1 - ensemble_conf)

    return {
        "market_id": mkt["id"],
        "question": mkt["question"],
        # 基础数据
        "current_count": current_count,
        "target": target,
        "remaining": max(target - current_count, 0),
        "days_remaining": round(days, 2),
        "yes_price": yes_price,
        "volume": mkt["volume"],
        # 6个分析维度
        "velocity_analysis": velocity,
        "market_microstructure": microstructure,
        "time_series": ts_decomp,
        "monte_carlo": mc_sim,
        "bayesian": bayesian,
        "kelly": kelly,
        # 综合评分
        "ensemble_confidence": round(ensemble_conf, 4),
        "edge": round(edge, 4),
        "confidence_components": {k: round(v, 4) for k, v in conf_components.items()},
        # 决策
        "decision": decision,
        "final_confidence": round(confidence, 4),
    }


def generate_report(results: list) -> str:
    """生成完整分析报告"""
    lines = []
    sep = "=" * 80

    lines.append(sep)
    lines.append(" POLYMARKET ELON TWEET COUNT — 深度数据分析报告")
    lines.append(f" 生成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} HKT")
    lines.append(f" 数据来源: xtracker.polymarket.com (快照 2026-04-18 02:15 HKT)")
    lines.append(sep)

    for r in results:
        mkt_id = r["market_id"]
        q = r["question"]
        yes_p = r["yes_price"]

        lines.append(f"\n{'─' * 80}")
        lines.append(f"📊 市场: {q}")
        lines.append(f"   ID: {mkt_id}")
        lines.append(f"   价格: YES = {yes_p*100:.0f}% | Vol: ${r['volume']:,.0f}")
        lines.append(f"   当前: {r['current_count']} posts | 目标: {r['target']} | 剩余: {r['remaining']} in {r['days_remaining']} days")
        lines.append("")

        # 维度1: 速度分析
        va = r["velocity_analysis"]
        lines.append(f"  【速度分析】")
        lines.append(f"    信号: {va.get('signal','N/A')} | 置信度: {va.get('confidence',0)*100:.1f}%")
        if "factors" in va:
            f = va["factors"]
            lines.append(f"    速度比: {f.get('velocity_ratio','N/A')}x | 期限压力: {f.get('deadline_pressure','N/A')}")
            lines.append(f"    完成度: {f.get('pct_complete',0)*100:.1f}% | 日间波动: {f.get('volatility_note','N/A')}")
            lines.append(f"    低于必要速度概率: {f.get('p_below_required',0)*100:.1f}% | Z-score: {f.get('z_score','N/A')}")
        lines.append(f"    原因: {va.get('reason','')}")

        # 维度2: 市场微观结构
        ms = r["market_microstructure"]
        lines.append(f"\n  【市场微观结构】")
        lines.append(f"    资金比率(YES): {ms.get('funding_ratio_yes',0)*100:.1f}% | 信号: {ms.get('smart_money_signal','N/A')}")
        lines.append(f"    流动性评分: {ms.get('liquidity_score',0):.3f} | 日均成交量: ${ms.get('volume_per_day',0):,.0f}")
        lines.append(f"    活跃度: {ms.get('activity_level','N/A')} | 定价错误风险: {ms.get('misprice_risk','N/A')}")

        # 维度3: 时间序列
        ts = r["time_series"]
        lines.append(f"\n  【时间序列分解】")
        lines.append(f"    EWMA速度: {ts.get('ewma_velocity',0):.1f} posts/day | 趋势: {ts.get('trend_direction','N/A')}")
        lines.append(f"    趋势乘数: {ts.get('trend_multiplier',0):.2f}x | 星期调整: {ts.get('dow_adjustment',0):.3f}")
        lines.append(f"    历史对照: Apr16-18={ts.get('historical_comparison',{}).get('apr16_18_rate','N/A')}/day, "
                     f"Apr14-21={ts.get('historical_comparison',{}).get('apr14_21_rate','N/A')}/day, "
                     f"基线={ts.get('historical_comparison',{}).get('baseline','N/A')}/day")

        # 维度4: Monte Carlo
        mc = r["monte_carlo"]
        lines.append(f"\n  【Monte Carlo (50,000次模拟)】")
        lines.append(f"    预测均值: {mc.get('mean','N/A')} posts | 中位数: {mc.get('median','N/A')} posts")
        lines.append(f"    P(达到目标): {mc.get('p_reach_target',0)*100:.1f}% | P(1.5x): {mc.get('p_1_5x',0)*100:.1f}% | P(2x): {mc.get('p_2x',0)*100:.1f}%")
        lines.append(f"    90%置信区间: [{mc.get('ci_90_lower','N/A')}, {mc.get('ci_90_upper','N/A')}]")

        # 维度5: 贝叶斯
        by = r["bayesian"]
        lines.append(f"\n  【贝叶斯推断】")
        lines.append(f"    先验(市场): {by.get('prior',0)*100:.1f}% → 后验: {by.get('posterior',0)*100:.1f}%")
        lines.append(f"    似然比: {by.get('likelihood_ratio','N/A')}x | "
                     f"P(正常速度达成): {by.get('p_enough_if_normal',0)*100:.1f}% | "
                     f"P(慢速达成): {by.get('p_enough_if_slow',0)*100:.1f}%")
        lines.append(f"    判断: {by.get('verdict','N/A')} | 概率变化: {by.get('change',0)*100:+.1f}%")

        # 维度6: Kelly
        k = r["kelly"]
        lines.append(f"\n  【Kelly Criterion】")
        lines.append(f"    全Kelly: {k.get('kelly_full',0)*100:.1f}% | 半Kelly: {k.get('kelly_half',0)*100:.1f}% | ¼Kelly: {k.get('kelly_quarter',0)*100:.1f}%")
        lines.append(f"    赔率: {k.get('odds','N/A')}x | 每$1期望值: {k.get('ev_per_dollar',0):+.4f}")

        # 综合结论
        lines.append(f"\n  【✅ 综合决策】")
        conf = r["final_confidence"]
        edge = r["edge"]
        cc = r["confidence_components"]
        lines.append(f"    决策: {r['decision']}")
        lines.append(f"    综合置信度: {conf*100:.1f}% (速度:{cc['velocity']*100:.1f}% | 贝叶斯:{cc['bayesian']*100:.1f}% | MC:{cc['monte_carlo']*100:.1f}% | 微观:{cc['micro']*100:.1f}%)")
        lines.append(f"    边缘: {edge*100:+.1f}% | Kelly: {k.get('kelly_quarter',0)*100:.1f}%仓位 | EV: ${edge * k.get('kelly_quarter',0) * 10000:.2f}")

    lines.append(f"\n{sep}")
    lines.append(" 说明:")
    lines.append("  置信度 = 加权组合(速度35% + 贝叶斯30% + MC25% + 微观10%)")
    lines.append("  边缘 = 综合置信度 - 市场隐含概率")
    lines.append("  Monte Carlo: 泊松分布模拟, lam=45*days")
    lines.append("  贝叶斯: 速度充足/不足两种假设下的似然比更新")
    lines.append("  速度比 = Elon平均日发帖 / 达到目标所需日发帖")
    lines.append("  星期调整: 基于历史发帖模式的星期效应 (周一最高,周末最低)")
    lines.append(sep)

    return "\n".join(lines)


if __name__ == "__main__":
    print("Running deep analysis...")
    results = [deep_analyze_market(m) for m in MARKETS]
    report = generate_report(results)
    print(report)

    # Save JSON
    out_dir = Path(__file__).parent / "output"
    out_dir.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    fp = out_dir / f"deep_analysis_{ts}.json"
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    with open(out_dir / "deep_analysis_latest.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    print(f"\nSaved: {fp}")