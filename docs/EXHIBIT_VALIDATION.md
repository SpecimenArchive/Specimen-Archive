# Extended exhibit validation

Executed controller revision: `f2e3f2afc81e1aa37e0cc2c9bd9d360fa3ec8b59`. The frozen controller was tested on three previously unused cases, followed by matched interventions. No held-out tuning followed the observed failures.

## Measured task outcomes

| Case | Intact | All motor outputs zero | PRCs disconnected |
|---|---|---|---|
| Standard / seed 503 | Link followed, final button activated | 0 input events | 0 input events |
| Offset / seed 607 | Link followed, final button not reached within 48 windows | 0 input events | 0 input events |
| Low contrast / seed 809 | 2 wheel actions, target not detected | 0 input events | 0 input events |

All nine traces replayed exactly: 432 decoded decisions, 25,920 sampled all-neuron states and 259,200 integration steps. Intact controllers produced genuine mouse, wheel, click and navigation events. Clamping the computed motors or interrupting the relevant sensory pathway abolished those actions. This establishes causal involvement of this engineered circuit. It does not establish general browser intelligence or measured larval decision-making.

The offset run ended with the second-page target still 104 px to the right, after using its budget on scrolling and movement. Low contrast failed the fixed green pixel mask. These outcomes are retained in [the compact archive](evidence/exhibit/README.md); neither was silently completed by setup automation.

Independent Linux CI reproduced the same nine outcomes and action counts. Windows and Linux tests, original exported baseline replay, scientific data validation and builds also passed: [workflow 34618653790](https://github.com/SpecimenArchive/Specimen-Archive/actions/runs/34618653790).

## Continuous production observation

The two-observer run lasted **600.966 seconds**, with **11,066 identical matched packets**, four completed bounded episodes, zero browser page errors and zero dropped stream frames. Session identity survived an observer disconnect/reconnect. The specimen's captured pixels remained exactly unchanged while disconnected. All three primary panel IDs/model steps matched. A selected command opened its recorded neural window, and the server continued independently. See [the complete measurement record](results/exhibit-endurance.json).

Node RSS ranged from approximately 145 MB at the first measurement to 337 MB at the end, with episode-boundary allocation peaks. This is a ten-minute measurement, not a claim of indefinite memory stability. Retention and buffers are bounded in code (8 raw episodes, 200 compact records, 600 display snapshots, 48 decision windows per episode). No additional browser process survives a completed episode. The field originally named `displayFrameIntervalMs` in this saved check measures requestAnimationFrame callbacks in headless Edge, not actual specimen draws; its 2.1 ms median must not be interpreted as 476 rendered frames/s. The renderer has a 60 Hz cap, verified separately with an actual draw counter.

The integrated preview is an unedited **46.4-second, 1440 × 1050, 25 fps** recording of the real observation browser. That video frame rate is separate from both neural sampling and specimen render cadence. [Preview review](INTEGRATED_REVIEW.md).

## Recovery, publication and limits

An isolated test deliberately closed the controlled browser before decision 2. The service recorded the failure, preserved completed commands and the finalized local video, then opened a new intact episode under the same session ID. Operator abort during the next partial integration window issued no action. See [recovery evidence](results/exhibit-recovery.json).

All nine held-out records have actual verified public Specimen Recorder commits. A real receipt-loss test returned the original commit, with one commit before and after and no duplicate: [receipt recovery](results/exhibit-recorder-recovery.json). Continuous episodes publish through the same recorder at completed experiment boundaries. Generated apparatus/tissue licences and data attribution are listed in [third-party notices](../THIRD_PARTY_NOTICES.md).

Only the controlled colour-assisted lane/scroll task is demonstrated. Public websites, expanded circuitry, learning and a language-model journal remain deferred, with prerequisites in [the milestone](EXHIBIT_MILESTONE.md). The accepted photographic rig is unchanged; local deformation and optics remain explicitly documented presentation mappings.
