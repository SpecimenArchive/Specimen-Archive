> Current checkpoint, 12 September 2026: SSH and the native Windows observation profile are running at clean `7f72d2b`. RDP is disconnected; real scrolling, saved videos, exact replay and capture recovery are verified. See [STATUS](../STATUS.md), [the current acceptance report](OBSERVATION_UPGRADE.md) and [isolated publication](RECORD_SERVICE.md).

# Remote Windows 11 station

## Current state

The trusted server host key matches the VM console. The VM runs Windows 11 Enterprise Evaluation build 26200, Node 24.21, Git 2.55 and genuine Chrome 153. The website/controller, capture worker and recordings run under C:\SpecimenArchive; the independent SYSTEM publisher uses its protected C:\ProgramData\SpecimenArchivePublisher directory. Connection details and the operator private key remain outside Git under %LOCALAPPDATA%\SpecimenArchive.

Worker and backend are limited interactive tasks, triggered at station logon and configured to restart after failures at one-minute intervals. The publisher starts as SYSTEM at boot. The display was transferred to a persistent console, and actual captures/actions continued with zero RDP connections. A cold reboot still requires the station user to log on; unattended autologon is not configured. A home-PC shutdown only removes that observer's SSH tunnel.

## Minimum private connection setup

For the simplest first login, run `scripts/windows/connect-rdp.ps1` in a **new** local PowerShell window. Enter the provided primary IP, username and Remote Desktop port. It stores these privately under `%LOCALAPPDATA%/SpecimenArchive/connection.json` and opens the Windows credential dialog. Paste the password there; it is never collected in the console or written to the connection file. Once the VM desktop is visible, continue SSH preparation below.

Run `scripts/windows/configure-connection.ps1` on the home PC in its ordinary user PowerShell. It prompts locally for the By-Hoster IP/hostname and administrative Windows username, generates a dedicated Ed25519 SSH key, and stores these under `%LOCALAPPDATA%/SpecimenArchive` with a restricted ACL. `connection.json` has the address, username, key path and known-hosts path. The private key is `vm_ed25519`; `vm_ed25519.pub` is public. No server password is collected or stored.

Use `mstsc.exe` for the initial VM login; enter the By-Hoster password only in Windows' credential dialog. Copy the generated `enable-vm-ssh.ps1` to the VM Desktop and run it there in an Administrator PowerShell. It installs/enables Microsoft's OpenSSH server and adds only the generated public key to the Windows administrators' authorized-keys file, preserving existing entries. If the provider uses a separate network firewall, permit SSH port 22 there for the operator connection.

Run the generated private `connect.ps1` on the home PC. Compare its host-key fingerprint with the fingerprint printed on the trusted VM console before accepting the first connection. Type `exit` after the successful test, and tell Codex "SSH ready". Do not send passwords, private-key contents or the private folder to chat/Git. If the SSH key has a passphrase, it must be unlocked locally in the user's SSH agent for unattended tool connections.

## Preferred deployment: everything on By-Hoster

After SSH is established, verify OS/hardware and install the required dependencies in the VM, deploy this exact source and run `prepare-remote.ps1 -DedicatedRemoteVM` in its dedicated interactive account. Build with `npm.cmd ci` and `npm.cmd run build`. The remote `start-backend.ps1` selects the VM-local worker and its private token automatically; the home PC does not host the controller.

From the VM's logged-on desktop:

```powershell
Set-Location C:\SpecimenArchive
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/windows/install-startup.ps1
```

This prepares separate `SpecimenArchive-Worker` and `SpecimenArchive-Backend` scheduled tasks, with one instance each, logon startup and failure restart. Both run in the verified interactive account. A machine reboot still requires that account to log on: automatic login or stored login passwords have not been configured. Continuing after RDP disconnect must be tested on By-Hoster's actual display/session. Task registration alone is not proof.

The launchers refresh their process PATH from the Windows environment and retain stdout/stderr logs in the private `runtime/remote-worker/logs` directory. The preceding invocation is retained as `.previous`. Worker request failures are recorded privately with their cause; observer responses remain bounded and do not expose private station data.

