import { useControls, folder } from "leva";
import { OrderedDither, IDitherProps } from "./shader/ordered-dither";

export function OrderedDitherControls() {
  const ditherConfig = useControls("Dither Settings", {
    matrixSize: {
      value: 8,
      options: {
        "2x2": 2,
        "3x3": 3,
        "4x4": 4,
        "8x8": 8,
        vertical: 20,
        horizontal: 21,
      },
    },
    "8x8 Values": folder({
      eightNum: {
        render: (get) => get("Dither Settings.matrixSize") === 8,
        value: 8,
        step: 1,
      },
      eightNumAug: {
        render: (get) => get("Dither Settings.matrixSize") === 8,
        value: 1,
        step: 1,
      },
    }),
    useColor: true,
    invertDither: false,
    colorThreshold: { value: 400, min: 1, max: 1024, step: 1 },
    ditherScale: { value: 3.5, min: 0, max: 10, step: 0.1 },
    darkThreshold: { value: 3, step: 0.01 },
    lightThreshold: { value: 3, step: 0.01 },
    dOffsetX: { value: 0, min: 0, max: 10, step: 0.1 },
    dOffsetY: { value: 0, min: 0, max: 10, step: 0.1 },
    Randomization: folder({
      randomize: false,
      seed: { value: 0, step: 1 },
    }),
  });

  // Map the Leva control names to the component prop names
  // Leva folders flatten the structure, so properties are accessible directly
  const ditherProps: IDitherProps = {
    matrixSize: ditherConfig.matrixSize,
    eightNum: ditherConfig.eightNum,
    eightNumAug: ditherConfig.eightNumAug,
    useColor: ditherConfig.useColor,
    invertDither: ditherConfig.invertDither,
    colorThreshold: ditherConfig.colorThreshold,
    ditherScale: ditherConfig.ditherScale,
    darkThreshold: ditherConfig.darkThreshold,
    lightThreshold: ditherConfig.lightThreshold,
    dOffsetX: ditherConfig.dOffsetX,
    dOffsetY: ditherConfig.dOffsetY,
    randomize: ditherConfig.randomize,
    seed: ditherConfig.seed,
  };

  return <OrderedDither {...ditherProps} />;
}
