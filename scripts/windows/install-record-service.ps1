$ErrorActionPreference='Stop'
$root='C:\ProgramData\SpecimenArchivePublisher'
$source='C:\SpecimenArchive\runtime\remote-worker'
if((Get-ScheduledTask -TaskName SpecimenArchive-Publisher -ErrorAction SilentlyContinue).State -eq 'Running'){
  [IO.File]::WriteAllText("$root\stop-publisher",[DateTimeOffset]::UtcNow.ToString('o'))
  $deadline=(Get-Date).AddMinutes(3)
  while((Get-ScheduledTask SpecimenArchive-Publisher).State -eq 'Running' -and (Get-Date) -lt $deadline){Start-Sleep -Milliseconds 500}
  if((Get-ScheduledTask SpecimenArchive-Publisher).State -eq 'Running'){throw 'Publisher has not finalized; do not replace its files during publication.'}
}
Copy-Item -LiteralPath "$source\record-service.mjs" -Destination "$root\record-service.mjs" -Force
Copy-Item -LiteralPath "$source\start-record-service.ps1" -Destination "$root\start-publisher.ps1" -Force
$c=Get-Content -LiteralPath "$root\publisher.json" -Raw | ConvertFrom-Json
$c.enabled=$true
$c | Add-Member -NotePropertyName branch -NotePropertyValue 'specimen-records' -Force
$c | Add-Member -NotePropertyName recordsRoot -NotePropertyValue 'C:/SpecimenArchive/runtime/exhibit-publications' -Force
$c | Add-Member -NotePropertyName statusDirectory -NotePropertyValue 'C:/SpecimenArchive/runtime/remote-worker' -Force
[IO.File]::WriteAllText("$root\publisher.json",($c | ConvertTo-Json))
# Publisher code and credentials share a SYSTEM-only DACL. No inherited admin,
# interactive station SID or browser process access is granted.
$acl=New-Object Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true,$false)
$system=New-Object Security.Principal.SecurityIdentifier('S-1-5-18')
$acl.SetOwner($system)
$rule=New-Object Security.AccessControl.FileSystemAccessRule($system,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
$acl.AddAccessRule($rule)
Set-Acl -LiteralPath $root -AclObject $acl
Get-ChildItem -LiteralPath $root -Recurse -Force | ForEach-Object {
  if($_.PSIsContainer){$child=New-Object Security.AccessControl.DirectorySecurity}else{$child=New-Object Security.AccessControl.FileSecurity}
  $child.SetAccessRuleProtection($false,$false);$child.SetOwner($system);Set-Acl -LiteralPath $_.FullName -AclObject $child
}
$action=New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File C:\ProgramData\SpecimenArchivePublisher\start-publisher.ps1'
$principal=New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings=New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -StartWhenAvailable
$trigger=New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName SpecimenArchive-Publisher -Action $action -Principal $principal -Settings $settings -Trigger $trigger -Force | Out-Null
Start-ScheduledTask SpecimenArchive-Publisher
'Isolated publisher installed.' | Set-Content "$source\publisher-installed.txt"
