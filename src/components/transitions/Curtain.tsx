"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CurtainProps {
  /** Whether the curtain should be visible */
  visible: boolean;
  /** Direction: "in" fades to black, "out" fades from black */
  direction?: "in" | "out";
  /** Duration in seconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
}

export function Curtain({
  visible,
  direction = "in",
  duration = 0.6,
  delay = 0,
}: CurtainProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ backgroundColor: "#0E1A24" }}
          initial={{ opacity: direction === "in" ? 0 : 1 }}
          animate={{ opacity: direction === "in" ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration, delay, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  );
}
