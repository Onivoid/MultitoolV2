import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { PAGE_ROOT } from "@/shared/components/pageStyles";

const defaultTransition = {
  duration: 0.8,
  delay: 0.2,
  ease: [0, 0.71, 0.2, 1.01] as const,
};

const fadeTransition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1] as const,
};

type PageMotionEntrance = "default" | "fade";

export default function PageMotion({
  children,
  className,
  entrance = "default",
  ...props
}: HTMLMotionProps<"div"> & { entrance?: PageMotionEntrance }) {
  const isFade = entrance === "fade";

  return (
    <motion.div
      initial={isFade ? { opacity: 0 } : { opacity: 0, x: 100 }}
      animate={isFade ? { opacity: 1 } : { opacity: 1, x: 0 }}
      transition={isFade ? fadeTransition : defaultTransition}
      className={cn(PAGE_ROOT, className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}
