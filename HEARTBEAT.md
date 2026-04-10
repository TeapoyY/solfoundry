# HEARTBEAT.md - Active Tasks Monitor
Updated: 2026-04-10 07:04 HKT

## Active Projects

### FormForge (AI Form Filler)
- **Repo**: https://github.com/TeapoyY/ai-form-filler
- **Stack**: FastAPI + PyMuPDF + Ollama (gemma3:1b + minicpm-v)
- **Status**: ✅ Active dev (v0.3.0)
- **Backend**: port 8002

### AI News / WorldPredict
- **Repos**: ai-news, world-predict
- **Status**: ✅ Running
- **Ports**: 8002 (news), 8011 (wp), 3002/3004 (frontend)

### Parallax Train Widget
- **Repo**: https://github.com/TeapoyY/parallax-train-widget
- **New**: Transparent/Desktop embed modes added (2026-04-09)

## Bounty Hunt ⚠️
1. Find: BountyHub.dev / Algora.io
2. **Verify real money**: `bounty` label ≠ cash!
3. Claude Code: `claude --print "implement..."`
4. PR verification: `gh pr list --author TeapoyY`

### Active PRs (verified 2026-04-10 07:04 HKT)
| PR | Repo | Bounty | Status |
|----|------|--------|--------|
| #887 | SolFoundry/solfoundry | T1: countdown timer + search bar | ✅ OPEN |
| #881 | SolFoundry/solfoundry | T1: Bounty Countdown Timer | ✅ OPEN |
| #880 | SolFoundry/solfoundry | T1: Search Bar to Bounties | ✅ OPEN |
| #876 | SolFoundry/solfoundry | T3: TypeScript SDK | ✅ OPEN |
| #875 | SolFoundry/solfoundry | T1: Fix GitHub OAuth Sign-In | ✅ OPEN |
| #2734 | react-native-gifted-chat | $15 | ❌ CLOSED (未找到) |

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
