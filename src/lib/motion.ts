import type { Transition } from "motion/react";

/**
 * Shared motion vocabulary so every surface of the app moves the same way.
 * `spring` is for UI chrome (buttons, overlays), `springGentle` for layout
 * shifts in lists and expanding content.
 */
export const spring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 32,
};

export const springGentle: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 30,
};

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
