# MEMORY.md - 长期记忆

## 经验总结

### Capacitor/Vite 白屏问题 ⚠️
- **原因**: Vite 默认使用绝对路径 `/assets/...`，Capacitor 从文件系统加载时无效
- **解决**: 在 `vite.config.ts` 中添加 `base: './'`
- **验证**: 检查构建输出的 `index.html` 中资源路径是否为 `./assets/...` 而非 `/assets/...`

### APK 签名
- AI Phone Agent keystore: `C:\Users\Administrator\.openclaw\workspace\ai-phone-agent\ai-phone-agent-release.keystore`
- Alias: aiphonagent, Storepass: android123, Keypass: android123
- 签名命令: `jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore <keystore> -storepass <pass> <apk> <alias>`

### 飞书云盘 API 限制
- 文件夹权限设置 API `type=folder` 有诸多限制
- 解决方案: 为每个文件单独设置 `link_share_entity: "anyone_readable"` 公开链接
- APK 下载文件夹 token: `C6lffONgvlxfZRdtZdfcwZCHnQh`

### 任务错误处理原则 ⚠️
- **遇到任务错误时，主动调查原因而不是只汇报错误**
- 检查 cron job 历史、错误日志、进程状态
- 尝试重现问题并修复
- 记录调查过程和解决方案

### 环境安装
- **遇到没有安装的环境时，尝试自行安装** (如 Python, yt-dlp 等)
- Windows 上可用: winget, choco, scoop, npm 等安装工具
- 如果 skill 需要 Python 但没有，可以用 `winget install Python` 安装

### 代理问题
- Clash 代理可能导致 Gateway 断开
- 解决：在 `gateway.cmd` 中添加 `NO_PROXY` 环境变量
- 需绕过: 127.0.0.1, localhost, *.local, feishu-cn, openapi.feishu.cn

### Skills
- ClawHub: `clawhub install <skill>` 
- 遇到 rate limit 等一会再试

## AI News v2 计划
- 位置: `ai-news/PLAN_v2.md`
- 阶段: 博客生成 + Android 打包 + Google Play 发布
- Skills 已创建: ainews-development, blog-generator, google-play-publish

## 2026-04-02 Session
- AI News backend: v0.8.2-noauth, PID 24636, running with --reload on port 8002
- WP backend: v0.8.16 on port 8011
- FIXED: Device-based anonymous read tracking (was failing silently)
  - Backend: MarkReadRequest now accepts device_id, creates anonymous users per device
  - Frontend: markAsRead() now generates UUID and sends device_id
  - APKs built: ai-news-release-v0.8.2.apk, ai-news-debug-dev.apk
- Bug: 8012 ghost processes are Windows TCP TIME_WAIT (not real processes)
- Pending: MINIMAX_API_KEY not set → WP uses fallback predictions with inflated confidence
- Daily report: `ainews_wp_daily_report_2026-04-02.md`

## 待完成
- [x] 注册 AI Trader 账户 (OpenClawBot2, ID: 357)

## 开发任务规则 ⚠️
**运行开发任务时，使用 Claude Code 进行开发！**
- Skill: `coding-agent` (已安装，支持 Claude Code)
- 命令: `claude --permission-mode bypassPermissions --print 'task'`
- 不要手动编写代码，让 Claude Code 代劳

## Bounty Hunt 规则 ⚠️
**使用 Claude Code + GStack QA 开发！**
1. 找 Bounty: BountyHub.dev / GitHub `💎 bounty` label
2. 认领: `/attempt #ISSUE`
3. 开发: `claude --permission-mode bypassPermissions --print "fix issue"`
4. 测试: 使用 GStack QA skill (`~/.claude/skills/gstack/qa/SKILL.md`)
5. 提交 PR
6. 记录到 `.learnings/bounty-hunt.md`

## 测试 Skills
| Skill | 路径 | 说明 |
|-------|------|------|
| GStack QA | `~/.claude/skills/gstack/qa/` | 完整 QA 测试流程 |
| coding-agent | OpenClaw skills | Claude Code 支持 |
- [x] 运行模拟交易 (脚本: ai-trader-bot.ps1)
- [x] 设置每小时汇报 (Cron job: trading-report, 每小时一次)
- [x] 注册 Claw Colony 账户 (areyouokbot, Token: 359,400)

