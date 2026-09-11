# Methods — Specimen 01

## Scope

Specimen 01 is a synthetic, observation-only digital specimen. Its anatomical connectivity comes from a published reconstruction; its dynamics, virtual environment, functional gains and rendering are implemented here. It is an inspectable assumed model, not a validated replica of animal behaviour, a pretrained brain, an experiment on a living animal or evidence of consciousness.

The active model contains **47 neurons, 161 directed connections and 711 anatomical synapses**. The explorer contains all **2,675 nodes** of the imported filtered graph. Fragments, effectors, other cells and unselected neurons receive no model activity. An absent activity value means **not modelled**, never a measured zero.

## Data boundary

`scripts/ingest.py` decodes the published Figure 2 RDS object. The igraph source/target arrays are zero based and are converted to the preserved skeleton IDs. Integer edge weights count chemical synapses. The script asserts graph counts, positive integral weights and unique node IDs, and writes byte-level checksums.

Selection starts with celltype1 (visual PRC), celltype2 (primary/related visual interneurons), celltype3 (INton), celltype57 (INsn), celltype104 (INdc), and celltype84–86 (MN3, MN1, MN2). It keeps only candidate cells both reachable from PRCs and able to reach a selected motor neuron using directed candidate edges. Six candidate cells are consequently excluded. The final set is 21 sensory neurons, 20 interneurons and 6 motor neurons. The graph is induced on these cells: no synthetic edges are added and no weight is replaced by a random value.

Cell names, classes, type annotations and sides are source labels. The source x/y values are a force-directed graph layout, **not anatomical coordinates**. We do not infer neuron transmitter or developmental status from a fly-specific rule or an unclassified fragment.

## Continuous dynamics

For each neuron, dimensionless activity `a_i` lies between 0 and 1. This is a non-spiking rate model: percentages in the interface mean `100 a_i`, not firing rates or membrane voltage.

```text
W_ji = synapse_count(j → i) / sum_k synapse_count(k → i)
u_i  = 1.15 × sum_j W_ji a_j                  (interneurons and motors)
u_i  = 1.40 × I_eye                          (photoreceptors)
da_i/dt = [tanh(u_i) − a_i] / tau_i
a_i(t + dt) = a_i(t) + dt × da_i/dt
```

All neurons update synchronously from the previous step. Euler integration uses `dt = 0.01 s`. Time constants are 0.12 s for photoreceptors, 0.28 s for interneurons and 0.42 s for motors. There is one discrete step of propagation per edge, with no additional axonal conduction delay. Incoming normalization uses the selected circuit's total weight, not the full graph's omitted inputs. Removing an edge in an intervention retains its intact denominator so the other edges are not artificially amplified.

These time constants, gains and effective positive signs are **assumptions**. Anatomical synapse counts are not calibrated functional efficacy. The visual-navigation paper reports glutamatergic photoreceptors and cholinergic motor identities, but transmitter identity does not establish receptor effect or per-edge efficacy. Uncertain interneuron signs remain explicitly unassigned biologically; the implemented exploratory model uses positive effective coupling for all selected edges. There is no fitted parameter set, spike threshold or invented neurotransmitter certainty.

Recurrent positive coupling can sustain activity after a stimulus. Bilateral convergence limits directional contrast, and the model does not reproduce all measured navigation properties. The current intervention results show causal dependence on the selected wiring; they do not validate these assumptions.

## Virtual environment and sensory encoding

The server advances a six-phase illumination schedule every 16 simulated seconds: dark adaptation, left light (0.85), right light (0.85), low right light (0.24), oblique light (0.72), and dark recovery. It repeats every 96 simulated seconds. This schedule is conventional experiment code and is never chosen by the neural model.

The environment is a 2,000 × 2,000 virtual μm periodic chamber. A smooth positional factor and directional shading encode the two visual inputs:

```text
spatial = 0.85 + 0.15 cos[(x sin(phi) − y cos(phi)) / 600]
I_side  = intensity × spatial
          × [0.15 + 0.85 max(0, cos(phi − heading − side × pi/2))]
          × [0.85 + 0.15 cos(roll)]
side = −1 for left, +1 for right
```

Left/right labels come from source annotations. Eye optics and placement are simplified; no optical measurement is claimed. Every pose update changes subsequent sensory input through heading, roll and position. The controlled intervention protocol deliberately replaces this encoder with fixed inputs so comparisons share the same input history; the live engine and sample trace retain the feedback loop.

## Motor decoder and visible movement

