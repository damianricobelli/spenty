import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";

import { deLocalizeUrl, localizeUrl } from "./paraglide/runtime";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

function parseSearch(searchStr: string) {
	const search = new URLSearchParams(
		searchStr.startsWith("?") ? searchStr.slice(1) : searchStr,
	);
	const result: Record<string, string | string[]> = {};

	for (const [key, value] of search.entries()) {
		const previous = result[key];
		if (previous === undefined) {
			result[key] = value;
			continue;
		}
		result[key] = Array.isArray(previous)
			? [...previous, value]
			: [previous, value];
	}

	return result;
}

function stringifySearch(search: Record<string, unknown>) {
	const params = new URLSearchParams();

	for (const [key, rawValue] of Object.entries(search)) {
		if (rawValue == null) continue;

		if (Array.isArray(rawValue)) {
			for (const item of rawValue) {
				if (item == null) continue;
				params.append(key, String(item));
			}
			continue;
		}

		params.set(key, String(rawValue));
	}

	const query = params.toString();
	return query ? `?${query}` : "";
}

// Create a new router instance
export const getRouter = () => {
  const rqContext = TanstackQuery.getContext();

  const router = createRouter({
    routeTree,
    context: {
      ...rqContext,
    },
    parseSearch,
    stringifySearch,

    // Paraglide URL rewrite docs: https://github.com/TanStack/router/tree/main/examples/react/i18n-paraglide#rewrite-url
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },

    defaultPreload: "intent",

    defaultNotFoundComponent: () => (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>404</h1>
        <p>Not Found</p>
      </div>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient: rqContext.queryClient,
  });

  return router;
};
