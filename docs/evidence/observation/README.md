# Observation input fixture

`retina-workstation.png` is an actual 1280×665 page screenshot from local headless Edge, rendered by this project’s workstation dashboard. Its observation stream is deliberately absent and the page visibly says DISCONNECTED; no model state or VM capture was fabricated. It provides a fixed image-response regression, not evidence of a live Windows station.

Reproduce the local check with `npm run build` and `node --import tsx scripts/observation-page-check.ts` on Windows with Edge. The script serves only the local build/circuit, captures exact visible page pixels, integrates the unchanged circuit, sends its decoded wheel command and measures actual resulting scroll displacement. No scroll offset or DOM target reaches the encoder. It writes actual measurements and page PNGs under ignored `runtime/upgrade`.

The v1 proportional mapping decoded an upward command from this frame despite greater lower-band contrast. Version 2 preserves that directional distinction at the calibrated PRC levels and decodes +48 px. Original model/decoder benchmarks and v1 replay remain separate. See the [upgrade report](../../OBSERVATION_UPGRADE.md) for limitations and native VM acceptance status.
