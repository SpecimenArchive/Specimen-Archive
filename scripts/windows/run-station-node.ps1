param(
  [Parameter(Mandatory=$true)][ValidateSet('worker','backend')][string]$Role,
  [Parameter(Mandatory=$true)][string[]]$NodeArguments
)
$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$station=Get-Content -LiteralPath (Join-Path $project 'runtime/remote-worker/station.json') -Raw | ConvertFrom-Json
if($station.isolation -ne 'remote-vm' -or $station.dedicated -ne $true -or $station.userSid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value){throw 'Wrong dedicated station identity.'}
# Scheduled tasks may inherit an environment predating the Node installation.
$env:Path=[Environment]::GetEnvironmentVariable('Path','Machine')+';'+[Environment]::GetEnvironmentVariable('Path','User')
$node=(Get-Command node.exe -ErrorAction Stop).Source
$logs=Join-Path $project 'runtime/remote-worker/logs'
New-Item -ItemType Directory -Path $logs -Force | Out-Null
$stdout=Join-Path $logs "$Role.stdout.log"
$stderr=Join-Path $logs "$Role.stderr.log"
foreach($log in @($stdout,$stderr)){
  # Keep the preceding invocation for recovery diagnosis; both paths are owned
  # files in the private station directory, not user-selected cleanup targets.
  if(Test-Path -LiteralPath $log){Move-Item -LiteralPath $log -Destination ($log+'.previous') -Force}
}
$child=Start-Process -FilePath $node -ArgumentList $NodeArguments -WorkingDirectory $project -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
$child.WaitForExit()
$child.Refresh()
exit $child.ExitCode
