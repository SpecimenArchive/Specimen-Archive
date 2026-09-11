export const MODEL_CONFIG = Object.freeze({
  version: 'rate-v1', seed: 7101, dt: 0.01, timeScale: 0.5,
  sensoryTau: 0.12, interTau: 0.28, motorTau: 0.42,
  gain: 1.15, sensoryGain: 1.4, epochSeconds: 16,
  basalSpeed: 7, motorSpeedGain: 48, turnGain: 2.4,
  chamberSize: 2000, streamHz: 20,
});
export type Intervention = 'intact' | 'disconnect-photoreceptors' | 'disconnect-inton' | 'shuffled' | 'clamp-left-motors' | 'clamp-right-motors' | 'clamp-all-motors';
