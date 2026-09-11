# Specimen Archive — recovery and implementation brief

Resume this existing project now. The previous Codex conversation became inaccessible, so recover the working state from the repository and this brief. This is an implementation task: inspect, make the necessary changes, run the application, review the result and complete the remaining work.

This document consolidates the current milestone and supersedes conflicting earlier visual directions. Make routine technical and visual decisions independently. Use review checkpoints for your own assessment; do not pause for cosmetic approval. Ask only when missing access or a consequential decision genuinely blocks progress, and continue independent work meanwhile.

## 1. Recover the existing project

Work in the current project directory. Read its instructions, relevant skills, README, STATUS.md, research notes, configuration, scripts and tests. Inspect Git status, branch, remotes, recent commits, uncommitted changes, existing assets and running project processes.

Preserve completed functionality and unfinished work. Do not reset the repository, discard files, rebuild the project from scratch or start duplicate controller sessions. Recover from actual files and running services without requiring the old chat or screenshots.

Known context, to verify against the repository:

- Brand: Specimen Archive. Current exhibit: Specimen 01, ticker $LARVA.
- Biological reference: Platynereis dumerilii, with a selected larval reference stage previously shown as 72 hpf.
- Previous interface reported 47 cells and 161 directed connections; confirm the actual selected dataset.
- The project includes a neural engine, sensory encoding, browser control, telemetry, recordings, an evidence archive and photographic microscope/specimen assets.
- Previous previews used http://127.0.0.1:4317/. Inspect existing startup configuration before launching.
- Public repository: SpecimenArchive/Specimen-Archive, previously using master.
- The last confirmed desktop capture source was Ubuntu/X11. The local host was reported as Windows 11 Pro; remote Windows 11 support was being prepared. A rented VM has been discussed, but its availability and connection details must be verified.
- The previous agent reported 29 passing tests and a 602-second session with 11,033 matching packets and successful reconnection. Locate those results and their source revision; they are historical reports, not automatic validation of subsequent Windows changes.

Give a concise recovery update, then proceed directly to implementation.

## 2. Exhibit and technical objective

Build a coherent laboratory exhibit in which visitors watch a larval neural model operate a real Windows browser, with the software's inputs, outputs and actions available for inspection.

The intended audience receives a companion worksheet identifying the fictional laboratory setting, generated apparatus/specimen imagery, computational neural model and genuinely executed software actions. Keep that worksheet and technical provenance accurate and available. The interface can remain in character without repeated simulation banners. Laboratory possession language belongs to the staged narrative.

Source code, Methods and experiment reports must accurately distinguish published anatomy, assumed model dynamics, engineered control mappings and executed actions. Rendered equipment is scenery; proof of working technology comes from runnable code and traceable behaviour.

Public visitors may inspect neurons, views, events and recordings. They cannot operate the VM, modify stimuli or change the active controller. Keep operator pause, manual recovery and emergency stop private, with assistance recorded.

## 3. Connect to an actual Windows 11 VM

Use a genuine Windows 11 environment as the browser and desktop-capture worker. Prefer the rented remote VM once available. Verify the operating system and available access before choosing an implementation.

Run actual Chrome and capture the real Windows desktop, including taskbar, Start button, application icons, system tray, clock and native window controls. Do not substitute a Linux theme, generated Windows interface, HTML taskbar or static desktop image around a moving webpage.

Keep the existing neural backend where it runs reliably. Connect it to the Windows execution/capture worker through authenticated communication. If the VM is unavailable, prepare installation scripts, configuration, worker integration and clear requirements; identify the specific access or provisioning step still needed. Do not silently purchase services or install a local VM as a substitute for the requested remote environment.

Use a dedicated project environment, not a capture of my everyday desktop. Keep credentials outside tracked files. Preserve unrelated accounts and settings.

Provide reproducible setup, startup, shutdown and recovery instructions. Handle worker reconnects, browser crashes and VM restarts without duplicating sessions or replaying stale commands. Validate that desktop capture and control continue when the operator disconnects from Remote Desktop. VM uptime alone is insufficient.

## 4. Configure the Windows workstation and browser tabs

Use a restrained Windows desktop background and a few genuine useful shortcuts. Give Chrome a sensible size using most of the display while leaving the taskbar visible. Avoid a tiny central browser surrounded by empty desktop.

Use one configured station timezone. The taskbar clock must show the environment's actual time. Preserve native browser tabs, address bar, navigation controls and window decorations; do not invent or paint these elements.

Pin our actual Specimen Archive website as the main Chrome tab. It should display current specimen state, neuronal activity, metrics and event history from the same active backend. Give this dashboard most of the screen time.

We do not have a public domain yet. Serve the application inside the VM or make the development server available through an appropriate private connection. Do not assume localhost on my computer is reachable as localhost inside the VM.

Prevent recursive monitor-within-monitor capture. Add a workstation display mode of the same website that keeps the live data but suppresses embedded captures of its own desktop. External observers retain the complete four-view interface.