Private preview from the home PC, using the saved connection (port 4319 avoids the preserved local preview):

```powershell
$c=Get-Content "$env:LOCALAPPDATA\SpecimenArchive\connection.json" -Raw | ConvertFrom-Json
ssh.exe -N -i $c.identityFile -p $c.sshPort -o "UserKnownHostsFile=$($c.knownHostsFile)" -o StrictHostKeyChecking=yes -o ExitOnForwardFailure=yes -L 127.0.0.1:4319:127.0.0.1:4317 -l $c.userName $c.address
```

Open `http://127.0.0.1:4319/`. Closing this tunnel or switching off the home PC only disconnects that observer. The VM website, controller, browser worker and recordings continue independently. Public observer hosting/TLS is a separate deployment decision; no public domain is required for this private milestone preview.

Graceful shutdown remotely:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\SpecimenArchive\scripts\windows\stop-station.ps1
```

The script requests normal backend recording finalization through a private filesystem marker, then requests worker cleanup. No public mutation endpoint is added. Restart with `Start-ScheduledTask -TaskName SpecimenArchive-Worker` and then `Start-ScheduledTask -TaskName SpecimenArchive-Backend`. If setup has not installed tasks, use the two start scripts in dedicated VM terminals and Ctrl+C for normal shutdown.

## Responsibilities and transport

The existing Node backend retains the model, decoder, recording, replay and observer session. **The accepted deployment now places both this backend and the Windows worker on By-Hoster**, along with recordings and the observation website. The home PC is only an operator/observer client and can be switched off. The split-backend SSH topology below remains an optional development configuration. `RemoteDesktopSession` attaches to real Google Chrome in the VM through an authenticated, loopback-only worker and SSH tunnel. HTTP carries native capture requests; a bearer-authenticated WebSocket bridges only the owned Chrome CDP endpoint. The bearer is loaded from a private file, never a URL or browser-page setting. The public observer application has no worker token or write endpoint.

The VM worker verifies Windows 11 client build >=22000, virtual-machine hardware identification, machine/account identity, dedicated-account declaration and a valid Google Chrome signature during preparation. Native capture verifies the same dedicated SID and VM identity before loading desktop APIs. Capture requires a single 1600 x 900 display, 96 DPI, visible Explorer taskbar, fixed Chrome window bounds and Chrome foreground focus. `Graphics.CopyFromScreen` captures the real desktop. The captured field includes the Explorer taskbar and native Windows chrome. Windows reports its actual clock in `GMT Standard Time` (London with seasonal adjustment).

The worker listens on VM **127.0.0.1:4320**, never on a public network interface. With both services on the VM, the backend connects directly over this loopback address and the dashboard uses the same VM loopback port 4317. Its own Chrome CDP port is also loopback-only. An authenticated SSH connection forwards backend port 4320 to that worker and reverses backend port 4317 to VM loopback port 4317. The dashboard's VM localhost therefore reaches the same active backend through a real tunnel; it does not assume unrelated machines share localhost.

One unexpired lease owns the worker. A second backend receives HTTP 409. The worker has a random boot ID, lease ID, 20-second heartbeat deadline and strictly increasing capture-operation sequence. Duplicate/old/out-of-order requests fail. CDP disconnect closes the owned browser; it is never reattached to replay stale actions. Backend recovery records the interrupted episode and opens a fresh lease after cleanup. Native capture failure or focus loss aborts the episode. Operator assistance remains separate from decoded commands.

## Prepare the VM once

Use the provider's genuine Windows 11 image and its console. A Windows Server image is not accepted. Use an account on this dedicated project VM and sign into it interactively. Preparation records its actual SID and machine identity; no account name or password is changed. Keep personal accounts and files off this station. Provision Node 24, Git, Google Chrome and an authenticated Windows OpenSSH server using provider/admin access. Keep port 4320 private; SSH is the only network entry used here. The project scripts do not install the OS, enable remote access or buy services.

In that dedicated VM account:

```powershell
git clone https://github.com/SpecimenArchive/Specimen-Archive.git C:\SpecimenArchive
Set-Location C:\SpecimenArchive
npm.cmd ci
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/windows/prepare-remote.ps1 -DedicatedRemoteVM
```

Preparation records the VM/account identity in ignored `runtime/remote-worker/station.json`, generates a random worker token and restricts that directory's ACL to the station account, Administrators and SYSTEM. Transfer `runtime/remote-worker/worker-token.txt` to a private file on the backend machine through the authenticated connection. Do not print it, check it in, copy a personal Chrome profile or put it in a command-line argument.

Configure the provider's persistent display at 1600 x 900 / 100% scaling with Explorer taskbar visible. Chrome uses (144,18), 1312 x 823, leaving the actual taskbar visible. The capture helper checks every required bound rather than silently accepting a different geometry. Add useful shortcuts to Chrome and the station checkout using the genuine Windows desktop. Pinning the dashboard in native Chrome remains a VM setup/verification item; no painted tab is used and the code does not yet automate native pinning.

## Optional split-backend development startup

1. In the VM's logged-on dedicated desktop, start the worker:

```powershell
Set-Location C:\SpecimenArchive
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/windows/start-worker.ps1
```

Keep this worker attached to the interactive user session. Launching it as a Windows service, in session 0, or directly inside the SSH shell does not provide an interactive desktop. A scheduled task, if used after provisioning, must run **only when this dedicated user is logged on**. Port binding prevents a duplicate worker.

2. On the backend, use the configured SSH host alias `specimen-vm` (replace it with the verified provider alias):

```powershell
ssh.exe -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=5 -o ServerAliveCountMax=3 -L 127.0.0.1:4320:127.0.0.1:4320 -R 127.0.0.1:4317:127.0.0.1:4317 specimen-vm
```

Verify the provider's host key through its trusted console on first connection. Use existing SSH authentication configuration. Forwarding must be enabled for this account; do not expose either forwarded service on `0.0.0.0`.

3. Stop the existing preview with Ctrl+C in its owning terminal before starting the changed backend, so port 4317 has one controller. In a separate backend PowerShell terminal:

```powershell
Set-Location 'C:\path\to\SpecimenArchive'
npm.cmd run build
$env:EXHIBIT_DESKTOP='windows'
$env:EXHIBIT_WINDOWS_URL='http://127.0.0.1:4320'
$env:EXHIBIT_WINDOWS_TOKEN_FILE='C:\private\specimen-worker-token.txt'
$env:RECORDER_ENABLED='0'
$env:PORT='4317'
npm.cmd start
```

The observer URL is `http://127.0.0.1:4317/`. The VM dashboard is the same website with `?display=workstation`; that mode does not fetch or embed desktop/page captures. Live neural data, model metrics and event history remain visible. No public domain or hosted Sites deployment is required for this milestone. This runtime needs an interactive VM; publishing static files alone cannot host its worker.

