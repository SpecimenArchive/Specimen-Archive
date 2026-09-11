$ErrorActionPreference='Stop'
$privateRoot=Join-Path $env:LOCALAPPDATA 'SpecimenArchive'
New-Item -ItemType Directory -Path $privateRoot -Force | Out-Null
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls.exe $privateRoot /inheritance:r /grant:r "*$($sid):(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not protect the private connection folder.' }
$address=Read-Host 'Primary IP address'
$userName=Read-Host 'Server username'
$portText=Read-Host 'Remote Desktop port supplied by By-Hoster (Enter for 3389)'
if (!$portText) { $portText='3389' }
$portNumber=0
if ($address -notmatch '^[A-Za-z0-9][A-Za-z0-9.:-]*$' -or $userName -match '[\r\n]' -or !$userName -or ![int]::TryParse($portText,[ref]$portNumber) -or $portNumber -lt 1 -or $portNumber -gt 65535) { throw 'Enter a plain IP/hostname, username and numeric port.' }
$configPath=Join-Path $privateRoot 'connection.json'
$existing=@{}
if (Test-Path -LiteralPath $configPath) {
  $old=Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
  foreach ($property in $old.PSObject.Properties) { $existing[$property.Name]=$property.Value }
  if ($existing.address -and $existing.address -ne $address) { throw 'A different saved server exists. Preserve its keys; edit connection.json privately before changing the server.' }
}
$existing.provider='By-Hoster';$existing.address=$address;$existing.userName=$userName;$existing.rdpPort=$portNumber;$existing.passwordStored=$false
if (!$existing.access) { $existing.access='rdp-only' }
if (!$existing.sshPort) { $existing.sshPort=22 }
if (!$existing.remoteProject) { $existing.remoteProject='C:/SpecimenArchive' }
[IO.File]::WriteAllText($configPath,($existing|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
$rdpPath=Join-Path $privateRoot 'By-Hoster.rdp'
$target=if ($address.Contains(':')) { "[$address]:$portNumber" } else { "${address}:$portNumber" }
$rdp=@"
full address:s:$target
username:s:$userName
prompt for credentials:i:1
authentication level:i:2
enablecredsspsupport:i:1
redirectclipboard:i:1
redirectprinters:i:0
audiocapturemode:i:0
screen mode id:i:2
"@
[IO.File]::WriteAllText($rdpPath,$rdp,[Text.Encoding]::Unicode)
Write-Host 'The Windows login box will open. Paste the server password THERE, then connect.'
Write-Host 'No password is requested in this console or saved in the connection files.'
Start-Process -FilePath (Join-Path $env:WINDIR 'System32/mstsc.exe') -ArgumentList ('"'+$rdpPath+'"')
