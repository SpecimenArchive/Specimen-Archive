# Browser causality evidence

Executed source: [e9c1c044934a735b4ddd994c9a1259f8652df33b](https://github.com/SpecimenArchive/Specimen-Archive/tree/e9c1c044934a735b4ddd994c9a1259f8652df33b). All nine runs have sourceDirty=false. Each uses the same published 47-neuron / 161-edge circuit and fixed pixel-motor-v2 configuration.

| Intervention | Activations | Controller events | Exact replay |
|---|---:|---:|---:|
| Intact | 3 / 3 | 21 total | 3 / 3 |
| All six motor cells clamped | 0 / 3 | 0 | 3 / 3 |
| Photoreceptor outgoing edges removed | 0 / 3 | 0 | 3 / 3 |

Every trial ran all 16 decisions. Recorded traces contain 8,640 sampled full-network states, representing 86,400 fixed integration steps across the suite. Replay reconstructs every step from PNGs and compares sampled states and commands exactly. The first intact browser recording is 18.08 seconds long. These small, predefined lane tasks establish engineering causality, not statistical generalization or biological competence.

Open [the visual evidence viewer](index.html) through the local server, or inspect the individual PNGs, browser.webm, record.json, trace.json.gz and publication.json in each run directory. The latter links its actual verified Specimen Recorder commit. Run npm run browser:replay to reconstruct the entire suite.

Independent Linux GitHub CI reproduced the same 3/3, 0/3, 0/3 outcome pattern: [workflow](https://github.com/SpecimenArchive/Specimen-Archive/actions/runs/34609432609), [actual CI summary](../../results/browser-ci-suite.json). Windows and Linux unit/build jobs also passed.

[UI verification](../../results/browser-ui-check.json) checks synchronized run/step identities, exact offline freeze, reconnect, replay, narrow layout and read-only routes. [Real recorder recovery](../../results/recorder-recovery.json) retained the same single GitHub commit after local receipt status loss. The earlier [cursor-mask failure](../development-failure/README.md) is retained separately and excluded from these final version-2 counts.
