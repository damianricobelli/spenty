import {
	animate,
	motion,
	useMotionValue,
	useReducedMotion,
	useTransform,
} from "motion/react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/format-currency";

/**
 * Renders a currency amount that counts toward its new value whenever it
 * changes. The count runs on a motion value, so React doesn't re-render on
 * every frame. Jumps straight to the value when the user prefers reduced motion.
 */
export function AnimatedCurrency({
	value,
	className,
}: {
	value: number;
	className?: string;
}) {
	const reduceMotion = useReducedMotion();
	const amount = useMotionValue(value);
	const text = useTransform(amount, (latest) => formatCurrency(latest));

	useEffect(() => {
		if (reduceMotion) {
			amount.jump(value);
			return;
		}
		const controls = animate(amount, value, {
			duration: 0.6,
			ease: [0.23, 1, 0.32, 1],
		});
		return () => controls.stop();
	}, [amount, value, reduceMotion]);

	return (
		<motion.span className={cn("tabular-nums", className)}>{text}</motion.span>
	);
}
