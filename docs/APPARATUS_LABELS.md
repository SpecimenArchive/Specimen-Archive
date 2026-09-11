# Apparatus asset recovery

## Current lettering: v4 marker refinement

`public/assets/apparatus-master-v4-marker.png` replaces the tidy lettering with smaller freehand felt-tip inscriptions: `$LARVA` on the front and `Specimen 01` on the visible right face. The front capitals and the more fluid side inscription have distinct rhythms, modest stroke variation and generous edge clearance. The built-in image editor supplied the new handwriting; local integration removed the old ink, reduced the generated strokes to 86% and retained the original paint illumination. No font or programmatically drawn glyphs were used. [Exact prompts](APPARATUS_MARKER_PROMPTS.md).

The final 1659 x 948 asset changes 4,581 pixels, all within two inset face regions. Every pixel outside those regions is identical to v3, including the microscope outline, scene and entire monitor. [Preservation receipt](results/apparatus-marker-preservation.json). Original v1, v2 and v3 remain intact. Renderer, chamber crop, worksheet and apparatus study now reference v4.

The enlarged [housing crop](screenshots/apparatus-marker-v4-close.png) was inspected for old lettering, paint seams, spelling, perspective and clearance. The [actual VM dashboard](screenshots/apparatus-marker-v4-dashboard.png) and expanded apparatus were reviewed at 1440, 1024 and 390 px; no overflow or browser errors occurred, and expand/Escape worked. The served v4 asset returned HTTP 200. [UI receipt](results/apparatus-marker-ui.json). This verifies the image integration; ten-minute VM continuity remains a separate check.

## Historical v3 edit

The recovered `apparatus-master-v2-indoor.png` preserves the established bench with closed blinds and controlled indoor lighting. It contains no lettering. `apparatus-master-v1.png` remains the historical daylight source. Neither is a photograph of a named laboratory or proof of physical apparatus.

The current `public/assets/apparatus-master-v3-labelled.png` is a built-in ImageGen edit of v2, requested on 11 September 2026. It is 1659 x 948, with `$LARVA` on the front vertical flat face of the microscope base and smaller `Specimen 01` on the right-side face. No inscription crosses the rounded corner or upper face. `@SpecimenArchive` belongs to website branding. No staff identity, institutional affiliation or specimen electrode is added.

Front lettering is centered near source (508,781), with clearance around all edges. Side lettering follows the receding face on one line. Require modest handwritten variation and physically integrated ink, without stickers or decorative distressing.

The built-in edit is visually close but not pixel-identical outside the inscription. The original v2 and historical v1 remain editable/reference sources. The photograph is synthetic scenery under the existing asset attribution in THIRD_PARTY_NOTICES.md. Runtime screen content is still a separately captured real desktop, with its own source ID, frame hash and timestamp.

No display defects are hidden with new blur, grain, bloom or glare. Historical screenshots/recordings remain labelled by their original revision and are not overwritten to imply that the new image existed then.
