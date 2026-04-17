# HEARTBEAT.md - Active Tasks Monitor
Updated: 2026-04-17 16:33 HKT

## Active Projects

### FormForge (AI Form Filler)
- **Repo**: https://github.com/TeapoyY/ai-form-filler
- **Stack**: FastAPI + PyMuPDF + PaddleOCR + Ollama (gemma3:1b + minicpm-v)
- **Status**: 鉁?2-step E2E working; Vision endpoint intermittent
- **Backend**: port 8001 (via `python start_ff.py`)
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

### Active PRs (verified 2026-04-16 21:02 HKT)
鈿狅笍 No open PRs 鈥?need new bounty targets!

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
| 8001 | FormForge backend | 鉁?|
| 8002 | AI News backend | 鉁?(restarted 11:30) |
| 8003 | LearnAny backend | 鉁?(restarted 15:08 - crashing ~hourly) |
| 8010 | Douyin Game Forge backend | 鉁?|
| 8011 | WorldPredict backend | 鉁?(restarted 12:44) |
| 3000 | Douyin Game Forge frontend | 鉁?(only IPv6 localhost) |
| 3002/3004 | AI News/WorldPredict frontend | 鉁?|
