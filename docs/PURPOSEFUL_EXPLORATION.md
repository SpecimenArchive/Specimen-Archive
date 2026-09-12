# Persistent exploration and the repeated Pons loop

The previous live policy returned to the Pons listing as a hub between discovered token pages. Its visit counters lived only in the worker's supervising process, and existing memory changed a retry budget rather than selecting destinations. Consequently the apparent variety reset at restart and the same listing scroll was repeatedly visible. The preserved `EncounterPlanner` is now only a historical policy/test helper; the live `ExternalStation` uses `ResearchPlanner`.

## What selects the next investigation

The planner stores discovered approved destinations, where links were found, last visits, outcomes, failed-navigation cooldowns, recent encounter paths and unresolved-question visits. On the first upgrade only, existing memory identities seed prior exposure; initial visit weights are estimated from their recorded decision counts and are not presented as measured historical visit totals. Subsequent visits are individually timestamped.

Candidates include Pons token details, Ethereum primary documentation, public Blockscout blocks/addresses/token records and the approved larval papers. Article/main links are discovered during actual encounters, not selected from a larger fixed rotation. The observer website, wallet connections, signing, trades, posting and account changes are excluded. Navigation and supporting resources permit GET/HEAD only; downloads and browser WebSockets are disabled.

Ranking considers novelty, time since a visit, repeated recent URLs, recent category frequency, elapsed time since a topic was inspected, links found on the current page and an eligible semantic research proposal. Stored encounter identity plus matching source terms can add a memory contribution; previously inspected destinations are penalized. The exact top candidate scores and winning URL without the memory contribution are recorded. A memory effect is claimed only when those two winning URLs differ. A corresponding recall/use record is written only when the supervisor accepts that destination, with its navigation event ID.

This is explicit conventional planning. It is not learned navigation by the neural circuit, and it does not assert that a title or image match proves semantic or visual recognition. A question produced by the narrator remains a question; merely opening its suggested reference does not prove it has been answered.

## Repeat detection and recovery

- Recently visited destinations have a strict 180-second cooldown. Failed destinations have a ten-minute backoff. If all eligible destinations are cooling down, exploration holds without repeating input until one is available.
- Hash anchors and trailing-slash aliases share one document identity and cooldown; legacy anchor entries are merged without losing their visits. The last four URLs and frequency of destination categories affect selection. Long-neglected topics receive a bounded history score so newly discovered links cannot indefinitely crowd out previously visited research. There is no random clicking or random permutation.
- Repeated unchanged captures, closed motor gates and acknowledged scroll boundaries increment a bounded retry count. The existing frozen retry adapter may adjust that bound without changing neural outputs.
- Encounters allow a minimum 12-second dwell, at most four decisions on a listing or eight elsewhere, and a maximum 55-second decision-loop dwell. Network opening time and recovery are measured separately.
- Navigation timeout, HTTP errors and access restrictions retain failed transitions. The supervisor recovers through its recorded policy; it never substitutes fabricated screenshots or claims failed input succeeded.

History is atomically persisted after discovery, arrival, outcome and choice. Episodes share it. Worker and backend restart resume from recorded progress rather than opening a mandatory Pons hub. Public `GET /api/exploration` exposes recent visits, objectives, owners, baseline/selected scores, memory IDs and open questions. The journal links proposal, acceptance and observed arrival to the actual source and event.

## Verification

Unit coverage includes persisted discovered links and cooldowns, exhausted-destination holding, a memory-induced ranking change and attribution only after acceptance. The live review must additionally demonstrate multiple actual encounter paths, useful source transitions, source-linked commentary and memory effects both before and after a controlled worker restart. These are live measurements, not fixture output. See [SHOWCASE_VERIFICATION.md](SHOWCASE_VERIFICATION.md) for the final results and retained failures.

Implementation: [research-planner.ts](../server/exhibit/research-planner.ts), [external-station.ts](../server/exhibit/external-station.ts), [external-policy.ts](../server/exhibit/external-policy.ts), [journal architecture](JOURNAL_ARCHITECTURE.md), [focused tests](../tests/public-journal.test.ts).
