# AI News + WorldPredict Keep-Alive Monitor with Auto-Restart
$ErrorActionPreference = "SilentlyContinue"

$logFile = "$PSScriptRoot/keepalive.log"
$PYTHON = "C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe"
$NPM = "C:\Program Files\nodejs\npm.ps1"

Write-Host "=========================================="
Write-Host "AI News + WorldPredict Keep-Alive Monitor"
Write-Host "Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "=========================================="

function Get-AvailablePort {
    param([int]$startPort, [int]$maxAttempts = 10)
    for ($i = 0; $i -lt $maxAttempts; $i++) {
        $port = $startPort + $i
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if (-not $conn) { return $port }
    }
    return $startPort
}

function Find-NodePort {
    # Find any port that Vite is running on for the given directory
    param([string]$workingDir)
    $nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*nodejs*" }
    # Return a dynamic port for frontend (3002-3010)
    return $null  # Let Vite handle port allocation
}

# Run once and exit (for manual check)
if ($args[0] -eq "check") {
    $status = @()
    $allOk = $true
    
    # Check AI News Backend
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $status += "AINews:OK" } else { $status += "AINews:FAIL"; $allOk = $false }
    } catch { $status += "AINews:ERROR"; $allOk = $false }
    
    # Check WorldPredict Backend
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8001/" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $status += "WPBack:OK" } else { $status += "WPBack:FAIL"; $allOk = $false }
    } catch { $status += "WPBack:ERROR"; $allOk = $false }
    
    # Check any frontend port (3002-3010)
    $frontendOk = $false
    for ($p = 3002; $p -le 3010; $p++) {
        try {
            $r = Invoke-WebRequest -Uri "http://127.0.0.1:$p" -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -eq 200) { 
                $status += "Frontend:$p OK"
                $frontendOk = $true
                break
            }
        } catch { }
    }
    if (-not $frontendOk) { $status += "Frontend:ERROR"; $allOk = $false }
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMsg = "[$timestamp] $($status -join ', ')"
    
    if ($allOk) {
        Write-Host "$logMsg - OK"
    } else {
        Write-Host "$logMsg - WARNING!"
    }
    
    "$logMsg" | Out-File -FilePath $logFile -Append -Encoding UTF8
    exit 0
}

# Continuous monitoring loop
$loop = 0

while ($true) {
    $loop++
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $allOk = $true
    $status = @()
    $restartFlags = @{
        AINews = $false
        WPBack = $false
    }
    
    # Check AI News Backend
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8000/" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $status += "AINews:OK" } else { $status += "AINews:FAIL"; $allOk = $false; $restartFlags.AINews = $true }
    } catch { $status += "AINews:ERROR"; $allOk = $false; $restartFlags.AINews = $true }
    
    # Check WorldPredict Backend
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:8001/" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) { $status += "WPBack:OK" } else { $status += "WPBack:FAIL"; $allOk = $false; $restartFlags.WPBack = $true }
    } catch { $status += "WPBack:ERROR"; $allOk = $false; $restartFlags.WPBack = $true }
    
    # Check any frontend port (3002-3010)
    $frontendOk = $false
    for ($p = 3002; $p -le 3010; $p++) {
        try {
            $r = Invoke-WebRequest -Uri "http://127.0.0.1:$p" -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -eq 200) { 
                $status += "Frontend:$p OK"
                $frontendOk = $true
                break
            }
        } catch { }
    }
    if (-not $frontendOk) { $status += "Frontend:ERROR"; $allOk = $false }
    
    $logMsg = "[$timestamp] #$loop - $($status -join ', ')"
    
    if ($allOk) {
        Write-Host "$logMsg - OK"
    } else {
        Write-Host "$logMsg - WARNING! Restarting failed services..."
        
        # Restart failed services
        if ($restartFlags.AINews) {
            Write-Host "  Restarting AI News Backend..."
            Get-NetTCPConnection -LocalPort 8000 | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Seconds 1
            Start-Process -FilePath $PYTHON -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -WorkingDirectory "C:\Users\Administrator\.openclaw\workspace\ai-news\backend" -WindowStyle Hidden
        }
        
        if ($restartFlags.WPBack) {
            Write-Host "  Restarting WorldPredict Backend..."
            Get-NetTCPConnection -LocalPort 8001 | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
            Start-Sleep -Seconds 1
            Start-Process -FilePath $PYTHON -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload" -WorkingDirectory "C:\Users\Administrator\.openclaw\workspace\world-predict\backend" -WindowStyle Hidden
        }
        
        # Frontend restart - scan ports and kill node processes
        if (-not $frontendOk) {
            Write-Host "  Restarting Frontends..."
            for ($p = 3002; $p -le 3010; $p++) {
                Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
            }
            Start-Sleep -Seconds 1
            Start-Process -FilePath $NPM -ArgumentList "run dev" -WorkingDirectory "C:\Users\Administrator\.openclaw\workspace\ai-news\frontend" -WindowStyle Hidden
            Start-Process -FilePath $NPM -ArgumentList "run dev" -WorkingDirectory "C:\Users\Administrator\.openclaw\workspace\world-predict\frontend" -WindowStyle Hidden
        }
    }
    
    # Log to file
    "$logMsg" | Out-File -FilePath $logFile -Append -Encoding UTF8
    
    Start-Sleep -Seconds 60
}