WSL is **not required for the remote Windows path**. The preserved Linux path still uses WSL Ubuntu on a Windows backend:

```powershell
$env:EXHIBIT_DESKTOP='1'
$env:EXHIBIT_WSL_DISTRO='Ubuntu'
$env:RECORDER_ENABLED='0'
npm.cmd start
```

Its one-time setup remains `wsl.exe -d Ubuntu -u root -- bash /mnt/c/path/to/SpecimenArchive/scripts/setup-desktop.sh`. Do not start both paths simultaneously on port 4317. Use `EXHIBIT_DESKTOP=0` only for explicitly labelled headless checks.

## Preserved benchmark capture semantics

The frozen 47-neuron / 161-edge controller and original 48-window benchmark are unchanged. A 640 x 360 sensory screenshot is calibrated against every corresponding desktop pixel at exactly 2x display scale before inputs execute. The emulation change must leave that sensory PNG identical. Subsequent capture rejects changed dimensions, DPI, taskbar, focus or window bounds. Calibration is setup-only and never enters neural decisions.

For the remote station, the supervisor prepares the dashboard, a primary-source reading tab and the seeded task tab. Only the controlled task receives neural mouse/wheel inputs. Source-page availability failures are retained. Requests are confined to the fixture, dashboard and eLife origin/subdomains, using GET/HEAD only; downloads and service workers are disabled. There are no account, purchase, upload, message or transaction actions. Fixed task selection and seeds remain in the record; the public reading tab does not imply arbitrary-page competence.

