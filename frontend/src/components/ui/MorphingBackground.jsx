import React from 'react';
import { cn } from '../../utils/helpers';

export function MorphingBackground({ className = '', variant = 'default' }) {
  const variants = {
    default: {
      blob1: 'from-indigo-600/20 to-violet-600/20',
      blob2: 'from-purple-600/15 to-pink-600/15',
      blob3: 'from-blue-600/10 to-cyan-600/10',
    },
    warm: {
      blob1: 'from-amber-600/20 to-orange-600/20',
      blob2: 'from-rose-600/15 to-pink-600/15',
      blob3: 'from-yellow-600/10 to-red-600/10',
    },
    ocean: {
      blob1: 'from-cyan-600/20 to-blue-600/20',
      blob2: 'from-teal-600/15 to-emerald-600/15',
      blob3: 'from-sky-600/10 to-indigo-600/10',
    },
  };

  const v = variants[variant] || variants.default;

  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Blob 1 — large, slow */}
      <div
        className={`absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full bg-gradient-to-br ${v.blob1} blur-[100px] animate-morphBlob1`}
      />
      {/* Blob 2 — medium, counter-rotate */}
      <div
        className={`absolute -bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full bg-gradient-to-br ${v.blob2} blur-[80px] animate-morphBlob2`}
      />
      {/* Blob 3 — small accent */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] h-[35%] rounded-full bg-gradient-to-br ${v.blob3} blur-[60px] animate-morphBlob3`}
      />
      {/* Noise texture overlay for organic feel */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.65' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export function GridBackground({ className = '' }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial fade for the grid */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-surface-950" />
    </div>
  );
}

export function AuroraBackground({ className = '' }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <div className="absolute inset-0 animate-aurora">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-[120px] animate-auroraShift1" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 blur-[100px] animate-auroraShift2" />
        <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-500/15 blur-[80px] animate-auroraShift3" />
      </div>
    </div>
  );
}
