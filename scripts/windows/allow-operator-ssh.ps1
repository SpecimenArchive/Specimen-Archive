$ErrorActionPreference='Stop'
$peer=@(Get-NetTCPConnection -LocalPort 3389 -State Established | Select-Object -ExpandProperty RemoteAddress -Unique)
if ($peer.Count -ne 1) { throw 'Expected one connected Remote Desktop address. Keep your VM session open.' }
$rule=@{Name='SpecimenArchive-SSH-Operator';Direction='Inbound';Protocol='TCP';LocalPort=22;RemoteAddress=$peer[0];Action='Allow';Profile='Any';Enabled='True'}
if (Get-NetFirewallRule -Name $rule.Name -ErrorAction SilentlyContinue) {
  Set-NetFirewallRule @rule
} else {
  New-NetFirewallRule @rule -DisplayName 'Specimen Archive SSH from operator' | Out-Null
}
Write-Output 'SSH_FIREWALL_READY'
