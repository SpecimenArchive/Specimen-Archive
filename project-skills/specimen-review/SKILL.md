---
name: specimen-review
description: Review changes to SPECIMEN 01 live specimen rendering and its connection to model state. Use when changing anatomy, optical treatment or pose interpolation in this repository.
---

Read `docs/DESIGN.md`, `docs/METHODS.md` and `docs/DATA_PROVENANCE.md` for the current agreed appearance and model boundaries.

Inputs: a running local application, the changed renderer/model source, and primary 72 hpf figure references listed in provenance. Output: actual desktop and narrow screenshots in `docs/screenshots/`, a concise finding in `STATUS.md`, and fixes for demonstrated defects.

Acceptance criteria:
- Head, three chaetigerous segments, posterior taper, prototroch and paired fine chaetae remain recognisable through a full roll. Judge against cited primary references, not generic worms.
- Tissue appears translucent in the pale field, with restrained pigment and stable deterministic microstructure. The head and bristles stay within view at observation zooms.
- Pausing the server freezes model-dependent motion and produces a stale/offline state. Do not let wall-time effects impersonate continued locomotion.
- Motor/pose screenshots and node traces come from the same sequence. A view change cannot mutate the model. Rendering coordinates are design approximations, not measured anatomy.
- Inspect animation across an automatic light change and replay boundary. Check fine bristles for aliasing, abrupt resets and severe frame-time regressions.

Use the existing preview tab. Update evidence only after observing the result; a successful build is not visual validation. Keep generated concept imagery distinct from biological evidence and from the live renderer.
