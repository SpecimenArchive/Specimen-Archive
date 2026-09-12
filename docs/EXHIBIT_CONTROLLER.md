# Continuous controlled-browser exhibit

> Historical implementation checkpoint. The active external Windows profile and public domain are documented in [EXTERNAL_CONTROL_AUDIT.md](EXTERNAL_CONTROL_AUDIT.md) and [PUBLIC_DEPLOYMENT.md](PUBLIC_DEPLOYMENT.md). Earlier self-dashboard schedules below are preserved history, not the current runtime.

The frozen horizontal benchmark remains in `server/browser` with its original nine published trials. `server/exhibit` adds a separately versioned, bounded two-page task; it reuses the same neural engine and six motor cells. No LLM selects actions. There is no wallet, token creation or transaction execution. `$LARVA` is exhibit identity only.

## Exact computation boundary

`runner.ts` captures a 640 × 360 PNG. `controller.ts::encodeExhibit` receives that PNG and a fixed alternating phase (`point`, `scroll`), never a Page, target coordinate, seed, DOM selector or evaluator. The original colour encoder detects green target pixels and cyan cursor pixels. A centroid is valid at 400 target pixels and 20 cursor pixels. Pointing is enabled only when the observed vertical error is within 24 px. Then the original ±18 px horizontal tolerance chooses left/right/aligned drives: (0.65,0.15), (0.15,0.65), or (0.85,0.85).

In the scroll phase, a target below/above the cursor lane produces right/left drives. If no target is visible, at least 24 amber pixels in the bottom fifth of the screenshot represent the page's visible down-arrow affordance and produce right drive. Otherwise drives are zero. The page's arrow is ordinary visible assistance; its DOM logic is confined to the task page and is not read by the controller. Green highlighting, cyan cursor, a horizontal cursor lane, alternating phases and this arrow are engineered assistance, not larval vision.

Each captured input is held for **600 actual Euler steps × 0.01 model seconds = 6 model seconds**. All 47 neurons compute every step; all states are retained every 10 steps (0.1 model s). The live runner paces the window over 3 wall seconds, without shortening neural integration. The specimen interpolates received model states at display cadence and never extrapolates beyond them. Captures and browser events add wall-clock overhead. Model time, input capture time, action start/end, recapture time, and packet delivery time are separate fields.

The network is the existing non-spiking `rate-v1`: positive effective coupling, incoming synapse-count normalization, tanh activation, time constants 0.12 / 0.28 / 0.42 model seconds. These dynamics, signs and gains are assumed. Source neuron IDs and edge weights are published anatomy. The active circuit has **21 PRCs, 20 interneurons, 6 motor neurons; 161 edges and 711 synapses**. The imported 2,675-node graph is available but is not all computed. See [METHODS.md](METHODS.md) and [DATA_PROVENANCE.md](DATA_PROVENANCE.md).

## Inspectable motor mapping

`M` is the mean of the six actual motor activities. `D = MN3_r #1732111 − MN2_r #359142`. Both are dimensionless rates, not voltages, spike counts or measured muscle forces.

| Condition | Point phase | Scroll phase |
|---|---|---|
| M < 0.500 | Wait | Wait |
| M ≥ 0.593 | Mouse down/up at current cursor | Wheel direction from D |
| 0.500 ≤ M < 0.593 | Move +24 px if D ≥ 0.008, otherwise −24 px | Wheel +48 px if D ≥ 0.008, otherwise −48 px |

The decoder accepts only these computed motor outputs and the target-independent phase. Fixed alternation is an engineering channel multiplex, not a neural decision. Cursor coordinates are execution state; x is bounded to [10,630], y stays 216. There is no vertical cursor controller, general page understanding, target snapping or corrective fallback. Scrolling brings targets into the lane. The executor uses `page.mouse.move`, `wheel`, `down` and `up`; never `locator.click`, automatic scroll-into-view or an evaluation script to act.

## Sessions, assistance and evidence

