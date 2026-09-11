# SPECIMEN 01 — build status

## Objective
Complete the local observation-only application specified in `specimen-01-codex-prompt.md`. No publishing, credentials, token operations or external repository creation.

## Environment and decisions
- Windows / PowerShell; Node 24.11.1, npm 11.7.0, Python 3.12.2, Git 2.42.
- Original folder contains only the brief; no repository instructions or existing application.
- React + Vite + TypeScript; one local Node process owns the continuous model, persistence and WebSocket stream.
- Scientific import precedes model selection. Primary Figure 2 supplement is an R binary tibble graph, not CSV.
- User chose natural-history microscopy: translucent ivory, subtle pigment, fine bristles, graphite dashboard and restrained cyan. Asked to see rendered specimen before full UI expansion.
- Local-only scope overrides hosted Sites setup/deployment. Use procedural controllable rendering for live pose; generated assets may support visual research only.

## Milestones
- [x] Read entire brief and inspect tools/environment.
- [x] A: Primary RDS downloaded and decoded. Counts verified; manifest and processed full graph/circuit committed at next checkpoint.
- [x] B: 47-neuron / 161-edge / 711-synapse active model. Fixed input response threshold at 1.17 s; PRC disconnection eliminates motor response; INton disconnection delays it to 1.49 s. Results in docs/results/validation.json.
- [x] C: Continuous engine, WebSocket snapshots, persistence, local renderer and first actual browser screenshots.
- [ ] D: Complete console, archive, methods, trace, benchmark and repository docs.
- [ ] E: Browser inspection, scientific/transport tests, build and restart verification.

## Next
USER STEERING: Dashboard expansion is paused. The user rejected the Canvas specimen as a flat scientific illustration being rotated. Preserve the working neural pipeline and dashboard. Build an ISOLATED convincing microscopy prototype, using actual 72 hpf live microscopy reference. Explain renderer limitations and involve user in approach. Show one strong still and 15–20 s motion at actual observation-panel size; assess against reference before integration or UI expansion.

LATEST USER DECISION: prioritise layered photographic rendering with constrained orientation. Visual realism is the acceptance criterion. The current illustration must not be the foundation. Create/obtain a convincing microscopy base asset and show it at the actual 1002×470 panel size BEFORE building animation. Then local body bending, relative tissue motion and independently animated ciliary regions, connected to model outputs; stable viewing angle with only small orientation changes. Reassess 3D only if needed. A partially authored unintegrated 3D study under prototype/ is parked; do not continue it now.

Image-generation created public/assets/specimen-photographic-base-v1.png (1832×859) from actual DIC references, with provenance alongside. No old Canvas artwork used. Actual 1002×470 still shown at http://127.0.0.1:4317/photographic-study.html and docs/screenshots/photographic-still-v1-panel.png. User asked whether this is the right foundation, with recommendation to soften overly bounded trunk divisions, vary homogeneous tissue granulation/focus and add vertical margin BEFORE motion. Awaiting reply; no photographic animation authored yet. The server/UI are preserved.

First optical-refinement review is in docs/previews/index.html (before/after identical actual state + 12s live clip). User explicitly found it insufficient; do not treat this as accepted visual completion.

## Exact commands and running processes
- `npm run dev`: one process, localhost 4317, retained exec session 16372.
- `npm run typecheck`: passed.
- `npm run validate:science`: passed; actual controlled results saved.
- `.venv/Scripts/python scripts/ingest.py`: successful import. Python dependencies in scripts/requirements.txt.
- `node scripts/preview.mjs`: first rendered desktop screenshots via installed Edge / Playwright. CUA has no connected browser.
- Git local checkpoint c6048a6. Sandbox .git is read-only; use narrowly escalated `git -c safe.directory=C:/path/to/SpecimenArchive ...` for requested checkpoints. No global config changes.

## Findings / known work
- Older GraphML alternative has different counts, excluded. Atlas old graph URL 404, primary supplement used. Full Zenodo archive is 1.87 GB and deliberately not downloaded; read metadata and compact repository sources instead.
- RDS graph class counts: 468 sensory, 920 inter, 239 motor, 424 effector, 467 fragment, 157 other. 1627 graph-class neurons is not the paper's 966 classified neurons.
- Need strengthen legibility, remove runtime external font dependency, finish neuron provenance and archive/Methods/Research views.
- Need browser interaction/reconnect/stale/mobile QA, meaningful automated tests, measured benchmark, real trace and full restart verification.
- Generated texture at public/assets/tissue-texture.png; synthetic material only, full prompt provenance alongside it.
- Actual live-microscopy frames inspected: docs/references/dic-72hpf-head.png (eLife 26000 video2), dic-72hpf-whole-body.png (video1, actually a cropped ciliary flank), dic-72hpf-bending.png (eLife 02730 video8, paired 3-day whole-body views). Use restrained transmitted-light DIC as optical reference, not SEM. Source videos are in data/raw, ignored.
- WebGL 2 renderer was measured as NVIDIA RTX 3070 Ti via ANGLE D3D11. No tool/service access blocker.
- Seven automated tests pass, 111-frame neuron trace and initial CPU benchmark saved. Skill validator passes. Documentation drafted in docs/METHODS.md, DATA_PROVENANCE.md, VALIDATION.md, RENDERER_REVIEW.md; final renderer sections will need updating.
