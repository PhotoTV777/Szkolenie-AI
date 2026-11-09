param([string]$Base = "http://localhost:3000")
$fail = 0

function Test-Get($path, $expectStatus = 200) {
  try {
    $r = Invoke-WebRequest -Uri "$Base$path" -UseBasicParsing
    if ($r.StatusCode -ne $expectStatus) { Write-Host "FAIL $path status $($r.StatusCode)"; return $false }
    return $true
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -eq $expectStatus) { return $true }
    Write-Host "FAIL $path $($_.Exception.Message)"
    return $false
  }
}

function Test-PostJson($path, $body, $expectStatus) {
  try {
    Invoke-WebRequest -Uri "$Base$path" -Method Post -Body $body -ContentType "application/json" -UseBasicParsing | Out-Null
    return $expectStatus -eq 200 -or $expectStatus -eq 201
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
  if ($code -eq $expectStatus) { return $true }
    Write-Host "FAIL POST $path expected $expectStatus got $code"
    return $false
  }
}

if (-not (Test-Get "/api/health")) { $fail++ }
if (-not (Test-Get "/api/rooms")) { $fail++ }
if (-not (Test-Get "/api/rooms/1")) { $fail++ }
if (-not (Test-Get "/api/rooms/999" 404)) { $fail++ }
if (-not (Test-Get "/api/nie-ma" 404)) { $fail++ }
if (-not (Test-Get "/api/rooms/1/reservations?from=2026-11-09&to=2026-11-15")) { $fail++ }

$ok = '{"date":"2030-01-15","time_start":"08:00","time_end":"09:00","purpose":"Smoke","person_name":"Test"}'
if (-not (Test-PostJson "/api/rooms/1/reservations" $ok 201)) { $fail++ }
$conflict = '{"date":"2026-11-10","time_start":"11:00","time_end":"13:00","purpose":"X","person_name":"Y"}'
if (-not (Test-PostJson "/api/rooms/1/reservations" $conflict 409)) { $fail++ }

if ($fail -eq 0) { Write-Host "SMOKE OK ($Base)"; exit 0 }
Write-Host "SMOKE FAILED: $fail test(s)"
exit 1
