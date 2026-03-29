# AI News + WorldPredict 开发状态

## 服务状态 (2026-03-29 21:25 GMT+8)

### WorldPredict
- **版本**: v0.8.5
- **后端**: ✅ localhost:8001 (健康)
- **前端**: ✅ localhost:3004 (已重启，代理修复)
- **WebSocket**: ✅ 支持
- **Git分支**: master

### AI News  
- **版本**: v0.7.0
- **后端**: ✅ localhost:8013 (健康)
- **前端**: ✅ localhost:3002 (API URL修复)
- **Git分支**: main

---

## 最近修复 (2026-03-29)

### 🔴 严重Bug修复
1. **WorldPredict前端代理配置错误** (frontend/vite.config.ts)
   - 症状: 502 Bad Gateway，API请求全部失败
   - 原因: proxy target指向了`localhost:8011`(AI News端口)，而非`localhost:8001`(WorldPredict端口)
   - 修复: 更新target为`http://localhost:8001`

2. **AI News前端API URL硬编码错误** (frontend/src/services/api.ts)
   - 症状: 前端API请求指向不存在的`localhost:8002`
   - 原因: `API_BASE_URL`默认值硬编码为`http://localhost:8002/api/v1`
   - 修复: 改为相对路径`/api/v1`，由Vite代理转发

3. **AI News后端版本号错误** (backend/app/api/routes.py)
   - API root返回`version: 0.6.0`，与实际版本v0.7.0不符
   - 修复: 更新为`0.7.0`

4. **AI News后端endpoint文档错误** (backend/app/api/routes.py)
   - 文档声称有`/news/trending`端点但实际不存在
   - 修复: 移除不存在的端点，补充实际存在的端点

5. **WorldPredict后端版本号不一致** (backend/app/api/routes.py)
   - routes.py版本为`0.8.4`，与main.py的`0.8.5`不一致
   - 修复: 统一为`0.8.5`

---

## 功能概览

### WorldPredict (v0.8.5)
- 📊 市场概览 / 指数行情 (A股 + 美股)
- 📈 Top Movers 涨跌幅排行
- 🔍 股票搜索 (A股 + 美股)
- 📉 股票技术指标分析 (RSI/MACD/布林带/均线)
- 🎯 智能选股器 (10种预设策略)
- 💹 股票预测 (增强版多平台社媒情绪分析)
- 🤖 MiniMax AI 增强分析
- ⭐ 自选股管理 + 实时行情
- 🔔 价格预警系统
- 💼 持仓P&L追踪
- 📊 投资组合回测系统
- 📜 预测历史 + 准确度评估
- 🔄 WebSocket 实时推送

### AI News (v0.7.0)
- 📰 AI/科技新闻聚合 (多个来源)
- 🏷️ 新闻分类 + 搜索
- 🔥 热门话题追踪
- 🤖 AI新闻摘要生成
- 📊 用户阅读统计
- 👍/👎 新闻反馈系统
- 🔄 新闻去重 (n-gram相似度)
- 👤 用户认证 + 个性化推荐

---

## 待办事项

### 高优先级
- [ ] 解决A股/美股实时行情API网络不通问题(腾讯/东财API)
- [ ] AI News前端Trending页面样式优化

### 中优先级
- [ ] WorldPredict添加更多技术指标(如KDJ, ATR)
- [ ] AI News添加更多新闻来源
- [ ] WorldPredict Dashboard添加最近预测概览

### 低优先级
- [ ] WorldPredict添加移动端适配
- [ ] AI News添加邮件推送功能
