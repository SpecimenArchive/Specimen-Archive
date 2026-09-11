---
name: specimen-review
description: Review changes to SPECIMEN 01 live specimen rendering and its connection to model state. Use when changing anatomy, optical treatment or pose interpolation in this repository.
---

Read `docs/DESIGN.md`, `docs/METHODS.md` and `docs/DATA_PROVENANCE.md` for the current agreed appearance and model boundaries.

Inputs: a running local application, the changed renderer/model source, and primary 72 hpf figure references listed in provenance. Output: actual desktop and narrow screenshots in `docs/screenshots/`, a concise finding in `STATUS.md`, and fixes for demonstrated defects.

Acceptance criteria:
- Head, three chaetigerous regions, posterior taper, prototroch and paired fine chaetae remain recognisable through the agreed constrained observation angle. The user selected a photographic rig; do not require unrestricted rolling or invent hidden anatomy. Judge against cited primary references.
- Tissue appears translucent in the pale field, with restrained pigment and stable deterministic microstructure. The head and bristles stay within view at observation zooms.
- Pausing the server freezes model-dependent motion and produces a stale/offline state. Do not let wall-time effects impersonate continued locomotion.
- Motor/pose screenshots and node traces come from the same sequence. A view change cannot mutate the model. Rendering coordinates are design approximations, not measured anatomy.
- Inspect animation across an automatic light change and replay boundary. Check fine bristles for aliasing, abrupt resets and severe frame-time regressions.

Use the existing preview URL. Update evidence only after observing the result; a successful build is not visual validation. Identify generated specimen assets as synthetic and distinguish them from biological evidence. Capture 15–20 seconds at the actual 1002×470 observation field. Check that water stays independent of deformation, local tissue never crosses anatomical boundaries, and ciliary motion uses the documented model phase. Show this checkpoint before integration, as requested by the user.
