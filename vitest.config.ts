import { defineConfig } from "vitest/config";

// Tests run without the app's Vite plugins (TanStack Start, Nitro, Paraglide),
// which rewrite server imports and aren't needed for unit tests.
export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "node",
	},
});
