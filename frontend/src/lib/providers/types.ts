/** Provider type definitions for ARYNOX AI HIRE */

export type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "interrupted" | "success" | "error";

export type InterviewPhase =
  | "initializing"
  | "connecting"
  | "ready"
  | "listening"
  | "thinking"
  | "speaking"
  | "interrupted"
  | "reconnecting"
  | "completed"
  | "error";

export interface InterviewMessage {
  id: string;
  role: "ai" | "candidate";
  content: string;
  timestamp: Date;
  skill?: string;
}

export interface InterviewSessionState {
  phase: InterviewPhase;
  avatarState: AvatarState;
  currentQuestion: string;
  currentSkill: string;
  questionNumber: number;
  totalQuestions: number;
  timeElapsed: number;
  timeRemaining: number;
  messages: InterviewMessage[];
  isRecording: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  isFullscreen: boolean;
  showTranscript: boolean;
  error: string | null;
  audioLevel: number;
  transcript: Array<{ role: "ai" | "candidate"; content: string; timestamp: string }>;
}

export interface WebSocketMessage {
  type: string;
  payload?: Record<string, any>;
}
