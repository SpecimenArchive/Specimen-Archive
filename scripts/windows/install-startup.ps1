$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$station=Get-Content -LiteralPath (Join-Path $project 'runtime/remote-worker/station.json') -Raw | ConvertFrom-Json
if ($station.isolation -ne 'remote-vm' -or $station.userSid -ne [Security.Principal.WindowsIdentity]::GetCurrent().User.Value) { throw 'Install startup only in the configured dedicated VM account.' }
$identity=[Security.Principal.WindowsIdentity]::GetCurrent().Name
$principal=New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
$trigger=New-ScheduledTaskTrigger -AtLogOn -User $identity
$settings=New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
foreach ($entry in @(@{Name='SpecimenArchive-Worker';Script='start-worker.ps1'},@{Name='SpecimenArchive-Backend';Script='start-backend.ps1'})) {
  if (Get-ScheduledTask -TaskName $entry.Name -ErrorAction SilentlyContinue) { throw "Task $($entry.Name) already exists; inspect before replacing it." }
  $scriptPath=Join-Path $PSScriptRoot $entry.Script
  $action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`"" -WorkingDirectory $project
  Register-ScheduledTask -TaskName $entry.Name -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Dedicated Specimen Archive VM; requires a logged-on interactive display. No home-PC service dependency.' | Out-Null
}
Start-ScheduledTask -TaskName 'SpecimenArchive-Worker'
Start-ScheduledTask -TaskName 'SpecimenArchive-Backend'
Write-Output 'Both services run on the VM. Logon startup and failure restart are configured. Reboot still requires this account to log on; no password or automatic logon was configured.'
