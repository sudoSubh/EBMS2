import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

export function TiltCard({
  children,
  className = '',
  glareColor = 'rgba(99, 102, 241, 0.15)',
  borderGlow = true,
  maxTilt = 12,
  scale = 1.02,
  ...props
}) {
  const cardRef = useRef(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * maxTilt;
    const rotateY = (x - 0.5) * maxTilt;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`);
    setGlare({ x: x * 100, y: y * 100, opacity: 0.6 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: 'transform 0.15s ease-out',
        transformStyle: 'preserve-3d',
      }}
      className={cn('relative group', className)}
      {...props}
    >
      {/* Depth border glow */}
      {borderGlow && (
        <div
          className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, ${glareColor}, transparent 60%)`,
          }}
        />
      )}

      {/* Card content wrapper */}
      <div className="relative z-10 h-full">
        {children}
      </div>

      {/* Internal glare/shine */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none z-20 overflow-hidden"
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity * 0.08}), transparent 50%)`,
          transition: 'background 0.15s ease-out',
        }}
      />
    </div>
  );
}

export function DepthCard({ children, className = '', depth = 20 }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * depth,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * depth,
    });
  };

  const handleLeave = () => setMouse({ x: 0, y: 0 });

  return (
    <motion.div
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn('relative', className)}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1200px',
      }}
    >
      {/* Shadow layer */}
      <motion.div
        animate={{
          x: -mouse.x * 0.3,
          y: -mouse.y * 0.3,
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-violet-600/20 rounded-2xl blur-xl -z-10"
        style={{ transform: 'translateZ(-30px)' }}
      />

      {/* Main card body */}
      <motion.div
        animate={{
          rotateY: mouse.x * 0.5,
          rotateX: -mouse.y * 0.5,
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
