# Observation dashboard and Windows runtime upgrade

The adopted request is preserved in [the upgrade brief](OBSERVATION_UPGRADE_BRIEF.md). The original neural engine, published circuit, benchmark profiles, imagery and calibrated apparatus v4 remain intact.

## Diagnosis before changes

- The 360 px CSS column in the apparatus banner produced the tiny thumbnail. The new main row gives roughly 74% to the full photograph and 26% to the activity feed; expansion is optional.
- The old 180-second dashboard dwell held model state but retained the task's `inputFrame` and encoded input. This explains a Record-button sensory image beside a dashboard desktop. The new runner samples the actually visible tab, identifies its page and frame, and clears current sensory data during orchestration. An executed decision's earlier input is explicitly labelled as its before-action frame.
- Zero input and waits in the task profile can be legitimate: the fixed alternating point/scroll phases gate inputs, and the motor mean must reach 0.500. The actual VM completed an activated 48-decision episode at `0b64125`, with 24 non-wait commands. Historical startup, CDP, lease and recording failures remain retained.
- The Windows launcher explicitly disabled publication and supplied no destination. The existing repository is `SpecimenArchive/Specimen-Archive`, default branch `master`; the operator account has verified repository administration/push permission. A separate repository-scoped SSH deploy key and private bare object store allow the VM recorder to publish compact records without a home-PC process or copied personal token.
- Cross-computer clock subtraction could overstate desktop age. The observer now anchors age to the server packet timestamp plus monotonic time since receipt. Transport gaps and missing/old captures remain visibly stale.

## Implemented observation profile

The imported runtime file contains **47 cells: 21 sensory, 20 interneuron and 6 motor**, with **161 directed connections / 711 synaptic contacts**. The full imported study has 2,675 nodes and 14,066 edges. Source x/y values are force-layout coordinates, not anatomical soma positions; the display identifies its functional layout.

`server/exhibit/observation-encoder.ts` defines the separately identified `observation-contrast-v2` profile. It samples every second pixel in two bands: x 8–92%, upper y 12–46%, lower y 54–90%. Luminance is 0.2126 R + 0.7152 G + 0.0722 B; each band reports mean and standard deviation. Combined contrast below 3 supplies zero drive. Otherwise contrast strength is capped at 1 using a 48-unit scale. If the bands differ by less than 0.5 luminance-standard-deviation units, both drives are zero. The stronger band supplies 0.15 + 0.5 × strength to its corresponding side; the other side receives 0.15. These are explicit engineering mappings, not measured retinal responses.

The unchanged 47-cell rate engine integrates 600 steps × 0.01 model seconds. The existing motor decoder waits below M=0.500; otherwise D=MN3_r−MN2_r above/equal 0.008 selects +48 px, and below selects −48 px. This observation profile dispatches wheel inputs only. It cannot read or understand page content. The original coloured-target move/click/scroll benchmarks remain separate and unchanged.

The main dashboard receives 38 of 48 decision windows; approved eLife and local worksheet visits receive five each. Native pinning, page preparation/focus and cursor placement for wheel delivery are recorded as orchestration. Future neural commands are unknown until decoded. Accepted commands and predetermined tab changes alone populate QUEUED.

Each decision retains its exact before/after PNGs, native desktop captures, page identity, sampling values, every sampled neural state, thresholds, decoded command, trusted input events and measured scroll change. Scroll offsets are verification only and cannot reach the encoder or decoder. Zero displacement at a page boundary is blocked rather than counted as a successful movement. Record execution, video recording and publication statuses are separate.

## Observer interface and metrics

The large apparatus, specimen, sensory/neural panel and direct desktop share the same render packet. Inspection replays a recorded decision locally while the VM continues. Pause follow holds feed rows without stopping execution. Repeated waits are collapsed with count and duration. Model outputs are never extrapolated across missing samples.

Active units use activity >0.1 in the current snapshot. Sensory imbalance is right minus left encoded drive. Motor drive is the actual six-cell mean. Executed/min counts verified page movements in the preceding 60 wall seconds; cumulative executed and attempted counts are separate. Capture-to-action latency uses the last input capture and dispatch timestamps. Capture cadence uses the last ten seconds; decision interval uses the last twenty decisions. Missing telemetry displays as unavailable.

## Publication and storage

