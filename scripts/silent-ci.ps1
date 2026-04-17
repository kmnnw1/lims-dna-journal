# PowerShell script for Silent Background CI (Agent Optimized)
$intervalSeconds = 120 # 2 minutes
$healthFile = ".internal_data/health.status"

Write-Host "🕵️ Silent Background Monitoring started (Shadow Architect mode)." -ForegroundColor Gray

while ($true) {
    # Run the error digest generator
    # Using tsx to run the typescript script directly
    try {
        npx tsx scripts/error-digest.ts | Out-Null
        "OK" | Out-File -FilePath $healthFile -Force
    } catch {
        "ERROR" | Out-File -FilePath $healthFile -Force
    }
    
    Start-Sleep -Seconds $intervalSeconds
}
