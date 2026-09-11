# Browser-controller audit

The existing `Engine.step()` calls `environmentAt()`, then `RateNetwork.step(left, right)`, then `decodeMotor()` and `advancePose()`. It genuinely computes all 47 activities from 161 imported directed connections. The graph retains the published neuron IDs and synapse counts. The active circuit contains 21 photoreceptors, 20 interneurons and six motor neurons; it is a selected subset of the 2,675-node imported graph, not a whole-animal simulation.

Before this increment, input was a scripted light schedule with an assumed pose-dependent encoder. WebSocket snapshots and the photographic rig used computed state. The motor-integral experiment selected a subsequent light condition. Neither implementation captured browser pixels or executed mouse events. Consequently, those demonstrations alone did not establish neural browser control.

The browser experiment reuses the same `Engine`, `RateNetwork`, imported graph and dynamics. It adds a PNG-only retinal encoder, a fixed motor decoder, an executor using Playwright mouse events, and an independent evaluator. A one-dimensional lane task is intentional: it can test the complete causal chain without claiming general browser competence or biological mouse-control behaviour.

Anatomy is published; positive effective connection signs, rate time constants, left/right sensory encoding, stimulus hold periods and cursor decoding are engineering assumptions. In particular, the convergent circuit's raw left/right motor averages do not provide an adequate directional decoder. The browser mapping instead reads the computed MN3_r–MN2_r contrast and the six-motor population mean. Numerical probe results and fixed thresholds are recorded separately from task trials.
