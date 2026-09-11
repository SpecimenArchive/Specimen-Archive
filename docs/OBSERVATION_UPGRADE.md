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

`server/exhibit/observation-encoder.ts` defines a new, separately identified `observation-contrast-v1` profile. It samples every second pixel in two bands: x 8–92%, upper y 12–46%, lower y 54–90%. Luminance is 0.2126 R + 0.7152 G + 0.0722 B; each band reports mean and standard deviation. Combined contrast below 3 supplies zero drive. Otherwise contrast strength is capped at 1 using a 48-unit scale, and each side receives 0.15 + 0.5 × strength × its contrast / maximum band contrast. These are explicit engineering mappings, not measured retinal responses.

The unchanged 47-cell rate engine integrates 600 steps × 0.01 model seconds. The existing motor decoder waits below M=0.500; otherwise D=MN3_r−MN2_r above/equal 0.008 selects +48 px, and below selects −48 px. This observation profile dispatches wheel inputs only. It cannot read or understand page content. The original coloured-target move/click/scroll benchmarks remain separate and unchanged.

The main dashboard receives 38 of 48 decision windows; approved eLife and local worksheet visits receive five each. Native pinning, page preparation/focus and cursor placement for wheel delivery are recorded as orchestration. Future neural commands are unknown until decoded. Accepted commands and predetermined tab changes alone populate QUEUED.

Each decision retains its exact before/after PNGs, native desktop captures, page identity, sampling values, every sampled neural state, thresholds, decoded command, trusted input events and measured scroll change. Scroll offsets are verification only and cannot reach the encoder or decoder. Zero displacement at a page boundary is blocked rather than counted as a successful movement. Record execution, video recording and publication statuses are separate.

## Observer interface and metrics

The large apparatus, specimen, sensory/neural panel and direct desktop share the same render packet. Inspection replays a recorded decision locally while the VM continues. Pause follow holds feed rows without stopping execution. Repeated waits are collapsed with count and duration. Model outputs are never extrapolated across missing samples.

Active units use activity >0.1 in the current snapshot. Sensory imbalance is right minus left encoded drive. Motor drive is the actual six-cell mean. Executed/min counts verified page movements in the preceding 60 wall seconds; cumulative executed and attempted counts are separate. Capture-to-action latency uses the last input capture and dispatch timestamps. Capture cadence uses the last ten seconds; decision interval uses the last twenty decisions. Missing telemetry displays as unavailable.

## Publication and storage

The recorder uses `specimen-records`, independently of source `master`. It writes a compact record with normal Git commits, reads the remote bytes and commit back, and recovers an existing identical record after lost receipts. Concurrent pushes retry at most three times. Recorder passes attempt at most four records; failures use exponential backoff capped at fifteen minutes and stop after five attempts. Raw videos/continuous captures and credentials remain outside ordinary Git.

## Verification checkpoint

Local typecheck/build, 38 tests, changed PowerShell syntax and C# compilation pass. New pixel-contrast tests produce opposite scroll directions; motor clamping and photoreceptor disconnection abolish actions. A real local Git transport test verifies concurrent publication, lost-receipt recovery and refusal to overwrite conflicting bytes. The large frontend was inspected at 390, 1024, 1440 and 1920 px using the existing VM stream: no overflow or browser errors. Native maximisation/pinning and the new observation profile still require VM deployment and end-to-end acceptance; no ten-minute upgrade result is claimed at this checkpoint.

The requested visual reference was [flybrain.online](https://flybrain.online/) and its [source repository](https://github.com/fruitflydev/flycoinrh). Its sensory/activity/motor relationship informed hierarchy only; fly neuron names, spike/voltage metrics, learning and wallet activity were not adopted. Publication access follows [GitHub's repository deploy-key mechanism](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/managing-deploy-keys); native pinning uses Windows UI Automation's [InvokePattern](https://learn.microsoft.com/en-us/dotnet/framework/ui-automation/invoke-a-control-using-ui-automation).
