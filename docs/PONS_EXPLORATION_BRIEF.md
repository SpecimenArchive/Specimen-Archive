# Specimen Archive â€” Pons exploration, control audit and layout refinement

Continue implementing in the existing project. This brief overrides the earlier requirement to keep the Specimen Archive website as the VM's main visible tab or return destination. Preserve the working Windows 11 VM connection, circuit, specimen asset, apparatus composite, recorder and publication setup.

The public website is the observation console. The controlled VM should explore external pages, primarily Pons, with occasional relevant larval research. It must stop browsing or scrolling its own observation console.

Make routine implementation and design decisions independently. Inspect the actual repository and running system, fix the problems, review the result and provide evidence. Ask only for access that is genuinely missing.

## 1. Audit whether the code demonstrates neural control

Answer this explicitly from the current source and actual runs: â€œDoes the code published to GitHub show that this larval neural model produces the controls executed on the Windows VM?â€

Compare the deployed source revision, local changes and public repository revision. Identify the real modules and functions for capture, sensory encoding, neural integration, motor readout, action decoding, dispatch and result verification. Link to the actual source at a fixed commit and trace one real action through every stage.

State exactly what is implemented today: scrolling, cursor movement, clicking, navigation or orchestration. The screenshots say the observation profile scrolls only. Do not claim that it chooses and opens coins merely because a separate browser script does so.

Inspect every path that can issue browser input. Identify scheduled navigation, random choices, defaults, fallback controls and any DOM-derived target coordinates. DOM checks can validate or block a proposed action, but must not secretly choose an allegedly neural target. Code that only gates a scripted decision with neural activity does not demonstrate that the neural model selected its direction or destination.

Publish a compact evidence map: capability, executing function, source of the decision, recorded example and verification result. Give a clear verdict such as verified for scrolling, partly verified for navigation, or not yet verified, with precise limitations. Implement missing pieces needed for the requested behaviour rather than leaving this as an audit report.

## 2. Replace self-browsing with Pons exploration

Use https://www.ponsfamily.com/launchpad as the initial browsing environment. Inspect its current real UI. Spend most browsing time on its Explore listing and coin detail pages; use a smaller proportion for relevant published larval research and source material.

Exclude the Specimen Archive dashboard, including local/workstation variants, from automatic browsing and recovery destinations. This restriction applies to the controller, not to human observers visiting the public website.

The visible sequence should include scrolling through token listings, entering coin detail pages, observing their visible content, scrolling when possible, returning to Explore and encountering other coins. Occasionally visit a relevant research page. Avoid repeatedly visiting a fixed handful of tokens or replaying the same timed tour.

Prefer actual neural-decoded cursor movement, scrolling and link clicks if support can be implemented and verified with the existing model. Document any new motor-to-control mapping and evaluate it on pages not used for tuning. The model responds to visual inputs; it must not be described as understanding token fundamentals or choosing investments.

If opening pages requires a scheduler, keep that route explicit: the scheduler chooses/prepares an environment and neural outputs control the supported interactions within it. Label that distinction in events and Methods. Do not disguise random page selection as a neural decision or convert the entire experience into a random browser bot.

Keep browsing read-only, within approved page routes, without wallet connection, buying, selling, token creation, form submissions or downloads. Do not automate around a challenge or access restriction.

## 3. Fix stagnation and stream freshness

The screenshots show STALE, a desktop age of 40.6 seconds, capture cadence around 0.34 fps, decisions roughly six seconds apart, repeated blocked -48 px commands and episodes with exactly five executed actions. These are investigation targets, not confirmed root causes.

Trace whether recording/finalisation blocks capture, episodes terminate without a clean continuation, a page boundary causes persistent no-ops, the wrong scroll container is targeted, input loses focus, or capture/session transport has failed. Use actual logs and frame IDs.

Separate command proposal, policy acceptance, dispatch, browser acknowledgement and observed effect. A trusted input event alone is insufficient to claim the page moved or a coin opened. Record the observed scroll offset or destination change, with result frames. Distinguish a boundary no-op from a policy block, stale-input rejection and execution failure.

Add bounded recovery for genuine stalls. Stop repeating commands against an unchanged page indefinitely. A supervisor may recover to an approved page, but record this as orchestration. Do not lower thresholds arbitrarily or inject fictional motor activity merely to keep the display moving.

