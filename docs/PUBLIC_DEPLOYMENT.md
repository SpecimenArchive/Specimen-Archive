# Public VM observation deployment

The canonical observer is **https://specimenarchive.com**. Both HTTP and `https://www.specimenarchive.com` return 308 redirects to HTTPS on the apex domain. Cloudflare provides public TLS and a named tunnel to the existing VM's loopback HTTP observer. No additional server or paid hosting service was added.

## Service placement

| Service | Runs on | Exposure / persistence |
|---|---|---|
| Genuine Windows 11 desktop and Chrome | Dedicated By-Hoster Windows 11 VM | Interactive console; native 1280 × 800 display. No authenticated Remote Desktop session is needed during operation. |
| Capture/browser worker | VM, `SpecimenArchive-Worker` scheduled task | Loopback 4320, private bearer and browser control channel. Limited interactive account; logon startup and recovery. |
| Neural controller, observer, persistent memory | VM, `SpecimenArchive-Backend` task | Loopback 4317; one shared controller independent of visitors. Public routes allow GET/HEAD inspection only. |
| Video and exact-replay finalizer | VM, backend-owned child process | Outside the live input loop; bounded queue and preserved pending evidence. |
| Evidence publisher | VM, separate SYSTEM task | SYSTEM-only key and executable. Publishes compact immutable evidence to `specimen-records`; no force pushes, branch deletion or protection bypass. |
| Cloudflared 2026.9.1 | VM, automatic LocalSystem service | Outbound named tunnel; token file outside Git with protected ACL. Loopback readiness 20241. Configured service recovery. |
| Observer browser | Any permitted public visitor device | Relative HTTPS API and WSS; no local execution of the experiment. |

Home-PC SSH credentials remain under `%LOCALAPPDATA%\SpecimenArchive`, outside Git. VM publisher credentials are under `C:\ProgramData\SpecimenArchivePublisher` with SYSTEM-only ACLs. Cloudflared's token and installer metadata are in protected ProgramData directories. Tokens, keys and VM connection details are not published. Windows RDP TCP/UDP allow rules are scoped to the operator's verified SSH connection address. If that address changes, use the provider console to update the administration scope; do not open the observer's control ports publicly.

The two published Cloudflare application routes are apex and `www`, both with service URL `http://127.0.0.1:4317`; no HTTP Host Header override. The app accepts only its exact configured host/origin set, canonicalizes `www`, redirects forwarded HTTP, sets HSTS, and applies a same-origin production CSP. WebSocket client messages are rejected. There are no public administrative writes or OAuth callbacks. Cloudflare manages edge-certificate issuance/renewal; the connector uses its existing service recovery rather than a home-PC process.

## Persistent memory

Memory is enabled by ignored VM file `C:\SpecimenArchive\runtime\memory\control.json`, with `enabled` and mode `train`, `frozen` or `disabled`. An operator changes this file through private administration and restarts the backend gracefully. The browser has no public endpoint for changing it. Training collects acknowledged outcomes while leaving baseline retry budget 3 active. Frozen mode uses the saved adapter without training; disabled mode retains baseline retries. The evaluation is loaded from `runtime/memory/evaluation.json`.

`memory.json` is replaced atomically, with `memory.previous.json`, seven rotating daily JSON exports, and a bounded set of original encounter PNG thumbnails. Retention is 600 encounter identities, 1,200 recalls and 12 evidence links per identity. Repeated decisions aggregate into outcomes; the first evidence link is preserved. Deployments and worker/backend restarts do not reset this directory. No credential, provider screen or deployment terminal enters the accepted public capture/memory path.

Source documents and runtime configuration are indexed from a fixed public-file allowlist. Seven curated primary-source notes record exact retrieval timestamps, HTML hashes and supporting passages in `data/knowledge/source-receipts.json`. No LLM/API key or hidden language controller is used. URL identity, title/address identity and coarse visual similarity are labelled separately. Memory inspection never performs a recall or model update.

## Verification and operational limits

The external control verdict and fixed source map are in [EXTERNAL_CONTROL_AUDIT.md](EXTERNAL_CONTROL_AUDIT.md). The memory objective and task matrix were published before training in [MEMORY_EXPERIMENT.md](MEMORY_EXPERIMENT.md). Final machine-readable results accompany those reports; failures remain in the bounded archive and are counted separately from movement.

The public site is independent of the home PC. The worker, backend and browser require an unlocked interactive Windows console. **A cold VM reboot currently requires a manual console login**; no password-backed automatic login is configured. Cloudflared and the SYSTEM publisher can start at boot, while the interactive station tasks start at logon and recover after process failure. Do not describe this as verified unattended cold-boot operation. Provider-console login followed by the existing station tasks is the remaining recovery step after a reboot.

Target desktop cadence is 4 fps, with measured capture intervals and source timestamps displayed; it is not high-frame-rate remote desktop video. The same decoded genuine frame is shared by the apparatus monitor and direct view. The neural window contains six model seconds paced over at least 1.2 wall seconds plus real capture, dispatch and page-transition overhead. No synthetic frames fill a capture interruption.
