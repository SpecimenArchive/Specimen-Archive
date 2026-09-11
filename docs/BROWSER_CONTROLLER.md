# Executable neural browser control

## What is demonstrated

A captured 640 × 360 browser viewport becomes two sensory drives. The existing 47-neuron rate engine propagates those drives through the selected published wiring. A fixed decoder reads six computed motor activities and produces horizontal mouse movement or activation. Playwright executes those commands, and its next screenshot closes the loop. This is a deliberately constrained colour/lane task, not general browser intelligence or evidence that an animal naturally controls a mouse.

Source: [Verasztó et al., 2025, Figure 2 source data](https://elifesciences.org/articles/97964/figures), DOI 10.7554/eLife.97964.3. See [data provenance](DATA_PROVENANCE.md) for download, transformation and checksums, and [the audit](CONTROLLER_AUDIT.md) for the pre-existing implementation.

## Execute

Node 24, npm and Chromium are required. On Windows the default browser channel is installed Microsoft Edge; on other platforms install Playwright Chromium. `PLAYWRIGHT_CHANNEL=chromium` also selects the bundled browser on Windows. No GitHub login is required for local trials.

```sh
npm ci
npx playwright install chromium
npm run demo
```

Open http://127.0.0.1:4317. The observation interface is read-only; a separate isolated local browser receives the controller's actions. Closing the observer does not stop the trial. The demonstration repeats matched intact/motor-disabled/photoreceptor-disconnected trials. Stop with Ctrl+C. Model time advances in explicit accelerated integration windows and is displayed separately from wall time.

```sh
npm run browser:validate                # nine matched real-browser trials
npm run browser:validate -- --export    # also export bounded evidence to docs/evidence/browser
npm run browser:replay                 # recompute exported evidence from its PNGs
npm run browser:replay -- runtime/browser/<run-id>
npm run browser:calibrate              # constant-input probes, no task outcomes
npm test
npm run build
```

For fast diagnosis append `--fast` to validation. It changes wall pacing only, not neural integration or the action budget. Normal recordings retain 600 ms minimum per six simulated seconds so the actions can be watched.

## Published structure and assumed computation

The imported graph contains 2,675 nodes and 14,066 directed connections. The induced visual/postural circuit computes 21 photoreceptors, 20 interneurons and six motor neurons using 161 connections / 711 anatomical synapses. Every active neuron has its published ID. This excludes most of the animal's nervous system. `data/processed/circuit.json` carries the full active edge list and selection description.

`RateNetwork` uses synchronous Euler updates at dt=0.01 simulated seconds:

`a_next = a + dt/tau × (tanh(input) − a)`

Photoreceptor input is 1.4 times its encoded drive. Other cells receive 1.15 times the sum of preceding-step source activities weighted by each edge's synapse count divided by its target's incoming total. Time constants are 0.12 s sensory, 0.28 s interneuron and 0.42 s motor. Activity is bounded, dimensionless and non-spiking. All effective signs are positive assumptions; no membrane voltages, spikes or measured firing rates are claimed. Dynamics are deterministic; seed 7101 belongs to the optional shuffled-network control, while the browser fixture has its own recorded target seed.

## Screenshot encoder

`server/browser/encoder.ts` accepts only PNG bytes from `page.screenshot()`, decoded by pngjs. It has no Page, DOM locator, seed, target configuration or success-checking interface.

All pixels are scanned. Green target pixels satisfy G>145, R<120, B<150 and G>1.4R. Cyan cursor pixels satisfy B>235, G>210 and R<70. The two masks yield pixel counts and centroids; at least 400 target and 20 cursor pixels are required. Missing signal drives both sensory channels to zero. Horizontal target-centroid minus cursor-centroid error determines the encoding:

| Image condition | Left drive | Right drive |
|---|---:|---:|
| Error < −18 px | 0.65 | 0.15 |
| Error > +18 px | 0.15 | 0.65 |
| Absolute error ≤18 px | 0.85 | 0.85 |
| Insufficient pixels | 0 | 0 |

Drives are assigned to actual photoreceptors by the existing L/R anatomical name mapping; unassigned sensory cells would receive the mean. This is an engineered visual preprocessing rule. It extracts coordinates from pixels; it never reads privileged target coordinates. The initial task restricts target and cursor to one horizontal lane. It does not solve vertical navigation, arbitrary colours, distractors, page scrolling or natural images.

## Motor decoder and execution

Each captured image is held for 600 model steps (six simulated seconds), with persistent neural state between images. No neural reset occurs between decisions. Sixty samples per decision record all 47 states at 0.1 simulated-second intervals; replay reconstructs every integration step.

Let M be the arithmetic mean of all six motor activities. Let D be activity of MN3_r (#1732111) minus MN2_r (#359142).

1. M <0.50: wait, with no mouse event.
2. Otherwise M ≥0.593: mouse down/up at the current cursor, producing a real click.
3. Otherwise D ≥0.008: move +24 px; D <0.008: move −24 px. Vertical displacement is zero.

The page boundary clips cursor x to [10,630]; there is no target snapping. These thresholds are engineering choices from independent constant-input probes in `docs/results/browser-calibration.json`, not fitted biological parameters. The other four motor cells contribute to the population gates. The raw left/right motor-average difference is insufficiently selective for this task.

`decoder.ts` receives motor values only. `executor.ts` receives the decoded command and uses [Playwright mouse events](https://playwright.dev/docs/api/class-mouse); it never uses a selector to activate the target. Target construction, navigation and initial cursor placement are explicitly recorded setup automation. The task's real HTML button changes its text, colour and outcome banner on click.

## Evidence and causality

Every trial has 16 decisions, regardless of success, with identical seeds/action budget across intact, all-motor-clamped and photoreceptor-output-disconnected conditions. Each trial starts from zero activities and the same pose. The motor intervention clamps the six motor cells to zero after every network step. The pathway intervention removes outgoing photoreceptor edges while leaving the encoded sensory activity present. Expected result: both prevent browser commands even though pixels still contain the target. The evaluator reads the page outcome only after all decisions; its result cannot change the controller's behaviour.

Per-run `record.json` includes real start/end times, run ID, source revision and dirty flag, exact circuit SHA-256, model/data/encoder/decoder versions and parameters, browser/Node versions, seed, active neuron IDs, setup actions, decision-level sensory measurements, six motor values, decoded commands, executed browser events (including isTrusted), outcomes and artifact hashes. `trace.json.gz` stores all sampled neural states, sensory values, pose and model steps. `frame-NNN.png` records each actual observation, and `browser.webm` records the [browser context](https://playwright.dev/docs/videos). Model seconds, wall timestamps, pixel coordinates and dimensionless activity are separate quantities.

`browser:replay` re-encodes the recorded PNGs and reruns the engine; it compares saved neural activity, motor values and commands exactly and checks executed events against decoded commands. Replay never executes browser actions. The recording is visual evidence; paired interventions and exact trace reconstruction establish this engineered model's causal involvement.

The first development trial failed: the original cursor mask included antialiased text, causing a displaced centroid and misplaced clicks. Its artifacts remain locally recorded and the captured failure frame is a regression fixture. The corrected mask is version 2. Final measured trial counts and source revision are in `docs/evidence/browser/summary.json`; unsuccessful interventions are retained, not excluded.

## Public records

Continuous telemetry remains in ignored `runtime/`. `--export` saves one bounded evidence suite for review and replay. Specimen Recorder publishes compact result records at trial boundaries to the separate `specimen-records` branch. The record identifies automation explicitly; Git author/committer is Specimen Archive. Dirty/unversioned executions remain pending. Read-back verification and immutable run IDs prevent duplicate publication after retries. Actual commit receipts are linked in the observation feed; pending or failed states never display a successful publication.

Use `.env.example` for the optional GitHub destination. Enable `RECORDER_ENABLED=1` only when the executed source has been committed and pushed. Authentication uses `gh`'s normal secure credential flow; credentials never enter records or Git. [Development trail](DEVELOPMENT_TRAIL.md) documents the scope.
