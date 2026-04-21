# PowerShell script for Silent Background CI (Agent Optimized)
$intervalSeconds = 120 # 2 minutes
$healthFile = ".internal_data/health.status"

Write-Host "Background monitoring started (silent mode)." -ForegroundColor Gray

while ($true) {
    # Run the error digest generator
    # Using tsx to run the typescript script directly
    try {
        npx tsx scripts/github-status.ts | Out-Null
        npx tsx scripts/error-digest.ts | Out-Null
        [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $healthFile), "OK")
    } catch {
        [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $healthFile), "ERROR")
    }
    
    Start-Sleep -Seconds $intervalSeconds
}
