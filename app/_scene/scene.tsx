import { OrbitControls } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ToneMapping,
} from "@react-three/postprocessing";
import { useControls } from "leva";
import { RandomSpheres } from "./components/random-spheres";
import { Character } from "./components/character";

export function Scene() {
  // Leva controls for scene parameters
  const controls = useControls({
    "Lighting/ambientIntensity": { value: 1, min: 0, max: 5, step: 0.1 },
    "Lighting/pointLightIntensity": { value: 5, min: 0, max: 20, step: 0.5 },
    "Bloom/intensity": { value: 1.5, min: 0, max: 5, step: 0.1 },
    "Bloom/threshold": { value: 0.9, min: 0, max: 2, step: 0.1 },
    "Bloom/smoothing": { value: 0.9, min: 0, max: 2, step: 0.1 },
    "Character/scale": { value: 0.1, min: 0, max: 2, step: 0.01 },
    "Character/animation": {
      value: "idle",
      options: ["idle", "running", "t-pose"],
    },
    "Character/animationSpeed": { value: 1, min: 0, max: 3, step: 0.1 },
  });

  return (
    <>
      <ambientLight intensity={controls["Lighting/ambientIntensity"]} />
      <pointLight
        position={[10, 10, 10]}
        intensity={controls["Lighting/pointLightIntensity"]}
      />
      <OrbitControls />
      <RandomSpheres count={20} />
      <Character
        animationName={controls["Character/animation"]}
        animationSpeed={controls["Character/animationSpeed"]}
        position={[0, 0, 0]}
        scale={controls["Character/scale"]}
      />
      <EffectComposer>
        <Bloom
          intensity={controls["Bloom/intensity"]}
          luminanceThreshold={controls["Bloom/threshold"]}
          luminanceSmoothing={controls["Bloom/smoothing"]}
        />
        <ToneMapping />
      </EffectComposer>
    </>
  );
}
