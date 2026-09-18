"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { AvatarState } from "@/lib/providers/types";

interface Props {
  state?: AvatarState;
  audioLevel?: number;
  className?: string;
}

const SKIN = "#c9a07a";
const SKIN_DARK = "#a07850";
const EYE_WHITE = "#f0ede8";
const IRIS = "#3a2515";
const PUPIL = "#0a0808";
const LIP = "#b86050";
const HAIR = "#1c1c2a";
const SHIRT = "#2c4a7c";
const BROW = "#2a2020";

function Head({ state, audioLevel = 0 }: { state: AvatarState; audioLevel: number }) {
  const headRef = useRef<THREE.Group>(null!);
  const jawRef = useRef<THREE.Group>(null!);
  const leftEyeRef = useRef<THREE.Group>(null!);
  const rightEyeRef = useRef<THREE.Group>(null!);
  const leftPupilRef = useRef<THREE.Mesh>(null!);
  const rightPupilRef = useRef<THREE.Mesh>(null!);
  const lowerLipRef = useRef<THREE.Mesh>(null!);
  const leftBrowRef = useRef<THREE.Mesh>(null!);
  const rightBrowRef = useRef<THREE.Mesh>(null!);

  const blinkPhase = useRef(0);
  const nextBlink = useRef(3000 + Math.random() * 2000);
  const blinkTimer = useRef(0);
  const mouthOpen = useRef(0);
  const lastT = useRef(0);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const dt = lastT.current ? t - lastT.current : 0.016;
    lastT.current = t;

    // Head
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.25) * 0.04;
      headRef.current.rotation.x = Math.sin(t * 0.18) * 0.015;
      headRef.current.scale.y = 1 + Math.sin(t * 0.8) * 0.003;
    }

    // Blink
    blinkTimer.current += dt * 1000;
    if (blinkPhase.current === 0 && blinkTimer.current > nextBlink.current) {
      blinkPhase.current = 1;
      blinkTimer.current = 0;
    }
    if (blinkPhase.current > 0) {
      blinkPhase.current += dt * 14;
      const b = blinkPhase.current < 1 ? Math.sin(blinkPhase.current * Math.PI) : Math.max(0, 1 - (blinkPhase.current - 1) * 3);
      const s = 1 - b * 0.85;
      if (leftEyeRef.current) leftEyeRef.current.scale.y = s;
      if (rightEyeRef.current) rightEyeRef.current.scale.y = s;
      if (blinkPhase.current > 1.3) {
        blinkPhase.current = 0;
        blinkTimer.current = 0;
        nextBlink.current = 2500 + Math.random() * 3000;
      }
    }

    // Pupils
    if (leftPupilRef.current && rightPupilRef.current) {
      const gx = Math.sin(t * 0.3) * 0.012;
      const gy = Math.cos(t * 0.25) * 0.006;
      leftPupilRef.current.position.x = -0.26 + gx;
      leftPupilRef.current.position.y = 0.1 + gy;
      rightPupilRef.current.position.x = 0.26 + gx;
      rightPupilRef.current.position.y = 0.1 + gy;
    }

    // Mouth
    const target = state === "speaking"
      ? Math.abs(Math.sin(t * 11)) * audioLevel * 0.7 + 0.05
      : state === "listening" ? Math.sin(t * 1.5) * 0.03
      : state === "thinking" ? 0.02 : 0;
    mouthOpen.current += (target - mouthOpen.current) * 0.15;
    if (lowerLipRef.current) lowerLipRef.current.position.y = -0.118 - mouthOpen.current * 0.035;
    if (jawRef.current) {
      jawRef.current.position.y = -0.2 - mouthOpen.current * 0.02;
      jawRef.current.scale.y = 1 + mouthOpen.current * 0.3;
    }

    // Brows
    const by = 0.265 + (state === "thinking" ? 0.02 : state === "listening" ? 0.01 : state === "error" ? -0.015 : 0);
    if (leftBrowRef.current) leftBrowRef.current.position.y = by;
    if (rightBrowRef.current) rightBrowRef.current.position.y = by;
  });

  return (
    <group ref={headRef}>
      {/* Skull */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.72, 24, 24]} />
        <meshStandardMaterial color={SKIN} roughness={0.55} />
      </mesh>

      {/* Jaw */}
      <group ref={jawRef} position={[0, -0.18, 0.12]}>
        <mesh>
          <sphereGeometry args={[0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={SKIN} roughness={0.55} />
        </mesh>
      </group>

      {/* Ears */}
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} position={[s * 0.7, 0.28, -0.02]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={SKIN_DARK} roughness={0.6} />
        </mesh>
      ))}

      {/* Nose */}
      <mesh position={[0, 0.1, 0.66]} rotation={[0.25, 0, 0]}>
        <coneGeometry args={[0.06, 0.18, 8]} />
        <meshStandardMaterial color={SKIN_DARK} roughness={0.5} />
      </mesh>

      {/* Eyes */}
      {[-1, 1].map((side) => (
        <group key={`eye${side}`} ref={side === -1 ? leftEyeRef : rightEyeRef} position={[side * 0.26, 0.32, 0.52]}>
          <mesh>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshStandardMaterial color={EYE_WHITE} roughness={0.05} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color={IRIS} roughness={0.25} />
          </mesh>
          <mesh ref={side === -1 ? leftPupilRef : rightPupilRef} position={[0, 0, 0.085]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={PUPIL} roughness={0.05} />
          </mesh>
          <mesh position={[0.015, 0.015, 0.09]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={0.5} transparent opacity={0.9} />
          </mesh>
        </group>
      ))}

      {/* Brows */}
      {[-1, 1].map((side) => (
        <mesh key={`brow${side}`} ref={side === -1 ? leftBrowRef : rightBrowRef}
          position={[side * 0.26, 0.265, 0.56]} rotation={[0, 0, side * 0.08]}>
          <boxGeometry args={[0.15, 0.02, 0.02]} />
          <meshStandardMaterial color={BROW} roughness={0.85} />
        </mesh>
      ))}

      {/* Mouth */}
      <mesh position={[0, -0.06, 0.6]}>
        <boxGeometry args={[0.12, 0.015, 0.015]} />
        <meshStandardMaterial color={LIP} roughness={0.45} />
      </mesh>
      <mesh ref={lowerLipRef} position={[0, -0.078, 0.6]}>
        <boxGeometry args={[0.1, 0.012, 0.015]} />
        <meshStandardMaterial color={LIP} roughness={0.45} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 0.72, 0.02]} rotation={[0.1, 0, 0]}>
        <sphereGeometry args={[0.44, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.48]} />
        <meshStandardMaterial color={HAIR} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.6, 0.35]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[0.38, 0.05, 0.1]} />
        <meshStandardMaterial color={HAIR} roughness={0.9} />
      </mesh>

      {/* Neck + Shirt */}
      <mesh position={[0, -0.42, 0]}>
        <cylinderGeometry args={[0.13, 0.16, 0.16, 8]} />
        <meshStandardMaterial color={SKIN} roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <sphereGeometry args={[0.4, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        <meshStandardMaterial color={SHIRT} roughness={0.8} />
      </mesh>
    </group>
  );
}

export function AIInterviewerAvatar({ state = "idle", audioLevel = 0, className }: Props) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Canvas
        camera={{ position: [0, 0.3, 2.6], fov: 34 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        frameloop="demand"
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[2, 4, 4]} intensity={0.7} />
        <directionalLight position={[-2, 2, 3]} intensity={0.2} color="#e0e7ff" />
        <pointLight position={[0, 2.5, 3]} intensity={0.3} color="#818cf8" />

        <Float speed={0.4} rotationIntensity={0.02} floatIntensity={0.08}>
          <Head state={state} audioLevel={audioLevel} />
        </Float>
      </Canvas>

      <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        <div className={`h-2 w-2 rounded-full ${
          state === "speaking" ? "bg-green-400 animate-pulse" :
          state === "listening" ? "bg-blue-400" :
          state === "thinking" ? "bg-amber-400 animate-pulse" :
          "bg-gray-400"
        }`} />
        <span className="text-xs text-white/80 font-medium capitalize">{state}</span>
      </div>
    </div>
  );
}
