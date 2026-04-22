import React from 'react';
import { motion } from 'framer-motion';
import { cn, getStatusBadgeClass } from '../../utils/helpers';

export function Badge({ children, variant, className = '' }) {
  const cls = variant || getStatusBadgeClass(children?.toString().toLowerCase());
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      className={cn('badge', cls, className)}
    >
      {children}
    </motion.span>
  );
}

export function StatusBadge({ status }) {
  const labels = {
    active: '● Active',
    returned: '✓ Returned',
    overdue: '⚠ Overdue',
    lost: '✕ Lost',
    pending: '○ Pending',
    fulfilled: '✓ Fulfilled',
    cancelled: '✕ Cancelled',
    expired: '○ Expired',
    paid: '✓ Paid',
    partial: '◑ Partial',
    waived: '≈ Waived',
    available: '● Available',
    issued: '◆ Issued',
    reserved: '◇ Reserved',
    damaged: '⚠ Damaged',
  };

  // Live pulse for critical statuses
  const isPulsing = ['overdue', 'lost', 'damaged'].includes(status);

  return (
    <motion.span className="relative inline-flex">
      {isPulsing && (
        <motion.span
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-lg bg-red-500/20"
        />
      )}
      <Badge variant={getStatusBadgeClass(status)}>{labels[status] || status}</Badge>
    </motion.span>
  );
}
