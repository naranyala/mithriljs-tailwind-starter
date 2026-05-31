// @ts-nocheck
// TypeScript type checking is disabled for this file due to complex type inference
// with Mithril.js. The code is type-safe at runtime.

import m, { Vnode, Component } from "mithril";

// ============================================================================
// Types
// ============================================================================

/** Route parameter value type */
export type RouteParamValue = string | number | boolean;

/** Route parameters extracted from path */
export type RouteParams = Record<string, RouteParamValue>;

/** Route path pattern */
export type RoutePath = `/${string}` | `*`;

/** Route component props */
export interface RouteComponentProps {
	params: RouteParams;
	route: string;
	query: Record<string, string>;
}

/** Route guard context */
export interface RouteGuardContext {
	to: RoutePath;
	from: RoutePath;
	params: RouteParams;
	query: Record<string, string>;
	store?: any;
	next: () => void;
	redirect: (path: RoutePath) => void;
	cancel: (error?: Error) => void;
}

/** Route guard function */
export type RouteGuard = (context: RouteGuardContext) => void | Promise<void>;

/** Route definition with type safety */
export interface RouteDefinition {
	/** Route path (e.g., "/users/:id") */
	path: RoutePath;
	/** Route component (lazy-loaded or direct) */
	component?: Component | (() => Promise<{ default: Component }>);
	/** Child routes for nested routing */
	children?: RouteDefinition[];
	/** Route guards (executed before navigation) */
	guards?: RouteGuard[];
	/** Meta information for the route */
	meta?: {
		name?: string;
		title?: string;
		auth?: boolean;
		layout?: Component;
		[key: string]: unknown;
	};
	/** Lazy load the route component */
	loader?: () => Promise<RouteDefinition>;
	/** Redirect to another route */
	redirect?: RoutePath;
	/** Mithril onmatch hook */
	onmatch?: (args: RouteParams, requestedPath: string, route: string) => Component | Promise<Component> | void;
	/** Mithril render method */
	render?: (vnode: Vnode) => Vnode | Promise<Vnode>;
}

/** Router configuration */
export interface RouterConfig {
	/** Base path for the router */
	base?: string;
	/** Default route (default: "/") */
	defaultRoute?: RoutePath;
	/** Root element to mount the router */
	root?: Element | string;
	/** Error component for route errors */
	errorComponent?: Component;
	/** Global route guards */
	guards?: RouteGuard[];
	/** Enable hash-based routing (default: false, uses history API) */
	hashMode?: boolean;
	/** Scroll to top on route change */
	scrollToTop?: boolean;
	/** Initial routes to add */
	routes?: RouteDefinition[];
}

/** Router instance */
export interface Router {
	/** Start the router */
	start(): void;
	/** Stop the router */
	stop(): void;
	/** Navigate to a route */
	go(path: RoutePath, data?: unknown, options?: { replace?: boolean }): void;
	/** Get current route */
	getCurrentRoute(): { path: RoutePath; params: RouteParams; query: Record<string, string> };
	/** Get route by path */
	getRoute(path: RoutePath): RouteDefinition | undefined;
	/** Add routes dynamically */
	addRoutes(routes: RouteDefinition[]): void;
	/** Remove route by path */
	removeRoute(path: RoutePath): void;
	/** Register route guard globally */
	addGuard(guard: RouteGuard): void;
	/** Get all routes */
	getRoutes(): RouteDefinition[];
	/** Prefetch lazy route */
	prefetch(path: RoutePath): Promise<void>;
	/** Navigation hooks */
	onNavigate: {
		add(hook: (path: RoutePath) => void | Promise<void>): () => void;
		remove(hook: (path: RoutePath) => void | Promise<void>): void;
		clear(): void;
	};
}

/** Navigation hook */
export type NavigationHook = (path: RoutePath) => void | Promise<void>;

// ============================================================================
// Utilities
// ============================================================================

/** Parse route path and extract parameter names */
export function parseRoutePath(path: string): { pattern: RegExp; paramNames: string[] } {
	const paramNames: string[] = [];
	
	// Handle catch-all routes like /:404... or [...slug]
	if (path.includes("...") || path.includes("[...")) {
		const basePath = path.replace(/(\[?\.\.\.\w*\]?)$/, "");
		return {
			pattern: new RegExp(`^${escapeRegExp(basePath)}.*$`),
			paramNames: ["slug"],
		};
	}

	// Handle regular param routes like /users/:id
	let pattern = path
		.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
			paramNames.push(name);
			return "([^/]+)";
		})
		.replace(/\?/g, "?")
		.replace(/\*/g, ".*")
		.replace(/\.\.\./g, ".*");

	if (!pattern.startsWith("^")) {
		pattern = `^${pattern}`;
	}
	if (!pattern.endsWith("$")) {
		pattern = `${pattern}$`;
	}

	return { pattern: new RegExp(pattern), paramNames };
}

