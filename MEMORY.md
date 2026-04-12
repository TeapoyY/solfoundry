# MEMORY.md - 长期记忆

## 经验总结

### Capacitor/Vite 白屏问题
- 解决: `vite.config.ts` 中添加 `base: './'`

### APK 签名
- keystore: `ai-phone-agent-release.keystore`, Alias: aiphonagent, Storepass/Keypass: android123

### 飞书云盘 API
- APK 下载文件夹 token: `C6lffONgvlxfZRdtZdfcwZCHnQh`

### 任务错误处理原则 ⚠️
- 遇到错误主动调查，不只汇报：检查 cron 日志、错误日志、进程状态，尝试重现并修复

### 环境安装
- 遇到未安装环境时尝试自行安装 (winget, choco, scoop, npm)

### 代理问题
- Clash 可能导致 Gateway 断开: 在 `gateway.cmd` 添加 `NO_PROXY` 绕过 127.0.0.1, localhost, *.local, feishu-cn, openapi.feishu.cn

## 开发任务规则 ⚠️
- 使用 Claude Code: `claude --permission-mode bypassPermissions --print 'task'`
- 不要手动编写代码

## Bounty Hunt 规则 ⚠️
1. 找 Bounty: BountyHub.dev / Algora.io / GitHub `💎 bounty` label
2. **验证真钱**: Issue 正文中写明 `$XX` 或 verified token; `bounty` 标签 ≠ 真钱
3. Claude Code: `claude --print "implement..."`
4. PR 必须 `gh pr list --author TeapoyY` 核实真实作者

### Active PRs
| PR | Repo | Bounty | Status |
|----|------|--------|--------|
| #887 | SolFoundry/solfoundry | T1: countdown + search bar | ✅ OPEN |
| #875 | SolFoundry/solfoundry | T1: Fix GitHub OAuth | ✅ OPEN |

## AI Money Hunter 深度分析 (2026-04-12 更新)
详见: ai_money_opportunities.md

**TOP 5 机会 (已深度分析):**
1. **AI 法律合同审查** 🥇 - $5K-50K/mo 潜力，YC 框架验证需求真实
2. **AI SMB 客服自动化** 🥈 - Shopify 商家，$2K-20K/mo
3. **垂直领域 MCP Server** 🥉 - 低执行成本，MCP 生态爆发期
4. **Claude Code 套利** ⚠️ - 低壁垒，不推荐纯套利
5. **AI 工具聚合平台** 📌 - 垂直聚合更可行

**核心发现:** 法律合同审查壁垒是 "prompt 质量 + 领域理解"，不是专有数据集 — 可用 AI 构建。

**本周行动:** Streamlit MVP (法律合同审查) + 3 位律师测试

## 运行中的 Subagents
| 名称 | 功能 |
|------|------|
| app-dev | AI News + WorldPredict 开发 |
| stock-monitor | 股票盯盘 (拓维信息/华胜天成/心动公司) |
| ai-trader | AI Trader 加密货币交易 |
| ai-money-hunter | AI自动赚钱机会探索 |


## 工具和 Skills
- GitHub CLI: `winget install GitHub.cli` → `gh auth login`; ClawHub: `clawhub install <skill>`
- Learnings 目录: `C:\Users\Administrator\.openclaw\workspace\.learnings\`
- Claude Code CLI: `claude --version` = 2.1.79; Dev agent timeout: 1小时

## 应用开发

### LearnAny (2026-04-12 新建)
- 仓库: https://github.com/TeapoyY/learn-any; FastAPI (port 8003) + 单文件 SPA
- 费曼+苏格拉底 8阶段渐进学习引擎; UI原则: tacit knowledge

### AI News / WorldPredict
- AI News: port 8002/3002; WorldPredict: port 8011/3004

### AI Phone Agent
- 仓库: https://github.com/TeapoyY/ai-phone-agent; APK: ai-phone-agent-v0.8.12-aligned.apk

### FormForge (AI Form Filler)
- 仓库: https://github.com/TeapoyY/ai-form-filler; FastAPI + PaddleOCR/EasyOCR + Ollama (gemma3:1b + minicpm-v); port 8001
- PRIMARY: 2-step path (PyMuPDF text + gemma3:1b) ✅ 化学元素全对
- Vision path (minicpm-v): ✅ 12/12 fields stable
- OCR engines: PyMuPDF (text PDFs) ✅ | PaddleOCR: DISABLED on Windows CPU (PIR NotImplementedError) | DeepSeek-OCR: installed (needs SiliconFlow API key) | EasyOCR: disabled (slow)

### Parallax Train Widget
- 仓库: https://github.com/TeapoyY/parallax-train-widget; 模式: Normal / Transparent / Desktop


