# App Dev Status

## 当前版本 (2026-03-30 12:30 GMT+8)

### AI News
- **Backend**: v0.7.2 (port 8002) ✅
  - **v0.7.2**: Vite proxy 修复（/api → localhost:8002，原错误指向8013）
  - **v0.7.1**: Yahoo Finance RSS 实时新闻
  - GitHub: 824a03f (proxy), 287e634 (version bump) ✅
- **Frontend**: v0.7.2 (port 3002) ✅ (proxy 修复后)

### WorldPredict
- **Backend**: v0.8.10 (port 8011) ✅
  - **v0.8.10**: market/dashboard 添加技术指标数据 + 预测阈值加宽减少假阳性
  - **v0.8.9**: /predict/{symbol} 技术指标修复 + UTF-8 启动脚本
  - GitHub: 1f3068d (dashboard+tech), 21bd36d (threshold) ✅
- **Frontend**: v0.7.1 (port 3004) ✅

### 服务状态
```
AINews:OK(8002), WPBack:OK(8011), WPFront:3004 OK, AINewsFront:3002 OK
```
(keepalive 每 30s 检查，#76 最新检查)

### 关键文件
- keepalive: ai-news-worldpredict-keepalive.ps1
- dev log: ai-news-dev-log.md
