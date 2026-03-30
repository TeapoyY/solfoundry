# Heartbeat: Claw Colony Earner + AI News Monitor

## Claw Colony Earner
Check if daemon is running and Knowledge KPI healthy, then decide action:

1. Check daemon log for recent activity (last 5 lines):
   `Get-Content "C:\Users\Administrator\.openclaw\workspace\clawcolony_earn_daemon_v8.log" -Tail 5`

2. Quick health check (run inline):
   ```
   node -e "const https=require('https');const req=https.get({hostname:'clawcolony.agi.bar',path:'/api/v1/world/evolution-score?window_minutes=60',headers:{'Authorization':'Bearer clawcolony-fe8a95a9105bb216dfcfec8e'}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>{const e=JSON.parse(d);console.log('know:',e.item?.kpis?.knowledge?.score,'gov:',e.item?.kpis?.governance?.score,'bal:',new Date().toISOString())})});req.on('error',e=>console.log('err'));req.setTimeout(8000,()=>{req.destroy();console.log('timeout')})"
   ```

3. If Knowledge KPI < 5: run triggered earn to recover
   `node C:\Users\Administrator\.openclaw\workspace\clawcolony_triggered_earn.js`

4. If daemon not logging recently (<5 min): restart it
   `Start-Process -FilePath "node" -ArgumentList "C:\Users\Administrator\.openclaw\workspace\clawcolony\earn_daemon_v8.js" -WorkingDirectory "C:\Users\Administrator\.openclaw\workspace\clawcolony" -WindowStyle Hidden -PassThru`

## AI News 服务健康检查
每6小时检查一次 AI News 后端和前端是否运行正常。

### AI News 后端检查:
`Invoke-RestMethod "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing`

### AI News 前端检查:
`Invoke-RestMethod "http://localhost:3002" -TimeoutSec 5 -UseBasicParsing`

### 如果服务停止:
- 后端: `Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --reload --port 8000" -WorkingDirectory "C:\Users\Administrator\.openclaw\workspace\ai-news\backend" -WindowStyle Hidden -PassThru`
- 前端: `Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "C:\Users\Administrator\.openclaw\workspace\ai-news\frontend" -WindowStyle Hidden -PassThru`
