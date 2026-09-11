# Observation renderer — replacement decision

## Existing implementation and why it failed

`src/render/specimen.ts` draws the original specimen using Canvas 2D: a planar Path2D body envelope, flat gradient fills, ellipse-based granules and yolk vesicles, pigment circles and Bezier bristles/cilia. Some internal points are projected from a cylindrical coordinate system, but the body surface remains flat and its occlusion/focus behaviour does not represent tissue thickness. Whole-object screen rotation is the server heading. Roll changes internal projected coordinates; a quadratic lateral offset supplies bend. Cilia phase comes from the server, but the representation is visually dominated by the rotating envelope.

The first optical pass reduced uniform outlines and varied bristles, pigment and internal contrast. It did **not** meet the user's microscopy target. Its same-scale before/after and 12-second clip are retained as review history, not accepted final visuals. Per-primitive blur also caused unacceptable frame cost and was removed.

## Agreed immediate scope

The user has paused dashboard expansion. Preserve the authoritative 47-neuron pipeline and surrounding composition. Build an isolated renderer prototype, show a strong still and 15–20 seconds of motion at the actual observation-panel size, and assess it against actual microscopy before integration. Ask for material rendering-direction decisions, not routine implementation permission.

## Optical reference

Use transmitted-light DIC with a neutral, slightly warm field, asymmetric refractive contrast, dark irregular pigment cups, optically dense internal tissue and selective focus. Do not use SEM surface shading, fluorescent neon or illustrated outlines as the microscopy target.

- Verasztó et al., **Ciliomotor circuitry underlying whole-body coordination of ciliary activity in the Platynereis larva**, eLife 6:e26000 (2017), https://elifesciences.org/articles/26000. Video 1 explicitly depicts 72 hpf cilia; Video 2 provides a live head DIC close-up. Frames extracted at 0.75 seconds are under `docs/references/dic-72hpf-*.png`. Source videos remain in ignored research cache.
- Randel et al., eLife 3:e02730, Video 8: unilateral illumination and bending in three-day-old larvae, https://elifesciences.org/articles/02730#video8. The paired whole-body frame provides the better reference for overlap, pigment and deformation. It is actual experimental footage, distinct from our synthetic preview.
- These research images retain eLife's Creative Commons Attribution terms; credit the respective authors. Extraction is a temporal selection, with no generative alteration.

## Initial recommendation (superseded by user choice)

Replace the planar envelope with a deformable 3D specimen. Separate the tissue volume, internal structures, pigment cups, paired chaetae and distinct ciliary regions. Use model-driven deformation and ciliary phase; let orientation change actual depth, overlap and focus. A depth-aware optical shader is preferable to adding blur to hundreds of flat drawing primitives.

A layered photographic rig could provide a convincing fixed viewpoint faster but would constrain the required roll and occlusion. The recommended 3D path remains an illustrative anatomical model, not reconstructed measured tissue. No new API, paid service or external credentials are necessary for the first prototype.

## User-selected approach

The user chose **layered photographic rendering with constrained orientation**, explicitly prioritising visual realism over unrestricted roll. The unintegrated 3D study is parked. First create a substantially stronger, species-grounded microscopy base asset and show it at the actual 1002×470 panel size. Do not build animation before showing that still.

After the still review, add local deformation (gentle bend, relative tissue displacement, independent ciliary regions) driven by documented model outputs. Keep lighting, focal treatment and anatomical identities stable. Limit orientation changes; do not pretend a photographic layer reconstructs hidden anatomy. Reassess 3D only if this approach cannot provide the required movement.

## Review gates

- In a still, compare tissue depth, tonal density, pigment shape, refractive contrast and focal selectivity with the DIC references.
- In a 15–20-second clip, inspect relative tissue motion, body deformation, independently phased ciliary regions and depth changes under roll.
- Anatomical positions are stable in body coordinates. No framewise generated morphing.
- Use the existing observation-panel dimensions. Preserve raw snapshots and capture metrics; document any artistic motor mapping separately from the neural equations.
- Do not integrate or resume dashboard expansion on the basis of a build passing or an unreviewed still.
