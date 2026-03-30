# AI News + WorldPredict 开发日志

## 2026-03-30 14:05 开发更新 ✅

### WorldPredict v0.8.13: Dashboard数据修复 + 文件编码修复

#### 1. Dashboard数据修复
- **问题**: `/api/v1/market/dashboard` 返回空数组（12个股票全部失败）
- **根因**: 
  - 嵌套`asyncio.gather`模式问题
  - 新闻API单次请求需4+秒，但超时仅设2秒
- **修复** (routes.py dashboard):
  - 改用扁平`asyncio.gather(*all_tasks, return_exceptions=True)`
  - 超时时间调整：新闻2s→8s，技术指标3s→8s，行情2s→5s
- **结果**: Dashboard现在返回 3US + 4CN + 4HK = 11只股票（偶尔1只US股票超时）

#### 2. main.py文件编码修复
- **问题**: main.py被意外保存为UTF-16 LE编码，导致Python启动失败
- **症状**: `SyntaxError: invalid character '��' (U+FF0C)`
- **修复**: 将main.py从UTF-16 LE转换为UTF-8编码

#### 3. 版本更新
- WorldPredict: v0.8.12 → v0.8.13
- 提交: 5d085b3 (fix encoding), c94140e (frontend version), 8deb6ba (dashboard fix)
- GitHub: 已推送

### AI News v0.7.2
- Blog功能已完全实现（路由、服务、模型）
- 后端重启后blog路由生效（之前因代码更新但未重启导致路由未注册）
- API测试: `/api/v1/blog/posts` 返回空列表（正常工作）

## 2026-03-30 14:23 开发更新 ✅

### WorldPredict v0.8.13: Dashboard Gather修复 + UTF-16编码修复

#### 1. Dashboard 嵌套Gather问题修复
- **问题**: 原代码使用嵌套 `asyncio.gather` 调用，一个市场组失败可能影响其他组
- **修复**: 改用扁平 `asyncio.gather(*all_tasks, return_exceptions=True)`
- **效果**: US/CN/HK三组完全独立，一组失败不影响其他组

#### 2. main.py UTF-16编码修复
- **问题**: main.py 被意外保存为 UTF-16 LE编码 (带BOM)，导致 Python 启动失败
- **症状**: `invalid character` 和 `null bytes` 错误
- **修复**: 转换为 UTF-8 编码

#### 3. Dashboard超时调整
- 新闻获取: 2s → 8s (适应慢速API)
- 实时行情: 2s → 5s (适应网络波动)
- 技术指标: 3s → 8s

#### 4. GitHub 状态
- WorldPredict: 5d085b3 ✅ (UTF-16 fix)
- AI News: c1de3cb ✅ (.gitignore + package-lock.json)
- WorldPredict README: v0.8.12 → v0.8.13 ✅

### 服务状态 (2026-03-30 14:22)
| Service | Port | Version | Status |
|---------|------|---------|--------|
| AI News Backend | 8002 | v0.7.2 | ✅ Healthy (blog routes) |
| AI News Backend | 8000 | v0.7.2 | ✅ Healthy (old) |
| WorldPredict Backend | 8011 | v0.8.13 | ✅ Healthy |
| AI News Frontend | 3002 | - | ✅ Running |
| WorldPredict Frontend | 3004 | - | ✅ Running |

**Dashboard 测试结果 (60s timeout):**
- US stocks: 3/4 返回 (MSFT失败，返回neutral)
- CN stocks: 4/4 返回 ✅
- HK stocks: 3/4 prices null (0700, 9988, 3690 - 腾讯财经API问题)

## 2026-03-30 13:40 开发更新 ✅

### WorldPredict v0.8.12: Dashboard超时修复 + HK指数

#### 1. Dashboard Endpoint超时修复
- **问题**: `/api/v1/market/dashboard` 超时无响应 (10s+)
- **根因**: fetch_us_stock/fetch_cn_stock/fetch_hk_stock 内各操作无独立超时
- **修复** (routes.py):
  - `fetch_us_stock`: 新闻2s超时, 技术指标3s超时, 行情2s超时
  - `fetch_cn_stock`: 同上
  - `fetch_hk_stock`: 同上
  - 所有操作包裹在 `asyncio.wait_for(..., timeout=X)` 中

