/** Extended task profile. Baseline pixel-motor-v2 remains immutable. */
export const EXHIBIT_CONFIG=Object.freeze({
  version:'pixel-lane-scroll-v1',width:640,height:360,cursor:{x:320,y:216},
  modelSteps:600,sampleEvery:10,windowWallMs:3000,decisions:48,
  movePixels:24,scrollPixels:48,verticalTolerance:24,guideMinimumPixels:24,
  motorGate:.5,activationMean:.593,rightContrast:.008,
  phaseOrder:['point','scroll'] as const,
  continuousSeeds:[101,203,307],heldOutSeeds:[503,607,809],
  rawRunsRetained:8,compactRunsRetained:200,recoveryDelayMs:2000,
});
export type Phase='point'|'scroll';
export type TaskLayout='standard'|'offset'|'low-contrast';