One backend creates one session independent of observers. Every episode starts an isolated browser and zero neural state, sets up a seeded two-page local task, navigates to its first page and positions the cursor. These supervisor actions are explicitly stored under `setup`, with command ID null. Each episode has a fixed 48-window budget; only after that does the evaluator read navigation/activation. Success does not stop or guide the controller. Timeout is 240 wall seconds; a failed episode is recorded, then the supervisor resets after 2 seconds. Operator shutdown aborts integration before any partial-window command. `EXHIBIT_FAULT_AFTER` injects one explicitly labelled development browser-close fault in the first episode.

All controller events have a unique command ID, run ID and session ID. A decision links input PNG/hash and capture timestamp → encoded drives → model steps and all retained neuron states → motor readout and decoder → trusted input events and navigation → next PNG/hash. `replay.ts` reexecutes the PNG sequence and checks all recorded states, commands, cursor continuity, trusted event coordinates/types and artifact hashes. Replay in the dashboard is local observation; it cannot execute or reset anything.

WebSocket packets are authoritative and numbered independently of model steps. A reconnect receives the current session. The specimen, signal panel, browser, apparatus monitor and selected event all share the same observation context. The monitor uses projective texture mapping into the fixed apparatus plate. The bench and optical layer retain their calibration; the captured desktop and recorded motor state supply the changing instruments. A stale/disconnected observer freezes at its last state.

Raw PNGs, per-window compressed neural states and videos live under ignored `runtime/exhibit`. Eight raw episodes and 200 compact episode records are retained; buffers hold 600 display states, 24 recent event summaries and at most 48 decision windows. Slow WebSocket observers are disconnected above 256 KiB queued output and can resync. New continuous images/videos are not committed to ordinary Git. The Specimen Recorder uses existing immutable records and receipt verification, publishing only at completed experiment boundaries. Dirty source and disabled or failed authentication remain accurately pending/failed. Existing baseline evidence in Git is preserved.

## Reproduction and limits

`npm ci`; `npx playwright install chromium` (Windows defaults to installed Edge); `npm run dev`. For Chromium on Windows set `PLAYWRIGHT_CHANNEL=chromium`. `npm run exhibit:validate` executes the fixed held-out matrix and matched interventions. `npm run exhibit:replay -- runtime/exhibit/<run-id>` reconstructs an episode. `node scripts/exhibit-endurance.mjs` runs two real observers for at least ten minutes with a 45-second recording, archive inspection and reconnect. Use `npm run observe:light` for the preserved original light-integral experiment, and `npm run demo:baseline` for the finite original browser suite.

The extended held-out matrix is fixed before execution: seed 503 standard layout, seed 607 offset layout, seed 809 low contrast. Each is run intact, with all motor outputs clamped, and with PRC input disconnected. The predeclared expectation is that the two interventions abolish actions; low contrast can defeat the fixed colour mask. Report the observed outcomes, including any timeout, without tuning on this matrix. New tuning requires a version increment and fresh held-out cases.

The [flycoinrh README](https://github.com/fruitflydev/flycoinrh) informs the architectural separation of a persistent neural/browser process from observers and failure recovery. No fly neurons, spike dynamics, learning rules, transaction scripts or language-model journal were imported. [Playwright input](https://playwright.dev/docs/input) specifies the genuine mouse API. Published 72 hpf imaging references are [eLife 02730](https://elifesciences.org/articles/02730), [26000](https://elifesciences.org/articles/26000) and [97964](https://elifesciences.org/articles/97964), with the [source atlas](https://jekelylab.github.io/Platynereis_connectome/).

## Workstation presentation correction

The earlier workstation checkpoint ran its controlled browser visibly in an isolated Linux desktop. The configured remote Windows observation profile is documented separately in [the upgrade report](OBSERVATION_UPGRADE.md). The exact page PNG remains the sole sensory input; a separately captured desktop supplies the apparatus. Fast causal validation remains headless.
