import React from 'react';
import { motion } from 'framer-motion';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeMap = { sm: 20, md: 32, lg: 48 };
  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative ${className}`} style={{ width: s, height: s }}>
      {/* Outer ring */}
      <motion.div
        className="absolute inset-0 border-2 border-primary-500/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
      {/* Inner arc */}
      <motion.div
        className="absolute inset-0 border-2 border-transparent border-t-primary-500 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {/* Glow dot */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: `50% ${s / 2}px` }}
      />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6"
      >
        {/* 3D rotating cube loader */}
        <div className="relative w-12 h-12" style={{ perspective: '200px' }}>
          <motion.div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600"
            animate={{
              rotateX: [0, 180, 360],
              rotateY: [0, 180, 360],
              borderRadius: ['25%', '50%', '25%'],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              boxShadow: '0 0 30px rgba(99, 102, 241, 0.4), 0 0 60px rgba(99, 102, 241, 0.15)',
            }}
          />
        </div>
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-slate-400 text-sm font-medium tracking-wider"
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="admin-card p-0 overflow-hidden"
    >
      <table className="table w-full">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><div className="skeleton h-3 w-24 rounded" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
              className="border-t border-surface-700"
            >
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}><div className="skeleton h-4 w-full rounded" /></td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
