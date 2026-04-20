# MEMORY.md - 长期记忆

## 经验总结
- Python PATH: WindowsApps stub → 用完整路径 `C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe`
- Clash 导致 Gateway 断开: `gateway.cmd` 添加 `NO_PROXY` 绕过 127.0.0.1, localhost, feishu-cn
- Capacitor/Vite 白屏: `vite.config.ts` 中添加 `base: './'`
- Claude Code: `claude --version` = 2.1.79; Dev agent timeout: 1h; `--permission-mode bypassPermissions --print`
- GitHub CLI: `winget install GitHub.cli` + `gh auth login`; ClawHub: `clawhub install <skill>`
- **开发流程**: 每次迭代后必须测试，测试通过再打包 APK

## AI Agent 赚钱机会 (2026-04-19)
- 报告: `~/.openclaw/workspace/ai_money_opportunities.md`
- Top3: 1)法律AI SaaS(护城河深) 2)AI Agency套利(快变现) 3)AI+垂直SaaS
- EUREKA: 法律"第二意见" > "AI替代律师"；PE/VC Pre-DD是金融AI切入点
- Web Search 不可用(Brave API未配置)，用 web_fetch + GitHub Trending 替代

## AI Trader 状态 (2026-04-17)
- ETH: -$36.91 | BTC: -$354.10 | Total: -$391.01
- 持仓: 1.49 ETH @ 2205, 0.444 BTC @ 71067

## Polymarket Elon Tracker (v3 — 2026-04-20)
- **目录**: `polymarket-elon-tracker/`
- **Cron**: `f5c6ff90` every 1h | **入口**: `run_hourly.py`
- **核心**: `src/full_analyzer.py` (v3: norm_cdf fix, live prices, snapshot)
- **Bucket combo**: EV = sum(P_i) - sum(price_i)；TOP5 combos sorted by edge
- **实时价格**: `fetch_live_prices.py` → browser relay → `live_prices.json`
- **xtrack告警**: `xtrack_snapshot.json` 对比检测，变动发 Feishu
- **规则**: 主贴+quote posts+reposts=计入；纯回复/社区转发不计入
- **Daily rate**: ~30/day | Peak UTC: 22,23,0,1,7,8

## Polymarket Elon Tracker (v3 — 2026-04-20)
- **目录**: `polymarket-elon-tracker/`
- **Cron**: `f5c6ff90` every 1h | **入口**: `run_hourly.py`
- **核心**: `src/full_analyzer.py` (v3: norm_cdf fix, live prices, snapshot)
- **Bucket combo**: EV = sum(P_i) - sum(price_i)；TOP5 combos sorted by edge
- **xtrack告警**: `xtrack_snapshot.json` 对比检测，变动发 Feishu
- **规则**: 主贴+quote posts+reposts=计入；纯回复/社区转发不计入
- **Daily rate**: ~30/day | Peak UTC: 22,23,0,1,7,8

### 当前信号 (2026-04-20 22:58 HKT) — 从 Polymarket HTML 实时读取
| 市场 | xtrack | 目标 | PM价格 | Edge | Kelly |
|------|--------|------|--------|------|-------|
| apr14-21 | 139 | 190 | 88% | +12% | 25% |
| apr17-24 | 93 | 200 | 85% | +14% | 25% |
| may2026 | 0 | 800 | 85% | +15% | 25% |

### 关键修复 (2026-04-20)
- **`get_market_confirmed`** 用 `globals()` 替代 `dir()` 检查 ✅
- **live bucket prices**: `fetch_live_prices.py` 从 Polymarket HTML `__NEXT_DATA__` 提取所有 range bucket 的实时 YES/NO 价格 ✅
- **`get_bucket_price_from_live()`**: `analyze_market()` 内联查询 live price，不再 hardcoded ✅
- 之前问题: `live_prices.json` 只存 binary 价格，没有 bucket 价格；analyzer 用 hardcoded `price` 字段
- 解决: `load_live_prices()` 返回完整 JSON（含 `bucket_prices`），`get_bucket_price_from_live()` 按 slug 查询每个桶的价格

## 项目
- **FormForge** (8001): FastAPI + PyMuPDF + Ollama; E2E 12/12 ✅
- **Polymarket Elon Tracker**: SQLite + browser relay + MC分析
- **Lucky Defense** (`lucky-defense/`): HTML5塔防，5 lanes，auto-merge
- **LearnAny** (8003): 费曼+苏格拉底引擎 ✅
- **AI News** (8002): ✅ | **WorldPredict** (8011): ✅

## 服务端口
8001 FormForge | 8002 AI News | 8003 LearnAny | 8011 WorldPredict — 全部在线

## Bounty Hunt
- BountyHub Skill: `~/.openclaw/skills/bounty-hunt/` | Cron: every 2h
- Algora/SolFoundry: 找 `$XX` 标注的真钱 bounty
- Skills: `bounty-hunt/` (Claude Code + review loop → PR)

## Cron Jobs
| Job | Schedule |
|-----|----------|
| gateway-keepalive | every 10m |
| bounty-hub-hunter | every 2h |
| polymarket-elon-monitor | every 1h |
| ai-money-hunter | every 1h |

## ClawColony
- pendingVotes: 1; enrolledProposals: [539, 540]; lastVote: #541 (yes, 2026-03-19)
