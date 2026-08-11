"use client";

import { motion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        mass: 0.5,
      }}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
