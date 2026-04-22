import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/helpers";

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  onClick,
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{
        y: -4,
        scale: 1.01,
        transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] },
      }}
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition-shadow duration-300 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent justify-between flex flex-col space-y-4 cursor-pointer relative overflow-hidden",
        className
      )}
    >
      {/* Background Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-violet-500/10 opacity-0 group-hover/bento:opacity-100 transition-all duration-500 z-0" />

      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover/bento:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 0 1px rgba(99, 102, 241, 0.15), 0 0 30px rgba(99, 102, 241, 0.05)',
        }}
      />

      <div className="relative z-10 w-full h-full min-h-[6rem] rounded-xl overflow-hidden bg-gradient-to-br from-neutral-100 dark:from-neutral-900 to-neutral-200 dark:to-neutral-800">
        {header}
      </div>
      <motion.div
        className="relative z-10"
        initial={false}
        animate={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            whileHover={{ scale: 1.2, rotate: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {icon}
          </motion.div>
          <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200">
            {title}
          </div>
        </div>
        <div className="font-sans font-normal text-neutral-600 text-xs dark:text-neutral-300">
          {description}
        </div>
      </motion.div>
    </motion.div>
  );
};
