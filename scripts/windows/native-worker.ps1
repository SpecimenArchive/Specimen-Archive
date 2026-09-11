$ErrorActionPreference='Stop'
# Fail BEFORE loading capture APIs or inspecting any desktop on an ordinary host.
$isolation='windows-sandbox'
if ($env:SPECIMEN_REMOTE_GUEST -eq '1' -and $env:SPECIMEN_REMOTE_CONFIG) {
  $station=Get-Content -LiteralPath $env:SPECIMEN_REMOTE_CONFIG -Raw | ConvertFrom-Json
  $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User.Value
  $machine=Get-CimInstance Win32_ComputerSystem
  if ($station.isolation -ne 'remote-vm' -or $station.dedicated -ne $true -or $sid -ne $station.userSid -or $env:USERNAME -ne $station.userName -or $machine.Name -ne $station.computerName -or "$($machine.Manufacturer) $($machine.Model)" -notmatch 'Virtual|VMware|QEMU|KVM|Xen|HVM|Parallels') { throw 'Dedicated remote VM identity verification failed.' }
  if ((Get-CimInstance Win32_OperatingSystem).ProductType -ne 1) { throw 'Windows 11 client is required, not Windows Server.' }
  $isolation='remote-vm'
} elseif ($env:USERNAME -ne 'WDAGUtilityAccount' -or $env:SPECIMEN_SANDBOX_GUEST -ne '1') { throw 'Desktop capture requires the configured dedicated remote VM account.' }
$os=Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion'
if ([int]$os.CurrentBuild -lt 22000) { throw 'This station requires Windows 11 or later.' }
Add-Type -Path "$PSScriptRoot\NativeDesktop.cs" -ReferencedAssemblies System.Drawing
[SpecimenDesktop]::Initialize()
while ($line=[Console]::ReadLine()) {
  try {
    $request=$line | ConvertFrom-Json
    switch ($request.method) {
      'info' { $result=@{os='Windows 11';isolation=$isolation;osBuild="$($os.CurrentBuild).$($os.UBR)";width=[SpecimenDesktop]::Width;height=[SpecimenDesktop]::Height;scale=[SpecimenDesktop]::Scale} }
      'arrange' { [SpecimenDesktop]::Arrange([int]$request.pid); $result=@{ok=$true} }
      'capture' {
        $start=[DateTimeOffset]::UtcNow; $watch=[Diagnostics.Stopwatch]::StartNew()
        $png=[SpecimenDesktop]::Capture([int]$request.pid)
        $watch.Stop(); $window=[SpecimenDesktop]::Bounds([int]$request.pid); $taskbar=[SpecimenDesktop]::Taskbar()
        $result=@{png=$png;sourceCapturedAt=$start.ToUnixTimeMilliseconds();captureMs=$watch.Elapsed.TotalMilliseconds;width=[SpecimenDesktop]::Width;height=[SpecimenDesktop]::Height;dpi=96;os='Windows 11';osBuild="$($os.CurrentBuild).$($os.UBR)";timeZone=(Get-TimeZone).Id;window=$window;taskbar=$taskbar}
      }
      default { throw 'Unknown native station operation' }
    }
    [Console]::WriteLine((@{id=$request.id;result=$result}|ConvertTo-Json -Depth 5 -Compress))
  } catch { [Console]::WriteLine((@{id=$request.id;error=$_.Exception.Message}|ConvertTo-Json -Compress)) }
}