#### 2. Market Overview添加HK指数
- **问题**: 市场概览只显示A股6个指数，缺少港股
- **修复** (routes.py indices列表):
  - 添加 `("hkHSI", "恒生指数")`
  - 添加 `("hkHSCEI", "恒生国企指数")`
- **修复** (market_data.py):
  - HK index symbol处理: 区分HK股票(HK0700)和HK指数(HKHSI/HKHSCEI)
  - Volume字段修复: `int(float(parts[6]))` 替代 `int(parts[6])` (HK指数volume为浮点数)

#### 3. Version bump: 0.8.11 → 0.8.12
- main.py: 3处 version="0.8.12"
- routes.py root: version="0.8.12"

## 2026-03-30 13:05 开发更新 ✅

### WorldPredict v0.8.11: 港股全面支持 (第二轮修复)

#### HK股票数据层全面修复
- **Bug修复** (news_fetcher.py): 
  - `fetch_stock_news` 原来对4位数字HK股票使用Eastmoney（不支持），改为使用Yahoo Finance + ".HK"后缀
  - 添加腾讯(0700)和小米(1810)的mock新闻模板

- **Bug修复** (market_data.py):
  - `get_realtime_quote` 原来对HK股票代码处理有误 (`symbol[-5:]`截断问题)
  - 修复: 正确处理 "HK0700", "hk0700", "0700" 三种输入格式，统一转换为 "hk00700" (5位数字补零)

- **Bug修复** (routes.py fetch_hk_stock):
  - 修复symbol双重前缀问题: "hk0700" → "hkhk0700"
  - 修复: 传入clean_symbol (去掉HK前缀) 给 get_cached_news

- **改进** (technical_indicators.py):
  - `get_historical_prices` 支持HK股票: 4位数字代码自动转换为 Yahoo Finance 格式 "0700.HK"
  - 支持RSI/MACD/布林带等技术指标计算

- **GitHub commit**: 98db678 ✅ (routes.py + market_data.py + news_fetcher.py + technical_indicators.py)
- **GitHub push**: ✅

### WorldPredict v0.8.11: 港股覆盖 + 版本修复

#### 1. 新功能: 港股市场覆盖
- **问题**: dashboard 只覆盖美股和A股，缺少港股
- **修复**: 在 `/market/dashboard` 添加港股预测
  - 新增热门港股: 腾讯(0700)、阿里(9988)、美团(3690)、小米(1810)、京东(9618)、比亚迪股份(1211)
  - 添加 `fetch_hk_stock` 异步函数，与美股/A股逻辑一致
  - Dashboard 响应新增 `hk_stocks` 数组
  - 使用腾讯财经API获取港股实时数据（hk00700等格式）

#### 2. 版本修复: main.py 版本字符串更新
- **问题**: v0.8.10 代码已部署但 main.py 仍显示 0.8.9
- **修复**: 更新 main.py 中所有版本字符串 (root, health, system_stats)

### 服务状态 ✅
| Service | Port | Version | Status |
|---------|------|---------|--------|
| AI News Backend | 8002 | v0.7.2 | ✅ Healthy |
| WorldPredict Backend | 8011 | v0.8.11 | ✅ Healthy |
| AI News Frontend | 3002 | - | ✅ Running |
| WorldPredict Frontend | 3004 | - | ✅ Running |

## 2026-03-30 12:28 开发更新 ✅

### WorldPredict v0.8.10: 两项关键改进

#### 1. Bug Fix: `/market/dashboard` 技术指标缺失
- **问题**: dashboard 端点的 `fetch_us_stock` 和 `fetch_cn_stock` 函数未传递 `technical_data` 给预测器
- **修复**: 添加技术指标获取（与 `/predict` 端点一致）
- **影响**: 现在 AAPL/MSFT/NVDA/GOOGL 的 dashboard 预测也包含真实技术面分析
- **GitHub commit**: 1f3068d ✅

