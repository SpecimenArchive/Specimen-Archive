import type { Environment, Pose, LightCondition } from '../../shared/types';
import { MODEL_CONFIG as C } from './config';
export const SCHEDULE = [
  { label: 'Dark adaptation', angle: -Math.PI / 2, intensity: 0 },
  { label: 'Lateral light · left', angle: -Math.PI / 2, intensity: .85 },
  { label: 'Lateral light · right', angle: Math.PI / 2, intensity: .85 },
  { label: 'Low illumination', angle: Math.PI / 2, intensity: .24 },
  { label: 'Oblique light', angle: -Math.PI / 4, intensity: .72 },
  { label: 'Dark recovery', angle: -Math.PI / 4, intensity: 0 },
];
export function environmentAt(time: number, pose: Pose, override?: LightCondition & {epoch:number}): Environment {
  const epoch = override?.epoch ?? Math.floor((time + 1e-8) / C.epochSeconds);
  const env = override ?? SCHEDULE[epoch % SCHEDULE.length];
  // Directional eye shading is an assumed encoder. Pose changes alter the next
  // input; a smooth spatial illumination field makes position relevant too.
  const spatial = .85 + .15 * Math.cos((pose.x * Math.sin(env.angle) - pose.y * Math.cos(env.angle)) / 600);
  const directional = (side: number) => env.intensity * spatial * (.15 + .85 * Math.max(0, Math.cos(env.angle - pose.heading - side * Math.PI / 2))) * (.85 + .15 * Math.cos(pose.roll));
  return { epoch, ...env, lightLeft: directional(-1), lightRight: directional(1) };
}
