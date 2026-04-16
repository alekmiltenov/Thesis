export type Role = 'solver' | 'explorer' | 'critic' | 'validator' | 'judge'
export type RoleType = 'thinker' | 'reviewer' | 'judge'
export type Phase = 'thinker' | 'reviewer' | 'final_thinker' | 'judge'
export type ViewMode = 'chat' | 'visualization' | 'split'
export type Theme = 'light' | 'dark'
export type DebateStatus = 'idle' | 'running' | 'complete' | 'error'

export interface ParticipantConfig {
  model: string
  role: Role
}

export interface DebateConfig {
  rounds: number
  participants: ParticipantConfig[]
  user_prompt: string
}

export interface ParticipantMeta {
  id: number
  model: string
  role: Role
  role_type: RoleType
}

export interface ParticipantResponse {
  id: number
  role: Role
  model: string
  text: string
}

export interface RoundBlock {
  round: number
  thinker_outputs: ParticipantResponse[]
  reviewer_outputs: ParticipantResponse[]
  final_thinker_outputs: ParticipantResponse[]
  judge_outputs: ParticipantResponse[]
}

export type DebateEvent =
  | { type: 'debate_started'; rounds: number; participants: ParticipantMeta[] }
  | { type: 'participant_response'; round: number; phase: Phase; participant: ParticipantResponse }
  | { type: 'round_complete'; round: number; round_block: RoundBlock }
  | { type: 'debate_complete'; final_answer: string; history: RoundBlock[] }
  | { type: 'error'; message: string }

export interface ChatMessage {
  id: string
  round: number
  phase: Phase
  participant: ParticipantResponse
}

export interface VizNode {
  participantId: number
  model: string
  role: Role
  status: 'waiting' | 'done'
  text?: string
}

export interface VizLane {
  id: string
  round: number
  phase: Phase
  nodes: VizNode[]
}
