import type { Transition } from "motion/react";

/**
 * Shared motion vocabulary so every surface of the app moves the same way.
 * `springGentle` is for layout shifts in lists and expanding content.
 */
export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
};

/** Matches the --ease-out / --ease-drawer tokens in styles.css. */
export const easeOut = [0.23, 1, 0.32, 1] as const;
export const easeDrawer = [0.32, 0.72, 0, 1] as const;

/**
 * Sheet that rises from the bottom (the toolbar's add/edit forms). Uses full
 * transform strings so Motion can run it on the compositor, and leaves faster
 * than it arrives. Reduced motion keeps the fade and drops the movement.
 */
export function sheetMotion(reduceMotion: boolean | null) {
  const from = reduceMotion ? "none" : "translateY(24px) scale(0.97)";
  const to = reduceMotion ? "none" : "translateY(16px) scale(0.98)";
  return {
    initial: { opacity: 0, transform: from },
    animate: {
      opacity: 1,
      transform: reduceMotion ? "none" : "translateY(0px) scale(1)",
      transition: { duration: 0.34, ease: easeDrawer },
    },
    exit: {
      opacity: 0,
      transform: to,
      transition: { duration: 0.18, ease: easeOut },
    },
  };
}

/** Fallback used when the user prefers reduced motion. */
export const reducedFade: Transition = { duration: 0.12, ease: "easeOut" };

/** Enter/exit preset for list items (history rows, member chips). */
export const listItem = {
  initial: { opacity: 0, y: -8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
} as const;

/** Enter/exit preset for vertically expanding panels. */
export const expandPanel = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
} as const;
