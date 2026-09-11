$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Set-Location -LiteralPath $project
$env:SPECIMEN_REMOTE_CONFIG=Join-Path $project 'runtime/remote-worker/station.json'
if (!(Test-Path -LiteralPath $env:SPECIMEN_REMOTE_CONFIG)) { throw 'Prepare the dedicated remote VM first; see docs/WINDOWS_STATION.md.' }
$station=Get-Content -LiteralPath $env:SPECIMEN_REMOTE_CONFIG -Raw | ConvertFrom-Json
if($station.isolation -ne 'remote-vm' -or $station.userSid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value){throw 'Wrong dedicated station identity.'}
$stopMarker=Join-Path $project 'runtime/remote-worker/stop-worker'
if(Test-Path -LiteralPath $stopMarker){Remove-Item -LiteralPath $stopMarker}
& "$PSScriptRoot/run-station-node.ps1" -Role worker -NodeArguments @('--import','tsx','scripts/windows/remote-worker.ts')
exit $LASTEXITCODE
