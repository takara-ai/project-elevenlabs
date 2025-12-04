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
    ambientIntensity: { value: 1.5, min: 0, max: 5, step: 0.1 },
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