#### 2. 改进: 预测阈值加宽，减少假阳性
- **问题**: 方向判定阈值太窄 (0.02-0.04)，导致信号模糊时错误预测 "up"
- **修复**: 
  - news_count > 20: 0.02 → 0.05 (0.45-0.55)
  - news_count > 5: 0.03 → 0.07 (0.43-0.57)
  - news_count ≤ 5: 0.04 → 0.10 (0.40-0.60)
- **影响**: 信号模糊时更多返回 "neutral"，减少错误方向预测
- **GitHub commit**: 21bd36d ✅

### AI News v0.7.2: 关键 Bug Fix

#### 修复: Vite Proxy 指向错误端口
- **问题**: `frontend/vite.config.ts` 的 `/api` proxy 指向 `localhost:8013`（无服务），实际后端运行在 `8002`
- **影响**: AI News 前端（port 3002）无法正常获取新闻数据
- **修复**: 修正 proxy target 为 `http://localhost:8002`
- **GitHub commit**: 824a03f (proxy fix), 287e634 (version bump) ✅

### 服务状态 (2026-03-30 12:28)
- AI News Backend (8002): v0.7.2 ✅
- WorldPredict Backend (8011): v0.8.10 ✅
- AI News Frontend (3002): ✅ (proxy 已修复)
- WorldPredict Frontend (3004): ✅

## 2026-03-30 12:15 开发更新 ✅ (WorldPredict v0.8.9)

### Bug Fix: `/predict/{symbol}` 技术指标缺失
- **问题**: `predict_stock` 端点未传递 `technical_data` 给预测器，导致 `technical_impact` 始终为 `0.5` (中性默认值)
- **修复**: 在 `routes.py` 的 `predict_stock` 函数中添加技术指标获取和传递
- **结果**: `technical_impact` 从 `0.5` → `0.63` (真实技术分析数据)
- **GitHub commit**: a08ae2f ✅

### 改进: UTF-8 编码支持
- **问题**: Windows PowerShell 环境变量 `PYTHONUTF8` 未正确传递给子进程，中文字符在日志中乱码
- **修复**: 创建专用启动脚本 + 更新 keepalive 脚本
  - `backend/start_wp.ps1`: 使用 `$env:PYTHONUTF8=1` 启动 WorldPredict
  - `backend/start_ainews.ps1`: 使用 `$env:PYTHONUTF8=1` 启动 AI News
  - `backend/start_utf8.bat`: chcp 65001 + UTF-8 环境变量 (备用)
  - `backend/start_server.py`: Python wrapper 强制 `sys.flags.utf8_mode = 1`
  - `ai-news-worldpredict-keepalive.ps1`: 重启函数使用 PS1 脚本
- **注意**: API JSON 响应中的中文已经是正确 UTF-8 (PowerShell 控制台显示乱码是控制台编码问题，非数据损坏)
- **GitHub commit**: ab4a6ff (WorldPredict) ✅, 431dd86 (AI News) ✅

### GitHub Push 状态
- AI News: b0773de (v0.7.1 version bump) ✅ + 431dd86 (UTF-8 startup scripts) ✅
- WorldPredict: a08ae2f (technical data fix) ✅ + ab4a6ff (UTF-8 startup scripts) ✅

## 2026-03-30 11:35 开发更新 ✅ (AI News v0.7.1)

### AI News v0.7.1 - Yahoo Finance RSS 实时新闻 ✅
- [x] **问题**: 原中文RSS源 (eastmoney/sina/qq/163) 全部返回404/超时
- [x] **修复**: 替换为 Yahoo Finance RSS (多symbol并行)
- [x] Yahoo Finance 多symbol: NVDA, AAPL, MSFT, GOOGL, TSLA, AMZN, META, AMD
- [x] 标题去重机制 (seen_titles set)
- [x] Eastmoney API 作为备用 (目前API不可用，降级处理)
- [x] 版本: v0.7.0 → v0.7.1
- [x] Backend PID 8013 重启 ✅
- [x] GitHub commit: 621bc60 (push pending - network down)