Keep several secondary tabs for varied observation tasks: reading pages, scrolling, following links, navigating back and simple visual interactions. Use suitable public pages and project-hosted task pages. Vary starting conditions and task selection so it does not endlessly repeat one staged sequence.

Keep activity within navigation and observation; exclude purchases, account changes, messages, uploads and downloads. Return the presentation to the main dashboard between excursions.

The task scheduler may prepare tabs, choose tasks or restore dashboard focus. Record those operations as orchestration. Attribute only actions actually decoded from neural outputs to the neural controller. Log random seeds and task configurations where needed for reproduction.

## 5. Preserve real neural causality

Verify and maintain this feedback loop:

Browser image → sensory encoding → neural model → motor outputs → action decoder → executed Windows/browser input → resulting image.

Use the actual selected connectome data with traceable neuron IDs and connections. Document source, filtering, coverage, licences and assumptions. Preserve the existing engine wherever appropriate.

Extend the decoder only where additional demonstrated actions require it. Explain the populations, thresholds, timing and engineering mappings used for movement, activation, scrolling or tab-related commands.

Keep controller sensory input separate from full-desktop presentation capture. Desktop resolution, DPI scaling, browser placement and crop changes must not silently invalidate input or action coordinates. Display a single consistent pointer corresponding to executed actions.

Keep DOM target coordinates, task answers and success checks outside the visual controller's decision pathway. DOM inspection may support evaluation or reject prohibited actions, but must not choose successful actions behind the neural display.

Do not replace neural decisions with random click scripts, hidden target snapping, scripted task completion or an LLM driver. Varied activity is useful only when its origin is inspectable. Report what the implemented controller can actually do; do not claim arbitrary browser competence from a simple navigation task.

Keep my manual token deployment separate from controller actions. Any contract or transaction display must use actual data and accurate attribution.

## 6. Preserve all four connected views

A. Apparatus overview: show the microscope workstation, chamber and computer as one consistent setup. Keep it expandable so it does not displace the active technical demonstration.

B. Specimen observation: retain the strongest photographic microscopy treatment. Preserve reference anatomy, translucent depth, restrained pigment and selective focus. Use subtle local bending and supported appendage movement, with internal structures anchored to the body. Avoid whole-image rotation as the main animation, rigid repeated compartments, rubbery stretching, sliding textures and excessive grain. Constrain orientation to what the renderer supports convincingly. Model-dependent behaviour must follow model outputs; document decorative optical effects separately.

C. Signal inspection: show the actual input image or sampled region, encoded sensory drive, neuronal activity, motor outputs and decoder thresholds. Include compact activity history and a detailed selected-neuron trace with source IDs, connections and units. Use anatomical coordinates only when supported by data; otherwise explain the schematic layout. Display quantities the engine computes, without invented voltage, spike or calcium measurements.

D. Browser execution: show the actual controlled Windows browser, pointer, page changes, current task/tab and event feed. It is independent of the observer's browser.

On desktop, specimen observation, signal inspection and browser execution must be visible together, with apparatus context expandable. Keep all four accessible on narrow screens. Preserve legibility and avoid excessive blank space or repeated evidence cards.

## 7. Correct the apparatus lighting

Preserve the established microscope, chamber, camera, monitor and equipment arrangement. Use closed blinds and consistent controlled indoor lighting, resolving the permanent-daylight problem without adding a day/night system.

Keep equipment placement, framing, chamber geometry and lighting consistent across apparatus views. The bench camera can remain fixed. Avoid decorative camera wobble, constantly flickering lights or unnecessary moving equipment.

Cables connect plausible equipment. Do not add invented electrodes in the larva, fabricated staff credentials or affiliations.

If an asset truly prevents clean integration, revise it carefully while preserving scene continuity. Avoid unnecessary redesign of the whole apparatus.

## 8. Final microscope lettering

Replace the previous awkward handle lettering with two separate black-marker inscriptions:

- Front-facing white panel: "$LARVA", centred within the usable flat front face and clearly readable.
- Visible right-side panel: "Specimen 01", smaller and aligned with that side's perspective.

Keep "@SpecimenArchive" in the website branding, not on the microscope base.

Remove previous attempted lettering and restore its underlying surface before applying the replacements. Neither inscription may cross the rounded corner, wrap between faces or spill onto the top. Leave generous clearance around both.

Use believable handwriting with modest variation in stroke thickness, ink coverage and letter spacing. Keep the baseline controlled. Avoid decorative typography, excessive wobble and artificial distressing. Integrate ink with the surface perspective, lighting and texture.

Update all dependent apparatus views consistently and inspect the result at normal size and close zoom.

## 9. Synchronisation, continuous operation and evidence

Use one authoritative backend session for all observers. Track session/run IDs, code revision, configuration, frame IDs, model steps, target tab, commands, execution results and timestamps.

The signal display, executed browser commands and model-dependent specimen motion must derive from the same state. The apparatus monitor shows the corresponding captured Windows session.

