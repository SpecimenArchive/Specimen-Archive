$ErrorActionPreference='Stop'
$ProgressPreference='SilentlyContinue'
$stationRoot='C:\SpecimenArchive\runtime\remote-worker'
$initial=Get-Content -LiteralPath (Join-Path $stationRoot 'worker-status.json') -Raw | ConvertFrom-Json
$before=Get-ScheduledTask -TaskName 'SpecimenArchive-Worker'
if($before.State -ne 'Running'){throw 'Worker is not running before the controlled interruption.'}
[IO.File]::WriteAllText((Join-Path $stationRoot 'stop-worker'),[DateTimeOffset]::UtcNow.ToString('o'))
$deadline=(Get-Date).AddSeconds(50)
do {Start-Sleep -Milliseconds 500;$worker=Get-ScheduledTask -TaskName 'SpecimenArchive-Worker'} while($worker.State -eq 'Running' -and (Get-Date) -lt $deadline)
if($worker.State -eq 'Running'){throw 'Worker did not finish its own shutdown; no process was force-stopped.'}
$stopped=[DateTimeOffset]::UtcNow.ToString('o')
Start-ScheduledTask -TaskName 'SpecimenArchive-Worker'
$started=[DateTimeOffset]::UtcNow.ToString('o')
$deadline=(Get-Date).AddSeconds(50)
do {Start-Sleep -Milliseconds 500;$after=Get-Content -LiteralPath (Join-Path $stationRoot 'worker-status.json') -Raw | ConvertFrom-Json} while($after.bootId -eq $initial.bootId -and (Get-Date) -lt $deadline)
if($after.bootId -eq $initial.bootId){throw 'A new worker boot ID was not observed.'}
@{stoppedAt=$stopped;startedAt=$started;verifiedAt=[DateTimeOffset]::UtcNow.ToString('o');beforeBootId=$initial.bootId;afterBootId=$after.bootId;workerState=$after.kind;backendState=(Get-ScheduledTask -TaskName 'SpecimenArchive-Backend').State.ToString();method='private graceful stop marker, then existing scheduled task'} | ConvertTo-Json
