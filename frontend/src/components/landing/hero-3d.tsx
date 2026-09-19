"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

/**
 * Premium 3D hero — an audio-reactive glass core (the "voice" of ARYNOX)
 * wrapped in an orbiting ring system + aurora sparkles.
 * Performance-safe: frameloop="demand"-friendly, low poly, capped DPR.
 */

function VoiceCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.18;
      meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.12;
      // subtle "breathing" like the AI is alive
      const pulse = 1 + Math.sin(t * 1.6) * 0.035;
      meshRef.current.scale.setScalar(pulse);
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 0.4;
      innerRef.current.rotation.z = Math.sin(t * 0.5) * 0.2;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.7}>
      {/* Glass shell */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.55, 12]} />
        <MeshTransmissionMaterial
          transmission={0.92}
          thickness={1.4}
          roughness={0.08}
          ior={1.45}
          chromaticAberration={0.35}
          anisotropicBlur={0.3}
          distortion={0.35}
          distortionScale={0.4}
          temporalDistortion={0.12}
          color="#a5b4fc"
          attenuationColor="#6366f1"
          attenuationDistance={2.4}
        />
      </mesh>
      {/* Inner energy core */}
      <mesh ref={innerRef} scale={0.62}>
        <icosahedronGeometry args={[1, 2]} />
        <MeshDistortMaterial
          color="#818cf8"
          emissive="#6366f1"
          emissiveIntensity={1.6}
          roughness={0.15}
          metalness={0.9}
          distort={0.45}
          speed={2.2}
        />
      </mesh>
    </Float>
  );
}

function OrbitRing({ radius, tilt, speed, color, opacity }: {
  radius: number; tilt: [number, number, number]; speed: number; color: string; opacity: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * speed;
  });
  const geometry = useMemo(() => new THREE.TorusGeometry(radius, 0.012, 8, 128), [radius]);
  return (
    <group ref={ref} rotation={tilt}>
      <mesh geometry={geometry}>
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      {/* Satellite node on the ring */}
      <mesh position={[radius, 0, 0]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

function FloatingParticles() {
  const count = 40;
  const mesh = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 9,
        y: (Math.random() - 0.5) * 9,
        z: (Math.random() - 0.5) * 5,
        scale: Math.random() * 0.035 + 0.015,
        speed: Math.random() * 0.3 + 0.1,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!mesh.current) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.3,
        p.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.3,
        p.z + Math.sin(t * p.speed * 0.5) * 0.15
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color="#a5b4fc" opacity={0.55} transparent />
    </instancedMesh>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5.4], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        frameloop="always"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} />
        <pointLight position={[-5, 3, 2]} intensity={1.1} color="#6366f1" />
        <pointLight position={[4, -4, 3]} intensity={0.7} color="#ec4899" />

        <VoiceCore />
        <OrbitRing radius={2.3} tilt={[1.35, 0.3, 0]} speed={0.25} color="#818cf8" opacity={0.5} />
        <OrbitRing radius={2.75} tilt={[1.05, -0.4, 0.4]} speed={-0.18} color="#c084fc" opacity={0.4} />
        <OrbitRing radius={3.2} tilt={[1.5, 0.15, -0.3]} speed={0.12} color="#f472b6" opacity={0.3} />
        <FloatingParticles />
        <Sparkles count={60} scale={[9, 9, 5]} size={1.6} speed={0.35} color="#c7d2fe" opacity={0.5} />
      </Canvas>
    </div>
  );
}
