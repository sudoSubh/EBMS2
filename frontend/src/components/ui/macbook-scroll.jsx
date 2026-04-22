import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "../../utils/helpers";

export const MacbookScroll = ({
  src,
  showGradient,
  title,
  badge,
  badgeUrl,
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (window && window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  const scaleX = useTransform(
    scrollYProgress,
    [0, 0.3],
    [1.2, isMobile ? 1 : 1.5]
  );
  const scaleY = useTransform(
    scrollYProgress,
    [0, 0.3],
    [0.6, isMobile ? 1 : 1.5]
  );
  const translateZ = useTransform(scrollYProgress, [0, 0.2], [100, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.2], [-60, 0]);
  
  return (
    <div
      ref={ref}
      className="min-h-[150vh] flex flex-col items-center py-20 justify-start flex-shrink-0 [perspective:800px] transform md:scale-100  scale-[0.4] sm:scale-50 relative"
    >
      <div className="absolute top-0 w-full flex flex-col items-center justify-center p-4">
        {title && <h2 className="text-4xl font-black text-center text-white mb-2 tracking-tighter">{title}</h2>}
        {badge}
      </div>

      <motion.div
         style={{
           rotateX,
           scaleX,
           scaleY,
           translateZ,
         }}
         className="mt-[200px]"
      >
        <div className="h-[25rem] w-[32rem] bg-slate-200 dark:bg-[#272729] rounded-[22px] p-2 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-700 mx-auto">
          <div className="w-full h-full bg-slate-900 rounded-[14px] overflow-hidden relative">
             <img src={src} alt="screen" className="w-full h-full object-cover" />
             {showGradient && (
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
             )}
          </div>
          {/* Keyboard base */}
          <div className="absolute -bottom-[20px] left-1/2 -translate-x-1/2 w-[34rem] h-6 bg-[#b0b0b0] dark:bg-[#1f1f1f] rounded-b-[20px] shadow-[inset_0_-2px_10px_rgba(0,0,0,0.4)] flex items-center justify-center">
            <div className="w-20 h-1 bg-slate-400 dark:bg-[#333] rounded-full mx-auto" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
