# Data provenance

## Primary material

| Material | Source and version | Use |
|---|---|---|
| Whole-body connectome | [Verasztó, Jasek et al., eLife 13:RP97964](https://elifesciences.org/articles/97964), Version of Record, 27 August 2025, DOI 10.7554/eLife.97964.3 | Connectivity, cell annotations and biological context |
| Figure 2 source data 1 | [elife-97964-fig2-data1-v1.zip](https://cdn.elifesciences.org/articles/97964/elife-97964-fig2-data1-v1.zip), member `Figure2_source_data1.rds` | Authoritative imported graph |
| Published code archive | [Zenodo 15830426](https://zenodo.org/records/15830426), published 7 July 2025 | Archive metadata, attribution, reuse terms and alternative source inspection |
| Interactive atlas | [Jékely Lab Platynereis atlas](https://jekelylab.github.io/Platynereis_connectome/) | Reference navigation; current index links to the celltype compendium |
| Visual navigation | [Randel et al., eLife 3:e02730](https://elifesciences.org/articles/02730), DOI 10.7554/eLife.02730 | Circuit identity, developmental-stage and movement references |

The connectome authors are Csaba Verasztó, Sanja Jasek, Martin Gühmann, Luis Alberto Bezares-Calderón, Elizabeth A. Williams, Réza Shahidi and Gáspár Jékely. Affiliations include the University of Exeter, Heidelberg University, EPFL and the University of Bristol. This application is independent and does not imply their endorsement.

## Verified counts and categories

| Category | Source study | Imported Figure 2 graph | Active model |
|---|---:|---:|---:|
| All reconstructed body cells | 9,162 | Not the graph's counting unit | — |
| Classified neurons / types | 966 / 202 | Different from graph-class totals | — |
| All graph nodes | 2,675 | 2,675 | 47 |
| Sensory-class nodes | — | 468 | 21 |
| Interneuron-class nodes | — | 920 | 20 |
| Motor-class nodes | — | 239 | 6 |
| Effector nodes | — | 424 | 0 |
| Fragment nodes | 467 | 467 | 0 |
| Other nodes | — | 157 | 0 |
| Directed edges | 14,066 | 14,066 | 161 |
| In-graph synapses | 26,881 | 26,881 | 711 |

The three graph neuron classes total **1,627**, including source annotations beyond the study's set of classified neurons. The source totals of 9,162 body cells and 2,675 graph nodes have different counting units. The active circuit count appears separately above; ambiguous fragments retain their source classification.

## Import contract

The source ZIP is 566,594 bytes and contains one RDS file. The RDS is a serialized R `tbl_graph`/igraph object, not a CSV. `rdata==1.0.0` exposes its ten-slot underlying igraph list. The pipeline validates vertex count, directedness, edge arrays and weights before extracting attributes. The R class-wrapper warning is suppressed only after explicitly supporting this representation; alternate structures fail loudly.

`data/processed/manifest.json` records archive/member SHA-256, exact transformations, selection, exclusions, source versus imported counts, and output byte hashes. `connectome.json` preserves source labels, skeleton IDs, type annotations, classes, side, segment, module and the published graph-layout x/y values. `circuit.json` is its selected induced subgraph. No random network fallback exists.

Rebuild with Python 3.12 and `scripts/requirements.txt`. Delete or move the cached ZIP yourself only if you explicitly want to re-download; otherwise the pipeline uses the cache and produces byte-identical scientific outputs. The pinned supplement filename identifies the release. Unexpected graph counts stop ingestion.

## Version discrepancies and access findings

- The atlas's old `Full_connectome_modules_with_names.html` URL returned 404 during the build. The atlas index remains accessible and points to the celltype compendium.
- The Zenodo archive is approximately 1.87 GB. Its public API metadata and corresponding repository were inspected; the bulk archive and microscopy volume were not downloaded.
- A compact GraphML alternative at repository tag `1.1` contains 2,706 nodes and 14,294 edges. It is an older export, lacks the required labels in that file, and was deliberately excluded.
- The available Figure 1 raster contains older graph-class counts (1,642 neurons). It is useful as an anatomical reference, but its totals do not override the exact current Figure 2 supplement. The application displays imported counts from the manifest.

## Visual references and constructed assets

The primary Figure 1 images for eLife 02730 and 97964 were inspected at their published scales: a compact larva with a distinct head, prototroch and three bristled trunk segments. The optical field uses an approximately 215 μm virtual body proportion. Surface detail, opacity, focus and pigment belong to the registered observation plate. Published anatomy and the optical registration have separate records.

`public/assets/tissue-texture.png` supplies a low-opacity optical layer in the earlier procedural renderer. Its original method and prompts remain in `public/assets/tissue-texture.provenance.txt`; the [assessment companion](ASSESSMENT_COMPANION.md#image-preparation-record) describes the constructed imagery separately from the scientific sources. Screenshots and WebM clips in `docs/` retain their captured application states and timing where relevant.

## Reuse and credit

The eLife article is distributed under Creative Commons Attribution; the pinned Zenodo record states **CC BY 4.0**. The compact derived graph assets are redistributed under CC BY 4.0 with author credit, source links, version and transformation notices. Our original code uses MIT, separately from data and third-party assets. See [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md).

The inspiration project [flybrain.online](https://flybrain.online/) and [fruitflydev/flycoinrh](https://github.com/fruitflydev/flycoinrh) was inspected for the relationship between imported wiring, sensory input, motor output and an observation feed. No interface, source code, fly-specific model, token actions, account or credential flow was copied.
