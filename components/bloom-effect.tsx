"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Sphere } from "@react-three/drei";
import { useControls } from "leva";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useMemo } from "react";

// Store renderer reference outside React scope to bypass immutability
let rendererInstance: THREE.WebGLRenderer | null = null;

// Seeded random function for deterministic randomness
function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// Component to handle tone mapping exposure updates
function ToneMappingController() {
  const { gl } = useThree();
  const toneMappingControls = useControls("tone mapping", {
    exposure: { value: 1, min: 0.1, max: 2, step: 0.01 },
  });

  // Store renderer instance in effect
  useEffect(() => {
    rendererInstance = gl;
  }, [gl]);

  useFrame(() => {
    if (rendererInstance) {
      rendererInstance.toneMappingExposure = Math.pow(
        toneMappingControls.exposure,
        4.0
      );
    }
  });

  return null;
}

function BloomScene() {
  const groupRef = useRef<THREE.Group>(null);

  // Leva controls for bloom settings - matching the example
  const bloomControls = useControls("bloom", {
    threshold: { value: 0, min: 0, max: 1, step: 0.01 },
    strength: { value: 3, min: 0, max: 3, step: 0.1 },
    radius: { value: 1, min: 0, max: 1, step: 0.01 },
  });

  // Leva controls for scene settings
  const sceneControls = useControls("Scene", {
    emissiveIntensity: { value: 2, min: 0, max: 10, step: 0.1 },
    ambientLightIntensity: { value: 0.3, min: 0, max: 2, step: 0.1 },
    rotationSpeed: { value: 0.2, min: 0, max: 1, step: 0.01 },
  });

  // Animate the bloom elements
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * sceneControls.rotationSpeed) * 0.1;
      groupRef.current.rotation.x =
        Math.cos(state.clock.elapsedTime * sceneControls.rotationSpeed * 0.75) *
        0.1;
    }
  });

  // Create multiple glowing spheres for bloom - using bright emissive materials
  const spheres = useMemo(() => {
    const colors = [
      "#93c5fd", // blue
      "#c4b5fd", // purple
      "#fbbf24", // amber
      "#f472b6", // pink
      "#34d399", // emerald
      "#60a5fa", // light blue
      "#a78bfa", // violet
      "#fb7185", // rose
    ];

    return Array.from({ length: 12 }, (_, i) => {
      const random = seededRandom(i * 1000 + 42);
      return {
        position: [
          (random() - 0.5) * 12,
          (random() - 0.5) * 12,
          (random() - 0.5) * 6,
        ] as [number, number, number],
        color: colors[i % 8],
        size: 0.4 + random() * 0.6,
      };
    });
  }, []);

  return (
    <>
      <ToneMappingController />
      <group ref={groupRef}>
        {/* Glowing spheres with emissive materials - these will bloom */}
        {spheres.map((sphere, i) => (
          <Sphere
            key={i}
            args={[sphere.size, 32, 32]}
            position={sphere.position}
          >
            <meshStandardMaterial
              color={sphere.color}
              emissive={sphere.color}
              emissiveIntensity={sceneControls.emissiveIntensity}
            />
          </Sphere>
        ))}

        {/* Additional bright emissive objects */}
        <Sphere args={[1, 32, 32]} position={[-4, 2, 0]}>
          <meshStandardMaterial
            color="#93c5fd"
            emissive="#93c5fd"
            emissiveIntensity={sceneControls.emissiveIntensity * 1.5}
          />
        </Sphere>
        <Sphere args={[1, 32, 32]} position={[4, -2, 0]}>
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#c4b5fd"
            emissiveIntensity={sceneControls.emissiveIntensity * 1.5}
          />
        </Sphere>
        <Sphere args={[0.8, 32, 32]} position={[0, 3, 0]}>
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={sceneControls.emissiveIntensity * 1.5}
          />
        </Sphere>

        {/* Ambient light for overall scene illumination */}
        <ambientLight intensity={sceneControls.ambientLightIntensity} />
      </group>

      {/* Post-processing bloom effect - controlled by Leva */}
      <EffectComposer>
        <Bloom
          intensity={bloomControls.strength}
          luminanceThreshold={bloomControls.threshold}
          luminanceSmoothing={0.85}
          radius={bloomControls.radius}
        />
      </EffectComposer>
    </>
  );
}

export default function BloomEffect() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          // Ensure initial exposure is set
          gl.toneMappingExposure = 1;
        }}
        dpr={[1, 2]}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          outline: "none",
          border: "none",
        }}
      >
        <BloomScene />
      </Canvas>
    </div>
  );
}
