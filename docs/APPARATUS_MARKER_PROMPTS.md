# Microscope lettering refinement prompts

Built-in image editing was used on the existing apparatus asset. The final generated housing edit supplied the new ink. Local integration removed the old ink and fitted the generated inscriptions at 86% scale while retaining the original housing illumination and all pixels outside the two inset face masks. No font or programmatically drawn letter shapes were used. Early whole-scene candidates were rejected for regular-looking lettering or scene drift.

## Handwriting reference

```text
Edit this close-up photograph of a microscope's clean cream painted base. Preserve the photograph and housing exactly, adding only two small black felt-tip inscriptions directly on the two vertical painted faces.

On the broad front vertical face, centered roughly around image coordinates (295,270), casually handwrite the exact text "$LARVA", about 205 pixels wide and 48 pixels high. On the receding right-side vertical face, centered roughly around (800,185), handwrite the exact mixed-case text "Specimen 01", smaller, with the baseline following the face's upward-right perspective. Stay comfortably clear of the rounded corner, top face, and every housing edge.

These are quick equipment labels written freehand with an ordinary medium black felt-tip marker. The front inscription has slightly uneven hand-printed capitals and a single-stroke dollar sign: modest variation in actual letter size, spacing and slant, a casually imperfect baseline. The two As are naturally different hand-drawn forms. The side inscription has a looser, slightly joined mixed-case rhythm, as if written in a single unselfconscious motion; its letters are individually hand formed, not uniformly typographic. Keep both readable and restrained. The point is recognizably spontaneous human penmanship, NOT neat lettering.

Show modest pen-pressure variation and naturally uneven stroke edges. Where the hand doubles over a stroke the ink is a little denser; a few strokes contain a very subtle lighter felt-tip streak. Retain the original focus softness and painted surface texture through the ink. Avoid calligraphy, neat signage, a handwriting font, mechanical random rotations, exaggerated wobble, heavy distress, or grunge. No outline/shadow/bevel/sticker. No text anywhere else.

Keep the crop, housing shape, tabletop, black foot, light, focus, and all photographic details unchanged. Only add these two freehand black ink inscriptions.
```

## Reference in full scene

```text
Use case: compositing / precise-object-edit.
Image 1 is the EDIT TARGET: the complete established microscope/workstation scene. Image 2 is a SUPPORTING REFERENCE: a close-up of this same microscope housing with the desired genuine freehand felt-tip handwriting.

Edit Image 1 only on the two labelled painted faces of the microscope base. Remove its two old tidy/font-like inscriptions completely and restore the paint beneath them. Transfer the handwriting designs from Image 2 onto these faces, adapting their size and perspective to Image 1. Use Image 2's actual hand-formed glyphs, spacing character and modest felt-tip pressure variation. Do not reuse Image 1's old lettering shapes.

Exact wording: front "$LARVA"; visible right-side face "Specimen 01".
The new labels must be slightly SMALLER than the original labels in Image 1. At Image 1's 1659x948 scale, keep the front inscription about 90 pixels wide, centered near (508,780), entirely within the front flat vertical panel with generous paint around it. Keep the side inscription about 75 pixels along its receding baseline, centered on the same right flat face as the old label, also with generous clearance. Both labels should be casually readable, with neither crossing the rounded corner or touching the upper face.

Match the original photograph's lighting, softness, perspective and painted texture. The reference's slightly irregular hand-formed capitals and more fluid mixed case should remain recognizable at this smaller size. Preserve modest pressure variation and subtle darker overlaps, but avoid excessive grain or roughness at the final scale. The ink lies directly on the painted surface, with no decal or digital overlay appearance.

CRITICAL: keep every other part of Image 1 unchanged: microscope construction and objectives, camera, viewpoint, lighting, bench, cables, keyboard, closed blinds, surrounding scene, framing, and exact equipment placement. Do not replace Image 1's whole microscope or scene with the close-up reference. Transfer ONLY the two handwriting designs into the original faces, after removing the old inscriptions. Output the COMPLETE original scene, matching the original 1659x948 image dimensions and composition.
```

## Final housing edit

```text
Use case: precise-object-edit.
Image 1 is the edit target: a close crop of the existing microscope base. Image 2 is a handwriting style reference. Edit Image 1's two black inscriptions.

First completely remove the old lettering from BOTH faces and restore the painted finish beneath it. Then write new, visibly different, casual black felt-tip inscriptions, smaller by about 18 percent. Exact front text: "$LARVA". Exact visible right-side text: "Specimen 01". Leave comfortable paint clearance from panel edges and rounded corners. At Image 1's 1100 x 510 scale, front new inscription should occupy roughly x=215..445 and y=224..296 (about 230 pixels wide); the side inscription should remain centered in its old location, with about 185 pixels total width along the receding face.

Use Image 2's genuine quick freehand lettering style as inspiration: front individual handwritten capitals and a loosely drawn single-stem dollar sign; side fluid mixed-case handwriting with its own rhythm. Modest variations in letter height, spacing, slant and baseline, pressure and stroke width. Slightly darker overlaps and occasional faint internal marker streaks. Natural readable spontaneous writing, not a tidy handwriting font. Avoid uniform mechanical glyphs, random letter rotations, distressing, calligraphy, messiness or decorative effects.

Keep the whole physical housing shape, camera angle, lighting, surface texture, upper/lower panel boundaries, rounded corner and surrounding scene at Image 1's exact positions. Change only the two inscriptions and paint directly beneath them. The ink must follow each face's perspective and inherit its photograph's focus and lighting. Return this close crop in the same composition.
```
