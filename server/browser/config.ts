export const BROWSER_CONFIG=Object.freeze({
  version:'pixel-motor-v2',width:640,height:360,cursorStart:{x:320,y:216},
  decisions:16,modelStepsPerDecision:600,neuralSampleEvery:10,minimumWindowWallMs:600,
  targetSeeds:[11,29,47],interventions:['intact','clamp-all-motors','disconnect-photoreceptors'] as const,
  encoder:{version:'colour-retina-v2',centreTolerancePx:18,minimumTargetPixels:400,minimumCursorPixels:20,
    targetGreenMin:145,targetRedMax:120,targetBlueMax:150,targetGreenRedRatio:1.4,
    cursorBlueMin:235,cursorGreenMin:210,cursorRedMax:70,
    lowDrive:.15,highDrive:.65,alignedDrive:.85},
  decoder:{version:'mn-contrast-v1',motorMeanGate:.50,activationMean:.593,
    rightContrastThreshold:.008,movePixels:24,contrastPositiveId:'1732111',contrastNegativeId:'359142'},
});
export type BrowserIntervention=typeof BROWSER_CONFIG.interventions[number];
