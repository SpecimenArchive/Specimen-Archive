$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$stationRoot=Join-Path $project 'runtime/remote-worker'
$station=Get-Content -LiteralPath (Join-Path $stationRoot 'station.json') -Raw | ConvertFrom-Json
if ($station.isolation -ne 'remote-vm' -or $station.userName -ne $env:USERNAME) { throw 'Wrong station account.' }
# Private filesystem request invokes the normal backend recording shutdown.
[IO.File]::WriteAllText((Join-Path $stationRoot 'stop-backend'),[DateTimeOffset]::UtcNow.ToString('o'))
$deadline=(Get-Date).AddSeconds(40)
do {
  try { $health=Invoke-RestMethod -Uri 'http://127.0.0.1:4317/api/health' -TimeoutSec 2 } catch { $health=$null }
  if (!$health) { break }
  Start-Sleep -Milliseconds 500
} while ((Get-Date) -lt $deadline)
if ($health) { throw 'Backend did not finish recording shutdown; inspect it before stopping tasks.' }
# The worker performs its own native/browser cleanup, including after an earlier
# backend crash. Do not force-stop a task and orphan its desktop children.
[IO.File]::WriteAllText((Join-Path $stationRoot 'stop-worker'),[DateTimeOffset]::UtcNow.ToString('o'))
Write-Output 'Backend finalized; graceful worker stop requested. Check worker-status.json for stopped. Restart with Start-ScheduledTask for Worker, then Backend.'
