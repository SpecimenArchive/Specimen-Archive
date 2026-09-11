param(
  [Parameter(Mandatory=$true)][string]$PublicKey,
  [ValidateSet('WindowsUpdate','DirectMsi')][string]$InstallSource='WindowsUpdate'
)
$ErrorActionPreference='Stop'
$admin=New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (!$admin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'Open PowerShell as Administrator INSIDE the By-Hoster VM, then run this command there.' }
$os=Get-CimInstance Win32_OperatingSystem
if ($os.ProductType -ne 1 -or [int]$os.BuildNumber -lt 22000) { throw 'This station requires Windows 11 client.' }
if ($PublicKey -notmatch '^ssh-ed25519 [A-Za-z0-9+/]+={0,3}( [A-Za-z0-9 ._-]+)?$') { throw 'Expected the dedicated Ed25519 PUBLIC key, never a password or private key.' }
if ($InstallSource -eq 'DirectMsi') {
  # The earlier copy-and-paste command uses this exact temporary filename.
  # Do not race its Windows capability install with an MSI install of sshd.
  $oldSetup=@(Get-CimInstance Win32_Process -Filter "Name='powershell.exe'" | Where-Object {
    $_.ProcessId -ne $PID -and $_.CommandLine -match '(?i)-File\s+"?[^"\r\n]*[\\/]specimen-ssh\.ps1(?:"|\s|$)'
  })
  if ($oldSetup.Count) { throw 'The original setup is still running. Press Ctrl+C in its tab and wait for the PS prompt before running this command again. Do not kill Windows servicing processes.' }
  if (!(Get-Service -Name sshd -ErrorAction SilentlyContinue)) {
    if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') { throw 'This pinned installer requires Windows x64.' }
    [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
    $setupDir=Join-Path $env:TEMP ('SpecimenOpenSSH-'+[guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $setupDir | Out-Null
    $msi=Join-Path $setupDir 'OpenSSH-Win64-v10.0.0.0.msi'
    $msiLog=Join-Path $setupDir 'install.log'
    $uri='https://github.com/PowerShell/Win32-OpenSSH/releases/download/10.0.0.0p2-Preview/OpenSSH-Win64-v10.0.0.0.msi'
    Write-Host 'Downloading the direct OpenSSH installer (6.6 MB)...'
    $ProgressPreference='SilentlyContinue'
    Invoke-WebRequest -UseBasicParsing -Uri $uri -OutFile $msi -TimeoutSec 120
    if ((Get-FileHash -LiteralPath $msi -Algorithm SHA256).Hash -ne 'DDEC9C53864280759CF9F74791CEFD387100E3946AA849A1C138A4ED1B96B7D9') { throw 'Installer checksum mismatch. Nothing was installed.' }
    $signature=Get-AuthenticodeSignature -LiteralPath $msi
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch '(^|,\s*)O=Microsoft Corporation(,|$)') { throw 'Installer must have a valid Microsoft signature. Nothing was installed.' }
    Write-Host 'Microsoft signature and checksum verified. Installing SSH server...'
    $installer=Start-Process -FilePath (Join-Path $env:WINDIR 'System32/msiexec.exe') -ArgumentList @('/i',('"'+$msi+'"'),'ADDLOCAL=Server','/qn','/norestart','/L*v',('"'+$msiLog+'"')) -WindowStyle Hidden -PassThru
    if (!$installer.WaitForExit(180000)) { throw "The MSI is still running. Do not launch another installer. Installation log: $msiLog" }
    $installer.Refresh()
    if ($installer.ExitCode -eq 1618) { throw "Windows reports another installation is running. No forced cancellation was attempted. Log: $msiLog" }
    if ($installer.ExitCode -notin @(0,3010)) { throw "OpenSSH installer exited with code $($installer.ExitCode). Log: $msiLog" }
    if ($installer.ExitCode -eq 3010) { Write-Host 'Windows reports that a restart is required; the script will check whether SSH can start now.' }
  } else {
    Write-Host 'OpenSSH is already installed; reusing the existing service and host keys.'
  }
} else {
  $capability=Get-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0'
  if ($capability.State -ne 'Installed') {
    Write-Host 'Installing Windows OpenSSH. This may take a few minutes...'
    Add-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0' | Out-Null
  }
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
$serviceInfo=Get-CimInstance Win32_Service -Filter "Name='sshd'"
if ($serviceInfo.PathName -notmatch '^"?(.+?\\sshd\.exe)"?(?:\s|$)') { throw 'Cannot identify the installed SSH server binary.' }
$keygen=Join-Path (Split-Path -Parent $Matches[1]) 'ssh-keygen.exe'
$fingerprint=& $keygen -lf (Join-Path $env:ProgramData 'ssh/ssh_host_ed25519_key.pub')
if ($LASTEXITCODE -ne 0) { throw 'Unable to read the server public-key fingerprint.' }
Write-Host "Windows client build: $($os.BuildNumber)"
Write-Host "SSH_READY $fingerprint"
Write-Host 'Send Codex the SSH_READY line. It is a public fingerprint, not a password. Keep this VM session open for installation.'
