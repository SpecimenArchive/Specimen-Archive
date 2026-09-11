# Specimen Archive — observation dashboard and Windows runtime upgrade

Continue the existing Specimen Archive project and implement this upgrade now. Inspect the repository, project instructions, current application and existing Windows 11 VM connection before editing. Use relevant installed design, image and browser skills where useful. Make routine decisions independently; ask only for missing access or a consequential unresolved choice. Complete the work and show the running result.

The goal is a compelling observation station: a large laboratory view, visible Windows activity, meaningful neural visualisation and a readable explanation of what is happening. Visitors observe; they do not control the VM. This is a substantial redesign plus runtime repair.

## 1. Diagnose the current faults before decorating them

The supplied screenshots show:
- A tiny apparatus thumbnail inside a mostly empty introductory banner.
- An IDLE session, a no-signal sensory state and many waits with a closed motor gate.
- A sensory preview containing a Record button while the Windows capture shows the dashboard.
- CMD/PowerShell visible behind a small Chrome window.
- Archive runs marked error, with publication pending and “Repository destination not configured.”

Treat these as symptoms to investigate, not proof of a particular cause. Trace capture, active tab, sensory crop, encoding, integration, motor decoding, input execution, recording and publication. Explain the actual causes and fix them.

Check frame IDs and timestamps: the displayed sensory input must correspond to the page the controller actually sensed and acted on. A stored sample or hidden test page must not masquerade as the currently visible tab. Distinguish valid weak input, a legitimate wait, a completed task, a stale frame and a broken capture connection. Do not fill missing telemetry with plausible zeroes.

## 2. Make the laboratory view the main attraction

Replace the apparatus introduction banner with a large, immediately visible observation stage. At desktop sizes, use approximately 70–75% of the main row for the laboratory scene and the remaining width for the activity feed. Adjust proportions to preserve the full monitor, microscope and labelled base without stretching the image. A visitor must not need Expand to see the main exhibit.

Keep the header compact. Place a concise session strip near the stage: connection state, session elapsed time, current activity and desktop-frame age. Fullscreen is an optional enhancement.

Below the main stage, show the three supporting views together on desktop:
1. Microscopy specimen and model-derived motion.
2. Sensory input and neural activity.
3. A large enough direct Windows desktop capture to inspect browser behaviour.

These remain visibly connected to the same session. Use the four views to explain the system, rather than repeating the same small picture throughout the page.

Keep the charcoal, ivory and restrained teal identity. Improve typography, spacing and hierarchy substantially: readable body text, clear labels, large useful values and restrained emphasis. Remove oversized empty card interiors and walls of tiny monospace text. Use monospace for measurements and event details. Preserve comfortable mobile layouts and reduced-motion support.

Retain the established apparatus, natural marker labels and controlled indoor lighting. Reuse the current calibrated asset unless there is a concrete visual defect.

## 3. Clean up the real Windows desktop and keep it running

Inspect which services depend on the visible terminal before closing it. Move required processes to the existing reliable unattended launch mechanism, with file logs, restart handling and the required interactive desktop session for capture/input. Then close only the redundant project terminal windows. Do not kill the controller, capture worker or unrelated processes to tidy the screen.

Use genuine Windows 11, its real taskbar and headed Chrome. Size Chrome generously, normally maximised, with recognisable tabs and address controls. Keep the actual observation website pinned as the main tab. No domain is required: use the address that actually works from within the VM.

Keep the main site visible for most of the session, with occasional bounded visits to approved secondary pages. Make real scrolling visible on the dashboard and secondary pages where content allows it. Support sensible pauses and returns without rapid tab thrashing. Repair the sensory/decoder/execution path if it cannot currently produce useful actions; do not substitute a decorative scrolling loop.

The specimen/controller drives actions attributed to it. Operational actions such as preparing a page, changing a task or returning to the dashboard can be scheduled separately, but must be recorded as orchestration. Do not silently use random scripts, DOM target snapping or an LLM to generate supposedly neural actions.

The workstation version of the dashboard must suppress recursive capture of its own monitor view. Keep useful metrics, signals and specimen content visible inside that version.

## 4. Add a genuinely live activity and command feed

Place this beside the large laboratory stage, visible immediately. Organise it around:
- NOW: the actual current operation and active page.
- QUEUED: commands already accepted for execution and scheduled maintenance/task changes.
- RECENT: completed, blocked, cancelled and failed actions.

Show timestamp, command type, source (neural decoder or orchestration), relevant parameters, execution status and result. Plain summaries should make the activity understandable, with technical detail available on selection. Include meaningful waits and their causes; collapse repetitive waits with a count and duration.

“What happens next” must come from the real queue. Future neural decisions are not known: show “Awaiting next neural decision” when appropriate. Never fabricate intentions, countdowns, predicted actions or success.

Selecting an executed event should link its source frame and crop, encoded sensory values, contributing neural outputs, decoder calculation/threshold, actual command and resulting observation. Use shared frame/decision/event IDs. Redact sensitive desktop or request information from public logs.

Implement a bounded feed with follow-live behaviour and pause-follow for inspection. Pausing the viewer's feed must not pause the VM. Avoid rearranging rows while someone is reading an event.

## 5. Make the neural instrumentation richer and understandable

Derive every metric from the current engine. Verify the implemented circuit size instead of assuming the historical 47 cells and 161 directed edges are still current. Keep full-study anatomical statistics separate from runtime counts.

