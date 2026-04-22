import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, limit, onPageChange }) {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPages = () => {
    const arr = [];
    const delta = 2;
    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      arr.push(i);
    }
    if (page - delta > 2) arr.unshift('...');
    if (page + delta < pages - 1) arr.push('...');
    arr.unshift(1);
    if (pages > 1) arr.push(pages);
    return arr;
  };

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-sm text-slate-500">
        Showing <span className="text-slate-300 font-medium">{from}–{to}</span> of <span className="text-slate-300 font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <motion.button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`e-${i}`} className="px-3 py-1 text-slate-500">…</span>
          ) : (
            <motion.button
              key={p}
              onClick={() => onPageChange(p)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.9 }}
              className={`relative min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                p === page
                  ? 'bg-primary-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  : 'hover:bg-surface-700 text-slate-400'
              }`}
            >
              {p === page && (
                <motion.div
                  layoutId="pagination-active"
                  className="absolute inset-0 bg-primary-600 rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {p}
            </motion.button>
          )
        )}
        <motion.button
          onClick={() => onPageChange(page + 1)}
          disabled={page === pages}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-lg hover:bg-surface-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
}
