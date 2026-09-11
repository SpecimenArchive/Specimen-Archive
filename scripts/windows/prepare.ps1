param([switch]$Start)
$ErrorActionPreference='Stop'
$project=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$chrome='C:\Program Files\Google\Chrome\Application'
$node=(Get-Command node.exe -ErrorAction Stop).Source
if (!(Test-Path -LiteralPath "$chrome\chrome.exe")) { throw 'Install genuine Google Chrome on the host, then prepare again. No browser profile will be copied.' }
$signature=Get-AuthenticodeSignature "$chrome\chrome.exe"
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Google') { throw 'The Chrome program signature is not a valid Google signature.' }
$stationId=[guid]::NewGuid().ToString()
$stationRoot=Join-Path $project "runtime/windows-station/$stationId"
$tools=Join-Path $stationRoot 'tools'; $exchange=Join-Path $stationRoot 'exchange'
New-Item -ItemType Directory -Path $tools,$exchange -Force | Out-Null
# Copy application binaries only. Chrome's personal AppData/User Data is never read.
Copy-Item -LiteralPath $chrome -Destination (Join-Path $tools 'Chrome') -Recurse
Copy-Item -LiteralPath $node -Destination (Join-Path $tools 'node.exe')
foreach ($file in 'guest-bootstrap.ps1','guest-agent.mjs','file-transport.mjs','native-worker.ps1','NativeDesktop.cs') { Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $tools }
$config=@{protocol=1;stationId=$stationId;timeZone='GMT Standard Time';width=1600;height=900;presentationScale=2;chromeVersion=(Get-Item "$chrome\chrome.exe").VersionInfo.ProductVersion}
[IO.File]::WriteAllText((Join-Path $tools 'station.json'),($config|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
$toolsXml=[Security.SecurityElement]::Escape($tools);$exchangeXml=[Security.SecurityElement]::Escape($exchange)
$wsb=@"
<Configuration>
  <MemoryInMB>4096</MemoryInMB>
  <Networking>Disable</Networking>
  <ClipboardRedirection>Disable</ClipboardRedirection>
  <AudioInput>Disable</AudioInput><VideoInput>Disable</VideoInput><PrinterRedirection>Disable</PrinterRedirection>
  <MappedFolders>
    <MappedFolder><HostFolder>$toolsXml</HostFolder><SandboxFolder>C:\SpecimenTools</SandboxFolder><ReadOnly>true</ReadOnly></MappedFolder>
    <MappedFolder><HostFolder>$exchangeXml</HostFolder><SandboxFolder>C:\SpecimenExchange</SandboxFolder><ReadOnly>false</ReadOnly></MappedFolder>
  </MappedFolders>
  <LogonCommand><Command>powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\SpecimenTools\guest-bootstrap.ps1</Command></LogonCommand>
</Configuration>
"@
$configuration=Join-Path $stationRoot 'Specimen-Windows11.wsb'
[IO.File]::WriteAllText($configuration,$wsb,[Text.UTF8Encoding]::new($false))
Write-Output "Prepared station: $stationRoot"
Write-Output "Set EXHIBIT_WINDOWS_STATION to this directory before starting the backend."
if ($Start) {
  $sandbox=Join-Path $env:WINDIR 'System32\WindowsSandbox.exe'
  if (!(Test-Path -LiteralPath $sandbox)) { throw 'Windows Sandbox is not installed. An Administrator must enable Containers-DisposableClientVM and restart Windows. Prepared files remain available.' }
  Start-Process -FilePath $sandbox -ArgumentList ('"'+$configuration+'"') -WindowStyle Hidden
} else { Write-Output "Configuration: $configuration" }
