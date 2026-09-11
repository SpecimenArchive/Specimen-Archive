import type { Circuit, Pose } from '../../shared/types';
import { MODEL_CONFIG as C } from './config';
export function decodeMotor(circuit: Circuit, activity: Float64Array) {
  let left=0,right=0,nl=0,nr=0;
  circuit.nodes.forEach((n,i)=>{if(n.category==='motor'){if(n.side==='L'){left+=activity[i];nl++;}if(n.side==='R'){right+=activity[i];nr++;}}});
  left/=Math.max(1,nl);right/=Math.max(1,nr);
  return {left,right,forward:C.basalSpeed+C.motorSpeedGain*(left+right)/2,turn:C.turnGain*(right-left)};
}
export function advancePose(pose: Pose, motor: ReturnType<typeof decodeMotor>) {
  pose.heading+=motor.turn*C.dt;
  pose.bend+=(Math.tanh(motor.turn*.8)-pose.bend)*C.dt/.35;
  pose.roll+=(.18+.7*(motor.left+motor.right)/2)*C.dt;
  pose.ciliaPhase+=Math.PI*2*(9+6*(motor.left+motor.right)/2)*C.dt;
  const dx=Math.sin(pose.heading)*motor.forward*C.dt,dy=-Math.cos(pose.heading)*motor.forward*C.dt;
  // Periodic virtual chamber, with separately declared deterministic passive flow.
  const wrap=(value:number)=>((value+C.chamberSize/2)%C.chamberSize+C.chamberSize)%C.chamberSize-C.chamberSize/2;
  pose.x=wrap(pose.x+dx+.45*C.dt);pose.y=wrap(pose.y+dy+.12*C.dt);
  pose.distance+=Math.hypot(dx,dy);
}
