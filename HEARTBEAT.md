# HEARTBEAT.md - Active Tasks Monitor
Updated: 2026-04-21 23:58 HKT

## Polymarket Elon Tracker (v3 — 2026-04-21)
- **Repo**: `polymarket-elon-tracker/`
- **入口**: `run_hourly.py` (cron `f5c6ff90`)
- **核心**: `src/full_analyzer.py` — multi-outcome bucket analysis + bidirectional edge

### 数据源
- **xtrack**: Polymarket页面 `TWEET COUNT`（via HTTP HTML `__NEXT_DATA__` + browser relay fallback）
  - 验证: 2026-04-20 手动测试返回 **183** ✅
- **价格**: Polymarket HTML `__NEXT_DATA__` 内嵌 JSON → `dehydratedState.queries[].state.data.markets[].outcomePrices`
  - `fetch_live_prices.py` 解析 Polymarket 页面 HTML，提取所有 range bucket 的实时 YES/NO 价格
  - `get_bucket_price_from_live()` 在 `analyze_market()` 内查询 live price，替代硬编码的 `price` 字段
  - 验证: 2026-04-20 22:55 bucket 价格已实时更新 ✅

### 每小时流程 (run_hourly.py)
1. `fetch_live_counts.py` → 写 `live_xtrack.json`
2. `check_xtrack_changes()` → 对比 `xtrack_snapshot.json` → 变动告警
3. `fetch_live_prices.py` → 写 `live_prices.json`
4. `full_analyzer.py` → 输出 `output/latest_full_analysis.json`
5. 飞书报告

### 当前问题
- ✅ `get_market_confirmed` bug 已修复（改用 `globals()`）
- ✅ live bucket prices 已启用（从 Polymarket HTML 实时读取，不再 hardcoded）
- Browser relay 断 → xtrack 从 Polymarket HTML 提取（`fetch_live_counts.py`），价格也用HTML fallback（`fetch_live_prices.py`）
- ⚠️ 飞书通知超时：`openclaw msg send` 在 polymarket cron 中频繁超时，Gateway RPC 正常，问题在飞书消息路由
- subagent (browser relay) 是最可靠数据源，Python fallback 只能应急

### 今日大事记 (2026-04-21)
- Gateway 中断 2次：05:02 和 14:44，均自动恢复
- crypto-daily-check 09:00 已运行

### 关键文件
```bash
# 完整小时检查
python "polymarket-elon-tracker/run_hourly.py"
# 仅抓 xtrack（需 relay）
python "polymarket-elon-tracker/fetch_live_counts.py"
```

## Bounty Hunt
- **来源**: BountyHub.dev only（Algora 已禁用，搜索不精确）
- **Cron**: `bounty-hub-hunter` every 2h（状态: error — browser relay 断开）
- **Script**: `C:\Users\Administrator\.openclaw\skills\bounty-hunt\scripts\bounty_hunter.py`
- **Bug 修复**: `process_bounty()` KeyError: 'short_id' 已修复

### Browser Relay 需求
bounty-hub-hunter 需要 relay attach 到 **bountyhub.dev**：
1. Chrome 打开 https://bountyhub.dev
2. 点击 OpenClaw Browser Relay 图标 → badge ON
3. 下次 cron 运行时自动抓取

### 当前 Open PRs（2026-04-20 已清理）
保留（验证是真实 bounty）:
- `TeapoyY/solfoundry` #30, #27, #25, #23, #22 ✅
- `TeapoyY/sovereign-genesis` #4, #3, #2 ✅
- `Bu1ldTh3Futur3/bounty-hunter-test` #43 ✅
已关闭: ~30 个非 bounty/重复 PR（2026-04-20 批量清理）

## Cron Jobs
| Job | Schedule | Status |
|-----|----------|--------|
| gateway-keepalive | every 10m | running |
| polymarket-elon-monitor | every 1h | running（数据从HTML fallback）|
| bounty-hub-hunter | every 2h | error（需 relay）|
| crypto-daily-check | daily 09:00 | running |
| ai-money-hunter-hourly | every 1h | error |
| ainews-wp-daily-report | every 1d | ok |
| Daily PR Review | every 1d | error |

## Service Ports
| Port | Service | Status |
|------|---------|--------|
| 8001 | FormForge backend | ✅ Listen |
| 8002 | AI News backend | ✅ Listen |
| 8003 | LearnAny backend | ✅ Listen |
| 8011 | WorldPredict backend | ✅ Listen |

## Self-Improvement Loop

### 每30分钟:
- [ ] 检查是否需要归档会话 (session-archivist)
- [ ] 检查是否需要创建新 Skill (auto-skill-creator)

### 每小时:
- [ ] MEMORY.md 使用率检查 (memory-guardian)
  - >70%: 提示 consolidation | >80%: 执行

### 每小时HEARTBEAT检查:
- [ ] MEMORY.md 字节数检查 (>80% → consolidation)
- [ ] HEARTBEAT.md 更新提醒
- [ ] 重要记忆保存

### 每天:
- [ ] 回顾昨天关键事件
- [ ] 清理过时的HEARTBEAT项目

## Crypto Daily Monitor (Added 2026-04-21)
- **目录**: `crypto-daily-monitor/` | Cron: `crypto-daily-check` daily
- **币种**: DOGE, XRP, SHIB, BNB, CFX
- **数据源**: Binance 页面抓取 (browser relay) + CoinGecko (CFX fallback)
- **信号规则**: 距年低≤10% → 买入信号 | 距史低≤15% → 强买入信号 | 成交量激增+价格跌 → 大额买入信号
- **脚本**: `crypto_browser_scraper.py` (browser relay 版本)
- **上次快照**: `last_snapshot.json`
- **数据不稳定**: Binance API/CoinGecko API 均被墙，需 browser relay 抓取
- **注意**: BNB ATH $1370, DOGE ATH $0.73, SHIB ATH $0.0000885, XRP ATH $3.84, CFX ATH $1.70
- Skill: bounty-hunt/ at ~/.openclaw/skills/bounty-hunt/
- Cron: bounty-hub-hunter every 2h
- Script: scripts/bounty_hunter.py
- fetches from bountyhub.dev via browser relay
- Claude Code implements + review loop -> PR
