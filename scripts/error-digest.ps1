# scripts/error-digest.ps1
$ErrorActionPreference = "Continue"

# Fix terminal encoding for output stability
chcp 65001 >$null
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "`n[QA] Running Project Analysis (Biome + TSC)..." -ForegroundColor Cyan

# Run tools and capture output
Write-Host "  -> Analyzing Biome..." -ForegroundColor Gray
$biomeRes = npx biome check . 2>&1

Write-Host "  -> Analyzing TypeScript..." -ForegroundColor Gray
$tscRes = npx tsc --noEmit 2>&1

$errList = @()

# Filter Biome results
foreach ($l in $biomeRes) {
    if ($l -match "error" -or $l -match "warning" -or $l -match "тЬЦ" -or $l -match "тЪа") {
        $errList += "[BIOME] $l"
    }
}

# Filter TSC results
foreach ($l in $tscRes) {
    if ($l -match "error TS\d+:") {
        $errList += "[TSC] $l"
    }
}

if ($errList.Count -gt 0) {
    $now = Get-Date -Format 'HH:mm:ss'
    # Keeping report simple to avoid parser issues
    $header = "--- ERROR REPORT (" + $errList.Count + " issues) [" + $now + "] ---"
    $report = "$header`n`n"
    $report += ($errList -join "`n")
    $report += "`n`n--- END OF REPORT ---"
    
    # Copy to clipboard
    $report | Set-Clipboard
    
    Write-Host "`n[!] Found $($errList.Count) problems." -ForegroundColor Red
    Write-Host "[*] Full report copied to clipboard." -ForegroundColor Yellow
} else {
    Write-Host "`n[+] No problems found. Project is clean." -ForegroundColor Green
}

Write-Host ""
