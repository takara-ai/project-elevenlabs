import {
  Bloom,
  EffectComposer,
  ToneMapping,
} from "@react-three/postprocessing";
import { useControls } from "leva";
import { Camera } from "./components/camera";
import { Character } from "./components/character";
import { CursorPosition } from "./components/cursor-position";
import { Floor } from "./components/floor";
import { RandomSpheres } from "./components/random-spheres";
import { Title3D } from "./components/title";
import { History } from "./components/history";

export function Scene() {
  // Leva controls for scene parameters
  const lighting = useControls("Lighting", {
    ambientIntensity: { value: 0, min: 0, max: 5, step: 0.1 },
    pointLightIntensity: { value: 5, min: 0, max: 20, step: 0.5 },
    pointLightX: { value: 0, min: -50, max: 50, step: 1 },
    pointLightY: { value: 5, min: -50, max: 50, step: 1 },
    pointLightZ: { value: 10, min: -50, max: 50, step: 1 },
    pointLightColor: {
      value: "#ead03e",
      min: "#000000",
      max: "#ffffff",
      step: 0.01,
    },
  });

  const bloom = useControls("Bloom", {
    intensity: { value: 1, min: 0, max: 5, step: 0.1 },
    threshold: { value: 0.5, min: 0, max: 2, step: 0.1 },
    smoothing: { value: 1, min: 0, max: 2, step: 0.1 },
  });

  const character = useControls("Character", {
    scale: { value: 1, min: 0, max: 2, step: 0.01 },
    animation: {
      value: "idle",
      options: ["idle", "running", "t-pose"],
    },
    animationSpeed: { value: 1, min: 0, max: 3, step: 0.1 },
  });

  const scene = useControls("Scene", {
    randomSpheresCount: { value: 20, min: 0, max: 100, step: 1 },
  });

  return (
    <>
      <ambientLight intensity={lighting.ambientIntensity} />
      <Camera />
      <Title3D />
      <Floor />
      <CursorPosition />
      <pointLight
        position={[
          lighting.pointLightX,
          lighting.pointLightY,
          lighting.pointLightZ,
        ]}
        color={lighting.pointLightColor}
        intensity={lighting.pointLightIntensity}
      />
      <RandomSpheres count={scene.randomSpheresCount} />
      <History />
      <Character
        animationName={character.animation}
        animationSpeed={character.animationSpeed}
        position={[0, 0, 0]}
        scale={character.scale}
      />
      {/* <DebugOverlay /> */}
      <EffectComposer>
        <Bloom
          intensity={bloom.intensity}
          luminanceThreshold={bloom.threshold}
          luminanceSmoothing={bloom.smoothing}
        />
        <ToneMapping />
      </EffectComposer>
    </>
  );
}
