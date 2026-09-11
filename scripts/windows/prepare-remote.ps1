param([Parameter(Mandatory=$true)][switch]$DedicatedRemoteVM)
$ErrorActionPreference='Stop'
if (!$DedicatedRemoteVM) { throw 'Explicit dedicated remote VM declaration required.' }
$machine=Get-CimInstance Win32_ComputerSystem
$os=Get-CimInstance Win32_OperatingSystem
if ($os.ProductType -ne 1 -or [int]$os.BuildNumber -lt 22000 -or "$($machine.Manufacturer) $($machine.Model)" -notmatch 'Virtual|VMware|QEMU|KVM|Xen|HVM|Parallels') { throw 'Run only inside a genuine Windows 11 VM.' }
# The rented VM is dedicated to this project; bind capture to the explicitly
# selected account without changing the provider's login or its password.
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
if (!(Test-Path -LiteralPath $chrome)) { throw 'Install Google Chrome in the VM first.' }
$signature=Get-AuthenticodeSignature -LiteralPath $chrome
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Google') { throw 'Expected a valid Google Chrome signature.' }
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$root=Join-Path $project 'runtime/remote-worker'
New-Item -ItemType Directory -Path $root -Force | Out-Null
$configPath=Join-Path $root 'station.json'
if (Test-Path -LiteralPath $configPath) { throw 'Station already configured; use start-worker.ps1. Preserve the existing identity and token.' }
$token=New-Object byte[] 32;$rng=[Security.Cryptography.RandomNumberGenerator]::Create();$rng.GetBytes($token);$rng.Dispose()
[IO.File]::WriteAllText((Join-Path $root 'worker-token.txt'),([BitConverter]::ToString($token).Replace('-','').ToLowerInvariant()))
$config=@{protocol=1;dedicated=$true;isolation='remote-vm';stationId=[guid]::NewGuid().ToString();root=$root;userName=$env:USERNAME;userSid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value;computerName=$machine.Name;chromePath=$chrome;timeZone='GMT Standard Time'}
[IO.File]::WriteAllText($configPath,($config|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
# The private runtime folder is readable only by this user and local system/admins.
$sid=$config.userSid
& icacls.exe $root /inheritance:r /grant:r "*$($sid):(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Private station ACL setup failed.' }
Set-TimeZone -Id 'GMT Standard Time'
Write-Output 'Dedicated remote station prepared. Transfer worker-token.txt privately to the backend; never commit it.'
Write-Output 'Run scripts/windows/start-worker.ps1 from this logged-on VM desktop.'
