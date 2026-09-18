"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function HeroSphere() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.12;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.08;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.5, 4]} />
        <MeshDistortMaterial
          color="#6366f1"
          roughness={0.2}
          metalness={0.8}
          distort={0.2}
          speed={1}
        />
      </mesh>
    </Float>
  );
}

function FloatingParticles() {
  const count = 30;
  const mesh = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 8,
        scale: Math.random() * 0.04 + 0.02,
        speed: Math.random() * 0.3 + 0.1,
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    particles.forEach((p, i) => {
      const t = state.clock.elapsedTime * p.speed;
      dummy.position.set(
        p.x + Math.sin(t) * 0.25,
        p.y + Math.cos(t * 0.7) * 0.25,
        p.z + Math.sin(t * 0.5) * 0.15
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshStandardMaterial color="#818cf8" opacity={0.5} transparent />
    </instancedMesh>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
        frameloop="demand"
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <pointLight position={[-5, 3, 2]} intensity={0.8} color="#6366f1" />

        <HeroSphere />
        <FloatingParticles />
      </Canvas>
    </div>
  );
}
