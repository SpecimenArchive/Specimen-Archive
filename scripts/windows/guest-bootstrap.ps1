$ErrorActionPreference='Stop'
if ($env:USERNAME -ne 'WDAGUtilityAccount') { throw 'Refusing to configure or capture the everyday Windows desktop. Run only inside Windows Sandbox.' }
try {
  $config=Get-Content C:\SpecimenTools\station.json -Raw | ConvertFrom-Json
  $os=Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
  if ([int]$os.CurrentBuild -lt 22000) { throw 'Windows 11 is required for this station profile.' }
  # These settings apply only to the disposable guest account and its clock.
  Set-TimeZone -Id $config.timeZone
  New-Item -ItemType Directory -Force C:\SpecimenStation | Out-Null
  Copy-Item -LiteralPath C:\SpecimenTools\Chrome -Destination C:\SpecimenStation\Chrome -Recurse
  $desktop=[Environment]::GetFolderPath('Desktop')
  $shell=New-Object -ComObject WScript.Shell
  $shortcut=$shell.CreateShortcut((Join-Path $desktop 'Google Chrome.lnk'));$shortcut.TargetPath='C:\SpecimenStation\Chrome\chrome.exe';$shortcut.Arguments='--user-data-dir=C:\SpecimenStation\manual-profile';$shortcut.Save()
  $shortcut=$shell.CreateShortcut((Join-Path $desktop 'Station records.lnk'));$shortcut.TargetPath='C:\SpecimenExchange';$shortcut.Save()
  @"
Specimen Archive / isolated Windows workstation
Timezone: $($config.timeZone) (Europe/London, automatic daylight saving)
The clock is Windows' actual guest clock. No synthetic clock overlay is used.
The neural backend owns the controlled Chrome window; observer controls are separate.
Only project program files and the capture transport folder are mapped from the host.
"@ | Set-Content -Encoding UTF8 (Join-Path $desktop 'Station notes.txt')
  # Suppress guest-only notifications; no host settings or applications are touched.
  $notifications='HKCU:\Software\Microsoft\Windows\CurrentVersion\PushNotifications'
  New-Item $notifications -Force | Out-Null
  New-ItemProperty $notifications -Name ToastEnabled -Value 0 -PropertyType DWord -Force | Out-Null
  $env:SPECIMEN_SANDBOX_GUEST='1'
  & C:\SpecimenTools\node.exe C:\SpecimenTools\guest-agent.mjs
} catch { $_.Exception.Message | Set-Content -Encoding UTF8 C:\SpecimenExchange\startup-error.txt; throw }