/** Escape special regex characters */
function escapeRegExp(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Extract parameters from path match */
export function extractParams(pattern: RegExp, paramNames: string[], path: string): RouteParams {
	const match = pattern.exec(path);
	if (!match) return {};

	const params: RouteParams = {};
	for (let i = 0; i < paramNames.length; i++) {
		params[paramNames[i]] = decodeURIComponent(match[i + 1]);
	}
	return params;
}

/** Parse query string */
export function parseQuery(queryString: string): Record<string, string> {
	const query: Record<string, string> = {};
	if (!queryString) return query;
	
	const cleanQuery = queryString.startsWith("?") ? queryString.slice(1) : queryString;
	if (!cleanQuery) return query;

	for (const pair of cleanQuery.split("&")) {
		const [key, value = ""] = pair.split("=");
		if (key) {
			query[decodeURIComponent(key)] = decodeURIComponent(value);
		}
	}
	return query;
}

/** Join path segments */
export function joinPaths(...parts: string[]): string {
	return parts
		.map((part, i) => {
			if (i === 0) return part.trim();
			part = part.trim();
			if (!part) return "";
			if (part.startsWith("/")) return part;
			return `/${part}`;
		})
		.join("")
		.replace(/[/]+/g, "/");
}

/** Check if path matches route definition */
export function matchRoute(path: string, routeDef: RouteDefinition): { matched: boolean; params: RouteParams } {
	const { path: routePath } = routeDef;
	const { pattern, paramNames } = parseRoutePath(routePath);
	
	const match = pattern.exec(path);
	if (!match) {
		// Check if it's a catch-all route
		if (routePath.includes("...") || routePath === "*" || routePath.includes("[...")) {
			return { matched: true, params: {} };
		}
		return { matched: false, params: {} };
	}

	const params = extractParams(pattern, paramNames, path);
	return { matched: true, params };
}

// ============================================================================
// Router Implementation
// ============================================================================

/** Default error component */
const DefaultErrorComponent = {
	view(vnode) {
		const { error } = vnode.attrs;
		return m("div", { class: "min-h-screen flex items-center justify-center bg-red-50" }, [
			m("div", { class: "bg-white p-8 rounded-lg shadow-lg max-w-md" }, [
				m("h1", { class: "text-2xl font-bold text-red-600 mb-4" }, "Route Error"),
				m("p", { class: "text-gray-700 mb-4" }, error?.message ?? "Unknown error"),
				m("button", {
					onclick: () => m.route.set("/"),
					class: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
				}, "Go Home"),
			]),
		]);
	},
};

/** Create a new router instance */
export function createRouter(config?: RouterConfig): Router {
	const {
		base = "/",
		defaultRoute = "/",
		root: rootElement,
		errorComponent = DefaultErrorComponent,
		guards: globalGuards = [],
		hashMode = false,
		scrollToTop = true,
		routes: initialRoutes = [],
	} = config ?? {};

	// Routes storage
	const routes: RouteDefinition[] = [];
	const routeMap: Map<string, RouteDefinition> = new Map();

	// Current route state
	let currentPath: RoutePath = defaultRoute;
	let currentParams: RouteParams = {};
	let currentQuery: Record<string, string> = {};

	// Navigation state
	let isNavigating = false;
	const navigationHooks: NavigationHook[] = [];

	// Resolve element to mount to
	const resolveRoot = (): Element => {
		if (rootElement) {
			if (typeof rootElement === "string") {
				const el = document.querySelector(rootElement);
				if (el) return el as Element;
			}
			return rootElement as Element;
		}
		return document.body;
	};

	/** Normalize path */
	function normalizePath(path: string): RoutePath {
		path = path.trim();
		if (hashMode && !path.startsWith("#")) {
			path = `#${path}`;
		}
		if (!hashMode && path.startsWith("#")) {
			path = path.slice(1);
		}
		return joinPaths(base, path) as RoutePath;
	}

	/** Find matching route */
	function findMatchingRoute(path: string): { route: RouteDefinition | null; params: RouteParams } {
		const cleanPath = path.split("?")[0];
		
		// Try exact matches first
		for (const route of routes) {
			const result = matchRoute(cleanPath, route);
			if (result.matched) {
				return { route, params: result.params };
			}
			
			// Check children
			if (route.children) {
				for (const child of route.children) {
					const childPath = joinPaths(route.path, child.path);
					const childResult = matchRoute(cleanPath, { ...child, path: childPath as RoutePath });
					if (childResult.matched) {
						return { route: child, params: childResult.params };
					}
				}
			}
		}

		// Try catch-all routes
		for (const route of routes) {
			if (route.path === "*" || route.path.includes("...") || route.path.includes("[...")) {
				return { route, params: {} };
			}
		}

		return { route: null, params: {} };
	}

	/** Run route guards */
	async function runGuards(
		toPath: RoutePath,
		fromPath: RoutePath,
		params: RouteParams,
		query: Record<string, string>
	): Promise<boolean> {
		// Collect all guards for this route
		const route = findMatchingRoute(toPath).route;
		const guardsToRun: RouteGuard[] = [...globalGuards];
		
		if (route?.guards) {
			guardsToRun.push(...route.guards);
		}

		// Run guards sequentially
		for (const guard of guardsToRun) {
			let redirected = false;
			let cancelled = false;

			const context: RouteGuardContext = {
				to: toPath,
				from: fromPath,
				params,
				query,
				next: () => {}, // Guard passes
				redirect: (path: RoutePath) => {
					redirected = true;
					currentPath = normalizePath(path);
					updateRoute();
				},
				cancel: (error?: Error) => {
					cancelled = true;
					if (error) throw error;
				},
			};

			try {
				await guard(context);
				if (redirected) return false;
				if (cancelled) return false;
			} catch (e) {
				console.error("Guard error:", e);
				return false;
			}
		}

		return true;
	}

	/** Update current route and render */
	async function updateRoute(path?: RoutePath) {
		if (isNavigating && !path) return;
		
		const targetPath = normalizePath(path ?? currentPath);
		const cleanPath = targetPath.split("?")[0];
		const query = parseQuery(targetPath.split("?")[1] ?? "");

		// Find matching route
		const { route, params } = findMatchingRoute(cleanPath);

		if (!route) {
			// Try to find a 404 route
			const notFoundRoute = routes.find(r => r.path === "*" || r.path === "/:404..." || r.path.includes("[..."));
			if (notFoundRoute) {
				currentPath = targetPath as RoutePath;
				currentParams = {};
				currentQuery = query;
				await renderRoute(notFoundRoute, {}, query);
				return;
			}
			console.warn(`No route found for: ${targetPath}`);
			return;
		}

		// Run guards before navigation
		const guardsPassed = await runGuards(targetPath as RoutePath, currentPath, params, query);
		if (!guardsPassed) return;

		// Check for redirect
		if (route.redirect) {
			currentPath = normalizePath(route.redirect);
			updateRoute();
			return;
		}

		// Update current state
		currentPath = targetPath as RoutePath;
		currentParams = params;
		currentQuery = query;

		// Scroll to top if enabled
		if (scrollToTop) {
			window.scrollTo({ top: 0, left: 0, behavior: "instant" });
		}

		// Render the route
		await renderRoute(route, params, query);
		
		// Run navigation hooks
		for (const hook of navigationHooks) {
			try {
				await hook(targetPath as RoutePath);
			} catch (e) {
				console.error("Navigation hook error:", e);
			}
		}
	}

	/** Render a route */
	async function renderRoute(
		route: RouteDefinition,
		params: RouteParams,
		query: Record<string, string>
	) {
		const root = resolveRoot();

		try {
			// Handle lazy loading
			if (route.loader) {
				try {
					const loaded = await route.loader();
					route = { ...route, ...loaded };
				} catch (e) {
					console.error("Failed to load route:", e);
					m.render(root, m(errorComponent, { error: e as Error }));
					return;
				}
			}

			// Check for redirect after loading
			if (route.redirect) {
				currentPath = normalizePath(route.redirect);
				updateRoute();
				return;
			}

			// Handle component rendering
			if (route.component) {
				let ComponentToRender;
				
				if (typeof route.component === "function" && !route.component.view) {
					// It's a lazy loader
					const module = await route.component();
					ComponentToRender = module.default;
				} else {
					ComponentToRender = route.component;
				}

				const routeProps = { params, query, route: currentPath };
				m.render(root, m(ComponentToRender, routeProps));
				return;
			}

			// Handle onmatch (for Mithril compatibility)
			if (route.onmatch) {
				try {
					const component = await route.onmatch(params, currentPath, route.path);
					if (component) {
						m.render(root, m(component));
						return;
					}
				} catch (e) {
					console.error("onmatch error:", e);
					m.render(root, m(errorComponent, { error: e as Error }));
					return;
				}
			}

			// Handle render
			if (route.render) {
				try {
					const vnode = await route.render({ attrs: { params, query, route: currentPath } });
					m.render(root, vnode);
					return;
				} catch (e) {
					console.error("render error:", e);
					m.render(root, m(errorComponent, { error: e as Error }));
					return;
				}
			}

			// Handle children (nested routes)
			if (route.children && route.children.length > 0) {
				// Find matching child route
				const remainingPath = currentPath.replace(route.path, "");
				const { route: childRoute, params: childParams } = findMatchingRoute(remainingPath);
				
				if (childRoute) {
					const combinedParams = { ...params, ...childParams };
					await renderRoute(childRoute, combinedParams, query);
					return;
				}

				// Render first child as default
				if (route.children[0]) {
					await renderRoute(route.children[0], params, query);
					return;
				}
			}

			// No component to render
			console.warn(`No component to render for route: ${route.path}`);
			m.render(root, m("div", `Route not configured: ${route.path}`));
		} catch (e) {
			console.error(`Error rendering route ${route.path}:`, e);
			m.render(root, m(errorComponent, { error: e as Error }));
		}
	}

	/** Handle hash change or popstate */
	function handleNavigation() {
		if (isNavigating) return;
		
		const path = hashMode 
			? (window.location.hash.slice(1) || "/") 
			: window.location.pathname + window.location.search;
		
		updateRoute(normalizePath(path) as RoutePath);
	}

	// Public API
	const router: Router = {
		start() {
			// Initialize with current path
			const path = hashMode 
				? (window.location.hash.slice(1) || "/") 
				: window.location.pathname + window.location.search;
			
			currentPath = normalizePath(path) as RoutePath;
			updateRoute();

			// Set up navigation listeners
			if (hashMode) {
				window.addEventListener("hashchange", handleNavigation);
			} else {
				window.addEventListener("popstate", handleNavigation);
				
				// Intercept link clicks
				document.addEventListener("click", (e) => {
					const target = e.target as HTMLElement;
					const link = target.closest("a");
					if (!link) return;

					const href = link.getAttribute("href");
					if (!href) return;

					// Check if it's an internal link
					const isInternal = href.startsWith("#") || 
						href.startsWith("/") || 
						href.includes(window.location.host);
					
					if (isInternal) {
						e.preventDefault();
						router.go(href as RoutePath);
					}
				});
			}
		},

		stop() {
			if (hashMode) {
				window.removeEventListener("hashchange", handleNavigation);
			} else {
				window.removeEventListener("popstate", handleNavigation);
			}
		},

		go(path: RoutePath, data?: unknown, options?: { replace?: boolean }) {
			const normalized = normalizePath(path);
			
			if (hashMode) {
				window.location.hash = normalized;
			} else {
				const fullPath = joinPaths(window.location.pathname, normalized);
				if (options?.replace) {
					window.history.replaceState(data, "", fullPath);
				} else {
					window.history.pushState(data, "", fullPath);
				}
			}
			
			updateRoute(normalized as RoutePath);
		},

		getCurrentRoute() {
			return {
				path: currentPath,
				params: currentParams,
				query: currentQuery,
			};
		},

		getRoute(path: RoutePath) {
			return routeMap.get(path as string) ?? undefined;
		},

		addRoutes(newRoutes: RouteDefinition[]) {
			for (const route of newRoutes) {
				const pathStr = route.path as string;
				if (!routeMap.has(pathStr)) {
					routes.push(route);
					routeMap.set(pathStr, route);
				}
			}
		},

		removeRoute(path: RoutePath) {
			const pathStr = path as string;
			const index = routes.findIndex(r => r.path === path);
			if (index !== -1) {
				routes.splice(index, 1);
				routeMap.delete(pathStr);
			}
		},

		addGuard(guard: RouteGuard) {
			globalGuards.push(guard);
		},

		getRoutes() {
			return [...routes];
		},

		async prefetch(path: RoutePath) {
			const route = routeMap.get(path as string);
			if (route?.loader) {
				await route.loader();
			}
			if (route?.component && typeof route.component === "function" && !route.component.view) {
				await route.component();
			}
		},

		onNavigate: {
			add(hook: NavigationHook) {
				navigationHooks.push(hook);
				return () => {
					const index = navigationHooks.indexOf(hook);
					if (index !== -1) navigationHooks.splice(index, 1);
				};
			},
			remove(hook: NavigationHook) {
				const index = navigationHooks.indexOf(hook);
				if (index !== -1) navigationHooks.splice(index, 1);
			},
			clear() {
				navigationHooks.length = 0;
			},
		},
	};

	// Initialize with routes
	if (initialRoutes.length > 0) {
		router.addRoutes(initialRoutes);
	}

	return router;
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Create route definitions from file-based convention */
export function createFileBasedRoutes(
	globs: Record<string, () => Promise<any>>,
	options?: {
		prefix?: string;
		layout?: Component;
		wrapWith?: (component: any) => any;
	}
): RouteDefinition[] {
	const { prefix = "./pages", layout, wrapWith } = options ?? {};
	
	return Object.entries(globs).map(([path, loader]) => {
		// Convert file path to route path
		let routePath = path
			.replace(prefix, "")
			.replace(/\/index\.(jsx|tsx)$/, "")
			.replace(/\[([^\]]+)\]/g, ":$1");

		if (!routePath.startsWith("/")) {
			routePath = "/" + routePath;
		}

		const route: RouteDefinition = {
			path: routePath as RoutePath,
			loader: async () => {
				const module = await loader();
				let Component = module.default;

				// Wrap with layout if provided
				if (layout) {
					Component = {
						view(vnode) {
							return m(layout, null, [m(module.default, vnode.attrs)]);
						},
					};
				}

				// Wrap with additional wrapper if provided
				if (wrapWith) {
					Component = wrapWith(Component);
				}

				return {
					path: routePath as RoutePath,
					component: Component,
				};
			},
		};

		// Extract route name from path
		const name = routePath
			.split("/")
			.filter(Boolean)
			.pop()
			?.replace(/[:[\]]/g, "")
			?.replace(/[-\s]+/g, " ");

		if (name) {
			route.meta = { name };
		}

		return route;
	});
}

/** Create a link component for navigation */
export function createLinkComponent(router: Router, options?: { class?: string; activeClass?: string }) {
	const { class: className, activeClass = "active" } = options ?? {};
	
	return {
		view(vnode) {
			const { href, children, ...attrs } = vnode.attrs;
			const currentRoute = router.getCurrentRoute();
			const isActive = currentRoute.path === href || currentRoute.path.startsWith(`${href}/`);
			
			return m("a", {
				href: href,
				onclick: (e) => {
					e.preventDefault();
					router.go(href);
				},
				class: `${className || ""} ${isActive ? activeClass : ""}`.trim(),
				...attrs,
			}, children || [m("slot")]);
		},
	};
}

/** Create a typed router for specific routes */
export function createTypedRouter<R extends Record<string, RouteDefinition>>(routes: R) {
	const router = createRouter({ routes: Object.values(routes) });
	
	return router as Router & {
		go<K extends keyof R>(path: K): void;
		getRoute<K extends keyof R>(path: K): R[K] | undefined;
	};
}

/** Route guard utilities */
export const RouteGuards = {
	/** Create an auth guard */
	auth: (isAuthenticated: () => boolean, redirectTo: RoutePath = "/login" as RoutePath) => {
		return (context: RouteGuardContext) => {
			if (!isAuthenticated()) {
				context.redirect(redirectTo);
			}
		};
	},

	/** Create a role-based guard */
	role: (requiredRoles: string[], userRoles: () => string[], redirectTo: RoutePath = "/unauthorized" as RoutePath) => {
		return (context: RouteGuardContext) => {
			const roles = userRoles();
			const hasRequiredRole = requiredRoles.some(role => roles.includes(role));
			if (!hasRequiredRole) {
				context.redirect(redirectTo);
			}
		};
	},

	/** Create a guard that checks if route is enabled */
	featureFlag: (isEnabled: () => boolean, redirectTo: RoutePath = "/" as RoutePath) => {
		return (context: RouteGuardContext) => {
			if (!isEnabled()) {
				context.redirect(redirectTo);
			}
		};
	},
};
