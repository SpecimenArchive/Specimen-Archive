# Photographic motion checkpoint

The user approved the photographic foundation and requested one refinement followed by a 15–20-second isolated motion study. The main console and scientific engine remain unchanged at this checkpoint. Open `http://127.0.0.1:4317/photographic-study.html`: the desktop field is exactly **1002 × 470 CSS pixels**. `docs/previews/photographic-motion.webm` is an actual 19.5-second browser capture. Playback affects only the recorded review, never the running experiment.

## Asset and reference

`public/assets/specimen-photographic-base-v2.png` is a synthetic image produced by one focused built-in image-generation edit of v1. Exact prompts and assessment accompany both assets. Neither is an authentic micrograph. References: [Verasztó et al., eLife 26000, Video 2](https://elifesciences.org/articles/26000#video2), head DIC footage, and [Randel et al., eLife 02730, Video 8](https://elifesciences.org/articles/02730#video8), three-day bending. Extracted reference frames retain source attribution and Creative Commons terms.

The asset edit improves density variation and ciliary detail but incompletely softens regular trunk boundaries. The renderer uses fixed local focal-depth fields: deep tissue softens while pigment and selected near tissue remain sharp. Focus follows anatomical coordinates and is not animated. There is no global blur, lighting animation or moving particle overlay. Subject scale is 0.84, leaving about 70–73% field height for the body.

## Inspectable rig

`src/render/photographic.ts` uses Three.js for an unlit fullscreen photographic shader, not 3D anatomy. A registered matte covers the head, continuous trunk and chaetal fans. The shader subtracts estimated low-frequency illumination from the image, deforms this optical residual, then composites it onto an independent fixed water plate. No framewise image generation occurs. All region coordinates are artistic registrations, not measured landmarks.

| Visible change | Fixed engineering mapping |
|---|---|
| Body bend | `b = clamp(2.1 × pose.bend, −0.18, 0.18)`; below neck coordinate `y=0.30`, centreline shifts by `b × (y−0.30)²`, with second-order longitudinal correction for approximate constant arc length. |
| Viewing angle | `0.035 × tanh(heading + 0.18)` radians; at most two degrees. The tracking view omits unrestricted model roll. |
| Internal tissue | Three cubic-falloff regions. Displacement depends on motor level and bend and is typically under two display pixels. Displacement and its derivative vanish at region boundaries. |
| Long chaetae | Root-fixed distal splay follows local bend and side. They are not treated as beating cilia. |
| Head ciliary regions | Authoritative unwrapped `pose.ciliaPhase`, independent fixed phase offsets, envelopes modulated by MN3 activities. |
| Trunk ciliary regions | Same oscillator, separate registered regions/offsets, envelopes modulated by MN1 activities. |
| Water, illumination, focus | Fixed presentation; no neural meaning or wall-clock motion. |

Regional motor assignment is a simplified engineering mapping informed by ciliomotor anatomy. Soma side does not reconstruct projection territory. Basal ciliary amplitude persists at zero neural activity, consistent with the model's declared basal oscillator; activity modulates amplitude and model oscillator rate. Optical regions are not additional neurons or telemetry.

## Evidence and reproduction

`docs/results/prototype-episode.json` contains 98 original snapshots with all 47 activities from run `s01_1789128034818_3edc9b24`. The review covers model time 14.04–23.79 s at 0.5× pace. Left light begins at model time 16 s. The client interpolates recorded snapshots, including unwrapped phase, without extrapolation. Some raw historical event strings retain an early encoding defect; visible captions are corrected without modifying original records.

Measured capture: **1,170 rendered frames / 19.504 wall seconds**, median interval **16.7 ms**, p95 **16.8 ms**, no browser errors. These are this machine's render measurements, not guaranteed encoded frame delivery or cross-device performance. Exact results: `docs/results/photographic-recording.json`.

`node scripts/photographic-check.mjs` checks actual pixels: zero changed background pixels, zero changes when the same state is redrawn, zero changes when wall time advances at fixed state. The specimen changes during the response. Desktop and 390-pixel screenshots were inspected; no narrow horizontal overflow. `node scripts/photographic-review.mjs --record` reproduces still and capture using Edge through Playwright.

## Assessment

The user then confirmed the head fix and identified subtle distortion at all six chaetal attachment points. `scripts/root-motion-check.mjs` reproduced phase-dependent changes at each root from checkpoint 89259fa (maximum channel differences 60, 95, 52, 91, 25 and 2). Registered protected root regions now exclude both ciliary warping and local splay. All six 17×17 pixel ROIs show zero phase-dependent changes. The head regression still passes and 1,804 peripheral pixels retain motion. The previous head-fixed/root-defective clip is retained as `photographic-motion-root-defect.webm`. Source rig version is `photo-rig-v3-root-stable`; the latest normal-speed capture replaces the review clip after validation.

Subsequent user review found unnatural jelly-like head motion. `scripts/head-motion-check.mjs` reproduces the exact shader from checkpoint f76bb06 with only oscillator phase varied: 2,585 changing pixels in a 119×66 head ROI, maximum RGB channel difference 147. The cause was broad ciliary masks crossing tissue and pigment. The correction registers an explicit head exclusion and reduces peripheral displacement. The same check now yields zero head-ROI pixel changes while 2,878 appendage pixels still move. Twelve phase samples are tested; this isolates a renderer defect, not neural behaviour. Original and corrected full-speed captures are compared in `docs/previews/head-motion-review.html`. The user confirmed the head correction and subsequently confirmed all six roots are stable. The accepted rig is integrated in the main console; browser mode uses the same controller snapshot for neural inspection and specimen presentation.

Density, restrained pigment, local bending and stable water are substantially stronger than the rejected procedural illustration. The head stays stable while the trunk bends; internal regions remain attached to anatomy. Movement is deliberately gentle. Tissue remains more granular and trunk divisions more regular than actual DIC footage. Tiny ciliary fields are less clearly resolved than the reference. Hidden structures cannot be revealed by full roll. These limitations are explicit and consistent with the user's constrained-view choice. Motion review is pending before console integration.
