# PowerShell script to sync internal metadata (Local only)
$filePath = ".internal_data/notes.md"
$backupDir = ".internal_data/backups"
$intervalSeconds = 300 # 5 minutes

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

Write-Host "Internal metadata sync started." -ForegroundColor Cyan

while ($true) {
    if (Test-Path $filePath) {
        $lastUpdate = Get-Item $filePath | Select-Object -ExpandProperty LastWriteTime
        
        # Check if the file was modified in the last interval
        if ($lastUpdate -gt (Get-Date).AddSeconds(-$intervalSeconds)) {
            $ts = Get-Date -Format "yyyyMMdd_HHmm"
            $backupPath = Join-Path (Join-Path (Get-Location).Path $backupDir) "notes_$ts.md.bak"
            [System.IO.File]::Copy((Join-Path (Get-Location).Path $filePath), $backupPath, $true)
            # Keep only last 10 backups
            $backups = Get-ChildItem $backupDir | Sort-Object LastWriteTime -Descending
            if ($backups.Count -gt 10) {
                $backups | Select-Object -Skip 10 | Remove-Item -Force
            }
        }
    }
    Start-Sleep -Seconds $intervalSeconds
}
