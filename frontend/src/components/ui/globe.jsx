import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function Globe({ className }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let phi = 0;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 1000,
      height: 1000,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.1, 0.1, 0.2],
      markerColor: [0.4, 0.4, 1],
      glowColor: [0.2, 0.2, 0.8],
      markers: [
        { location: [37.7595, -122.4367], size: 0.1 },
        { location: [40.7128, -74.006], size: 0.1 },
        { location: [51.5074, -0.1278], size: 0.1 },
        { location: [35.6895, 139.6917], size: 0.1 },
        { location: [48.8566, 2.3522], size: 0.1 },
        { location: [28.6139, 77.2090], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.003;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <div className={`w-full max-w-[600px] aspect-square mx-auto ${className}`}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", contain: "layout paint size", opacity: 0.8 }}
      />
    </div>
  );
}
