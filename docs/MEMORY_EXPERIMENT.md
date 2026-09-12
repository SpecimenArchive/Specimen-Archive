# Persistent experience and bounded adaptation: protocol v1

Protocol defined before training on 12 September 2026. This extends external observation, not the larval connectivity or motor decoder. The active network remains rate-v1, 47 cells, 161 directed connections, 711 anatomical synapses. No LLM controls the browser. The first knowledge panel uses curated sourced notes and deterministic retrieval; it needs no API key.

## Ownership and persistence

The neural path is native desktop crop → contrast encoder → rate network → motor decoder → permitted wheel dispatch → observed displacement. The environment supervisor chooses approved external pages. A persistent experience store receives completed decisions, aggregates repeated outcomes, retrieves prior encounters and supplies explicit advice to the supervisor. It cannot change neural inputs, model parameters, allowed routes, credentials or executable commands.

Reuse the project's atomic JSON server-side storage pattern under ignored runtime storage. Retain at most 600 encounter identities, 1,200 recalls and 12 original evidence links per encounter. Keep stable IDs, first/latest timestamps, canonical URL, title/content identity, a compact visual descriptor, original frame references, revision/configuration and outcome counts. Save atomically with a previous-state backup and a bounded daily export. Worker, backend and deployment restarts do not delete this directory. Public inspection is GET-only and never performs retrieval or training.

Recall matching must report its method: canonical URL, title/content identity, coarse visual similarity or engineering context. A URL match is not visual recognition. A recall stores retrieved IDs separately from IDs used in an explanation or a supervisor decision. External text is data, never instructions. No first-person narration or claim of self-awareness is produced.

## Predefined learning objective and update

Task: reduce repeated acknowledged boundary wheel no-ops while preserving actual wheel direction and allowing a useful page displacement. Learned parameter: the supervisor's retry budget, bounded to 1–3 unchanged outcomes. Fixed baseline remains 3. The network, encoder and decoder are frozen.

Context consists of page kind, encoded contrast category and decoded wheel direction. Learn a Beta-Bernoulli estimate of boundary probability from actual acknowledged outcomes only: prior alpha=1, beta=1; boundary increments alpha, visible displacement increments beta. Counts saturate by proportional rescaling at 200 observations. Failed, stale and policy-blocked commands never train this estimator. At least five observations are required. A posterior boundary probability of at least 0.75 advises budget 1; at least 0.55 advises 2; otherwise 3. These engineering thresholds are fixed before training. Save the state, source evidence IDs and checkpoint hash. Training mode observes outcomes but retains the baseline policy; frozen mode can use a saved checkpoint without updating it; disabled mode uses baseline and performs no updates.

Primary evaluation: useful visible displacements / acknowledged wheel attempts, plus absolute displacement / fixed decision-window budget. Report boundary no-ops, attempts, waits, page transitions, runtime and denominators. More visits or memory entries alone are not success. Compare fixed baseline, frozen adaptation and disabled adaptation under matched starting offsets, page inputs, action budgets and several task seeds. Freeze learning during held-out evaluation. Distinguish recorded-input tests, controlled browser integration and live external trials; do not present an offline estimate as an observed online improvement. Report a negative or inconclusive result if that is measured.

Memory evaluation is separate: save newly observed encounter details, restart the store/process, ask about those specific records with retrieval enabled/disabled, verify evidence IDs and provenance, and report exact content/visual/URL matching. Public UI must show stored, retrieved and behaviourally used records distinctly.

## Biological limits and sources

