"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function FeatureOrb({ color, position }: { color: string; position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.3;
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={ref} position={position}>
        <dodecahedronGeometry args={[0.6, 0]} />
        <MeshDistortMaterial
          color={color}
          roughness={0.3}
          metalness={0.7}
          distort={0.2}
          speed={2}
        />
      </mesh>
    </Float>
  );
}

function NodeLines() {
  const ref = useRef<THREE.Group>(null);

  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 12; i++) {
      pts.push(new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2,
      ));
    }
    return pts;
  }, []);

  const lines = useMemo(() => {
    const lineData: { from: THREE.Vector3; to: THREE.Vector3 }[] = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        if (points[i].distanceTo(points[j]) < 2.5) {
          lineData.push({ from: points[i], to: points[j] });
        }
      }
    }
    return lineData;
  }, [points]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={ref}>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={2} />
        </mesh>
      ))}
      {lines.map((l, i) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([l.from, l.to]);
        return (
          <primitive key={i} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#a5b4fc", opacity: 0.3, transparent: true }))} />
        );
      })}
    </group>
  );
}

export function Features3D() {
  return (
    <div className="h-64 w-full">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.3} />
        <pointLight position={[3, 3, 3]} intensity={0.5} color="#6366f1" />
        <FeatureOrb color="#6366f1" position={[-1.5, 0.5, 0]} />
        <FeatureOrb color="#818cf8" position={[1.5, -0.3, 0.5]} />
        <FeatureOrb color="#a5b4fc" position={[0, 1, -0.5]} />
        <NodeLines />
      </Canvas>
    </div>
  );
}
