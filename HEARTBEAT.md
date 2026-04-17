# HEARTBEAT.md - Active Tasks Monitor
Updated: 2026-04-17 15:08 HKT

## Active Projects

### FormForge (AI Form Filler)
- **Repo**: https://github.com/TeapoyY/ai-form-filler
- **Stack**: FastAPI + PyMuPDF + PaddleOCR + Ollama (gemma3:1b + minicpm-v)
- **Status**: ✅ 2-step E2E working; Vision endpoint intermittent
- **Backend**: port 8001 (via `python start_ff.py`)
- **OCR**: PyMuPDF text ✅ | PaddleOCR 3.4.0 + paddlepaddle 3.0.0 ✅ (~37s cold-start) | DeepSeek OCR 0.3.0 (needs DS_OCR_API_KEY) | EasyOCR disabled
- **LLM**: Ollama gemma3:1b (text) + minicpm-v (vision) — direct localhost, no proxy
- **E2E**: 12/12 EN10204 ✅ (2-step: OCR ~3s + extract ~10s)
- **⚠️ Vision endpoint**: Intermittently hangs when calling Ollama minicpm-v from FastAPI. Direct Ollama calls work fine (~20s). Root cause unclear — possibly httpx async threading issue. 2-step path is the reliable workhorse.
- **⚠️ Python PATH**: WindowsApps stub → 用完整路径 `C:\...\Python311\python.exe`
- **Server**: `cd backend && python start_ff.py` (uses .env for PORT=8001, OLLAMA_VISION_MODEL=minicpm-v)
- **Setup after clone**: Copy `.env.example` → `.env`, run `backend/create_test_samples.py`

### Douyin Game Forge (抖音游戏工坊) 🆕
- **Repo**: https://github.com/TeapoyY/douyin-game-forge
- **Stack**: Node.js/Express (8010) + React 18 + Vite + TypeScript (3000)
- **Status**: ✅ Backend+Frontend running
- **Issue**: Claude Code not called - uses hardcoded fallback puzzle/2048 template
- **Bugs**: Chinese encoding garbled in API responses
- **Path Fix**: outputDir = `..\..\..\output` (4 levels up from backend/)
- **Test**: Create survivor-like → generates puzzle game instead

### LearnAny
- **Repo**: https://github.com/TeapoyY/learn-any
- **Stack**: FastAPI + MiniMax + 单文件 SPA
- **Status**: ✅ Running (port 8003)
- **功能**: 费曼+苏格拉底渐进学习引擎

### AI News / WorldPredict
- **Repos**: ai-news, world-predict
- **Status**: ✅ Running
- **Ports**: 8002 (news), 8011 (wp), 3002/3004 (frontend)

### Parallax Train Widget
- **Repo**: https://github.com/TeapoyY/parallax-train-widget
- **Status**: ✅

## Bounty Hunt ⚠️
1. Find: BountyHub.dev / Algora.io
2. **Verify real money**: `bounty` label ≠ cash!
3. Claude Code: `claude --print "implement..."`
4. PR verification: `gh pr list --author TeapoyY`

### Active PRs (verified 2026-04-16 21:02 HKT)
⚠️ No open PRs — need new bounty targets!

## Cron Jobs
| Job | Schedule | Status |
|-----|----------|--------|
| gateway-keepalive | every 10m | ✅ |
| bounty-hunt-monitor | every 1h | ✅ |
| ai-money-hunter | every 1h | ✅ |

---

## Self-Improvement Loop (Hermes-style) ⚡ NEW

### 组件 (4 Skills)
| Skill | 功能 | 触发 |
|-------|------|------|
| auto-skill-creator | 从复杂任务创建 Skill | tool_calls >= 5 |
| memory-guardian | 有界记忆 + 自动精简 | >80% 时精简 |
| session-archivist | 会话归档 + 搜索 | 每 30 分钟 |
| nudge-memory | 周期性保存提醒 | 每小时 HEARTBEAT |

### HEARTBEAT 检查清单 (按顺序)

**每 30 分钟:**
- [ ] 检查是否需要归档当前会话 (session-archivist)
- [ ] 检查是否需要创建新 Skill (auto-skill-creator)

**每小时:**
- [ ] MEMORY.md 使用率检查 (memory-guardian)
  - 如果 >70%: 提示 consolidation
  - 如果 >80%: 执行 consolidation
- [ ] 重要知识保存提醒 (nudge-memory)
- [ ] USER.md 使用率检查

**每天 (首次 HEARTBEAT):**
- [ ] 回顾昨天关键进展
- [ ] 清理过时 MEMORY 条目
- [ ] 检查 session archives 搜索能力

### 保存规则
| 内容 | 位置 |
|------|------|
| 工具技巧 | TOOLS.md |
| 行为模式 | SOUL.md |
| 工作流改进 | AGENTS.md |
| 普遍教训 | .learnings/LEARNINGS.md |
| 命令错误 | .learnings/ERRORS.md |
| 用户请求 | .learnings/FEATURE_REQUESTS.md |

### 容量限制
- MEMORY.md: **4,000 chars** (80% of 5,000)
- USER.md: **2,400 chars** (80% of 3,000)
- 超出 → 自动 consolidation

---

## Service Ports
| Port | Service | Status |
|------|---------|--------|
| 8001 | FormForge backend | ✅ |
| 8002 | AI News backend | ✅ (restarted 11:30) |
| 8003 | LearnAny backend | ✅ (restarted 15:08 - crashing ~hourly) |
| 8010 | Douyin Game Forge backend | ✅ |
| 8011 | WorldPredict backend | ✅ (restarted 12:44) |
| 3000 | Douyin Game Forge frontend | ✅ (only IPv6 localhost) |
| 3002/3004 | AI News/WorldPredict frontend | ✅ |