The [annelid connectome study](https://elifesciences.org/articles/97964) describes developing mushroom-body circuits separately from the visual module and discusses associative learning as a possibility. That does not establish a learning rule in our selected visual-to-motor subset. No fruit-fly mushroom-body rule or weights are transplanted. The retry adapter is conventional software, not claimed synaptic plasticity.

The [reference project's voice description](https://github.com/fruitflydev/flycoinrh#the-voice) separates its language-model narrator from neural activity. This project likewise keeps semantic explanations separate. Curated crypto references come from Ethereum's primary documentation, with actual retrieval timestamps and short supporting passages. The self-profile comes from this project's actual configuration and event history.

## Results

### Controlled integration matrix, fixed before training

Use the five VM PNGs captured at 13:22–13:23 UTC on 12 September, before memory training: Explore, Pons, ZZZ, Bundle Cat and eLife 97964. For a reproducible browser integration check, each original image is a single scrollable image in a 1280 × 360 Chrome viewport. Seeds 503, 607 and 809 fix page order and respectively top, middle and bottom starting offsets. Each arm receives 48 neural windows with the same eight-window encounter ceiling. Compare baseline retry budget 3, the frozen learned budget and disabled adaptation. Record actual trusted wheel events and scroll displacement and replay every sampled neural state from the captured fixture PNGs. This deliberately controlled image-scroll benchmark is distinct from live external browsing; its result cannot establish a live Pons improvement. Live native traces remain the separate evidence for real-site scrolling.

Training was frozen at 15:11:46 UTC after **257 acknowledged outcomes** across 22 encounter identities. Checkpoint `7032af3b32b2950278790e8034eb22e7e824bb355521454784c568f0e99bed08` is preserved in [the checkpoint receipt](results/memory-frozen-checkpoint.json). Only the research / upper-texture / upward-wheel context met the threshold for a shorter retry budget: nine boundary outcomes and no movement, with posterior boundary probability 10/11. No neural parameter changed.

The held-out Chrome integration matrix ran at source [f0f3d11](https://github.com/SpecimenArchive/Specimen-Archive/tree/f0f3d11c735b42c7e046dafe0aece0acbde753e3) from 15:12:43 to 15:17:00 UTC. Each arm received 144 windows and 144 actual acknowledged wheel attempts across the three seeds. **All three arms produced 113 visible moves, 31 boundary no-ops and 5,424 displaced pixels. There was no measured improvement.** Per-seed moved/attempted counts were 47/48, 48/48 and 18/48 in every arm. The frozen condition actually selected budget 1 in some contexts, but that did not improve these held-out outcomes. All 432 decisions and 25,920 sampled neural states replayed exactly. No trial was excluded or tuned after seeing its result. [Comparison](results/memory-evaluation.json) · [all nine trial receipts](results/memory-evaluation-trials.json).

This is a negative controlled integration result. It does not establish improved live Pons browsing, nor does it imply biological plasticity. The frozen adapter remains explicitly labelled experimental; the observed neural wheel path and supervisor-owned environment selection remain separate.

## Restart recovery and retrieval

The first live restart exposed a canonicalization defect: the approved atlas URL lost its trailing slash in storage and was then rejected on reload. The original loader fell back to an empty store. Source `deb371a` accepts the canonical atlas URL and refuses to overwrite existing evidence when both primary and backup state are invalid. Regression tests cover both cases.

The intact frozen checkpoint and immutable decision records recovered **all 22 original trained encounter IDs and all 257 training outcomes**, plus subsequent valid encounters. Recovery used 315 decision links from nine records. Some original per-visit IDs and recall matcher diagnostics could not be reconstructed; recovered linkage records explicitly say so. Original captured thumbnails were restored where still retained. This loss is not presented as a successful first restart. [Recovery receipt and limitations](results/memory-recovery.json).

After repair, the actual new backend loaded the original Explore encounter first observed at **14:49:22.830 UTC**, retaining command `exhibit_1789224541888_20f32a33:c000` from source a80d508. A real recall at **15:22:17.547 UTC** linked it through canonical URL and title/address identity. Its visual distance was 3.234375, above the visual-match threshold; **this was not visual recognition of the same page**. The prior record supplied sourced context in the knowledge panel, not wheel direction. [Original evidence and post-restart recall](results/memory-restart.json).