The operator approved the dedicated write key. Publication now runs in a separate SYSTEM service with a SYSTEM-only key/code ACL; a real station-account read attempt was denied. Actual evidence publication and remote readback succeeded. See [service setup and verification](RECORD_SERVICE.md). The backend no longer accesses the private publisher configuration or invokes Git publication.

The recorder uses `specimen-records`, independently of source `master`. It writes a compact record with normal Git commits, reads the remote bytes and commit back, and recovers an existing identical record after lost receipts. Concurrent pushes retry at most three times. Recorder passes attempt at most four records; failures use exponential backoff capped at fifteen minutes and stop after five attempts. Raw videos/continuous captures and credentials remain outside ordinary Git.

## Historical verification checkpoint - 11 September 2026

Local typecheck/build, 39 tests, changed PowerShell syntax and C# compilation pass. New pixel-contrast tests produce opposite scroll directions; motor clamping and photoreceptor disconnection abolish actions. A real local Git transport test verifies concurrent publication, lost-receipt recovery and refusal to overwrite conflicting bytes. The large frontend was inspected at 390, 1024, 1440 and 1920 px using the existing VM stream: no overflow or browser errors. Native maximisation/pinning and the new observation profile still require VM deployment and end-to-end acceptance; no ten-minute upgrade result is claimed at this checkpoint.

The first deployed upgrade, `f2a17d5`, maximized Chrome successfully (native bounds -8,-8 to 1288,760 on a 1280×800 display; taskbar y752–800). Calibration correctly failed because a Windows Update restart dialog dimmed and covered the page. No neural inputs were sent. Native capture was visually inspected to identify the dialog. A new distributed pixel-agreement check also rejects an OS overlay during later decisions; it compares the actual native page with the exact sensory PNG. The update dialog requires operator dismissal before native acceptance can continue. No successful pinning, scrolling or ten-minute result for the upgraded profile is claimed yet.

