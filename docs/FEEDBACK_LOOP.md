# Motor-integral light experiment

The original observation experiment remains available with `npm run observe:light`. It uses the existing pose-dependent light encoder and rate network. After 16 model seconds of dark recovery, integrate all six motor activities over an eight-second left-light probe with fixed dt=0.01 s. The engineering selector computes D = integral(R − L) dt, where L and R are three-cell side averages.

If D ≥0.05 activity·model seconds, execute right light. If D ≤−0.05, execute left light. Otherwise record that no threshold was reached and execute darkness. Observe the selected condition for eight model seconds. Repeat every 120 model seconds. The experiment supervisor applies this fixed threshold protocol and records the selected illumination.

`server/experiment.ts` records initial state, source/data versions and hashes, exact configuration, all motor integrals, selected condition and the measured response. The checkpoint saves the partial integral with the engine state. `npm run validate:feedback` compares intact, right-motor-clamped and all-motor-clamped runs and verifies deterministic reconstruction. The recorded decisions are right, left and no-threshold/dark respectively; exact values are in `docs/results/feedback-validation.json`.

The browser experiment in [BROWSER_CONTROLLER.md](BROWSER_CONTROLLER.md) is the stronger action demonstration: it captures pixels and executes computed mouse commands. The light experiment does not itself demonstrate browser control.
