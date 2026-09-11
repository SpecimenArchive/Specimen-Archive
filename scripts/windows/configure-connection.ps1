$ErrorActionPreference='Stop'
# Run in the user's own PowerShell window. All answers remain outside Git.
$privateRoot=Join-Path $env:LOCALAPPDATA 'SpecimenArchive'
New-Item -ItemType Directory -Path $privateRoot -Force | Out-Null
$sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls.exe $privateRoot /inheritance:r /grant:r "*$($sid):(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not restrict the private connection folder.' }
$path=Join-Path $privateRoot 'connection.json'
if (Test-Path -LiteralPath $path) { throw "Connection already exists at $path. Edit it locally to correct details; the key is preserved." }
$address=Read-Host 'By-Hoster server IP or hostname (no http:// prefix)'
$userName=Read-Host 'Windows login username supplied by By-Hoster'
if ($address -notmatch '^[A-Za-z0-9][A-Za-z0-9.:-]*$' -or $userName -notmatch '^[A-Za-z0-9_][A-Za-z0-9_.\\-]*$') { throw 'Use a plain server address and Windows username.' }
$key=Join-Path $privateRoot 'vm_ed25519'
if (!(Test-Path -LiteralPath $key)) {
  Write-Host 'Create the dedicated SSH key. Any passphrase is entered locally, never in chat.'
  Write-Host 'For unattended agent access, an empty passphrase is supported; this dedicated key is protected by the folder ACL.'
  & ssh-keygen.exe -t ed25519 -f $key -C 'SpecimenArchive dedicated By-Hoster access'
  if ($LASTEXITCODE -ne 0) { throw 'SSH key creation failed.' }
}
$configuration=@{provider='By-Hoster';address=$address;userName=$userName;sshPort=22;identityFile=$key;knownHostsFile=(Join-Path $privateRoot 'known_hosts');remoteProject='C:/SpecimenArchive';access='ssh-key';passwordStored=$false}
[IO.File]::WriteAllText($path,($configuration|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
$publicKey=(Get-Content -LiteralPath "$key.pub" -Raw).Trim()
$bootstrap=@'
$ErrorActionPreference='Stop'
$admin=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (!$admin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Run this on the By-Hoster VM in PowerShell as Administrator.' }
$os=Get-CimInstance Win32_OperatingSystem
if ($os.ProductType -ne 1 -or [int]$os.BuildNumber -lt 22000) { throw 'Expected Windows 11 client.' }
$capability=Get-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0'
if ($capability.State -ne 'Installed') { Add-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0' | Out-Null }
Set-Service -Name sshd -StartupType Automatic
Start-Service sshd
if (!(Get-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH SSH Server' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 | Out-Null }
$authorized=Join-Path $env:ProgramData 'ssh/administrators_authorized_keys'
$keyLine='__PUBLIC_KEY__'
if (!(Test-Path -LiteralPath $authorized) -or !(Get-Content -LiteralPath $authorized | Where-Object { $_ -eq $keyLine })) { Add-Content -LiteralPath $authorized -Value $keyLine -Encoding ascii }
& icacls.exe $authorized /inheritance:r /grant:r '*S-1-5-18:F' '*S-1-5-32-544:F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'SSH authorized-key ACL setup failed.' }
Write-Host 'SSH enabled. Server host-key fingerprint (compare on the first SSH connection):'
& ssh-keygen.exe -lf "$env:ProgramData/ssh/ssh_host_ed25519_key.pub"
Write-Host 'Keep this VM session open until the project station has been installed.'
'@
$bootstrap=$bootstrap.Replace('__PUBLIC_KEY__',$publicKey)
[IO.File]::WriteAllText((Join-Path $privateRoot 'enable-vm-ssh.ps1'),$bootstrap,[Text.UTF8Encoding]::new($false))
$connect=@'
$ErrorActionPreference='Stop'
$c=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'connection.json') -Raw | ConvertFrom-Json
& ssh.exe -i $c.identityFile -p $c.sshPort -o "UserKnownHostsFile=$($c.knownHostsFile)" -o StrictHostKeyChecking=ask -l $c.userName $c.address
'@
[IO.File]::WriteAllText((Join-Path $privateRoot 'connect.ps1'),$connect,[Text.UTF8Encoding]::new($false))
Write-Host "Private connection saved: $path"
Write-Host "Copy $privateRoot\enable-vm-ssh.ps1 to the VM using Remote Desktop, then run it there in an Administrator PowerShell. It contains only the PUBLIC key."
Write-Host "Then run $privateRoot\connect.ps1 locally. Compare the shown host-key fingerprint with the VM before accepting it. Type exit after successful login."
Write-Host 'Tell Codex connection setup is ready. Do not send the password or private key.'
