export type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "interrupted" | "success" | "error";

export interface AvatarAnimationConfig {
  blinkInterval: number;
  breatheSpeed: number;
  headMovementRange: number;
  mouthSpeed: number;
  transitionSpeed: number;
}

export const DEFAULT_ANIMATION_CONFIG: AvatarAnimationConfig = {
  blinkInterval: 3500,
  breatheSpeed: 0.8,
  headMovementRange: 0.05,
  mouthSpeed: 12,
  transitionSpeed: 0.3,
};
