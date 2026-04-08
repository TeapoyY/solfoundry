# HEARTBEAT.md - Active Tasks Monitor
Updated: 2026-04-08 18:14 HKT

## Active Projects

### FormForge (AI Form Filler)
- **Repo**: https://github.com/TeapoyY/ai-form-filler
- **Stack**: FastAPI + PyMuPDF + PaddleOCR + Ollama (gemma3:1b + minicpm-v)
- **Status**: ✅ Active dev (v0.3.0)
- **Cron**: FormForge hourly dev (ID: 910ff854)
- **Issue**: MiniMax API insufficient balance — using Ollama instead
- **DeepSeek**: Set `DEEPSEEK_API_KEY` env var + `LLM_PROVIDER=deepseek` to activate

### AI Phone Agent
- **Repo**: https://github.com/TeapoyY/ai-phone-agent
- **Status**: ✅ Active (latest APK v0.8.9)
- **Backend**: port 8013 | **Frontend**: port 3000

### AI News
- **Repo**: https://github.com/TeapoyY/ai-news
- **Status**: ✅ Active
- **Backend**: port 8002 | **Frontend**: port 3002

### WorldPredict
- **Repo**: https://github.com/TeapoyY/world-predict
- **Status**: ✅ Active (v0.8.20)
- **Backend**: port 8011 | **Frontend**: port 3004

### WeChat Vampire Survivors (微信小游戏)
- **Repo**: https://github.com/TeapoyY/wechat-vampire-survivors (private)
- **Status**: 🆕 Pipeline ready — Cocos Creator + TypeScript

### ai-hedge-fund
- **Repo**: https://github.com/virattt/ai-hedge-fund (cloned to C:\Users\Administrator\ai-hedge-fund)
- **Status**: ⏳ Deployment pending — venv ready, deps installing

## Bounty Hunt

### Rules (⚠️ Read First)
1. Find bounties: BountyHub.dev (PRIMARY) / Algora.io (secondary)
2. **Verify real money**: `bounty` label ≠ cash! Must have `$XX` or tradeable token
3. Use Claude Code: `claude --permission-mode bypassPermissions --print "implement..."`
4. Verify PRs: always `gh pr list --author TeapoyY` — subagent can fabricate reports!
5. No commenting on others' work — just claim → implement → PR

### Current PRs (Real Bounties)
| PR | Repo | Bounty | Status |
|----|------|--------|--------|
| #875 | SolFoundry/solfoundry | 200K FNDRY (OAuth fix) | ✅ OPEN |
| #876 | SolFoundry/solfoundry | 900K FNDRY (TS SDK) | ✅ OPEN |
| #880 | SolFoundry/solfoundry | 150K FNDRY (Search bar) | ✅ OPEN |
| #881 | SolFoundry/solfoundry | 100K FNDRY (Countdown timer) | ✅ OPEN |
| #887 | SolFoundry/solfoundry | Multi-bounty combo | ✅ OPEN |
| #2734 | react-native-gifted-chat | $15 | ✅ OPEN |

### FNDRY Status
- FNDRY = SolFoundry platform token (not USD)
- Value unverified — check if listed on exchanges

## Cron Jobs
| Job | Schedule | Status |
|-----|----------|--------|
| gateway-keepalive | every 10m | ✅ |
| bounty-hunt-monitor | every 1h | ✅ |
| ai-money-hunter-hourly | every 1h | ✅ |

Note: "error" status = notification delivery failed (Axios 400), not job failure.

## Service Ports
- AI News backend: 8002
- WorldPredict backend: 8011
- FormForge backend: 8001
- AI Phone Agent backend: 8013