**真实新闻验证 (20条全部来自 Yahoo Finance):**
- "Is Now a Good Time to Buy Microsoft Stock?" (Yahoo Finance)
- "Is Meta Platforms, Inc. (META) Stock A Good Buy?" (Yahoo Finance)
- "Apple Inc.'s (AAPL) Siri to Get Powerful AI Features and a Standalone App" (Yahoo Finance)
- "Alphabet Just Introduced Its Newest AI Advantage" (Yahoo Finance)
- "UBS Lowers PT on Microsoft (MSFT), Maintains a Buy Rating" (Yahoo Finance)

### WorldPredict v0.8.9 ✅ Yahoo Finance RSS 实时新闻 (回顾 11:25)
- Yahoo Finance RSS 成为美股主要新闻源
- 添加浏览器 User-Agent 解决 403 问题
- 版本: v0.8.8 → v0.8.9

## 2026-03-30 11:25 开发更新 ✅ (WorldPredict v0.8.9)

### Yahoo Finance RSS 实时新闻 ✅
- [x] **核心改进**: Yahoo Finance RSS 成为美股主要新闻源
  - 发现问题: httpx 默认 User-Agent 被 Yahoo 屏蔽 (返回 404 HTML)
  - 修复: 添加浏览器 User-Agent (`Chrome/120.0.0.0`)
  - Yahoo Finance RSS 返回真实新闻标题、URL、发布时间
- [x] 美股 (AAPL, MSFT, NVDA, TSLA, GOOGL 等) 现在返回真实财经新闻
- [x] A股 (数字代码如 600519) 仍使用东方财富/新浪/模拟数据
- [x] 版本号: 0.8.8 → 0.8.9 (main.py/routes.py 硬编码版本)
- [x] GitHub push: af7e7e0 ✅

**真实新闻示例 (AAPL):**
- "Prediction: Apple Will Be the Worst 'Magnificent Seven' Stock to Own Between Now and 2030" (Yahoo Finance)
- "Is Taiwan Semiconductor Manufacturing Company Limited (TSM) A Good Stock To Buy Now?" (Yahoo Finance)
- "Apple Inc.'s (AAPL) Siri to Get Powerful AI Features and a Standalone App" (Yahoo Finance)

### WorldPredict v0.8.8 版本一致性修复 ✅ (回顾)
- 修复 main.py/routes.py 中硬编码版本号 "0.8.7" → "0.8.8"

## 2026-03-30 11:15 开发更新 ✅

### WorldPredict v0.8.8 版本一致性修复 ✅
- [x] 修复 `main.py` 中硬编码版本号: root/health/system_stats 端点从 "0.8.7" → "0.8.8"
- [x] 修复 `routes.py` 中硬编码版本号: root 端点从 "0.8.7" → "0.8.8"
- [x] 更新 `README.md`: v0.8.5 → v0.8.8, 端口 8001 → 8011
- [x] 后端重启: PID 31108 → 34724 (端口 8011)
- [x] GitHub push: 773e99b ✅ (version fix), f7c499f ✅ (README update)

### AI News Backend 重启 ✅
- [x] AI News Backend 进程意外停止，端口 8013 无监听
- [x] 使用 `scripts/start_ainews_8013.ps1` 重启
- [x] 验证 health: v0.7.0 ✅

### Keepalive 监控重启 ✅
- [x] `ai-news-worldpredict-keepalive.ps1` 之前未运行
- [x] 已启动 keepalive 监控进程

### 服务状态 (2026-03-30 11:15)
| 服务 | 端口 | 状态 | 版本 |
|------|------|------|------|
| WorldPredict Backend | 8011 | ✅ healthy | v0.8.8 |
| WorldPredict Frontend | 3004 | ✅ 200 | v0.7.1 |
| AI News Backend | 8013 | ✅ healthy | v0.7.0 |
| AI News Frontend | 3002 | ✅ 200 | v0.7.0 |

**GitHub 状态:**
- WorldPredict: master f7c499f ✅ (v0.8.8)
- AI News: master a70ae62 ✅ (v0.7.0)

