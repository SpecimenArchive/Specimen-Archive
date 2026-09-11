# Motor-integral light experiment

The original observation experiment remains available with `npm run dev`. It uses the existing pose-dependent light encoder and rate network. After 16 simulated seconds of dark recovery, integrate all six motor activities over an eight-second left-light probe with fixed dt=0.01 s. The engineering selector computes D = integral(R − L) dt, where L and R are three-cell side averages.

If D ≥0.05 activity·simulated seconds, execute right light. If D ≤−0.05, execute left light. Otherwise record that no threshold was reached and execute darkness. Observe the selected condition for eight simulated seconds. Repeat every 120 simulated seconds. These are engineered rules, not biological decisions or financial actions.

`server/experiment.ts` records initial state, source/data versions and hashes, exact configuration, all motor integrals, selected condition and the measured response. The checkpoint saves the partial integral with the engine state. `npm run validate:feedback` compares intact, right-motor-clamped and all-motor-clamped runs and verifies deterministic reconstruction. The recorded decisions are right, left and no-threshold/dark respectively; exact values are in `docs/results/feedback-validation.json`.

The browser experiment in [BROWSER_CONTROLLER.md](BROWSER_CONTROLLER.md) is the stronger action demonstration: it captures pixels and executes computed mouse commands. The light experiment does not itself demonstrate browser control.
