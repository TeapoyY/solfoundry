# HEARTBEAT.md - Active Tasks Monitor
Updated: 2026-04-16 08:34 HKT

## Active Projects

### FormForge (AI Form Filler)
- **Repo**: https://github.com/TeapoyY/ai-form-filler
- **Stack**: FastAPI + PyMuPDF + PaddleOCR + OpenRouter (Gemini 2.5 Flash Image)
- **Status**: ✅ Fully working (port 8001)
- **Backend**: port 8001 (pid dynamic, use start_server.py)
- **OCR**: PyMuPDF text ✅ | PaddleOCR ENABLED (3.4.0 + paddlepaddle 3.0.0, ~30s cold-start) | EasyOCR disabled | DeepSeek OCR needs API key
- **LLM**: OpenRouter google/gemini-2.5-flash-image via httpx (proxies={...}, trust_env=False)
- **E2E**: 12/12 EN10204 ✅ (2-step ~9s, Vision ~220s)
- **⚠️ Python PATH**: WindowsApps stub → 用完整路径 `C:\...\Python311\python.exe`
- **Server**: `cd backend && python start_server.py` (default port 8001)
- **Test**: `python quick_e2e.py` (smoke test, no vision)

### LearnAny (新)
- **Repo**: https://github.com/TeapoyY/learn-any
- **Stack**: FastAPI + OpenRouter + 单文件 SPA
- **Status**: ✅ 运行中 (port 8003)
- **功能**: 费曼+苏格拉底渐进学习引擎
- **注意**: fallback硬编码计划(网络不通时)

### AI News / WorldPredict
- **Repos**: ai-news, world-predict
- **Status**: ✅ Running
- **Ports**: 8002 (news), 8011 (wp), 3002/3004 (frontend)

### LearnAny (新)
- **Repo**: https://github.com/TeapoyY/learn-any
- **Stack**: FastAPI + MiniMax + 单文件 SPA
- **Status**: ✅ 新建完成
- **Backend**: port 8003
- **功能**: 费曼+苏格拉底渐进学习引擎

### Parallax Train Widget
- **Repo**: https://github.com/TeapoyY/parallax-train-widget
- **New**: Transparent/Desktop embed modes added (2026-04-09)

## Bounty Hunt ⚠️
1. Find: BountyHub.dev / Algora.io
2. **Verify real money**: `bounty` label ≠ cash!
3. Claude Code: `claude --print "implement..."`
4. PR verification: `gh pr list --author TeapoyY`

### Active PRs (verified 2026-04-16 08:34 HKT)
⚠️ No open PRs — need new bounty hunt targets!

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
- AI News backend: 8002
- WorldPredict backend: 8011
- FormForge backend: 8001
- AI Phone Agent backend: 8013
- LearnAny backend: 8003
