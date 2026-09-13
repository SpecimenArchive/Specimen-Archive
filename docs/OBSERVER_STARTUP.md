# Opening the observation station

The station continues running on the Windows VM when a visitor closes the site. Opening the site attaches a new observer; it does not start a new specimen episode.

The previous page loaded the application first, then requested the desktop and its larger sensory PNG together. A new frame identifier cancelled the pending presentation, even if the earlier desktop was about to finish decoding. Idle transitions and episode changes could also clear the screen. Three fresh public-page measurements showed first desktop times of 3.362, 2.425 and 7.746 seconds.

The opening document now starts the current-state request and image downloads ahead of the application. It preloads the apparatus plate and gives the desktop priority over the sensory PNG. The first decoded desktop can appear with its matching state packet while that packet's sensory image is still pending. Old sensory pixels clear immediately; they are never shown as the new input. A later decoded image cannot replace a newer displayed frame, and an earlier episode cannot overwrite the current episode.

Refreshing or following a site link retains the last displayed frame, matching neural state and original timestamps in this tab's session storage. It is a held capture until the connection resumes, with normal capture-age and connection labels. This cache expires after 30 minutes and is optional: blocked or full storage falls back to a fresh server capture. It cannot start or change the station. No stored animation is played as new activity.

The last displayed image remains during an episode handover or failed download. Disconnect still freezes the displayed model and pixels. The apparatus and direct desktop use the same decoded image, and the specimen and instruments use its matching packet.

The monitor mapping, apparatus image, VM, controller, memory, narration budget and recording services are unchanged. This change is confined to the observing page.

## Review

The isolated browser handover review covers continuous incoming frames with slow image downloads, delayed sensory images, out-of-order completion, disconnect/reconnect, and a late frame from an earlier episode. Its packet timings and sequences are explicitly transport fixtures, separate from specimen evidence.

The real station review withholds data only from the reviewing tab. It verifies exact held desktop pixels and model step, refresh with both image HTTP and stream data withheld, reconnect to a new matching packet, phone layout, expansion/Escape and operation with browser storage disabled. Reproduction commands: **node scripts/observer-handover-review.mjs** and **node scripts/observer-reconnect-review.mjs**, against the local preview. The second command also accepts **SPECIMEN_REVIEW_URL=https://specimenarchive.com** for a public acceptance run.

The production build and 66 existing tests passed. First visits still require a network transfer and browser decoding; this is not a zero-latency claim. Refreshes can show the retained capture while the fresh connection opens.

[Laboratory register](README.md)

## Public acceptance — 13 September 2026

Observer revision **1a3a5f470276f27c60fd1f5d867fe1271703e2f5** is deployed. The original VM session remained **session_1789242341320_350cbae5**, with no service restart. The published HTML and early-loading script matched their deployment hashes.

Three fresh public visits had a median first desktop of **0.57 seconds**, compared with **3.36 seconds** before this change. Three refreshes had a median of **0.14 seconds**. Individual timings and the network conditions are retained in the [acceptance receipt](results/observer-startup.json); they are samples, not a latency guarantee.

All five isolated transport checks and all five real public viewer checks passed. These include exact held pixels on reload while HTTP images and incoming stream packets were withheld, fresh-frame recovery, matching apparatus/direct/specimen identifiers, phone layout, expansion, and browser storage being unavailable.
