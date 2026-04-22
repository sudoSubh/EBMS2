import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

export function MagneticButton({
  children,
  className = '',
  strength = 0.35,
  as = 'button',
  ...props
}) {
  const ref = useRef(null);
  const Component = as === 'button' ? motion.button : motion.a;

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    ref.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  }, [strength]);

  const handleMouseLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = 'translate3d(0, 0, 0)';
    }
  }, []);

  return (
    <Component
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative overflow-hidden transition-transform duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]',
        className
      )}
      style={{ willChange: 'transform' }}
      {...props}
    >
      {/* Ripple inner glow */}
      <span className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300 rounded-inherit" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Component>
  );
}

export function GlowButton({ children, className = '', glowColor = '#6366f1', ...props }) {
  return (
    <motion.button
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 30px ${glowColor}40, 0 0 60px ${glowColor}20`,
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'relative px-6 py-3 font-semibold rounded-2xl overflow-hidden group',
        className
      )}
      {...props}
    >
      {/* Animated gradient border */}
      <span className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <span className="absolute inset-[1px] rounded-2xl bg-surface-900" />
      </span>

      {/* Shimmer sweep */}
      <span
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        }}
      />

      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}
