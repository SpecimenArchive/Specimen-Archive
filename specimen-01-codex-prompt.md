You are working in my newly created VS Code project folder. Build the first complete, locally runnable version of SPECIMEN 01, an observation-only digital biology console featuring a Platynereis dumerilii marine bristle-worm larva. Its associated ticker is $LARVA.

I will be available to collaborate. Work actively through research, implementation, running the application, visual inspection, fixes and documentation. Ask me focused questions when my input would materially improve the creative direction, priorities, scope or a consequential technical tradeoff. Give your recommendation and show a concrete preview or a small set of meaningful options where possible. Handle routine implementation decisions yourself and keep progressing on independent work while awaiting my input. Do not front-load a long questionnaire or repeatedly ask permission for ordinary local edits.

This needs to be impressive in both presentation and inspectable technical substance. Prioritise the specimen's visual quality, a distinctive and coherent observation console, clear neural activity, responsive streaming and reproducible explanations of how the system works. Iterate on the actual rendered result. Do not stop after a plan, scaffold, mockup or first successful build. Read and follow applicable repository instructions, preserve existing work, and implement the strongest coherent result you can. Do not spend time padding the architecture or adding unrelated features.

1. Product and presentation

- Display name: Specimen 01. Ticker: $LARVA. Potential umbrella identity: Specimen Archive, allowing later specimens to have different organisms and tickers. The X handle and contract address are configurable and currently unconfirmed; do not invent accounts or addresses.
- This is an immersive demonstration for an audience explicitly briefed beforehand that the specimen is synthetic. The main interface can remain in character as an observation console. Do not plaster simulation warnings over every panel. Keep the Methods and provenance material accurate about the digital specimen, simulated dynamics and implementation assumptions.
- Visitors observe a system that runs by itself. No gameplay, joystick, feeding, stimulus sliders, click-to-poke interactions, rewards, wallet connection or visitor start/stop controls. Reading documentation, inspecting neurons, changing observation views and navigating recorded sessions are fine; these must not alter the experiment.
- I will deploy the token myself. This build requires no wallet, signing, trading or deployment functionality. Do not fabricate transaction receipts, a deployment history, physical laboratory measurements or proof of autonomous token deployment.
- Work locally. Do not publish a site, post to X, provision paid services, purchase anything or use credentials. Missing external services should not block the local application.

2. Scientific foundation: establish this early

Read the primary research and inspect the available data before settling the model or biological visuals:

- Paper: https://elifesciences.org/articles/97964
- Interactive atlas: https://jekelylab.github.io/Platynereis_connectome/
- Published full-connectome graph export, Figure 2 source data: https://cdn.elifesciences.org/articles/97964/elife-97964-fig2-data1-v1.zip
- Published code archive: https://doi.org/10.5281/zenodo.15830426
- Visual navigation circuit and behaviour: https://elifesciences.org/articles/02730

For context only, the project that inspired this is https://flybrain.online/ and https://github.com/fruitflydev/flycoinrh. Study its relationship between biological connectivity, simulated activity, observation feed and telemetry. Write our own application and visual identity. Do not fork its interface or merely change the animal graphic.

Use compact connectivity tables, cell annotations, skeletons and meshes. Do not download the full electron-microscopy image volume or start reconstructing a connectome from microscopy. Prefer downloadable research supplements over fragile live APIs. Inspect the graph export's contents and format before choosing a conversion tool; do not assume it is CSV. A small reproducible Python or R preprocessing step is acceptable if necessary.

Verify the dataset version and counting rules. Reported figures to check against the paper include 9,162 reconstructed body cells, 966 neurons classified into 202 types, and a filtered graph with 2,675 nodes including 467 fragments, 14,066 directed edges and 26,881 in-graph synapses. These categories are not interchangeable. Never label all body cells or all graph nodes as neurons. Display the actual imported and simulated counts, separately from source-study counts.

