# MEMORY.md - 长期记忆

## 经验总结
- Python PATH: WindowsApps stub → 用完整路径 `C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe`
- Clash 导致 Gateway 断开: `gateway.cmd` 添加 `NO_PROXY` 绕过 127.0.0.1, localhost, *.local, feishu-cn, openapi.feishu.cn
- Capacitor/Vite 白屏: `vite.config.ts` 中添加 `base: './'`
- Claude Code: `claude --version` = 2.1.79; Dev agent timeout: 1小时; 用 `--permission-mode bypassPermissions --print`
- GitHub CLI: `winget install GitHub.cli` + `gh auth login`; ClawHub: `clawhub install <skill>`
- **开发流程**: 每次迭代后必须测试，测试通过再打包 APK

## AI Agent 赚钱机会 (2026-04-19)
- 报告: `~/.openclaw/workspace/ai_money_opportunities.md`
- **第一优先级**: 垂直领域 AI SaaS（法律/金融/医疗）— YC 最看好，护城河最深
- **第二优先级**: Claude Code/GPTs 套利 — 门槛低、快速变现、但护城河弱
- **第三优先级**: AI 研究/情报 Agent — 细分数领域存在机会
- **EUREKA**: 法律"第二意见"定位 > "AI替代律师"；PE/VC Pre-DD筛选是金融AI切入点
- Web Search 不可用(Brave API未配置)，已用 web_fetch + GitHub Trending 替代

## AI Trader 状态 (2026-04-17)
- ETH: -$36.91 | BTC: -$354.10 | Total: -$391.01
- 持仓: 1.49 ETH @ 2205, 0.444 BTC @ 71067

## Polymarket Elon Tracker (2026-04-19)
- **目录**: `C:\Users\Administrator\.openclaw\workspace\polymarket-elon-tracker\`
- **Cron**: `f5c6ff90-7ef1-40f6-958e-3a4c1705c644` every 1h
- **核心文件**: `src/full_analyzer.py` (v2引擎), `run_hourly.py` (主入口), `fetch_live_counts.py`
- **数据源**: xtrack 实时数据（Polymarket 页面 hardcoded）
- **真实日均**: ~30 tweets/day；高峰 UTC: 22,23,0,1,7,8
- **xtrack.com 封锁**: 用 Polymarket market 页面的 TWEET COUNT 字段
- **xtrack 规则**: 主贴+quote posts+reposts 计入；纯回复不计入
- **Bucket combos**: Polymarket 可买多个桶，EV = sum(P_i) - sum(price_i)

### 当前判决 (2026-04-19 16:18 UTC)
| 市场 | xtrack | 目标 | vel_ratio | YES价格 | Edge | Kelly¼ | 行动 |
|------|--------|------|-----------|---------|------|--------|------|
| apr14-21 | 184/190 | 190 | 13.04x | 88% | +12% | 25% | BUY YES |
| apr17-24 | 68/200 | 200 | 1.29x | 85% | +15% | 25% | BUY YES |
| may2026 | 0/800 | 800 | 1.16x | 85% | +15% | 25% | BUY YES |

- apr14-21 剩余 2.6d，仅差 6 条，几乎锁定
- apr17-24 剩余 5.7d，MC 预期 ~245 条

## 项目
- **FormForge** (port 8001): FastAPI + PyMuPDF + PaddleOCR + Ollama; E2E 12/12 EN10204 ✅
- **Polymarket Elon Tracker**: xTracker Clone，SQLite + browser CLI + 3情景MC分析
- **Lucky Defense** (`lucky-defense/index.html`): 单文件 HTML5 塔防，5 lanes，6 类型，auto-merge
- **LearnAny** (port 8003): 费曼+苏格拉底学习引擎 ✅
- **AI News** (port 8002): ✅ | **WorldPredict** (port 8011): ✅
- **Douyin Game Forge**: 项目目录已移除

## 服务端口状态 (2026-04-19)
| Port | Service | Status |
|------|---------|--------|
| 8001 | FormForge | ✅ Listen |
| 8002 | AI News | ✅ Listen |
| 8003 | LearnAny | ✅ Listen |
| 8011 | WorldPredict | ✅ Listen |

## Bounty Hunt
- 目标: Algora.io (SolFoundry); **验证真钱**: Issue 正文写 `$XX`
- PR #887: `feat: live countdown timer + search bar` (open, labeled `missing-wallet`)
- PR #875: `Fix GitHub OAuth Sign-In Flow` (open, CodeRabbit review needed)

## Cron Jobs
| Job | Schedule | Status |
|-----|----------|--------|
| gateway-keepalive | every 10m | ✅ |
| bounty-hunt-monitor | every 1h | ✅ |
| ai-money-hunter | every 1h | ✅ |

## ClawColony
- pendingVotes: 1; enrolledProposals: [539, 540]; lastVote: #541 (yes, 2026-03-19)


## Polymarket Tracker Updates (2026-04-20)
- run_hourly.py v3: live prices via browser relay + xtrack change alerts + TOP5 bucket combos
- fetch_live_prices.py: navigates Polymarket pages to extract YES/NO prices
- xtrack_snapshot.json: tracks xtrack counts between runs for change detection
- full_analyzer.py: norm_cdf bug fixed, load_live_prices/snapshot functions added
- Browser relay note: stuck on x.com - live prices暂时用hardcoded (88%/85%/85%)
- Kelly: apr14-21 YES=25%, apr17-24 YES=25%, may2026 YES=25%
- xtrack confirmed: apr14-21=167, apr17-24=68, may2026=0
