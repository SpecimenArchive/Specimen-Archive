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
function Pin-Dashboard([int]$browserPid) {
  Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes,WindowsBase
  $scope=[Windows.Automation.TreeScope]::Descendants
  $root=[Windows.Automation.AutomationElement]::FromHandle([SpecimenDesktop]::BrowserHandle($browserPid))
  $tabCondition=New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::TabItem)
  $tabs=$root.FindAll($scope,$tabCondition)
  $tab=@($tabs | Where-Object {$_.Current.Name -like '*Specimen 01*Specimen Archive*'})
  if($tab.Count -ne 1){throw 'Cannot uniquely identify the observation dashboard tab.'}
  $r=$tab[0].Current.BoundingRectangle
  [SpecimenDesktop]::TabMenu($browserPid,[int]($r.X+$r.Width/2),[int]($r.Y+$r.Height/2))
  $menuCondition=New-Object Windows.Automation.PropertyCondition([Windows.Automation.AutomationElement]::ControlTypeProperty,[Windows.Automation.ControlType]::MenuItem)
  $menus=[Windows.Automation.AutomationElement]::RootElement.FindAll($scope,$menuCondition)
  $pin=@($menus | Where-Object {$_.Current.ProcessId -eq $browserPid -and $_.Current.Name -in @('Pin','Pin tab')})
  $unpin=@($menus | Where-Object {$_.Current.ProcessId -eq $browserPid -and $_.Current.Name -in @('Unpin','Unpin tab')})
  if($unpin.Count -eq 1){[SpecimenDesktop]::Escape();return @{pinned=$true;alreadyPinned=$true}}
  if($pin.Count -ne 1){[SpecimenDesktop]::Escape();throw 'Native Chrome Pin command unavailable.'}
  ([Windows.Automation.InvokePattern]$pin[0].GetCurrentPattern([Windows.Automation.InvokePattern]::Pattern)).Invoke()
  Start-Sleep -Milliseconds 200
  $tabs=$root.FindAll($scope,$tabCondition)
  $tab=@($tabs | Where-Object {$_.Current.Name -like '*Specimen 01*Specimen Archive*'})
  if($tab.Count -ne 1){throw 'Cannot verify the pinned dashboard tab.'}
  $r=$tab[0].Current.BoundingRectangle
  [SpecimenDesktop]::TabMenu($browserPid,[int]($r.X+$r.Width/2),[int]($r.Y+$r.Height/2))
  $menus=[Windows.Automation.AutomationElement]::RootElement.FindAll($scope,$menuCondition)
  $unpin=@($menus | Where-Object {$_.Current.ProcessId -eq $browserPid -and $_.Current.Name -in @('Unpin','Unpin tab')})
  [SpecimenDesktop]::Escape()
  if($unpin.Count -ne 1){throw 'Native Chrome did not confirm that the dashboard is pinned.'}
  return @{pinned=$true;alreadyPinned=$false}
}
while ($line=[Console]::ReadLine()) {
  try {
    $request=$line | ConvertFrom-Json
    switch ($request.method) {
      'info' { $result=@{os='Windows 11';isolation=$isolation;osBuild="$($os.CurrentBuild).$($os.UBR)";width=[SpecimenDesktop]::Width;height=[SpecimenDesktop]::Height;scale=[SpecimenDesktop]::Scale} }
      'arrange' { [SpecimenDesktop]::Arrange([int]$request.pid); $result=@{ok=$true} }
      'pin' { $result=Pin-Dashboard ([int]$request.pid) }
      {$_ -in @('capture','display')} {
        $start=[DateTimeOffset]::UtcNow; $watch=[Diagnostics.Stopwatch]::StartNew()
        $png=if($request.method -eq 'display'){[SpecimenDesktop]::Display([int]$request.pid)}else{[SpecimenDesktop]::Capture([int]$request.pid)}
        $watch.Stop(); $window=[SpecimenDesktop]::Bounds([int]$request.pid); $taskbar=[SpecimenDesktop]::Taskbar()
        $result=@{png=$png;sourceCapturedAt=$start.ToUnixTimeMilliseconds();captureMs=$watch.Elapsed.TotalMilliseconds;width=[SpecimenDesktop]::Width;height=[SpecimenDesktop]::Height;dpi=96;os='Windows 11';osBuild="$($os.CurrentBuild).$($os.UBR)";timeZone=(Get-TimeZone).Id;window=$window;taskbar=$taskbar}
      }
      default { throw 'Unknown native station operation' }
    }
    [Console]::WriteLine((@{id=$request.id;result=$result}|ConvertTo-Json -Depth 5 -Compress))
  } catch { [Console]::WriteLine((@{id=$request.id;error=$_.Exception.Message}|ConvertTo-Json -Compress)) }
}