Create a reproducible ingestion pipeline and a data manifest containing source URLs, version/date, attribution and reuse terms, file checksums, transformations, node categories, edge meaning, exclusions and output counts. Cache compact processed data locally. Do not invent anatomical coordinates, neuron identities or connectivity and present them as measured data. A force-directed graph layout is acceptable when explicitly identified as a layout rather than physical anatomy.

Timebox blocked downloads to a few sensible attempts and try the published alternative routes. Continue other useful implementation while resolving access problems. Never quietly replace inaccessible scientific data with a random network.

3. A working neural pipeline, not decorative telemetry

Build a reproducible continuous model using real imported connectivity. The smallest acceptable scientific milestone is an identifiable sensory-to-motor circuit responding to controlled input through its actual connections. Expand the simulated network only as the available annotations and runtime budget justify. The anatomical explorer may show more of the published graph than the active model, but make those counts and boundaries explicit in Methods.

The published wiring is not a pretrained working brain. Synapse counts are structural measurements, not directly measured functional efficacy. Select suitable neuronal dynamics, document the equations, units and time step, and explain assumed gains, delays, thresholds and neurotransmitter signs. Research known circuit identities. Treat missing transmitter assignments and ambiguous fragments explicitly; do not manufacture certainty or blindly reuse fly-specific neuron rules.

The causal path must be inspectable: automatic stimulus schedule -> sensory encoding -> network dynamics -> motor readout -> specimen movement -> observation and event records. Build a simple documented virtual environment for the organism. Scheduled environmental changes happen automatically, with no visitor controls. Model output should influence the specimen's active movement, and relevant pose/environment information should feed subsequent sensory input.

Separate decorative optical effects from biological model output. Do not animate random numbers into the dashboard. Activity, motor signals, response timing, current pose and events must come from the running system. If the model is not spiking, use the correct activity labels instead of inventing spikes per second. Distinguish wall-clock time from simulated time.

Use a seeded run configuration and store event/state checkpoints so an observed episode can be reproduced. Verify that changing sensory input or disabling a relevant pathway changes the response; use a disconnected or shuffled control where meaningful. Report the actual outcome. Never hardcode a successful response while claiming it emerged from the connectome. A working assumed model must not be described as a validated replica of animal behaviour.

4. Observation feed and specimen rendering

The main attraction is a convincing microscope-style observation of the three-day-old Platynereis larva from the research. It must resemble that organism and developmental stage, with reference-grounded proportions, translucency, pigmentation, segmentation, fine bristles and ciliary structures. Verify its scale from the scientific material. Do not substitute a caterpillar, fly maggot, adult worm or generic cartoon creature.

Use a coherent, restrained microscopic aesthetic. Create a pale observation field, a translucent specimen and subtle optical depth. Design a calm observation sequence with movement variations grounded in published behaviour. Ciliary movement, rotation and bending are more relevant than a generic snake animation. A slowed observation view is acceptable if its time scale is represented accurately.

If suitable image-generation tools are available, use them for reference-informed visual assets and textures. They must not fabricate scientific evidence. Use a controllable renderer for the specimen's live movement so its pose can follow the model. A prerecorded generated video cannot substitute for the live causal pipeline. If generation tools are unavailable, build the strongest anatomically informed procedural/3D render possible and continue without waiting for me.

Maintain stable anatomy across frames. Avoid obvious loop resets, random body morphing, exaggerated lens effects and unnecessary camera shaking. The specimen should be the visual focus. Active locomotion should derive from the documented motor mapping; passive drift and camera effects should remain separate. A beautiful image with unrelated graphs is not a completed implementation.

5. Skills and visual craft

Inspect the skills and tools actually available in this environment. Use relevant frontend design, scientific visualisation, image generation, animation, browser inspection and testing skills when they materially improve the result. Read their instructions and apply them; do not just mention skill names. Honour repository instructions and existing permissions.