After 48 decisions, the evaluator records success/failure, and the supervisor returns to the dashboard for 180 wall seconds. Neural state is explicitly held during this idle period. The 540-second remote episode limit includes setup, neural work and dwell. Focus changes and dwell completion live in `record.orchestration` with `actor: supervisor`; they never acquire a neural command ID. Desktop captures refresh every two seconds during the dwell and use `cursorSource: not-present`. Their page frames are presentation only, never controller input. Every fresh episode resets neural state as before.

Raw frames and videos remain under the existing eight-episode retention policy. The worker owns a temporary Chrome profile per lease and removes it on successful cleanup. If a process/profile remains locked, inspect the dedicated worker's private receipt and stop the owned process before restarting. Never clean up by killing all Chrome processes or deleting broad directories.

## Shutdown, RDP and recovery

For the deployed tasks, run `scripts/windows/stop-station.ps1` on the VM to request backend finalization and then graceful worker shutdown. It allows up to 100 seconds for bounded recording cleanup. Restart Worker and Backend with `Start-ScheduledTask` after confirming both stopped. The private worker stop marker is the capture emergency stop. Closing the home observer tunnel does not expire this VM-local backend/worker lease. The optional split-backend development topology does expire its lease when its forwarding connection disappears. Never kill Chrome by process name or stop unrelated sessions.

An RDP disconnection can change or remove an interactive desktop. VM uptime is insufficient. Use the provider console/persistent display configuration, then **actually disconnect the operator's RDP client** while observers continue. Do not assume `tscon`, keeping a process alive or Windows task scheduling proves capture continuity. If a restart needs the dedicated user to log on through the provider console, record that as operator recovery; no unattended login is configured here.

Historical commissioning checklist (the current observation results supersede its pending status):

- Confirm OS, Chrome, account, timezone, native pinning, useful shortcuts and persistent display; inspect unwarped light/dark captures and exact calibration.
- Run 30–60 seconds spanning the end of a task excursion and dashboard return; retain source revision, command trace and real desktop frames. Inspect all screen edges, marker faces, normal/expanded apparatus and narrow observer layouts.
- Run `node scripts/exhibit-endurance.mjs` for ten minutes with two matching observers. Record RDP disconnection separately with its actual timestamp and inspect continued changing captures/actions. Reconnect an observer and verify matching session/events.
- Stop/restart the worker, interrupt SSH, close Chrome and restart the VM separately. Verify interrupted records, new leases/boot IDs and no stale action replay. Record any required login/display assistance.
- Run `npm.cmd run exhibit:validate` for the preserved held-out suite and matched interventions, then `npm.cmd run exhibit:replay -- runtime/exhibit/<run-id>` on actual Windows records. Report failed trials as well as successes.

The original recovery checkpoint preceded native execution at 0b64125. Its evidence remains preserved. The current observation profile uses 1:1 visible-page sensory captures after scaled calibration, rejects covered or misaligned frames, and replaces the legacy 180-second task dwell with the dashboard/reference/worksheet schedule described in the upgrade report. The new report separates actual runtime acceptance from local tests.

Primary implementation references: [Playwright CDP attachment](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp), [Playwright input](https://playwright.dev/docs/input), [Microsoft screen copying](https://learn.microsoft.com/en-us/dotnet/api/system.drawing.graphics.copyfromscreen), [Windows interactive remote sessions](https://learn.microsoft.com/en-us/windows/win32/termserv/terminal-services-sessions), [Windows OpenSSH setup](https://learn.microsoft.com/en-us/windows-server/administration/openssh/openssh_install_firstuse).
