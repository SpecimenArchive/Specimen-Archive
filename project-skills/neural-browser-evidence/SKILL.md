---
name: neural-browser-evidence
description: Implement or review the pixel-to-neural-to-browser experiment in this repository, including controller changes and causal evidence regeneration.
---

Read `docs/BROWSER_CONTROLLER.md` and `docs/CONTROLLER_AUDIT.md` before changing the controller boundary.

- `encoder.ts` accepts decoded screenshot bytes only. Target configuration and DOM outcome evaluation belong to the harness, never the controller or decoder.
- Every post-setup mouse event must cite a decision and its actual neural states. The decoder accepts computed motor activity only; no target snapping, fallback clicks or sensory bypass.
- Keep the same target seeds and action budget across intact, motor-disabled and pathway-interrupted trials. Save unsuccessful trials and errors.
- Recompute from recorded PNGs through the engine, compare all saved states and commands, and match browser events to executed commands. A video alone does not establish causality.
- Keep telemetry under ignored `runtime/`; publish bounded evidence with source/data hashes and real timestamps. Use the Specimen Archive Git identity; identify automatic records as Specimen Recorder in their contents and messages.
- Inspect the actual observation view: screenshot, neural graph and event rows must use the same run and decision. Replay must be explicitly labelled and must not execute actions.

For the connected exhibit also read `docs/EXHIBIT_CONTROLLER.md`. Preserve frozen `pixel-motor-v2`; use versioned extended profiles. Decoder phase is a fixed engineering multiplex, never privileged task state. Default observations must stay intact and continuous; controls belong in the archive. Verify session/run/command/model-step linkage across specimen, exact input, all-cell history, browser and apparatus monitor. Capture a 30–60-second integrated review, then run the ten-minute two-observer endurance check. Preserve failures, record replay results and inspect disconnected freeze. Raw frames/video belong in bounded ignored runtime storage. Review checkpoints are now self-assessments: the user authorized independent implementation and later refinement.
