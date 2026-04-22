import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

export default function Input({
  label,
  error,
  className = '',
  containerClassName = '',
  leftIcon,
  rightIcon,
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      {label && (
        <motion.label
          animate={focused ? { color: '#818cf8' } : { color: '#94a3b8' }}
          transition={{ duration: 0.2 }}
          className="label"
        >
          {label}
        </motion.label>
      )}
      <motion.div
        className="relative"
        animate={focused ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {leftIcon && (
          <motion.div
            animate={focused ? { color: '#818cf8' } : { color: '#64748b' }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {leftIcon}
          </motion.div>
        )}
        <input
          className={cn(
            'input-field',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-red-500 focus:ring-red-500',
            focused && 'shadow-[0_0_20px_rgba(99,102,241,0.1)]',
            className
          )}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
