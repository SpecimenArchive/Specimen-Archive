# Specimen Archive status

## Current priority
Demonstrate verifiable pixels -> published neural wiring -> actual browser actions, with replay, matched interventions and public compact evidence. Preserve the accepted photographic rig and original light-selection experiment.

## Implemented and checked
- Published 72 hpf Platynereis graph: 2,675 imported nodes, 14,066 edges; active 47-neuron/161-edge/711-synapse circuit. Traceable IDs and source checksums are retained.
- Deterministic non-spiking rate engine, full neuron state, motor-driven specimen pose, streamed observation, storage and light-integral experiment.
- Photographic tissue rig accepted after head and six bristle-root fixes; integrated with fixed-aspect resizing and authoritative-state freeze.
- PNG-only retinal encoder, persistent neural computation, fixed six-motor decoder, Playwright mouse executor and isolated HTML button task.
- Initial browser test failed because the cursor colour mask included antialiased text. The captured screenshot is now a regression fixture; corrected encoder v2 passes.
- Development suite: three intact seeded trials activated the real button; three motor-clamped and three photoreceptor-disconnected trials did not, with zero controller events. All nine reconstructed 960 sampled neural states and 16 decisions exactly. The final paced suite is exported under docs/evidence/browser from clean source e9c1c04. It independently reproduced the same outcomes, with exact replay for all 8,640 recorded states and 144 decisions.
- 20 automated tests and production build pass. Production UI verification passed: 12 browser/neural packet alignments, exact offline freeze, reconnect, recorded replay, narrow layout and HTTP 405 for mutations.
- Public repository is https://github.com/SpecimenArchive/Specimen-Archive. Project-local Git author and committer are Specimen Archive. Six earlier checkpoints are published. Recorder messages and record contents identify Specimen Recorder automation.

## Current acceptance evidence
- Final local suite: intact 3/3 activated, motor-clamped 0/3, PRC-disconnected 0/3; all nine exact replays. Every run has sourceDirty=false.
- Independent GitHub Linux browser suite repeated the same outcomes; Windows/Linux tests and builds passed. Workflow 34609432609.
- All nine final compact records were published by Specimen Recorder. Actual commit receipts are bundled and visible in the evidence viewer/feed. Real receipt-loss recovery kept one commit before and after.
- Production UI: 12 synchronized packet checks, exact offline freeze, reconnect, recorded replay, no 390px overflow, HTTP 405 for mutations.
- Interrupted trial closes its browser, saves video, records the interruption and executes no partial-window action. Tampered commands are rejected by replay.
- Original microscopy fixed-background/freeze checks pass; original stream measured 19.78 snapshots/s with two identical observers.
- Final repository evidence/documentation checkpoint and cross-platform exported-trace replay are being verified.

## Commands
- npm run dev: original continuous microscopy/light experiment on port 4317.
- npm run demo: one nine-trial browser suite with synchronized observation on port 4317.
- npm run demo:loop: repeated suites (optional).
- npm run browser:validate -- --export: actual paced browser trials and bounded evidence export.
- npm run browser:replay: reconstruct exported evidence from PNGs.
- npm test; npm run typecheck; npm run build.

## Boundaries
The initial task is one horizontal lane with a known visual colour treatment. Positive neural signs, rate dynamics, retinal encoding and mouse decoder are engineering assumptions, not measured larval behaviour. The full imported graph is available for inspection but only 47 neurons compute. Synthetic specimen imagery is optical presentation, not biological evidence.
