$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Set-Location -LiteralPath $project
$stationPath=Join-Path $project 'runtime/remote-worker/station.json'
if (!(Test-Path -LiteralPath $stationPath)) { throw 'Prepare this dedicated remote station first.' }
$station=Get-Content -LiteralPath $stationPath -Raw | ConvertFrom-Json
if ($station.isolation -ne 'remote-vm' -or $station.dedicated -ne $true -or $station.userName -ne $env:USERNAME) { throw 'Wrong station account.' }
try { $running=Invoke-RestMethod -Uri 'http://127.0.0.1:4317/api/health' -TimeoutSec 2 } catch { $running=$null }
if ($running) { throw 'An observer backend is already running on port 4317; do not create another session.' }
$env:EXHIBIT_DESKTOP='windows'
$env:EXHIBIT_OBSERVATION_PROFILE='1'
$env:EXHIBIT_WINDOWS_URL='http://127.0.0.1:4320'
$env:EXHIBIT_WINDOWS_TOKEN_FILE=Join-Path $project 'runtime/remote-worker/worker-token.txt'
$env:EXHIBIT_STOP_FILE=Join-Path $project 'runtime/remote-worker/stop-backend'
$env:RUNTIME_DIR=Join-Path $project 'runtime'
$env:RECORDER_REPOSITORY='SpecimenArchive/Specimen-Archive'
$env:RECORDER_ENABLED='0'
$publisherPath=Join-Path $env:ProgramData 'SpecimenArchivePublisher/publisher.json'
if(Test-Path -LiteralPath $publisherPath){$env:SPECIMEN_PUBLISHER_CONFIG=$publisherPath}
$env:PORT='4317'
$env:EXHIBIT_OBSERVER_ORIGINS='http://127.0.0.1:4319,http://localhost:4319'
if (Test-Path -LiteralPath $env:EXHIBIT_STOP_FILE) { Remove-Item -LiteralPath $env:EXHIBIT_STOP_FILE }
& "$PSScriptRoot/run-station-node.ps1" -Role backend -NodeArguments @('--env-file-if-exists=.env','--import','tsx','server/index.ts','--production')
exit $LASTEXITCODE
