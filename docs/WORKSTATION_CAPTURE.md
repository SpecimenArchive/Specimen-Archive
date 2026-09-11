# Workstation desktop capture

The apparatus now receives a real **960 × 540 Linux desktop** containing Chrome,
Openbox window decorations and a tint2 taskbar. These are running applications,
not painted imitations. Xvfb owns a private display and Chrome owns a temporary
profile. The operator's Windows desktop, browser tabs and personal files are never
used as capture sources. The existing backend remains the sole session owner.

## Capture and controller separation

The control path is unchanged: `page.screenshot()` at **640 × 360**, PNG encoder,
600 engine steps, six-motor decoder, then the existing Playwright mouse calls.
The apparatus capture cannot enter the encoder and never changes action
coordinates. The only task markup addition is a document title for the real tab
and taskbar; it does not change page pixels. The browser is placed inside a native
window at 1:1 page scale. Light and dark calibration compares **every one of the
230,400 viewport pixels** against its rectangle in the desktop capture. In live
link-hover frames Chrome can display its genuine destination status bubble over
the bottom of the page. It belongs only to desktop presentation; it is absent from
the sensory PNG, as required. Pixel checks separately report this native overlay.

After each settled action the backend saves the sensory page and the corresponding
desktop. It publishes that pair only after both are written. The observer decodes
both images before switching all four views; the apparatus draws before paint.
An 800 ms delayed-desktop test also verifies that waiting for a frame never rewinds the displayed neural sample. During integration the same captured image is held, as before. There is no
invented cursor tween, scrolling animation or free-running screen movie. The one
cyan page pointer is driven by the actual recorded mouse events in both captures.
XGetImage omits the unrelated X server hardware pointer rather than overlaying a
second cursor. The visible cyan pointer is the established engineered sensory
marker, not a new native-pointer measurement.

Desktop metadata records filename/hash, corresponding page, pointer coordinates,
source capture timestamp, backend completion timestamp, capture duration, round
trip duration, page offset and timestamp uncertainty. Windows and WSL clocks can
differ. `capturedAt` is explicitly a backend-clock midpoint estimate bounded by
the measured request/response interval; `sourceCapturedAt` retains raw Linux UTC.
`clockUncertaintyMs` bounds the estimate rather than claiming exact cross-OS time.
The four views are aligned by immutable frame pair and command/run/session IDs,
not by the two wall clocks. Replay verifies desktop hashes, page linkage and
pointer continuity in addition to the existing exact neural reconstruction.

## Run and verify

Windows requires **WSL 2 with an Ubuntu distro** for the real desktop. Node runs
on Windows; Chrome, the window manager and framebuffer run inside WSL. With Node
24 installed, these are the exact one-time setup commands in PowerShell for this
checkout (replace the checkout paths if cloned elsewhere):

```powershell
Set-Location 'C:\path\to\SpecimenArchive'
wsl.exe --list --verbose
# Only if Ubuntu is not installed: wsl.exe --install -d Ubuntu
wsl.exe -d Ubuntu -u root -- bash /mnt/c/path/to/SpecimenArchive/scripts/setup-desktop.sh
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run build
```

Start the production preview in PowerShell:

```powershell
Set-Location 'C:\path\to\SpecimenArchive'
$env:EXHIBIT_WSL_DISTRO='Ubuntu'
$env:EXHIBIT_DESKTOP='1'
$env:RUNTIME_DIR='runtime'
$env:RECORDER_ENABLED='0'
$env:PORT='4317'
npm.cmd start
```

Open **http://127.0.0.1:4317/**. `RECORDER_ENABLED=0` leaves automatic GitHub
publication disabled; local episode recording and replay continue. For development
use `npm.cmd run dev` in place of `npm.cmd start`.

**Shutdown:** press **Ctrl+C in that same PowerShell terminal** and wait for the
command prompt to return. This invokes the server's SIGINT shutdown, closes its
browser/video and terminates its private display and taskbar. Do not use
`wsl.exe --shutdown`: other WSL sessions do not belong to this preview. A restart
creates a new, explicitly identified session and preserves retained recordings.

On native Ubuntu/Debian, use `bash scripts/setup-desktop.sh`, then `npm ci`,
`npx playwright install chromium`, `npm run build` and
`RECORDER_ENABLED=0 PORT=4317 npm start`. `EXHIBIT_WSL_DISTRO` chooses another
prepared Windows distro. The Python helper uses process pipes to tunnel the private loopback CDP
and framebuffer requests, avoiding WSL forwarding and external listeners.
Closing the pipe tears down only the session's children and temporary profile.
Chrome's normal sandbox remains enabled.

`npm run desktop:check` captures two separately labelled optical calibration pages
and verifies exact page pixels. `node --import tsx scripts/workstation-ui-check.mjs`
checks sizes, expand/Escape, packet linkage and unchanged scene pixels against a
running development server (`EXHIBIT_URL`, default port 4318 for the review).
`node scripts/workstation-sequence.mjs` waits for an early live episode window and
records 55 seconds without sending controller commands. It writes the executed
source revision, dirty flag, session, events and video SHA256 to
`runtime/workstation-review/recording.json`. For a publication review:

```powershell
$env:EXHIBIT_URL='http://127.0.0.1:4317'
$env:WORKSTATION_REQUIRE_CLEAN='1'
node scripts/workstation-sequence.mjs
```

The local player is `/docs/previews/workstation-review.html`. The checked-in
`docs/results/workstation-sequence.json` is the earlier development review, not
evidence of a later commit. New review output stays ignored so generating it does
not modify executed source. `WORKSTATION_REVIEW_DIR` and
`WORKSTATION_REVIEW_REPORT` can select separate evidence destinations.
`EXHIBIT_URL=... node
scripts/exhibit-endurance.mjs` runs the existing ten-minute two-observer protocol.

`EXHIBIT_DESKTOP=0` explicitly opts into the preserved headless controller mode;
the apparatus reports missing desktop capture instead of fabricating chrome.
Fast causal suites also remain headless. Existing frozen baseline evidence,
recordings, graph, dynamics and intervention thresholds are unchanged. Rendering
fonts/browser rasterization can differ by operating system; recorded PNGs are
the exact authority for each run and replay does not need that browser installed.

New raw page/desktop PNGs and video remain in bounded ignored runtime storage.
Compact reviews are in `docs/results/workstation-*.json`. The optical calibration
is explicitly operator-driven QA and is not counted as neural action evidence.

References: [Playwright screenshot viewport](https://playwright.dev/docs/api/class-page#page-screenshot),
[Playwright CDP attachment](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp),
[Xvfb virtual framebuffer](https://xorg.freedesktop.org/archive/X11R6.8.2/doc/Xvfb.1.html).

## Recorder isolation

The continuous exhibit polls only its own recorder. It no longer rewrites pending receipts belonging to the inactive frozen baseline or light experiment. A locked receipt is exposed as recorderError in health diagnostics and retried later; it cannot terminate the neural/capture session. Pending receipts with unchanged reasons are not repeatedly rewritten.

Recorded WebM responses support bounded HTTP byte ranges so the review and archive players can seek without restarting the stream. The original video bytes remain unchanged.

## Observed completion checks

The final two-observer run lasted 602.065 seconds with 11,033 matching packets, no dropped stream frames, no browser/controller/recorder errors, exact disconnected specimen pixels and successful reconnect. The 55.109-second action sequence includes real movement, wheel events and a link navigation; its complete encoded review clip is 58 seconds. All 29 tests and the production build pass. Five completed desktop-backed episodes replayed 14,400 neural samples exactly; navigated-only outcomes remain recorded.