Motor activity is averaged over the three selected source-labelled motor somata on each side. Soma side is a convenient model readout; it is **not a reconstruction of all axonal projections or muscle-side targeting**.

```text
L, R          = mean activity of selected left/right motor neurons
forward speed = 7 + 48 × (L + R)/2                    virtual μm/s
turn rate     = 2.4 × (R − L)                         rad/s
heading      += turn rate × dt
bend target   = tanh(0.8 × turn rate), tau_bend = 0.35 s
roll rate     = 0.18 + 0.7 × (L + R)/2                 rad/s
cilia rate    = 9 + 6 × (L + R)/2                      cycles/s
dx, dy        = speed × [sin(heading), −cos(heading)] × dt
```

A separate passive flow of `(0.45, 0.12)` virtual μm/s is added before chamber wrapping. The 7 μm/s basal ciliary translation, oscillator, roll mapping, bend mapping and optical tracking are conventional code. The **modulation** of speed, roll, cilia and bend depends on neural output. No heading term points directly towards the stimulus; no successful navigation is hardcoded. Reversing light in this model need not reverse steering or produce biological phototaxis.

## Observation optics

The accepted renderer uses a synthetic microscopy-style photographic base grounded in 72 hpf references. A registered residual matte separates the specimen from a fixed water background. Bounded local bending, internal tissue displacement and independently moving peripheral ciliary/chaetal fields use the same streamed neural/motor state. The head and six attachment regions explicitly exclude the ciliary phase warp. The view uses constrained orientation and does not claim unrestricted 3D reconstruction. See [Photographic rig](PHOTOGRAPHIC_RIG.md) for exact masks, optical assumptions and measured regressions.

The image is synthetic optical presentation, not biological evidence or a measured neuron map. Generated asset prompts and provenance are stored beside the images. The renderer keeps physical proportions across viewport sizes, interpolates received states and never extrapolates active motion after a signal loss. Browser mode uses the controller's own neural state and accelerated model time; the original light experiment uses 0.5? wall time. View and neuron-selection controls cannot alter either model.

## Time, transport and persistence

The configured model speed is **0.5 simulated seconds per wall second**. Integration is fixed-step; the local scheduler accumulates elapsed time. Large scheduling gaps are recorded and catch-up is bounded to prevent a resumed sleeping machine from making an unobserved leap.

Version-1 WebSocket packets include run ID, monotonic sequence, ISO wall timestamp, model time, wall elapsed time, pose, environment, all 47 activities, motor/sensory readouts and recent events. They are state snapshots rather than fragile deltas. The server runs with no observer attached. It sends at a target 20 Hz; actual measured throughput is in the transport report.

Clients reject duplicate/out-of-order sequences within a run, reconnect with bounded exponential backoff and accept an authoritative resync frame. After 1.5 seconds without a valid frame, LIVE becomes STALE; a closed socket is OFFLINE. A slow client exceeding 64 KiB buffered output is disconnected with a resync instruction. The observer interface has no experiment-mutation endpoint. Services bind to 127.0.0.1.

The engine holds at most 80 events; a client keeps at most 600 snapshots. Local JSONL recording occurs at 5 Hz. An atomic state checkpoint and session metadata are written every five wall seconds. Recorded segments rotate every 120 simulated seconds, retaining at most 12 segments; archive reads are capped at 1,500 frames. Old automatically retained runtime segments are pruned, while review artifacts under `docs/` remain unchanged. Graceful shutdown saves a final checkpoint. Unfinished older sessions are marked interrupted at startup. A new run ID records the restart gap; the engine does not pretend the stopped interval was simulated.

## Reproduction

Run `npm run trace` for the documented closed-loop trace, `npm run validate:science` for controlled interventions, and `npm run benchmark` for local measurements. `docs/results/` contains the real outputs. `server/model/config.ts` holds the complete deterministic parameter set. See [validation](VALIDATION.md) for protocol limits and [data provenance](DATA_PROVENANCE.md) for sources and reuse terms.

## Browser action experiment

The browser mode replaces the scheduled light input with captured PNG information and uses a separate documented mouse decoder. The same neural engine drives both the graph and specimen presentation. Browser screenshots, actions and all sampled neurons share a run/decision/model-step identity. Its six-simulated-second integration windows, matched interventions, exact replay and record formats are documented in [BROWSER_CONTROLLER.md](BROWSER_CONTROLLER.md). This mode does not use the original continuous model scheduler or its restart checkpoint; every trial explicitly starts from zero state. Browser records are separate from bounded continuous light telemetry. One suite contains nine trials; repeated suites are opt-in and their evidence remains in runtime until deliberately archived or removed.
