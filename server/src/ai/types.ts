export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  tokens: { prompt: number; completion: number; total: number };
  latencyMs: number;
}

export interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<LLMResponse>;
  isAvailable(): boolean;
}

export interface InterviewQuestion {
  question: string;
  skill: string;
  difficulty: number;
  question_type: "technical" | "project_defense" | "problem_solving" | "system_design" | "hr";
  expected_concepts: string[];
  follow_up: boolean;
  language: "en" | "hi" | "mr";
}

export interface InterviewEvaluation {
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  project_understanding_score: number;
  evidence: string[];
  missing_concepts: string[];
  strengths: string[];
  improvements: string[];
  confidence: number;
  summary: string;
}

export interface STTResult {
  text: string;
  confidence: number;
  language: string;
}

export interface TTSResult {
  audioBuffer: Buffer;
  format: string;
  durationMs: number;
}

export interface STTProvider {
  name: string;
  transcribe(audioBuffer: Buffer, language?: string): Promise<STTResult>;
  isAvailable(): boolean;
}

export interface TTSProvider {
  name: string;
  synthesize(text: string, language?: string): Promise<TTSResult>;
  isAvailable(): boolean;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
}

export interface EmbeddingProvider {
  name: string;
  embed(text: string): Promise<EmbeddingResult>;
  isAvailable(): boolean;
}