If a recurring project workflow would benefit from its own skill, use the available skill-creation guidance to create a focused, project-scoped skill and keep it in source control. Good candidates are the observation-console design system or the repeatable specimen asset/animation review process. A skill should specify concrete inputs, outputs and acceptance criteria. Avoid a proliferation of generic skills or spending the session building infrastructure instead of the product. Prefer a concise design document when that is sufficient. Do not install untrusted skill bundles or require paid tools to proceed.

Develop one coherent art direction before scaling the interface. Record the typography, palette, spacing, component rules, scientific visualisation conventions and specimen rendering standards. Show me a concrete specimen study or representative observation view early enough that my feedback can shape the result. Explain the strongest direction and ask for guidance when the alternatives would materially change the experience. Continue data and engine work while we refine the visuals. Once the direction is settled, apply it consistently. Iterate against screenshots and actual animation, not descriptions of what the interface should look like.

6. Original dashboard design

Build a compact scientific instrument interface that feels purposeful and cool. Use near-black graphite framing, a pale microscope viewport, restrained cyan or amber accents, readable typography and monospaced numerical readouts. Avoid a generic SaaS landing page, oversized gradient hero, endless card grids, fake terminal spam or excessive neon.

The opening desktop view should immediately show the specimen, its current session and meaningful neural activity. Give the observation feed the most visual space, with an adjacent network/anatomy view and a readable event strip. Balance density with legibility. Keep expensive rendering and graphs performant rather than drawing every edge at once.

Implement these areas:

- Observation: specimen feed, identifier, developmental stage, current model state, actual session time, observation scale and connection health.
- Neural activity: functional groups, current activity and sensory/motor readouts. Support view-only inspection of selected nodes and their provenance.
- Events: concise records of environmental changes, neural responses and movement, all derived from the same run. Do not invent emotions, decisions or consciousness.
- Architecture and Methods: detailed but readable explanations of data ingestion, neuron model, inputs, motor mapping, rendering, streaming, persistence and validation. Include an accurate architecture diagram and equations where useful.
- Research: primary papers, authors/institutions, dataset version, attribution, source-versus-model distinctions and implementation limitations. Credit the research without implying endorsement.
- Session archive: only real locally recorded episodes. If there are none, show an appropriate empty state. Replays must have an identifiable recorded-session state and timestamp.

Use progressive disclosure: concise default views, substantial detail for people who open Methods or inspect a circuit. All visible controls must work. No invented historical uptime, chain data, charts, logs or inactive navigation presented as finished features.

7. Engineering and streaming

Detect the actual local environment. Prefer a maintainable TypeScript application with React/Vite for the interface and a lightweight local server for the continuous engine and streaming, unless your initial inspection gives a concrete reason to use another approach. Use a separate scientific preprocessing tool only when helpful. Keep service count small; do not introduce Kubernetes, cloud queues or an external database for this prototype.

The engine should run independently of whether a browser tab is open. Stream compact, versioned snapshots/events over WebSocket or another justified transport, including run ID, sequence, timestamps, model time, pose and neural readouts. Clients render the same authoritative state. If a video stream is unnecessary for the digital observation feed, render from server state in the browser rather than adding fragile video infrastructure.

Implement bounded history, backpressure, reconnect/resync behaviour, safe cleanup and a truthful stale/offline state. Do not keep displaying LIVE while replaying old data or after the engine has stopped. Preserve checkpoints, record restart gaps and recover cleanly. Bind local services appropriately, avoid exposing experiment mutation endpoints to observers, and do not hardcode external secrets or endpoints.

Make setup and start commands work in my VS Code environment, including Windows compatibility if applicable. Provide one documented command to start the complete application, a data-preparation command if needed, and straightforward stop/restart instructions. Use a lockfile and compatible current dependencies. Keep the project ready for later hosting, but do not deploy it now.

8. Prepare a serious source repository for GitHub

The source repository is part of the deliverable. It should let a technically competent reader reproduce the system and understand exactly how neural activity leads to visible behaviour. Prepare it locally for later publication on GitHub; do not create or push an external repository during this run. If Git is available and the folder is not already a repository, initialise it after checking existing instructions and files. Make meaningful local checkpoints and keep credentials, generated bulk data, dependency directories and runtime logs out of commits.

