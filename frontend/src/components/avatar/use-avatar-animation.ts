import { useRef, useCallback, useEffect, useState } from "react";
import { AvatarState, DEFAULT_ANIMATION_CONFIG } from "./types";

export function useAvatarAnimation(state: AvatarState) {
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const [morphTargetInfluences, setMorphTargetInfluences] = useState<Record<string, number>>({
    mouthOpen: 0,
    mouthClose: 0,
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    browUp: 0,
    smile: 0,
  });
  const [headRotation, setHeadRotation] = useState({ x: 0, y: 0, z: 0 });
  const audioLevelRef = useRef(0);
  const config = DEFAULT_ANIMATION_CONFIG;

  const setAudioLevel = useCallback((level: number) => {
    audioLevelRef.current = Math.max(0, Math.min(1, level));
  }, []);

  useEffect(() => {
    let lastBlink = Date.now();
    let blinkPhase = 0;

    const animate = (time: number) => {
      const t = time * 0.001;
      timeRef.current = t;

      const newInfluences: Record<string, number> = {
        mouthOpen: 0,
        mouthClose: 0,
        eyeBlinkLeft: 0,
        eyeBlinkRight: 0,
        browUp: 0,
        smile: 0,
      };

      // Blinking
      const now = Date.now();
      if (now - lastBlink > config.blinkInterval + Math.random() * 1000) {
        lastBlink = now;
        blinkPhase = 1;
      }
      if (blinkPhase > 0) {
        const blinkVal = blinkPhase < 0.5 ? blinkPhase * 2 : (1 - blinkPhase) * 2;
        newInfluences.eyeBlinkLeft = blinkVal;
        newInfluences.eyeBlinkRight = blinkVal;
        blinkPhase += 0.08;
        if (blinkPhase >= 1) blinkPhase = 0;
      }

      // Breathing (head movement)
      const breathe = Math.sin(t * config.breatheSpeed) * 0.01;

      // State-specific animations
      switch (state) {
        case "speaking": {
          const level = audioLevelRef.current;
          newInfluences.mouthOpen = level * (0.5 + Math.sin(t * config.mouthSpeed) * 0.5);
          newInfluences.mouthClose = 1 - newInfluences.mouthOpen;
          newInfluences.browUp = Math.sin(t * 2) * 0.1;
          newInfluences.smile = 0.15;
          setHeadRotation({ x: breathe, y: Math.sin(t * 0.5) * 0.05, z: 0 });
          break;
        }
        case "listening": {
          newInfluences.browUp = 0.1;
          newInfluences.smile = 0.08;
          setHeadRotation({ x: breathe, y: Math.sin(t * 0.3) * 0.03, z: 0 });
          break;
        }
        case "thinking": {
          newInfluences.browUp = 0.2;
          setHeadRotation({ x: breathe - 0.02, y: Math.sin(t * 0.2) * 0.04, z: 0.01 });
          break;
        }
        case "success": {
          newInfluences.smile = 0.4;
          newInfluences.browUp = 0.1;
          setHeadRotation({ x: breathe, y: 0, z: 0 });
          break;
        }
        case "error": {
          newInfluences.browUp = -0.1;
          setHeadRotation({ x: breathe + 0.02, y: 0, z: 0 });
          break;
        }
        default: {
          setHeadRotation({ x: breathe, y: Math.sin(t * 0.4) * 0.02, z: Math.sin(t * 0.3) * 0.01 });
          break;
        }
      }

      setMorphTargetInfluences(newInfluences);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [state, config]);

  return { morphTargetInfluences, headRotation, setAudioLevel };
}
