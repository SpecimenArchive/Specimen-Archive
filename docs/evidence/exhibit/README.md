# Extended browser evidence

These compact records were executed from clean revision `f2e3f2afc81e1aa37e0cc2c9bd9d360fa3ec8b59`. Actual timestamps, configuration, circuit hash, neuron IDs, computed motor readouts, phase rule, selected commands, trusted events and outcome remain in each immutable record. Each publication receipt links a real Specimen Recorder commit on the `specimen-records` branch.

The validation harness used **unpaced** 600-step integration windows; the continuous exhibit uses the same 600 steps paced over at least 3 wall seconds. The original f2e3f2a records contain both model and wall timestamps; this protocol note identifies the harness cadence explicitly. Subsequent records also include an `execution` pacing field. No recorded quantities have been altered retrospectively.

| Held-out case | Intact result | Motors disabled | PRCs disconnected |
|---|---|---|---|
| Seed 503, standard | Link followed and button activated | No actions | No actions |
| Seed 607, offset | Link followed; final activation not reached | No actions | No actions |
| Seed 809, low contrast | Two scroll actions; no target acquired | No actions | No actions |

All nine runs replayed 48 decisions and 2,880 full-circuit samples exactly: **432 decisions, 25,920 samples, 259,200 integration steps**. Standard-case intact had 12 cursor moves, 9 wheel actions and 2 clicks. Offset-case intact had 11 moves, 13 wheel actions and 1 click. Low contrast had 2 wheel actions. Controls had no controller input events.

The offset failure is an action-budget limitation: the final target was in the cursor lane by decision 42, but after three final horizontal moves its centroid was still 104 px right of the cursor when the fixed budget ended. The controller did not receive hidden completion assistance. Low contrast fails the predeclared green mask. These results do not establish reliable general-web navigation; public-page exploration remains deferred.

New raw PNGs, compressed all-neuron traces and browser recordings are distributed as a GitHub release asset, outside ordinary Git history. Restore the archive into `runtime/exhibit-validation/` to replay or inspect full windows locally. Compact records and verified commit links remain useful in a fresh clone without raw media. The frozen original baseline remains under `docs/evidence/browser`.

[Download the evidence bundle](https://github.com/SpecimenArchive/Specimen-Archive/releases/download/exhibit-v1/specimen-exhibit-evidence.zip) and extract at the repository root; the archive already contains the `runtime/` path prefixes. Verify SHA256 `2b5f07ddb786de4f969a3eb6c80ecd2b4d8b4c6b5fcda207409d79ab7ffcc72f` before extracting. [Release notes](https://github.com/SpecimenArchive/Specimen-Archive/releases/tag/exhibit-v1).

Commands: `npm run exhibit:validate`; `npm run exhibit:replay -- runtime/exhibit-validation/<run-id>`; `node scripts/exhibit-endurance.mjs`. See [controller methods](../../EXHIBIT_CONTROLLER.md) and the [companion worksheet](../../WORKSHEET.html).
