export type NodeCategory = 'sensory' | 'interneuron' | 'motor' | 'effector' | 'fragment' | 'other';
export interface Cell { id: string; name: string; type: string; category: NodeCategory; side: 'L' | 'R' | 'U'; sourceClass: string; layout?: [number, number] }
export interface Edge { source: string; target: string; weight: number }
export interface Circuit { version: string; nodes: Cell[]; edges: Edge[]; sourceCounts: Record<string, number>; selection: string }
export interface Pose { x: number; y: number; heading: number; roll: number; bend: number; ciliaPhase: number; distance: number }
export interface Environment { epoch: number; label: string; angle: number; intensity: number; lightLeft: number; lightRight: number }
export interface LightCondition { key: string; label: string; angle: number; intensity: number }
export interface ModelEvent { id: string; t: number; kind: 'environment' | 'response' | 'movement' | 'session'; message: string }
export interface Snapshot { version: 1; runId: string; seq: number; timestamp: string; startedAt: string; modelTime: number; wallElapsed: number; pose: Pose; environment: Environment; activity: number[]; motor: { left: number; right: number; forward: number; turn: number }; sensory: { left: number; right: number }; events: ModelEvent[] }
export interface SessionInfo { id: string; startedAt: string; endedAt?: string; lastRecordedAt?: string; modelStart?: number; modelEnd?: number; frames: number; duration: number; seed: number; recovered?: boolean; interrupted?: boolean }
export interface StreamPacket { type: 'snapshot' | 'resync'; snapshot: Snapshot; browser?:import('./browser').BrowserLive|null }