### AI Trader 详情
- Agent Name: OpenClawBot2
- Agent ID: 357
- Token: y_OUNBLI8QMIGomVQOXjN__WNUn2tQatvXoiQL0v5yw
- 初始资金: $100,000

### Claw Colony 详情 (2026-04-01 04:12 更新)
- Username: areyouokbot
- User ID: 4891a186-c970-499e-bf3d-bf4d2d66ee8d
- API Key: clawcolony-fe8a95a9105bb216dfcfec8e
- earn_daemon_v9 PID: 16428 → 已重启，新PID见keepalive
- Colony level: critical ⚠️
- Balance: 425,148,728 tokens (rank #1)
- 世界运行正常 (tick 3310, not frozen)

#### 运行状态 (2026-04-01 04:18 GMT+8)
- earn_daemon_v9: ✅ Running (tick 2910, state age ~1min, keepalive healthy)
- State file: `C:\Users\Administrator\.openclaw\workspace\clawcolony_earn_daemon_v8.state`
- Keepalive log: `clawcolony_earn_v9_keepalive.log`

#### 致命问题：Earning 已完全停止 ⚠️⚠️⚠️
- **KB Publishing**: API正常返回200，但balance delta = 0 (无token奖励)
- **Ganglion Forging**: API正常返回200，但balance delta = 0 (无token奖励)
- **Token History**: 所有操作都是 consume 10 tokens (life cost)，无任何earn记录
- **烧钱速度**: ~10 tokens/分钟 = ~14,400/day = ~29天余额耗尽
- **Reward Claims**: 所有历史collabs返回400 Bad Request (已过期)

#### KPI状态 (evolution-score)
- Overall: 33 (critical)
- Knowledge: 1 (178/179 users inactive) ⚠️
- Autonomy: 1 (178/179 inactive) ⚠️
- Governance: 34 (26 events)
- Collaboration: 5
- Survival: 97

#### 关键API
- `https://clawcolony.agi.bar/api/v1` (新地址)
- Balance: GET /api/v1/token/balance?user_id=...
- KB publish: POST /api/v1/library/publish {title,category,content}
- Forge: POST /api/v1/ganglia/forge {name,type,description,implementation,validation}
- Reward claim: POST /api/v1/token/reward/upgrade-pr-claim {task_id} (需要有效collab_id)

#### 经验教训
- DCA Bot是主要收入来源 ($4.4M cash)
- 次Bot (ai-trader-bot.js) 今天启动时只有$7,330，已消耗至$988
- AI Trader API受代理TLS问题影响

### 运行中的 Subagents
1. app-dev - AI News + WorldPredict 开发
2. stock-monitor - 股票盯盘 (3只股票)
3. clawcolony - Claw Colony 赚钱
4. ai-trader - AI Trader 加密货币交易
5. ai-money-hunter - AI自动赚钱机会探索 (每小时运行)
6. web3-airdrop-claimer - Web3 空投猎手 (实际领取空投)

### Cron Jobs
- ai-money-hunter-hourly: 每小时运行 ai-money-hunter，使用 GStack 框架探索赚钱机会 (timeout: 20分钟)

### GStack (YC创业方法论AI工具)
- 位置: ~/.claude/skills/gstack
- 15个YC验证专业角色
- 可用技能: /office-hours, /plan-ceo-review, /plan-eng-review, /review, /qa, /ship 等

## 问题
- Gateway 频繁关闭问题 - 已配置 NO_PROXY 但仍有问题

### AI Money Hunter 分析 (2026-04-03)
- Web Search API 仍然不可用（BRAVE_API_KEY 未配置）
- 更新了 ai_money_opportunities.md，增加新方向：
  - AI 电话助理 (Voice Agent) ⭐⭐⭐⭐⭐ 首选
  - 视频 AI 摘要 + 剪辑 ⭐⭐⭐⭐⭐
  - AI Agent Agency Model ⭐⭐⭐⭐
- 发现 workspace 已有 ai-phone-agent 目录，可复用
- GStack office-hours skill 已读取，掌握 YC 六问诊断框架

### AI Money Hunter 分析 (2026-04-03 第二轮)
- Web Search API 仍然不可用（BRAVE_API_KEY 未配置）
- 本次更新重点：
  - Voice AI Agent（语音替身）升级为🥇首选方向
  - Computer-Using Agent (CUA) 新增为🥇TOP2
  - MCP开发者服务升级（生态爆发中）
  - 核心EUREKA：AI赚钱 = 从"帮人做"到"替人做"的代际革命
  - Voice AI = 最后一个未被颠覆的高价值行为（电话）
  - MCP = 2026年的"网站"机会（平台转移红利）
- 已更新 ai_money_opportunities.md（完整报告）

### Bounty Hunt 规则 (2026-04-08 更新) ⚠️
- **不评论别人的工作** - 不留言、不讨论、只干活
- 直接认领 Bounty → 直接实现 → 直接提交 PR
- **⚠️ 验证规则: `bounty` 标签 ≠ 真钱！**
  - 必须验证实际金额: GitHub Issue 正文中写明 `$XX` 美元金额
  - 或verified可交易的token (如 FNDRY = SolFoundry 平台币)
  - 很多仓库用 `bounty` 标签做内部积分系统，并非真实现金
  - **假 Bounty 特征**: 只有标签无金额、积分/积分/徽章奖励
  - **真 Bounty 特征**: 明确 $ 金额、Algora.io/BountyHub.dev 平台列出的
- **⚠️ PR 必须验证**: subagent 报告可能造假！每次用 `gh pr list --author TeapoyY` 核实真实作者

### Cron Job 错误调查
- **stock-monitor**: cron job 配置为 agentTurn，timeout 太短(60s)，但脚本持续运行
  - 修复: 增加 timeout 到 300s
  - 心动公司(HK)数据频繁 No data - 可能是港股数据源问题
- **ai-money-hunter**: timeout 1200s 但仍然超时，可能是 web_search API 问题
  - 待调查: 检查 GStack 框架和 web_search 是否可用

## 股票盯盘

### 监控脚本
- 位置: `C:\Users\Administrator\.openclaw\workspace\scripts\stock_monitor_sina.py`
- 运行: `cmd /c "C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe C:\Users\Administrator\.openclaw\workspace\scripts\stock_monitor_sina.py"`
- 监控股票:
  - 拓维信息 (sz002261)
  - 华胜天成 (sh600410)
  - 心动公司 (hk02400)
- 数据源: 新浪财经API（国内可访问，不需要代理）
- 检查间隔: 60秒

### 功能
- 涨跌幅 >3% 提醒
- 接近日内高低点提示（高抛低吸信号）
- 接近涨跌停风险提示

## App 开发流程

### 流程规范
1. **编写** -> 2. **构建** -> 3. **上架**
2. **仓库要求**: 每个新 app 使用独立的 GitHub **私有**仓库
3. **Agent 隔离**: 每个应用单起一个 instance/subagent 来编写、测试、迭代、运行
4. 使用 GitHub CLI (`gh`) 进行版本管理

### GitHub Skill
- 安装: `winget install GitHub.cli` 或 `brew install gh`
- 认证: `gh auth login`
- 相关 skill: `C:\Users\Administrator\AppData\Roaming\npm\node_modules\openclaw\skills\github\SKILL.md`

### 遇到问题
- **寻找相关 skill**: 使用 `clawhub install <skill>` 或查看 `C:\Users\Administrator\AppData\Roaming\npm\node_modules\openclaw\skills\` 目录
- 常用 skills: github, coding-agent, skill-creator, discord (推送), slack (推送)

## 应用开发

### 应用1: AI News (高度定制化新闻推送)
- **仓库**: https://github.com/TeapoyY/ai-news (私有)
- **产品逻辑**: 类似 worldmonitor，简化版
- **核心功能**:
  - 用户自定义新闻行业/内容
  - AI 过滤和汇总新闻
  - 支持关注特定股票新闻
  - 支持关注特定行业
  - 推送方式: 邮箱 / 手机查询
  - 支持 PC 和手机
- **技术栈**: Python FastAPI + React

### 开发进度 (AI News)
- [x] Backend 框架搭建
- [x] 新闻抓取模块 (RSS)
- [x] AI 过滤模块 (基础)
- [x] 用户管理模块
- [x] API 接口
- [ ] Frontend (待开发)
- [ ] AI 集成 (待完善)
- [ ] 邮件推送 (待开发)

### 应用2: WorldPredict (金融预测)
- **仓库**: https://github.com/TeapoyY/world-predict (私有)
- **产品逻辑**: 结合 MiroFish + worldmonitor
- **核心功能**:
  - 新闻消息驱动预测金融资产/股票影响
  - 收集社媒和散户反应（贴吧等）
  - 综合推断金融资产走势
- **技术栈**: Python FastAPI

### 开发进度 (WorldPredict)
- [x] 项目结构创建
- [x] 后端框架
- [x] 新闻抓取模块
- [x] 股票影响分析模块
- [x] 社媒反应收集模块
- [x] 走势预测模块
- [ ] Frontend (待开发)

### 参考学习
- **Harness Engineering**: https://openai.com/zh-Hans-CN/index/harness-engineering/

## Harness Engineering 核心经验 (OpenAI Codex)

### 核心理念
- **人类掌舵，智能体执行**: 不手动编写代码，全部由 AI 生成
- **时间节省**: 约 1/10 手工编写时间

### 关键经验
1. **深度优先工作方式**: 将大目标拆解为小模块，提示智能体逐个构建
2. **情境管理**: 给 Codex 一张地图，而不是 1000 页说明书
3. **渐进式披露**: 简短 AGENTS.md (100行) 作为入口，指向深层文档
4. **强制边界**: 通过 linter 强制执行架构约束，而非微观管理
5. **代码即知识**: 所有知识必须存入代码仓库，否则智能体看不到
6. **快速迭代**: PR 生命周期短，测试偶发失败可通过重跑解决
7. **定期清理**: 建立"垃圾回收"机制，定期清理技术债务

### 实践要点
- 使用 git worktree 让 Codex 并行测试
- 应用程序 UI/日志对 Codex 可读
- 智能体可以自己审核自己的 PR
- 人类负责：转化反馈为验收标准、验证结果
- 智能体负责：代码、测试、CI配置、文档

### 应用到本项目
- 每个 App 建立独立私有仓库
- 使用 subagent 编写代码
- 保持简洁的 AGENTS.md
- 定期提交和清理

## 重要提醒
- **在必要时使用 self-improving-agent 的 skill** 来记录学习、错误和修正
- **所有任务执行前**: 先读取 `.learnings/LEARNINGS.md` 和 `.learnings/ERRORS.md` 避免重复错误
- **所有任务执行后**: 记录结果到 `.learnings/` 相应文件

## 所有开发流程规则 ⚠️
**所有开发任务必须使用 Claude Code 进行！**
1. **开发**: `claude --permission-mode bypassPermissions --print "task"`
2. **Review**: 用 Claude Code 检查代码问题
3. **修复**: 如果有问题，用 Claude Code 修复
4. **循环**: 直到 Review 没有问题
5. **最终验证**: 确认构建成功

**适用范围**:
- Dev agents (ai-phone-agent, ai-news, worldpredict 等)
- Bounty hunt 实现
- 所有代码开发/修复任务

**Claude Code CLI 已可用** - `claude --version` 返回 2.1.79
- Claude Code = Developer（执行开发）
- OpenClaw Subagent = Reviewer（审核、验证、循环直到没问题）
- Dev agent timeout: 1小时

## Self-Improving Agent Skill ⚠️

**位置**: `C:\Users\Administrator\.openclaw\workspace\skills\self-improving-agent`

**Learnings目录**: `C:\Users\Administrator\.openclaw\workspace\.learnings\`
- `LEARNINGS.md` - 纠正、最佳实践、知识差距
- `ERRORS.md` - 命令失败、集成错误
- `FEATURE_REQUESTS.md` - 用户请求的功能

**使用规则**:
| 情况 | 行动 |
|------|------|
| 命令/操作失败 | 记录到 `.learnings/ERRORS.md` |
| 用户纠正你 | 记录到 `.learnings/LEARNINGS.md` (category: correction) |
| 用户请求缺失功能 | 记录到 `.learnings/FEATURE_REQUESTS.md` |
| 发现更好的方法 | 记录到 `.learnings/LEARNINGS.md` (category: best_practice) |
| 知识过时/错误 | 记录到 `.learnings/LEARNINGS.md` (category: knowledge_gap) |

**推广规则**:
- 行为模式 → `SOUL.md`
- 工作流改进 → `AGENTS.md`
- 工具技巧 → `TOOLS.md`
- 广泛适用学习 → 提升到上述文件

## 发现的新工具/项目

### GStack
- **来源**: YC CEO Garry Tan 开源
- **GitHub**: github.com/garrytan/gstack
- **简介**: 将YC千家创业公司验证的思维框架封装为15个专业角色（CEO/设计师/工程经理等）
- **成绩**: 两周 3.3万星，MIT协议开源
- **用途**: 可用于 AI Money Hunter 的创业分析角色


## CLAWCOLONY STATUS UPDATE 2026-03-30 11:45 GMT+8

### ✅ World UNFROZEN! (at_risk recovered to 20.4%)
- Balance: 424,081,521 tokens (rank #1)
- **WORLD RUNNING**: tick_id 44, tick_count 3310
- **at_risk: 56/274 = 20.4%** (below 30% threshold - FROZEN CLEARED!)
- Treasury: 3,922 tokens
- Colony KPIs: overall=32 (critical), autonomy=2, knowledge=1, governance=9, collaboration=5, survival=98
- Life state: alive (146), hibernating (27), dead (6)

### Running Processes
- clawcolony_continuous_earn.js (PID 10784, started 11:41) ✅
- earn_daemon (PID 29716, started 11:32) ✅

### AI Trader Status (11:42 GMT+8)
- Cycle 4220: Cash $1,258,580 | PnL $29,782
  - Crypto: +$30,842 | Stocks: -$1,059
- Accumulating BTC + ETH regularly
- Main revenue stream ✅

### P648 Reward
- Task: "Knowledge Emergency Response Protocol"
- Reward: 20,000 tokens
- Status: Open, claimable via /api/v1/token/reward/upgrade-pr-claim

### CLAWCOLONY STATUS UPDATE 2026-04-01 04:18 GMT+8
- Balance: 425,148,728 tokens (rank #1) — ⚠️ EARNING STOPPED, declining ~10/min
- World: tick 3310, overall=33 (critical), knowledge=1, autonomy=1, gov=34, collab=5, survival=97
- Daemon: earn_daemon_v9 ✅ tick 2910, state healthy (1 min old)
- World: NOT frozen (at_risk 55/274 = 20%, below 30% threshold) ✅
- AI Trader: (check separate status)

## CRITICAL: Claw Colony Earning Broken (2026-04-01)
- KB Publishing and Ganglion Forging NO LONGER GENERATE TOKENS
- Balance declining ~10 tokens/minute from life costs
- At this rate: ~29 days until balance exhausted
- Reward claims for old collabs return 400 Bad Request
- No new earning mechanism found
- ACTION: Keep daemon running for rank #1, await server-side fix

## App Dev 更新 (2026-03-31 02:15 GMT+8)

### AI News 开发
- ✅ 创建 3个 Skills (ai-news-development, blog-generator, google-play-publish)
- ✅ 改进 release.yml: 添加 test-backend, lint, version-check, build-android jobs
- ✅ 添加 Play Store 手动发布 workflow
- ✅ 更新 PLAN_v2.md: M4 Skills ✅, M5 CI/CD ✅ 完成
- ✅ 修复 CI ESLint v10 兼容性问题 (pin to eslint@^9)
- ✅ GitHub: 提交并推送 39b9612, bde0692, 28c3a7e

### WorldPredict 开发
- ✅ 改进 ci.yml: 添加 Android APK build job (Capacitor + Java 21 + Android SDK)
- ✅ 初始化 Capacitor (appId: com.worldpredict.app)
- ✅ 构建 Debug APK (4.38 MB) 和 Release APK (3.43 MB, 已签名)
- ✅ 创建 release keystore: world-predict-release.keystore
- ✅ 修复 CI ESLint v10 兼容性问题 (pin to eslint@^9)
- ✅ 更新 README: 添加 Android APK 构建说明
- ✅ GitHub: 提交并推送 58b6a28, b513cfc

### 服务状态
- AI News: http://localhost:8002 (v0.8.0-noauth) ✅
- WorldPredict: http://localhost:8011 (v0.8.14) ✅
- AI News Frontend: http://localhost:3002 ✅
- WorldPredict Frontend: http://localhost:3004 ✅

### WorldPredict APK 文件
- `world-predict/world-predict-debug.apk` - 4.38 MB
- `world-predict/world-predict-release.apk` - 3.43 MB (已签名)
- `world-predict/world-predict-release.keystore` - 签名密钥

### 待完成
- Play Store 账户配置和测试发布 (AI News) - 需要:
  1. Google Play Developer 账户
  2. 在 Play Console 创建 AI News 应用
  3. 配置 GitHub Secrets (ANDROID_KEYSTORE, 密码等)
  4. 上传 release APK 进行测试发布
- WorldPredict APK 版本: v0.8.15 (commit b513cfc)

## FormForge (AI Form Filler)
- **仓库**: https://github.com/TeapoyY/ai-form-filler (私有)
- **产品**: AI 驱动表单填写工具 - 上传文档/图片，定义模板，AI 自动提取并填写
- **后端**: `backend/main.py` (FastAPI, port 8002)
- **前端**: `frontend/` (React + Vite)
- **测试文件**: `backend/test_samples/en10204_certificate.pdf` + `.png`

### 技术栈
- **OCR**: PyMuPDF (text PDFs) + EasyOCR fallback (PaddleOCR DISABLED - hangs on OCR calls)
- **Vision LLM**: Ollama minicpm-v (~4GB, via `/api/vision/file`)
- **Text LLM**: Ollama gemma3:1b (via `/api/extract`)
- **Backend**: FastAPI + uvicorn
- **端口**: 8002 (启动: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8002`)

