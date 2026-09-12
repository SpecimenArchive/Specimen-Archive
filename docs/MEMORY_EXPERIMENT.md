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

Pending implementation and matched evaluation. No learning improvement is claimed at this protocol checkpoint.
