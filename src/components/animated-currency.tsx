import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format-currency";

/**
 * Renders a currency amount that counts toward its new value whenever it
 * changes. Falls back to a static value when the user prefers reduced motion.
 */
export function AnimatedCurrency({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(() => formatCurrency(value));
  const previousValue = useRef(value);

  useEffect(() => {
    const from = previousValue.current;
    previousValue.current = value;
    if (from === value) return;
    if (reduceMotion) {
      setDisplay(formatCurrency(value));
      return;
    }
    const controls = animate(from, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(formatCurrency(latest)),
      onComplete: () => setDisplay(formatCurrency(value)),
    });
    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <span className={`tabular-nums ${className ?? ""}`}>{display}</span>
  );
}
