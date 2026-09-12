# Observation 028 — one encounter, from observation to memory

The film follows Specimen 01 through one Ethereum **Blocks** encounter. A close observation gives way to its motor window, one verified wheel action and the linked archive entry. It is an **18.5-second edited recording**, composed at **1080 × 1350** for silent mobile viewing.

Finished files are delivered separately as `specimen-archive-encounter.mp4` and `specimen-archive-cover.png`. The MP4 uses H.264, 30 frames per second, 4:2:0 pixels and a front-loaded playback index. The cover is a 1080 × 1350 still from the film’s opening observation.

## The retained encounter

| Record | Identity |
| --- | --- |
| Session | `session_1789242341320_350cbae5` |
| Episode | `exhibit_1789245076824_2082c868` |
| Decision | 27, zero-based; observation 028 in this episode |
| Command | `exhibit_1789245076824_2082c868:c027` |
| Source revision | `8e9c9621fcfac7e668b5b4293dd313c859387cf3` |
| Encountered page | [Blocks — ethereum.org](https://ethereum.org/developers/docs/blocks/) |
| Memory | `memory-be573869220b193216365549` |
| Original public evidence | [Specimen Recorder publication](https://github.com/SpecimenArchive/Specimen-Archive/commit/85d7548d2e125a21f1f96e838a14dc63de54881b) |

The input was captured at **20:33:38.270 UTC, 12 September 2026**. Its six motor outputs produced mean activity **0.577942195669866** and directional contrast **0.017956382810626836**, selecting **+48 px**. Windows accepted the command at 20:33:40.093, returned one trusted input acknowledgement, and verified scroll **0 → 48 px** at **20:33:40.313**.

The memory already existed before this visit. This encounter **updates** it; the film does not describe a newly created identity or a later recall. Its retained evidence carries the same command, decision, source revision, timestamp and 48-pixel displacement. The displayed description is the actual receipt: “Observed 48 px down in the html scroll container.” The memory function belongs to the conventional store; the wheel direction belongs to the neural decoder. Supervisor destination selection took place before this clip.

## Edit register

| Film time | Recorded material |
| --- | --- |
| 0–3.5 s | Specimen close-up driven by the opening part of decision 27’s saved pose/motor window; 20:33:39.526–39.710 UTC, slowed |
| 3.5–7.5 s | Native Windows recording detail and the corresponding six-motor traces; 20:33:39.710–40.071 UTC, slowed |
| 7.5–8.4 s | Final motor state and +48 px proposal, through the verified receipt at 20:33:40.313 UTC |
| 8.4–11.5 s | Forward cut to the next available native recording frame, captured at 20:33:43.404 UTC, showing the result; its actual capture timestamp is displayed |
| 11.5–16 s | The linked memory’s retained receipt and original source; its printed time is the receipt time, not a later write or recall |
| 16–18.5 s | Specimen Archive identity and `specimenarchive.com` |

The native display recorder has its own sampling cadence. Its next frame after the receipt arrived at 20:33:43.404; the intermediate wait is shortened with a forward cut labelled **NEXT CAPTURE**. Before and after remain in source order. The specimen motion uses the existing renderer and only this decision’s recorded states, with bounded interpolation between samples. The motor plot uses an explicitly labelled **0.560–0.585 dimensionless activity range**, so small recorded differences remain visible. It does not add oscillations, spikes or artificial activity.

The browser detail is a fixed proportional crop of the original 1280 × 800 recording. Brief charcoal chapter transitions are editorial; the actual browser before/after uses a direct cut. No voice, soundtrack, invented journal entry, unrelated page or live-broadcast styling is added.

## Verification and reproduction

[Selected evidence](evidence/social/encounter.json) preserves the decision, receipt, memory evidence and publication. [Verification results](results/social-film.json) record source hashes, export hashes, playback, seeking and the edit timeline. The full native WebM, timing file and neural trace are retained in the delivered evidence package outside Git.

Offline verification reproduces all **2,880 samples across 48 windows from their recorded encoded inputs** and recomputes the selected window directly from its original PNG: **all 60 states, pose values and the decoded command match exactly**. This is distinguished from a new full-episode PNG replay; only the selected window’s original pixels were needed for the film check. The original publisher’s complete replay result is retained in the episode record.

The source WebM, trace, timing and selected sensory images match the episode’s SHA-256 manifest. Published evidence was read back from the recorded GitHub commit and hash-matched. Export review decodes the entire MP4 and plays it at **360 × 450** phone size, including forward and backward seeking. Key captions, source identity, action displacement and memory description are inspected on that playback.

With the preserved source package in `runtime/social-film/source/` and an H.264-capable FFmpeg build, run:

```powershell
node --import tsx scripts/verify-social-film.ts
node scripts/render-social-film.mjs
node scripts/review-social-film.mjs
```

These are offline composition/review tools. They issue no native input and do not modify the running station. The renderer accepts `SPECIMEN_FILM_FFMPEG` for an installed encoder. The review uses the same verified local build. The portable build was obtained through the Windows build link on [FFmpeg’s download page](https://ffmpeg.org/download.html), with its publisher checksum verified before use.

[Laboratory register](README.md) · [Separate assessment context](ASSESSMENT_COMPANION.md)
