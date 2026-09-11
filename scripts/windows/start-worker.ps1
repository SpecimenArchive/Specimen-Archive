$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
Set-Location -LiteralPath $project
$env:SPECIMEN_REMOTE_CONFIG=Join-Path $project 'runtime/remote-worker/station.json'
if (!(Test-Path -LiteralPath $env:SPECIMEN_REMOTE_CONFIG)) { throw 'Prepare the dedicated remote VM first; see docs/WINDOWS_STATION.md.' }
& "$PSScriptRoot/run-station-node.ps1" -Role worker -NodeArguments @('--import','tsx','scripts/windows/remote-worker.ts')
exit $LASTEXITCODE