Build these core displays:
- Sensory view: exact input image/crop with the actual sampling overlay and left/right encoded drive.
- Circuit view: the implemented sensory, interneuron and motor graph, with node intensity and connections responding to recorded model activity. Use anatomical positions only if available and verified; otherwise identify the layout as functional.
- Activity history: a rolling heatmap for the implemented cells, plus an inspectable selected-cell trace.
- Motor decoder: left/right outputs, motor mean, directional contrast and clearly visible action thresholds.
- A compact metric strip: active units using a documented threshold, sensory imbalance, motor drive, executed actions per minute, cumulative executed actions and capture-to-action latency.

Put capture FPS, frame age, input/decision cadence and model-time/wall-time ratio in a compact health panel. Show units, aggregation window and brief definitions. Count successful execution separately from attempted or queued commands.

Use activity-linked transitions, trace cursors and a short highlight when a decision causes an action. Keep consistent colours across the input, circuit, decoder and event feed. Interpolation is for display only and must stop across stale data or gaps.

Do not invent spike rates or millivolts if this is a normalised-activity model. Do not copy fly-specific neurons or mushroom-body learning metrics into an annelid circuit. Describe computed neural activity accurately in the existing Methods and worksheet; maintain the agreed exhibit framing.

## 6. Explain how the specimen controls the computer

Make this understandable near the main observation stage, with a concise explanation and a deeper inspectable section. A visitor should immediately understand what connects the specimen to Windows and why this is a working software system.

Suggested factual wording, once verified against the implementation: “Specimen 01's neural model is connected to this Windows computer. Browser images become sensory inputs. Activity propagates through a circuit reconstructed from published larval connectivity, and our decoder translates its motor outputs into mouse and scrolling commands.”

Show the actual implemented stages: browser capture, numerical sensory encoding, neural computation, motor decoding and command execution. State which anatomy/connectivity comes from the research and which dynamics, thresholds and control mappings were introduced in code. Explain that a connectivity map alone does not specify a complete functioning biological brain.

Use a compact numbered explainer with current values, then link each stage to its actual source module, relevant data and an inspectable live event. Resolve the real repository paths rather than inventing filenames. Explain the image-to-input transformation and action threshold in plain language. Clearly identify scheduled orchestration where it participates.

The claimed connection is a software interface to a model of larval neurons. Do not describe the generated apparatus scene as evidence of physical neural recording, electrodes or possession. Keep the existing Methods and companion worksheet consistent. The visual narrative can remain immersive while the explanation identifies the real technology precisely.

## 7. Add two features that make the behaviour easy to follow

Add a compact “Last action explained” panel: one readable sentence derived from the actual decoder and execution result, followed by an inspectable calculation. A deterministic explanation is sufficient.

Add an event timeline that connects a sensory change, neural response and browser result. Let visitors inspect or replay an earlier event locally while the shared server continues. Clearly indicate when their view is historical and provide Return to live.

Continue the specimen's existing local deformation and motion mapping. Do not replace it with whole-image rotation or invent physical movement measurements. Ensure a frozen capture is visibly stale rather than animated into apparent freshness.

## 8. Repair recording and archive publication

Inspect each error category using actual logs. Run execution, recording and repository publication are separate stages: show their statuses separately so a publication failure does not imply the experiment failed.

Resolve “Repository destination not configured” using the project's actual configuration and existing SpecimenArchive/Specimen-Archive repository access. Verify destination, branch, credentials, permissions and the recorder's configuration. Use existing publication authorisation; if private access is missing, ask specifically for where it can be configured, without requesting secrets in chat.

Implement bounded retries and prevent duplicate publications. Do not commit every telemetry packet or put large video files and credentials into Git. Preserve the existing appropriate storage arrangement, publish compact evidence at episode boundaries, and keep source and evidence links working.

Keep historical failed records and their real outcomes. The homepage should feature the current intact session and a compact recent-results summary. The full searchable/filterable archive can sit below it. Do not clear errors merely to make the page look successful.

## 9. Verify the complete experience and deliver it

Use one authoritative backend session for all observers. Reconnect with sequence handling and bounded buffers; no duplicate command execution. Keep live, reconnecting, idle, paused, stale, replay and error states accurate. Public observation endpoints must not expose VM controls or secrets.

Review the actual app in a browser at common desktop and mobile sizes. Verify the large stage, legible Windows interface, monitor fit, feed behaviour and telemetry under light/dark browser content. Do not claim visual success based only on automated tests.

Run a ten-minute end-to-end session covering real scrolling, a secondary-tab visit, return to the main dashboard, action inspection and recording. Observe concurrently from two clients and verify agreement on the underlying session/events. Check admin RDP disconnection with services still running, a capture/network interruption and reconnection without false-live status or duplicate inputs. Reuse valid existing checks; add targeted tests for the changes and concrete remaining risks.

Make genuine milestone commits. Report the preview address, fixes and their causes, actual runtime verification, and any unresolved limitation. If already authorised publishing or deployment applies, complete that scoped step after verification; otherwise provide the reviewed result without expanding access.

Reference the observation structure at https://flybrain.online/ and its source at https://github.com/fruitflydev/flycoinrh. Borrow the readable relationship between sensory input, neural activity and motor output; keep Specimen Archive's own visual identity and scientifically appropriate circuitry.

Start implementing. Do not stop at a plan, a brief review or another cosmetic approval question.
