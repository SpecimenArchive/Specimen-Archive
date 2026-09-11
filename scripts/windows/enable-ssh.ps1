param([Parameter(Mandatory=$true)][string]$PublicKey)
$ErrorActionPreference='Stop'
$admin=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (!$admin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Open PowerShell as Administrator INSIDE the By-Hoster VM, then run this command there.' }
$os=Get-CimInstance Win32_OperatingSystem
if ($os.ProductType -ne 1 -or [int]$os.BuildNumber -lt 22000) { throw 'This station requires Windows 11 client.' }
if ($PublicKey -notmatch '^ssh-ed25519 [A-Za-z0-9+/]+={0,3}( [A-Za-z0-9 ._-]+)?$') { throw 'Expected the dedicated Ed25519 PUBLIC key, never a password or private key.' }
$capability=Get-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0'
if ($capability.State -ne 'Installed') {
  Write-Host 'Installing Windows OpenSSH. This may take a few minutes...'
  Add-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0' | Out-Null
}
Set-Service -Name sshd -StartupType Automatic
Start-Service sshd
if (!(Get-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -ErrorAction SilentlyContinue)) {
  New-NetFirewallRule -Name 'OpenSSH-Server-In-TCP' -DisplayName 'OpenSSH SSH Server' -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 | Out-Null
}
$authorized=Join-Path $env:ProgramData 'ssh/administrators_authorized_keys'
# Preserve any existing authorized keys. Only this public key is added.
if (!(Test-Path -LiteralPath $authorized) -or !(Get-Content -LiteralPath $authorized | Where-Object { $_.Trim() -eq $PublicKey.Trim() })) {
  Add-Content -LiteralPath $authorized -Value $PublicKey.Trim() -Encoding ascii
}
& icacls.exe $authorized /inheritance:r /grant:r '*S-1-5-18:F' '*S-1-5-32-544:F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'SSH authorized-key permissions could not be set.' }
$keygen=Join-Path $env:WINDIR 'System32/OpenSSH/ssh-keygen.exe'
$fingerprint=& $keygen -lf (Join-Path $env:ProgramData 'ssh/ssh_host_ed25519_key.pub')
if ($LASTEXITCODE -ne 0) { throw 'Unable to read the server public-key fingerprint.' }
Write-Host "Windows client build: $($os.BuildNumber)"
Write-Host "SSH_READY $fingerprint"
Write-Host 'Send Codex the SSH_READY line. It is a public fingerprint, not a password. Keep this VM session open for installation.'
