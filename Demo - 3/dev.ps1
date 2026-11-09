# Uruchomienie lokalnego serwera developerskiego (auto-restart przy zmianach w kodzie).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Brak node_modules — npm install..."
    npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "Env:$name" -Value $value
        }
    }
} elseif (-not $env:PORT) {
    $env:PORT = "3000"
}

$port = if ($env:PORT) { $env:PORT } else { "3000" }
Write-Host ""
Write-Host "  Rezerwacja sal — tryb dev" -ForegroundColor Cyan
Write-Host "  http://localhost:$port"
Write-Host "  API health: http://localhost:$port/api/health"
Write-Host "  Ctrl+C aby zatrzymać"
Write-Host ""

npm run dev