The requested visual reference was [flybrain.online](https://flybrain.online/) and its [source repository](https://github.com/fruitflydev/flycoinrh). Its sensory/activity/motor relationship informed hierarchy only; fly neuron names, spike/voltage metrics, learning and wallet activity were not adopted. Publication access follows [GitHub's repository deploy-key mechanism](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys); native pinning uses Windows UI Automation's [InvokePattern](https://learn.microsoft.com/en-us/dotnet/framework/ui-automation/invoke-a-control-using-ui-automation).


## Local image-response regression and historical access

The initial v1 proportional mapping could saturate both channels on ordinary textured pages and lose direction at the preserved decoder threshold. Version 2 uses categorical band evidence at the decoder’s documented PRC levels; v1 encoding and replay remain preserved. The unchanged circuit, dynamics, thresholds and benchmark protocols were not tuned. A frozen actual workstation-page PNG is now a regression fixture.

A local headless Edge check using the real application and worksheet pixels produced eight actual wheel-driven movements on each page. The disconnected workstation page alternated between scroll positions 0 and 48 px; the worksheet reached 144 px then alternated between 96 and 144 px as band dominance changed. This demonstrates image-dependent feedback and also its limited range on static layouts; it does not demonstrate semantic reading or broad exploration. The live VM’s evolving page still needs verification. [Actual local measurements](results/observation-page-check.json) and [fixture provenance](evidence/observation/README.md).

After the visible Windows Update dialog, SSH began timing out while RDP remained reachable (private check 22:51:54 UTC). The operator has been asked to log in through RDP and start the SSH service. The last deployed VM revision is f2a17d5; later source and the new recorder recovery bundle await deployment. No ten-minute upgraded VM session or native pinning success is claimed.


## Restored VM and recording repair - 12 September 2026

SSH access was restored using the existing Microsoft-signed OpenSSH installation and the original trusted host key. The MSI failure occurred while setting privileges on a missing sshd service; reinstalling over the incomplete service registration was insufficient. The VM is Windows 11 Enterprise Evaluation, build 26200. Source `7f72d2b` is deployed cleanly and builds successfully. The private observer preview is http://127.0.0.1:4319/ through the existing SSH tunnel.

Real native maximization, pixel calibration, dashboard pinning, trusted wheel input and secondary-tab focus now work. Playwright viewport changes had restored the native window; explicit presentation now maximizes it again. At 1:1 observation scale, sensory capture uses the visible Chrome view so scrollbar allocation agrees with native GDI capture. The original scaled benchmark path is unchanged. Native cursor centering during recorded orchestration prevents tab hover cards from covering the page. Distributed pixel comparison still stops input if foreground focus or page geometry changes.

Concurrent archive reads previously blocked the backend event loop long enough to expire the worker heartbeat. Archive reads are now asynchronous, cached and shared across observers; the disabled internal recorder no longer scans the archive. The separately protected SYSTEM publisher remains authoritative.

Background-tab videos continued encoding after a 15-second close timeout, so a still-growing temporary WebM could enter the artifact manifest and fail replay's byte-count check. Page videos are now compact 640 x 360; exact sensory/native PNGs remain at their original resolution. Context finalization gets a bounded 60 seconds, named saves run concurrently, and only successfully saved videos enter immutable evidence. The original recording error is retained alongside any save errors. This follows [Playwright's context-close and video finalization contract](https://playwright.dev/docs/videos). The dashboard explicitly holds an IDLE state during finalization. A targeted manifest regression test rejects mutable temporary videos; build and all 41 tests pass.

The VM transferred to its persistent console at 00:21:23 UTC and reports zero established RDP connections. Worker and backend run as limited interactive tasks at logon, with one-minute failure recovery. The publisher runs as SYSTEM at boot. The old setup terminal's window, shell and console host have closed; the harmless windowless Terminal process was left alone. No automatic login after a cold reboot is configured, so that remains a distinct limitation.

The new native acceptance check **passed for 601.12 seconds** with 5,295 matching observer packets and 85 unique completed/blocked command results, without duplicate results or JavaScript page errors. Both clients used session `session_1789175785381_a881dfe6`. Inspection held a historical decision while the VM continued, replay advanced the recorded state, and Return to live worked. Disconnecting one observer froze its specimen pixels exactly and reconnection returned it to LIVE. All three approved pages were observed.

Episode `exhibit_1789175785397_7a8b8445` completed all 48 decisions and replayed 2,880 sampled states exactly. Its 48 trusted wheel events included seven actual page movements; the remaining attempts reached scroll boundaries. Dashboard movement was 0 to 48 to 0 px; worksheet movement reached 144 px. Main-page focus received 38/48 windows. All three page videos finalised in 19.8 seconds, were hash-verified through the observer API, and decoded/seeking succeeded at 640 x 360 (durations 287-294 seconds). The [published evidence commit](https://github.com/SpecimenArchive/Specimen-Archive/commit/a8dab50f29b28f3f5ecad729b36fef218f6c5ab8) was independently verified: one compact JSON file added with a normal parent commit.

At 01:23:25 UTC, the worker alone was deliberately stopped. The backend stayed running; the UI showed ERROR and its specimen pixels remained exactly held. Restart was requested at 01:23:37 UTC and LIVE was verified again at 01:24:09 UTC in the same backend session. The interrupted 10-decision episode retained failed execution/recording outcomes. Six zero-decision reconnect attempts also retained their real failures. These seven records are expected evidence of this outage, not erased history. One read-only observer request timed out during episode finalization and succeeded on its bounded retry; command requests are never retried.

The unwarped native capture, dark dashboard, light reference and worksheet composites, enlarged apparatus, v4 housing crop and actual responsive views at 390/1024/1440/1920 px were visually inspected. No overflow or page errors were found; expansion/Escape worked. [Dashboard apparatus](screenshots/observation-dashboard-apparatus.png), [light reference](screenshots/observation-reference-apparatus.png), [inspection](screenshots/observation-action-inspection.png), [held capture error](screenshots/observation-capture-error.png), and [machine-readable verification](results/observation-acceptance.json).

All runtime services and data storage are on the VM. The home PC only carries the private observer tunnel, so disconnecting it does not stop the exhibit. Public domain/TLS hosting is intentionally outside this private milestone. Cold reboot still requires station-account login; no claim of unattended reboot acceptance is made.


After recovery, episode `exhibit_1789176227262_c9f6891f` also completed 48 decisions, saved all page videos and reproduced 2,880 sampled neural states exactly. The next intact episode started automatically. This confirms a full successful episode after the deliberate interruption, beyond merely reconnecting a socket.
