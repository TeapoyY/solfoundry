# HEARTBEAT.md - Active Tasks Monitor
Updated: 2026-04-18 17:30 HKT

## Polymarket Elon Tracker (xTracker Clone) - Updated 2026-04-19 11:50 HKT
- **Repo**: `polymarket-elon-tracker/`
- **架构** (v2 — multi-outcome):
  - `src/full_analyzer.py` — v2引擎: 多桶概率 + 双向边缘 + bucket溢出处理
  - `quick_check.py` — 入口: (1)fetch_live_counts.py抓xtrack (2)分析 (3)保存
  - `fetch_live_counts.py` — 从Polymarket页面抓TWEET COUNT（via browser relay）
  - `simple_collect.py` — Tweet采集（独立，不在 hourly check流程中）
- **Data source**: xtrack (via Polymarket TWEET COUNT) — **xtrack.polymarket.com被封锁，用Polymarket页面替代**
- **Daily rate**: ~30 tweets/day (Polymarket Apr校准)
- **关键逻辑**: confirmed > bucket上限 → P=0；bucket概率用remaining正态分布计算

### xtrack计数规则（市场结算规则）
**xtrack统计的内容:**
- ✅ Main feed posts (Elon自己发的推文)
- ✅ Quote posts (带评论转发)
- ✅ Reposts / Retweets
- ⚠️ Replies on main feed (standalone replies like https://x.com/elonmusk/status/1786073478711353576 — 这些算)
- ❌ Replies to other tweets (纯回复不算)
- ❌ Community reposts (不显示在x.com/home，不算)
- ✅ Deleted posts (只要被tracker抓到超过~5分钟就算)

**xtrack数据源**: https://xtrack.polymarket.com (本机封锁) → 用Polymarket market页面的TWEET COUNT字段作为代理

### 每小时检查流程 (HEARTBEAT任务) — UPDATED v2
**Cron Job**: `f5c6ff90-7ef1-40f6-958e-3a4c1705c644` (every 1h, announce to Feishu)
**Timeout**: 600s (10 min) | **Status**: enabled

**自动化流程** (via isolated agent):
1. `quick_check.py --no-fetch` → `src/full_analyzer.py` → `output/latest_full_analysis.json`
   - multi-outcome bucket analysis (P for each range bucket)
   - combo strategies (adjacent bucket combinations with edge)
   - bidirectional edge analysis (YES + NO)
2. `backtest.py` → daily rate calibration + backtest validation
3. Formatted 4-section report → 飞书 (user:ou_f3e81aedea89d300caca6e83bb0edeca)

**手动运行**: `openclaw cron run f5c6ff90-7ef1-40f6-958e-3a4c1705c644`
**查看状态**: `openclaw cron list | Select-String polymarket`
**查看历史**: `openclaw cron runs --id f5c6ff90-7ef1-40f6-958e-3a4c1705c644 --limit 3`

**旧流程问题**: full_analyzer.py用的是硬编码xtrack数值(164/55/0)，不是实时数据

### 当前市场信号 (2026-04-19 11:50 UTC) — xtrack权威数据
| 市场 | xtrack确认 | 目标 | 剩余/天数 | 所需速率 | P(YES) | PM价格 | 边缘 | Kelly¼ | 判决 |
|------|-----------|------|---------|---------|--------|--------|------|--------|------|
| apr14-21 | 164 | 190 | 26/2.8d | 9.1/day | 100% | YES@88% | **+12%** | 25% | **BUY YES** |
| apr17-24 | 55 | 200 | 145/5.8d | 24.8/day | 99% | YES@79% | **+20%** | 24% | **BUY YES** |
| may2026 | 0 | 800 | 800/31d | 25.8/day | 100% | YES@37% | **+63%** | 25% | **BUY YES** |

### Bucket分析亮点
- **apr14-21**: 240-259桶 → 我们P=72% vs PM价格27% → Edge+45%（但胜率已向YES集中）
- **apr17-24**: 220-239桶 → 我们P=55% vs PM价格10% → Edge+45%
- **may2026**: 900-999桶 → 我们P=83% vs PM价格10% → Edge+73%

### 关键文件
```bash
# 完整小时检查（自动）
python "C:\Users\Administrator\.openclaw\workspace\polymarket-elon-tracker\quick_check.py"

# 仅分析（使用缓存的live_xtrack.json）
python "C:\Users\Administrator\.openclaw\workspace\polymarket-elon-tracker\quick_check.py" --no-fetch

# 手动抓xtrack数据
python "C:\Users\Administrator\.openclaw\workspace\polymarket-elon-tracker\fetch_live_counts.py"
```

### ⚠️ 已知问题
- xtrack.polymarket.com 被封锁 — 用Polymarket market页面TWEET COUNT作为替代数据源
- 我们的collector只抓到97条 vs xtrack的164条 — 原因: x.com/home有scroll gap + 网络延迟
- May 2026 YES@37% 看起来是极大低估（MC P=83%，但市场对forecast有折扣）

### Lucky Defense Game
- **Path**: `lucky-defense/` (standalone)
- **Type**: Single-file HTML5 tower defense + merge game
- **Status**: APK built (v3, 3.9MB)
- **Features**: 5 lanes, 6 defender types, 5 tiers auto-merge, 10 rounds
- **Mobile**: Capacitor Android APK, full-screen, touch optimized

## Active Projects

### FormForge (AI Form Filler)
- **Repo**: https://github.com/TeapoyY/ai-form-filler
- **Stack**: FastAPI + PyMuPDF + PaddleOCR + Ollama (gemma3:1b + minicpm-v)
- **Status**: 鉁?2-step E2E working; Vision endpoint intermittent
- **Backend**: port 8001 ✅ (was DOWN, now UP)
- **OCR**: PyMuPDF text 鉁?| PaddleOCR 3.4.0 + paddlepaddle 3.0.0 鉁?(~37s cold-start) | DeepSeek OCR 0.3.0 (needs DS_OCR_API_KEY) | EasyOCR disabled
- **LLM**: Ollama gemma3:1b (text) + minicpm-v (vision) 鈥?direct localhost, no proxy
- **E2E**: 12/12 EN10204 鉁?(2-step: OCR ~3s + extract ~10s)
- **鈿狅笍 Vision endpoint**: Intermittently hangs when calling Ollama minicpm-v from FastAPI. Direct Ollama calls work fine (~20s). Root cause unclear 鈥?possibly httpx async threading issue. 2-step path is the reliable workhorse.
- **鈿狅笍 Python PATH**: WindowsApps stub 鈫?鐢ㄥ畬鏁磋矾寰?`C:\...\Python311\python.exe`
- **Server**: `cd backend && python start_ff.py` (uses .env for PORT=8001, OLLAMA_VISION_MODEL=minicpm-v)
- **Setup after clone**: Copy `.env.example` 鈫?`.env`, run `backend/create_test_samples.py`

### Douyin Game Forge (鎶栭煶娓告垙宸ュ潑) 馃啎
- **Repo**: https://github.com/TeapoyY/douyin-game-forge
- **Stack**: Node.js/Express (8010) + React 18 + Vite + TypeScript (3000)
- **Status**: 鉁?Backend+Frontend running
- **Issue**: Claude Code not called - uses hardcoded fallback puzzle/2048 template
- **Bugs**: Chinese encoding garbled in API responses
- **Path Fix**: outputDir = `..\..\..\output` (4 levels up from backend/)
- **Test**: Create survivor-like 鈫?generates puzzle game instead

### LearnAny
- **Repo**: https://github.com/TeapoyY/learn-any
- **Stack**: FastAPI + MiniMax + 鍗曟枃浠?SPA
- **Status**: 鉁?Running (port 8003)
- **鍔熻兘**: 璐规浖+鑻忔牸鎷夊簳娓愯繘瀛︿範寮曟搸

### AI News / WorldPredict
- **Repos**: ai-news, world-predict
- **Status**: 鉁?Running
- **Ports**: 8002 (news), 8011 (wp), 3002/3004 (frontend)

### Parallax Train Widget
- **Repo**: https://github.com/TeapoyY/parallax-train-widget
- **Status**: 鉁?
## Bounty Hunt 鈿狅笍
1. Find: BountyHub.dev / Algora.io
2. **Verify real money**: `bounty` label 鈮?cash!
3. Claude Code: `claude --print "implement..."`
4. PR verification: `gh pr list --author TeapoyY`

### Active PRs (verified 2026-04-18 17:25 HKT)
- **#887** OPEN: `feat(frontend): live countdown timer + search bar` (TeapoyY)
  - Combined T1 bounty: countdown timer #826 + search bar #823 + mobile polish #824
  - Label: `missing-wallet`
- **#875** OPEN: `[Bounty] T1: Fix GitHub OAuth Sign-In Flow` (TeapoyY)
  - CodeRabbit review: docstring coverage warning (50% < 80% threshold)
  - Needs docstrings to pass pre-merge

### SolFoundry Bounty Status (2026-04-18 17:25 HKT)
- **#831** OPEN: `🏭 Bounty T1: Animated GIF of Bounty Creation Flow`
  - PR #1032 (lui62233) — closed, submitted GIF (603KB, 10-frame)
  - PR #1039 (denishpt) — closed, submitted GIF
  - Both closed, issue still open — may need re-submission
- **#834** OPEN: Same title as #831, opened Apr 8 — possible duplicate
- Bounty board: https://www.algora.io/bounties?org=SolFoundry

## Cron Jobs
| Job | Schedule | Status |
|-----|----------|--------|
| gateway-keepalive | every 10m | 鉁?|
| bounty-hunt-monitor | every 1h | 鉁?|
| ai-money-hunter | every 1h | 鉁?|

---

## Self-Improvement Loop (Hermes-style) 鈿?NEW

### 缁勪欢 (4 Skills)
| Skill | 鍔熻兘 | 瑙﹀彂 |
|-------|------|------|
| auto-skill-creator | 浠庡鏉備换鍔″垱寤?Skill | tool_calls >= 5 |
| memory-guardian | 鏈夌晫璁板繂 + 鑷姩绮剧畝 | >80% 鏃剁簿绠€ |
| session-archivist | 浼氳瘽褰掓。 + 鎼滅储 | 姣?30 鍒嗛挓 |
| nudge-memory | 鍛ㄦ湡鎬т繚瀛樻彁閱?| 姣忓皬鏃?HEARTBEAT |

### HEARTBEAT 妫€鏌ユ竻鍗?(鎸夐『搴?

**姣?30 鍒嗛挓:**
- [ ] 妫€鏌ユ槸鍚﹂渶瑕佸綊妗ｅ綋鍓嶄細璇?(session-archivist)
- [ ] 妫€鏌ユ槸鍚﹂渶瑕佸垱寤烘柊 Skill (auto-skill-creator)

**姣忓皬鏃?**
- [ ] MEMORY.md 浣跨敤鐜囨鏌?(memory-guardian)
  - 濡傛灉 >70%: 鎻愮ず consolidation
  - 濡傛灉 >80%: 鎵ц consolidation
- [ ] 閲嶈鐭ヨ瘑淇濆瓨鎻愰啋 (nudge-memory)
- [ ] USER.md 浣跨敤鐜囨鏌?
**姣忓ぉ (棣栨 HEARTBEAT):**
- [ ] 鍥為【鏄ㄥぉ鍏抽敭杩涘睍
- [ ] 娓呯悊杩囨椂 MEMORY 鏉＄洰
- [ ] 妫€鏌?session archives 鎼滅储鑳藉姏

### 淇濆瓨瑙勫垯
| 鍐呭 | 浣嶇疆 |
|------|------|
| 宸ュ叿鎶€宸?| TOOLS.md |
| 琛屼负妯″紡 | SOUL.md |
| 宸ヤ綔娴佹敼杩?| AGENTS.md |
| 鏅亶鏁欒 | .learnings/LEARNINGS.md |
| 鍛戒护閿欒 | .learnings/ERRORS.md |
| 鐢ㄦ埛璇锋眰 | .learnings/FEATURE_REQUESTS.md |

### 瀹归噺闄愬埗
- MEMORY.md: **4,000 chars** (80% of 5,000)
- USER.md: **2,400 chars** (80% of 3,000)
- 瓒呭嚭 鈫?鑷姩 consolidation

---

## Service Ports
| Port | Service | Status |
|------|---------|--------|
| 8001 | FormForge backend | ✅ Listen (PID 2208, confirmed 09:36) |
| 8002 | AI News backend | ✅ Listen (PID 6768, confirmed 11:55) |
| 8003 | LearnAny backend | ✅ Listen (PID 10800, confirmed 11:55) |
| 8010 | Douyin Game Forge backend | ❌ Project dir removed from workspace |
| 8011 | WorldPredict backend | ✅ Listen (PID 24088, confirmed 11:55) |
| 3000 | Douyin Game Forge frontend | ❌ Project removed |
| 3002/3004 | AI News/WorldPredict frontend | 鉁?|

## BountyHub Skill (Added 2026-04-19)
- Skill: ounty-hunt/ at ~/.openclaw/skills/bounty-hunt/
- Cron: ounty-hub-hunter every 2h
- Script: scripts/bounty_hunter.py
- fetches from bountyhub.dev via browser relay
- Claude Code implements + review loop -> PR


## Updated 2026-04-20 00:23 HKT
### Polymarket Tracker v3 (run_hourly.py)
- Live prices via fetch_live_prices.py + browser relay
- xtrack变动告警: xtrack_snapshot.json对比检测
- TOP5 bucket combos per market (by Edge)
- fetch_live_prices.py, xtrack_snapshot.json
### BountyHub Skill
- Skill: ~/.openclaw/skills/bounty-hunt/
- Cron: bounty-hub-hunter (every 2h)
