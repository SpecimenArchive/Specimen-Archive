# Validation

All values below originate from runnable code and saved output. An assumed-model test is not biological validation.

## Controlled circuit response

Command: `npm run validate:science`. Full result: [results/validation.json](results/validation.json).

Protocol: integrate at 0.01 s for 2 s of darkness, then apply fixed 0.85 input to the designated eye side for 12 s. Feedback through the environment is bypassed **for this controlled probe only**. All runs share the same initial state. Threshold latency is time after onset until mean motor activity exceeds 0.05. No motor response is hardcoded.

| Condition | Left motor activity | Right motor activity | Speed (virtual μm/s) | Threshold latency |
|---|---:|---:|---:|---:|
| Intact, left input | 0.571469 | 0.566093 | 34.3015 | 1.17 s |
| Photoreceptor output disconnected | 0 | 0 | 7.0000 | Not reached |
| INton output disconnected | 0.518807 | 0.477143 | 30.9028 | 1.49 s |
| Intact, dark | 0 | 0 | 7.0000 | Not reached |
| Intact, right input | 0.573189 | 0.564712 | 34.3096 | 1.17 s |
| Seeded target shuffle | 0.340786 | 0.549945 | 28.3776 | 0.16 s |

Interpretation: actual connections propagate sensory activity into motor modulation. Disconnection of all PRC outputs abolishes that modulation. INton removal changes but does not abolish the response because other anatomical routes remain, including the direct IN1→INsn path. Changing input direction changes the output, but both sides converge strongly and final steering does not reverse sign. **The model does not establish accurate visual navigation or biological phototaxis.**

The shuffled control permutes edge targets with seed 7101, retaining source endpoint counts and target endpoint counts; weights travel with their edges and are normalized against the shuffled incoming total. It does not preserve anatomical reciprocity, avoid multi-edges or preserve weighted in-degree. It tests sensitivity to topology, not an ensemble statistical significance claim.

Repeated intact runs are exactly identical in the same runtime. A 40,000-step / 400 simulated-second test checks bounded activity, chamber positions and event history across multiple illumination changes. Restoring the entire internal state and continuing produces the same future state as uninterrupted integration.

## Neuron-level trace

Command: `npm run trace`. The output captures a real deterministic closed-loop episode around the scheduled onset at model time 16 s. Files: [sample-trace.json](results/sample-trace.json), [sample-trace.csv](results/sample-trace.csv).

The explicit path is `PRC_al3 #6743 → IN1_pr #37580 → INsn_l2 #57553 → MN1_l #108826`. Its edges and integer source synapse weights are included. The JSON also records every selected neuron's activity, the inspected cells' incoming normalized terms, sensory inputs, environment, motor decoding and resulting pose. These instantaneous incoming terms describe the sampled state; the synchronous integrator used the preceding time step. A direct connection path is not a decomposition of total causal contribution.

No fabricated wall-clock timestamps are inserted into this deterministic example. The screenshot study uses an actual recorded server state separately saved as `render-study-state.json`.

## Automated checks

`npm test` checks provenance hashes and category accounting, circuit response, interventions, determinism, checkpoint continuation, bounded long-running state, closed-loop sensory feedback and recording/readback error handling. Small synthetic fixtures are labelled as fixtures and never served as the specimen graph. `npm run typecheck` and `npm run build` check the complete application.

Transport and browser tests verify live snapshot agreement across clients, reconnect/resync, observer-only endpoints, stale/offline labelling, archive playback, content routes, overflow and renderer behaviour. Their actual machine output is saved under `docs/results/`; unresolved checks are recorded in `STATUS.md` until completed.

## Measured performance

Command: `npm run benchmark`. Full machine-specific report: [benchmark.json](results/benchmark.json).

Initial measurement on AMD Ryzen 9 5950X, Windows 10.0.22631, Node 24.11.1: 100,000 steps (1,000 simulated seconds) completed in **254.13 ms**, approximately **393,499 steps per wall second**. RSS after the loop was approximately 73.9 MiB. The benchmark is deliberately faster than the live paced engine; the configured observation still runs at 0.5× time and targets 20 snapshots/s. Serialization was measured separately at 10,000 packets in 144.15 ms, averaging 3,022.9 bytes per packet. Those are measurements of this implementation and machine, not deployment promises.

Browser recording metrics include the overhead of software headless rendering and video encoding. An early per-primitive blur approach caused a 121.7 ms median frame interval and was rejected. Depth contrast and a small number of optical compositing passes replaced it. The final movement-capture report records the resulting intervals; do not confuse capture frame timing with server model update rate.

## Limits

There is one reconstructed individual and a selected subcircuit, no functional efficacy calibration, no validated receptor-sign map, no complete body biomechanics and no evidence for higher cognitive claims. The chamber and optical scale are virtual. Rendered granules and anatomical drawing coordinates are not reconstructed cells. Server gaps are disclosed; no uptime is invented. Local disk retention is bounded, so long-term archival storage requires an explicit later product decision.
