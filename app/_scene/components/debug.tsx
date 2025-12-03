import React from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { OrthographicCamera } from "three";

/**
 * R3F Debug Overlay that shows camera position and zoom.
 * Place this inside your <Canvas> scene.
 */
export function DebugOverlay() {
  const { camera } = useThree();

  // Note: OrthographicCamera uses 'zoom', PerspectiveCamera doesn't
  const [info, setInfo] = React.useState({
    position: { x: 0, y: 0, z: 0 },
    zoom: 1,
  });

  React.useEffect(() => {
    function update() {
      setInfo({
        position: {
          x: Number(camera.position.x.toFixed(3)),
          y: Number(camera.position.y.toFixed(3)),
          z: Number(camera.position.z.toFixed(3)),
        },
        zoom: "zoom" in camera ? Number(camera.zoom.toFixed(3)) : 1,
      });
    }
    // Listen to frame renders for live update
    let animation = true;
    function loop() {
      update();
      if (animation) requestAnimationFrame(loop);
    }
    loop();
    return () => {
      animation = false;
    };
  }, [camera]);

  return (
    <Html
      position={[0, 0, 0]}
      className="min-w-40 w-fit h-fit z-1000 bg-zinc-900/90 text-white font-mono text-xs p-2 rounded-md box-shadow-sm"
      transform={false}
      prepend
    >
      <div>
        <div>
          <b>Camera Position</b>
        </div>
        <div>
          x: {info.position.x} <br />
          y: {info.position.y} <br />
          z: {info.position.z}
        </div>
        <div>
          <b>Zoom:</b> {info.zoom}
        </div>
      </div>
    </Html>
  );
}