Include:

- A clear README with a brief explanation, actual screenshots, architecture diagram, exact prerequisites, setup/run commands, data preparation, verification commands and a small source-code map.
- Original application and model source with well-named components and comments explaining scientific or algorithmic choices. Organise ingestion, sensory encoding, network dynamics, motor decoding, rendering and transport so those responsibilities can be inspected separately.
- A reproducible example tracing one stimulus through identified input neurons, connected circuit activity, the motor decoder and the resulting pose update. Preserve source node IDs where available. Save a real sample trace, its run configuration and the command needed to reproduce it. Clearly distinguish direct connection paths from claims about causal contribution.
- Focused METHODS, DATA_PROVENANCE and VALIDATION documentation, including equations, parameter sources, assumed values, category handling, mapping tables and intervention/control results. Explicitly identify which behaviour is implemented in conventional code and which depends on the neural model.
- A small benchmark command and measured results from the machine actually used: model size, update rate, simulation time versus wall time, memory and streaming rate. Report actual measurements; no estimated performance presented as benchmark evidence.
- A sensible licence for our original source code, separate third-party/data notices, a source manifest, dependency lockfiles, a safe configuration example and ignore rules. Include compact scientific assets only where their reuse terms allow it; otherwise provide reproducible download/processing commands.
- A practical CI workflow for meaningful checks and the production build. Keep it capable of running without private credentials, GUI intervention or a large raw-data download. Separate small code fixtures from scientific validation on the real dataset.

If Git or another publication prerequisite is unavailable, finish the source and documentation and explain the exact remaining step. Do not let GitHub setup displace the working demo. The repository's technical depth must reflect implemented, inspectable behaviour; elaborate documentation cannot substitute for a functioning neural pipeline.

9. Work sequence and verification

Work in functional milestones, checking that each is real before expanding it:

A. Inspect the folder, research sources and usable exports; record an implementation plan and decisions in the repository.
B. Import actual data and demonstrate a sensory-to-motor model response with reproducible evidence.
C. Build the continuous engine, state stream and specimen renderer as one working pipeline.
D. Complete the original observation interface, research/Methods material, recorded-session inspection and source repository documentation.
E. Run and inspect the application, fix functional and visual defects, and verify a clean restart.

Keep a concise STATUS.md with completed work, exact commands, known issues, my decisions and next actions so work survives context limits. Give concise progress updates that explain what works, what remains uncertain and where my input would help. Useful review points include the initial visual direction, the first working specimen/neural response and the integrated observation console. Bring concrete work to these conversations; do not turn every milestone into an approval gate. Do not end early at an arbitrary milestone if meaningful authorized work remains. Use source-control checkpoints if available; preserve unrelated work.

Verification should cover data counts and category handling, deterministic model behaviour, a meaningful circuit intervention/control, agreement between streamed pose and activity, observer reconnects, stale-data handling, bounded memory and a session long enough to observe several automatic environmental changes. Report failures honestly and improve the model where the evidence supports it.

Run type checks, relevant tests and a production build. Open the actual application with available browser tools and inspect screenshots at common desktop sizes and a narrow layout. Check the specimen silhouette and animation continuity, viewport fit, contrast, text overflow, event readability and browser console. If browser automation is unavailable, state the limit and use the strongest available verification; never claim visual inspection you did not perform.

10. Completion

Deliver a coherent, locally runnable observation console, not just a code dump. If the data or a scientific assumption blocks part of the goal, finish the other useful parts and identify the exact unresolved dependency rather than disguising it as success. Test fixtures may exist for development but must not masquerade as the imported specimen.

When finished, give me a concise handoff with the run command/local URL, what is implemented, source and model coverage, where the main files and Methods are, which skills were used or created, what you actually tested, repository preparation status, remaining limitations, and a few screenshots if available. Keep the substantial technical explanation in the application and repository. Start now, keep making progress, and involve me when guidance will materially improve the result.