### E2E 测试结果 (EN 10204 钢材证书) ✅
1. OCR PDF (PyMuPDF): 1061 chars, 33 blocks ✅
2. Extract (OCR→gemma3:1b): 12/12 fields, 0.99 conf ✅ (PDF preferred)
3. Vision PNG (minicpm-v): 9-12/12 fields (LLM JSON variance) ✅
4. OCR PNG (EasyOCR): returns 0 chars for this PNG — use vision endpoint instead

### 已知限制
- **PaddleOCR**: Hangs during OCR execution on Windows (connectivity check blocks). DISABLE_PADDLEOCR=1 in .env. Alternative: use vision endpoint for images.
- **PNG OCR**: EasyOCR returns 0 chars for en10204_certificate.png. Use `/api/vision/file` for image extraction instead.
- **DeepSeek**: No API key configured.

### 关键修复 (2026-04-08)
- FastAPI `template_id: str = Form("")` — 修复 Form 数据读取
- `_map_results` — 同时支持 `{"key":"..."}` 和 `{"field_key":"..."}` 格式
- minicpm-v JSON 解析 — 处理 `{{...}}` 双括号、JS注释、未加引号值
- httpx.Client() in `_call_ollama` — 使用持久连接替代 httpx.post() 模块函数 (修复 Windows FastAPI 环境下 Ollama 调用返回空结果)
- `.gitignore` — 添加 `*.log` 和 `server*.log` 排除服务器运行日志

### DeepSeek 支持
- `extractor.py` 包含 `_call_deepseek()` — 设置 `DEEPSEEK_API_KEY` 环境变量并切换 `LLM_PROVIDER=deepseek` 即可激活
- 当前使用 Ollama (gemma3:1b + minicpm-v) — DeepSeek API key 未配置

### 服务状态
- Backend: http://localhost:8002 (v0.3.0, PID ~5928)
- Frontend dev: `cd frontend && npm run dev`
