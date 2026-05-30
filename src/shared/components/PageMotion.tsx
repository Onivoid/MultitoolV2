import { motion, type HTMLMotionProps } from "framer-motion";

const defaultTransition = {
  duration: 0.8,
  delay: 0.2,
  ease: [0, 0.71, 0.2, 1.01] as const,
};

export default function PageMotion({
  children,
  className,
  ...props
}: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={defaultTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
