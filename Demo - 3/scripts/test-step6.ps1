$base = "http://localhost:3012/api/rooms/1/reservations"
$hdr = @{ "Content-Type" = "application/json" }

function Post-Res($body) {
  try {
    $r = Invoke-WebRequest -Uri $base -Method Post -Body $body -Headers $hdr -UseBasicParsing
    return $r.StatusCode
  } catch {
    return $_.Exception.Response.StatusCode.value__
  }
}

Write-Host "free slot:" (Post-Res '{"date":"2026-11-11","time_start":"08:00","time_end":"09:00","purpose":"T","person_name":"X"}')
Write-Host "bad times:" (Post-Res '{"date":"2026-11-11","time_start":"12:00","time_end":"10:00","purpose":"T","person_name":"X"}')
Write-Host "overlap:" (Post-Res '{"date":"2026-11-10","time_start":"11:00","time_end":"13:00","purpose":"T","person_name":"X"}')
Write-Host "touch end:" (Post-Res '{"date":"2026-11-10","time_start":"12:00","time_end":"14:00","purpose":"T","person_name":"X"}')
Write-Host "other day:" (Post-Res '{"date":"2026-11-15","time_start":"10:00","time_end":"12:00","purpose":"T","person_name":"X"}')
