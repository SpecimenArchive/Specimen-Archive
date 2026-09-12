# Memory, journal and research planning

The public journal is a separate semantic layer beside the fixed neural controller. It is not a language capability of the 47-cell circuit. The Observe, Memory and Inside pages link each entry to its actual encounter, source and control evidence.

## Evidence and ownership

`server/journal/store.ts` receives structured encounter transitions and completed neural decisions. It emits OBSERVE, RECALL, ACT and RESULT entries without a provider. Repeated wheel outcomes are grouped within one encounter, retaining every command ID. Waits, boundaries and failed verification remain distinct.

`server/journal/narrator.ts` asynchronously submits a bounded context to the OpenAI Responses API: the public article excerpt and its hash, capture/episode identifiers, actual retrieved memories and matching methods, curated primary-source passages, verified outcome, unresolved questions and eligible discovered destinations. Repeated navigation menus are excluded where an article/main region is available. This text never enters the pixel encoder or motor decoder.

The configured model is `gpt-4.1-mini-2025-04-14`. Structured output constrains source, memory and candidate identifiers to those supplied in that request. A second application check rejects unsupported references, unapproved destinations and oversized prose. An entry remains an interpretation or question where appropriate. These checks establish traceability, not a guarantee that generated prose is correct.

The narrator can propose a destination. A separate supervisor validates eligibility, records acceptance, navigates read-only and records success or failure. The journal retains the original proposed entry and later acceptance/result entries. `semantic-assistant`, `memory` and ordinary `supervisor` selection are recorded in the proposal and encounter; wheel commands still require computed neural states and genuine input receipts.

## Private configuration

Copy [the example](../config/narrator.example.json) to an operator-controlled private directory, fill its key privately, and point `SPECIMEN_NARRATOR_CONFIG` to it. Never put a real key in `.env.example`, source, browser storage or chat.

On the deployed Windows VM the backend reads `C:\ProgramData\SpecimenArchive\narrator.json`, protected to SYSTEM and Administrators, outside Git. Only its path is set in the backend launcher. The public API exposes availability, provider/model and request counts, never the configuration or key. No public command endpoint is added. The existing station account is the built-in Administrator, so this is not represented as OS isolation from an administrative process; the controlled browser has no filesystem/credential-reading tool. Publisher and tunnel credentials retain their separate SYSTEM-only protection.

Production allows 60 requests/hour and at least 45 seconds between requests. There is one in-flight request and one replaceable pending context, a 30-second request timeout, 120-second context expiry and 1,100 output tokens per request. The hourly request budget persists across backend restarts. Provider failures, rejected output and exhausted budget show a real unavailable/limited status while factual events continue.

## Persistence

| Store | Contents and bound |
| --- | --- |
| `runtime/memory/` | Existing 600 encounter identities, 1,200 recalls, original thumbnails, 12 evidence links per identity, frozen retry adapter and backups |
| `runtime/journal/journal.json` | 1,500 ordered entries, 160 proposals, atomic replacement and previous copy |
| `runtime/journal/request-budget.json` | Request timestamps for the current hour; retained through restart |
| `runtime/exploration/progress.json` | Up to 500 approved destinations, visits/cooldowns/discovery provenance, last 30 visits, 160 scored choices and question visits; previous copy |

Invalid primary files are recovered from their previous copy. If both are invalid, startup refuses to silently replace history. Browser history inspection performs no recall or controller update. Closing an observer does not stop collection.

The earlier memory loader defect and partial historical diagnostic loss remain disclosed in [MEMORY_EXPERIMENT.md](MEMORY_EXPERIMENT.md). This phase preserves the frozen checkpoint and its 257 training outcomes; new destination planning does not retrain it.

## Public inspection

`GET /api/journal` returns bounded entries without large context payloads; kind/before filters support history. `GET /api/journal/:id` returns the linked context for inspection. `GET /api/memories`, `/api/memory/:id` and `/api/exploration` expose read-only encounter and planning evidence. Journal pause/filter controls affect only the visitor's view.

Sources: [journal types](../shared/journal.ts), [journal store](../server/journal/store.ts), [narrator](../server/journal/narrator.ts), [planner](../server/exhibit/research-planner.ts), [memory](../server/memory/store.ts), [journal UI](../src/showcase/Journal.tsx), [public routes](../server/index.ts). Verification is recorded in [the showcase report](SHOWCASE_VERIFICATION.md).