Selecting an event must reveal its input frame, encoded stimulus, relevant neural outputs, decoder calculation, command and observed result. Historical inspection must not modify the active experiment.

Distinguish model time, elapsed wall time, capture time and execution time. Measure capture latency and preserve alignment. Decouple display frame rate from integration cadence; do not fabricate samples or change model timing merely for smoother animation.

Default the homepage to the active intact controller. Completed trials and interrupted-circuit controls belong in an archive with identified conditions. Zero motor activity in a disconnected control is not automatically a defect.

Continue through bounded episodes with documented state preservation or resets. Record setup and recovery assistance. Show actual live, replay, complete, idle, disconnected and error states; do not present old footage as live execution.

Handle browser failures, stalled tasks and observer reconnection. Use bounded telemetry histories, efficient frame streaming and sensible resource limits. A page refresh must not create another experiment. Keep continuous frames and large recordings outside ordinary Git commits.

## 10. Validation and visual review

Reuse valid existing checks for unchanged components. Test changed Windows capture, action mapping, tab behaviour and reconnection paths specifically.

Preserve the existing intact and intervention benchmarks. Compare intact operation with motor outputs disabled and a relevant sensory-to-motor pathway interrupted. State expected effects before interpreting results. Freeze a baseline configuration and evaluate previously unused positions, layouts and contrast conditions, recording failures as well as successes.

A repeatable trace establishes computational reproducibility. Intervention results support causality within the implemented model. Neither alone proves biological fidelity or broad browser intelligence.

Review a 30–60-second integrated recording showing the main dashboard, controller-generated activity in secondary tabs and return to the dashboard. Check light/dark content, normal/expanded views and responsive layouts.

After integrating the Windows runtime, complete a ten-minute continuous check with two observers sharing matching session/events. Include operator Remote Desktop disconnection and observer reconnection. Verify restart recovery separately as needed. Historical Linux validation cannot establish Windows capture continuity.

Use these as self-review checkpoints. Fix concrete failures and continue; avoid repeated cosmetic passes or additional tests with no remaining risk to resolve.

## 11. Source, publication and documentation

The public repository must contain the actual runnable data preparation, neural engine, sensory encoder, decoder, Windows execution/capture worker, telemetry and replay code.

Provide an accurate README, architecture, equations/update rules, model assumptions, provenance, licences, configuration examples, startup/shutdown commands and reproduction instructions. Explain where services run and which steps require VM provisioning or access.

Maintain the companion worksheet distinguishing generated scenery, computed signals, published anatomy and executed actions. Keep scientific claims precise.

Use a compact comparison table with expandable traces, recordings and source links. Keep genuine authorship and timestamps, preserve history and clearly attribute recorder automation.

I authorize normal commits and pushes of tested, relevant project changes to the public SpecimenArchive/Specimen-Archive repository's master branch, following applicable project rules. Verify the remote, inspect tracked files for credentials/private material, and preserve unrelated changes. Do not force-push or rewrite history. Publish meaningful increments and compact records without duplicate publications. Show actual publication success or failure and return real commit links.

Publishing code does not mean the website is hosted. No public domain is required for this milestone. Document remaining hosting requirements accurately.

## 12. Research, scope and final handover

Use existing research and consult primary references when implementation details need verification:

- Whole-body larval connectome: https://elifesciences.org/articles/97964
- Published atlas: https://jekelylab.github.io/Platynereis_connectome/
- Visual sensory-motor circuit: https://elifesciences.org/articles/02730
- Ciliomotor circuitry and imaging: https://elifesciences.org/articles/26000
- Comparative fly implementation: https://github.com/fruitflydev/flycoinrh
- Browser actions: https://playwright.dev/docs/input
- Browser traces: https://playwright.dev/docs/trace-viewer
- Windows capture: https://learn.microsoft.com/en-us/windows/apps/develop/media-authoring-processing/screen-capture

Use the fly project as an architectural reference while keeping this implementation original and species-appropriate. Do not import fly-specific sensory anatomy or learning circuitry without justification.

Use relevant available design, image-generation, rendering and browser-inspection skills. Create a focused reusable skill only if it materially helps and follow its required workflow. Preserve editable/source assets where available.

Prioritise the working Windows session, main dashboard and secondary-tab actions, coherent four-view exhibit, monitor integration and correct labels. Defer circuit expansion, learning and LLM journals until this milestone works. Track deferred features accurately.

Maintain STATUS.md with completed work, current configuration, meaningful limitations, pending access and next steps so another chat can resume reliably.

Finish with:
- The running preview and complete dashboard screenshot.
- An unwarped Windows desktop capture and finished monitor close-up.
- A reviewed action recording with its source revision.
- The published commit link, or the exact publication blocker.
- Actual validation results and any unfinished requirements.
- Exact startup/shutdown commands, including remote worker and WSL dependencies where applicable.

Begin now: recover the repository state, report the immediate implementation steps briefly, and proceed to changes. Do not stop after reading or summarising this brief.
