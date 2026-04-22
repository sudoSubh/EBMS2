import React from "react";
import { cn } from "../../utils/helpers";

export const BackgroundBeams = ({ className }) => {
  return (
    <div
      className={cn(
        "absolute inset-0 z-0 flex items-center justify-center overflow-hidden bg-slate-950",
        className
      )}
    >
      <div className="absolute top-0 w-[100vw] h-[100vh] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-900/40 via-slate-950 to-slate-950 z-0"></div>
      <div className="absolute inset-0 opacity-[0.03] z-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')"}}></div>
      
      {/* Beam 1 */}
      <div className="absolute left-[-10%] top-[-20%] w-[50%] h-[140%] translate-y-[10%] rotate-[-45deg] bg-gradient-to-b from-transparent via-primary-500/20 to-transparent blur-3xl rounded-full opacity-50 mix-blend-color-dodge animate-pulse" style={{ animationDuration: '4s' }}></div>
      
      {/* Beam 2 */}
      <div className="absolute right-[-10%] bottom-[-20%] w-[40%] h-[120%] -translate-y-[10%] rotate-[135deg] bg-gradient-to-b from-transparent via-violet-500/20 to-transparent blur-3xl rounded-full opacity-50 mix-blend-color-dodge animate-pulse" style={{ animationDuration: '6s' }}></div>
    </div>
  );
};