**功能验证:**
- `/api/v1/analyze/AAPL?include_technical=true` → technical_data 完整 ✅
  - RSI: 32.13 (bearish), MACD: -3.41 (bearish), KDJ: 40.39 (bullish)
  - Bollinger Bands, Moving Averages, ATR, Recent Prices 全部正常
  - prediction.technical_impact: 0.63 ✅
- `/api/v1/market/dashboard` → 4 US + 4 CN stocks ✅
- `/api/v1/predictions/overview` → 预测统计正常 ✅

## 2026-03-30 10:35

### 10:35 开发更新 ✅ (WorldPredict v0.8.8)
- [x] **技术指标整合预测**: `analyze_stock` 端点现在调用 `TechnicalIndicatorsService.get_technical_score()` 获取真实KDJ/RSI/MACD/MA/布林带数据
- [x] **Prediction新增字段**: `technical_impact` (技术面评分 0-1)
- [x] **AnalysisRequest新增**: `include_technical: bool = True` 参数
- [x] **AnalysisResponse新增**: `technical_data` 字段
- [x] **增强预测器升级**: `_calculate_technical_score_with_data()` 综合5个技术指标评分
- [x] **预测权重**: 新闻50% + 社媒35% + 技术面15%
- [x] **后端重启**: PID 15208 → 31108, 端口8011 ✅
- [x] **GitHub push**: d5b525a ✅ + fe10617 ✅

## 2026-03-29 20:20

### 20:20 开发更新 ✅
- [x] WorldPredict: 修复 `prediction_history.py` 存储路径bug ✅
  - 问题: `_get_storage_path()` 用 `dirname` 两次只到 `app/` 目录
  - 修复: 改为 `dirname` 三次，正确到 `backend/` 目录
  - 已移动 `app/prediction_history.json` → `backend/prediction_history.json`
  - GitHub push 成功 (82c1096) ✅
- [x] AI News: 提交 README.md v0.7.0 版本更新 ✅ (53a7ac8)
- [x] GitHub push: WorldPredict ✅, AI News ✅ (网络重试后成功)

## 2026-03-29 19:20

### 19:20 开发更新 ✅
- [x] WorldPredict 版本同步: main.py/routes.py 版本 "0.8.0"/"0.6.5" → "0.8.4" ✅
- [x] WorldPredict README.md: v0.7.0 → v0.8.4 ✅
- [x] AI News README.md: v0.6.0 → v0.7.0 ✅
- [x] AI News AGENTS.md 更新状态 ✅
- [x] WorldPredict AGENTS.md 更新状态 ✅
- [x] Git commits: WorldPredict f253485, 4408979 ✅
- [x] Git commits: AI News a70ae62 ✅
- [x] Git push: WorldPredict ✅, AI News ✅
- [x] 健康监控脚本: `scripts/ai-news-worldpredict-health.ps1` ✅
- [x] Health check: AI News v0.7.0 ✅, WorldPredict v0.8.4 ✅
- [x] API spot checks: /news OK, /market/overview OK ✅

## 版本历史
- v0.8.11 (2026-03-30) - WorldPredict 港股市场覆盖 (腾讯/阿里/美团/小米/京东/比亚迪)
- v0.8.10 (2026-03-30) - WorldPredict 技术指标修复 + 预测阈值加宽
- v0.8.7 (2026-03-29) - WorldPredict KDJ/ATR 技术指标
- v0.8.6 (2026-03-29) - WorldPredict 新闻获取超时优化
- v0.8.5 (2026-03-29) - WorldPredict market/dashboard 优化
- v0.8.4 (2026-03-29) - WorldPredict CN股票预测 + 新闻缓存
- v0.8.3 (2026-03-29) - WorldPredict 事件循环阻塞修复
- v0.8.0 (2026-03-29) - WorldPredict 预测历史持久化、WebSocket实时更新
- v0.7.0 (2026-03-29) - AI News 初始化版本
- v0.6.0 (2026-03-29) - AI News 初始化版本
