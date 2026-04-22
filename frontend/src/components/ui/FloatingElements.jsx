import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '../../utils/helpers';

/**
 * Floating 3D geometric shapes that add depth to sections
 */
export function FloatingShapes({ className = '' }) {
  return (
    <div className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      {/* Cube wireframe */}
      <motion.div
        className="absolute top-[15%] left-[10%] w-16 h-16 border border-indigo-500/20 rounded-lg"
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 180],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ transformStyle: 'preserve-3d', perspective: '500px' }}
      />

      {/* Ring */}
      <motion.div
        className="absolute top-[60%] right-[8%] w-24 h-24 border-2 border-violet-500/10 rounded-full"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Triangle */}
      <motion.div
        className="absolute bottom-[20%] left-[20%]"
        animate={{
          rotateZ: [0, 120, 240, 360],
          y: [0, -15, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderBottom: '20px solid rgba(139, 92, 246, 0.15)',
          }}
        />
      </motion.div>

      {/* Small dot cluster */}
      {[
        { x: '75%', y: '25%', delay: 0, size: 4 },
        { x: '78%', y: '28%', delay: 0.5, size: 3 },
        { x: '72%', y: '22%', delay: 1, size: 5 },
        { x: '30%', y: '70%', delay: 1.5, size: 3 },
        { x: '85%', y: '65%', delay: 2, size: 4 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-indigo-400/20"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: dot.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Gradient line */}
      <motion.div
        className="absolute top-[40%] left-0 w-full h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent)',
        }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/**
 * 3D Perspective text that tilts with scroll
 */
export function PerspectiveText({ children, className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -15]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        scale,
        opacity,
        perspective: '1200px',
        transformOrigin: 'center center',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated counter that counts up when visible
 */
export function AnimatedCounter({ value, duration = 2, className = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const numVal = parseInt(value) || 0;
          const startTime = performance.now();

          const step = (currentTime) => {
            const elapsed = (currentTime - startTime) / (duration * 1000);
            const progress = Math.min(elapsed, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * numVal));

            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };

          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString()}
    </span>
  );
}

/**
 * Smooth scroll reveal wrapper
 */
export function ScrollReveal({ children, className = '', direction = 'up', delay = 0 }) {
  const directionMap = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { y: 0, x: -60 },
    right: { y: 0, x: 60 },
  };

  const d = directionMap[direction] || directionMap.up;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: d.y,
        x: d.x,
        filter: 'blur(10px)',
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        filter: 'blur(0px)',
      }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