Keep recording and publication off the critical capture/control path. Continue the authoritative session cleanly across episode boundaries. Display the current page and controller phase rather than leaving â€œFinalising the observation recordâ€ as the main activity throughout publication.

Decouple desktop display cadence from neural decision cadence where needed. Profile capture, encoding and transport so scrolling is visibly continuous instead of a sequence of widely spaced stills. Report measured frame rate and latency under the actual VM budget. Do not invent intermediate desktop content, falsify timestamps or force a LIVE badge while data is stale.

## 4. Rebalance the page around the activity

The laboratory image is now oversized. Keep it prominent and automatically visible, but reduce the main stage to roughly 420â€“500 px high on a 1920Ã—1080 desktop, adjusting responsively.

Use a balanced opening composition:
- Laboratory scene on the left, roughly 55% of available width.
- Direct Windows browser view on the right, roughly 45%, making the Pons activity legible.
- Immediately below, a compact row with specimen, useful neural signals and recent actions.

Use responsive containment rather than cutting off equipment or stretching assets.

Keep an optional enlarged view. Remove excessive header height, empty vertical space and giant inactive graph panels. The primary screen should answer: where is it, what is it doing, and which signal caused the latest action?

Move detailed timing diagnostics, long explanations and the full archive behind well-labelled inspection sections or further down the page. Retain accurate source information and the established Methods/worksheet. Keep important operational faults visible in a concise status strip.

Use the existing charcoal/ivory/teal identity, with restrained amber for queued or blocked activity. Fix the large horizontal timeline scrollbar by using a compact recent-event strip with an accessible detail view.

## 5. Add a few distinctive observation features

Implement these from recorded data:

1. Current encounter: the visible site's name, token/page title, small thumbnail or icon if safely available, time on this page and navigation source. Page metadata is UI context, not a claim of neural understanding. Include the token address where available to distinguish identical tickers.

2. Journey strip: the last few visited pages with thumbnails, visit times and which transitions were neural or orchestrated. Selecting an item inspects its record locally; it must not navigate the shared VM.

3. Action overlay: a short actual cursor trail, click indication and scroll-direction/distance indicator in the direct browser view. Clearly treat these as dashboard annotations, not pixels in the raw captured desktop. Map coordinates correctly across browser chrome, viewport, DPI and responsive scaling.

4. Last action explained: sensory input and motor values beside the decoder result and observed browser change. Make this concise enough to follow without reading logs.

5. Meaningful session counters: unique pages visited, coin pages encountered, observed successful interactions and uninterrupted session duration. Keep attempted, blocked and executed counts distinct. Avoid â€œcoins analysed,â€ â€œconviction,â€ â€œbuy signalsâ€ or other capabilities the model does not have.

Keep neural animation tied to real recorded activity. The visual payoff should be watching signals cause observable events, without adding unrelated decorative counters.

## 6. Demonstrate, record and publish the result

Use targeted tests plus a recorded end-to-end run. Demonstrate actual Pons browsing, a coin detail visit, scrolling with observed page displacement, return to Explore, a research visit and continued operation without self-browsing. Identify the decision source for every action.

Use a held-out set of recorded visual inputs with fixed model parameters to compare intact operation, disconnected sensory input and clamped motor output. Run browser integration checks as well. Explain what these tests prove about the implemented software and what remains unproven. Do not claim that ablation alone proves a particular biological model is accurate.

Provide one reproducible command or documented short procedure that loads an evidence record and checks the recorded neural state, decoder output and executed command. Include configuration, dataset identity, random seed where used, timestamps, source commit and relevant before/after frames. Keep public records free of credentials and private machine information.

Observe the live session concurrently from two clients. Verify matching underlying event IDs, recovery after a capture interruption and continued operation after admin RDP disconnection. Confirm that the private publication credential remains isolated from the browser controller.

Keep genuine historical failures, fix current publication faults and use the already approved publication scope. Preserve branch protections; no force pushes. Link the public source and compact evidence once published.

Finish with the running preview, a short before/after explanation, the neural-control audit verdict, a recording of external browsing, actual performance measurements and any remaining blockers. Implement the changes rather than stopping at suggestions.