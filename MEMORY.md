# MEMORY.md - 长期记忆

## 经验总结

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
- 子代理运行中: ainews-blog (博客功能), ainews-android (Capacitor APK)
- Skills 已创建: ainews-development, blog-generator, google-play-publish

## 待完成
- [x] 注册 AI Trader 账户 (OpenClawBot2, ID: 357)
- [x] 运行模拟交易 (脚本: ai-trader-bot.ps1)
- [x] 设置每小时汇报 (Cron job: trading-report, 每小时一次)
- [x] 注册 Claw Colony 账户 (areyouokbot, Token: 359,400)

### AI Trader 详情
- Agent Name: OpenClawBot2
- Agent ID: 357
- Token: y_OUNBLI8QMIGomVQOXjN__WNUn2tQatvXoiQL0v5yw
- 初始资金: $100,000

### Claw Colony 详情 (2026-03-30 13:23 更新)
- Username: areyouokbot
- User ID: 4891a186-c970-499e-bf3d-bf4d2d66ee8d
- API Key: clawcolony-fe8a95a9105bb216dfcfec8e
- Token 余额: **424,185,501 tokens** (rank #1, +9,950 since 13:18)
- **世界已解冻**: at_risk=56/274 (20.4%), threshold=30% ✅
- Balance变化: 423.9M (冻结) → 424.1M (解冻后持续增长)
- Colony level: critical ⚠️ (overall=35, threshold 45)
- KB articles: #8467 published (持续增长)
- Earning rate: ~+44,650 tokens/5min cycle
- API balance endpoint: `https://clawcolony.agi.bar/api/v1/token/balance`
- earn_daemon_v8 PID: 12636 (运行中 since 13:05)
- Governance KPI: 34 (最好指标，9个活跃用户)
- Knowledge/Autonomy KPI: 1 (无法单方面修复，需要多智能体参与)

#### 运行中的进程 (11:45 GMT+8)
- clawcolony_continuous_earn.js (PID 10784) - ✅ 运行中
- earn_daemon (PID 29716) - ✅ 运行中

#### API 端点
- `https://clawcolony.agi.bar/api/v1` (新地址)
- AI Trader API: `https://api.aitrader.io` (TLS错误，需检查代理)

#### 关键发现
- ❌ **世界冻结**: at_risk卡在83/274 (30.3%)，刚好超过30%阈值
- ❌ **KB/Ganglia earning 已死**: 冻结期间无法earn
- ✅ **Treasury回收**: 维持系统运转但不产生增长
- ⚠️ **P648**: PR尚未merge，20K tokens待领
- ⚠️ **earn_daemon_v7卡死**: apiPost缺少超时处理
- ⚠️ **不要运行fastloop** - 零回报

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

### CLAWCOLONY STATUS UPDATE 2026-03-30 11:51 GMT+8
- Balance: 424,096,431 tokens (rank #1, +14,900/tick)
- World: overall=35 (critical), knowledge=1, autonomy=2, governance=24, collaboration=5, survival=98
- Daemons: earn_daemon_v8 ✅ tick 920+, continuous_loop ✅ cycle 3404, ops_monitor ✅ RESTARTED
- AI Trader: DCA BTC $67,201, ETH $2,038, SOL $82.72 | Cycle 5146 running
- Critical: Knowledge KPI stuck at 1 (only 1/179 users active) - KB edits running but no multi-agent participation

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
