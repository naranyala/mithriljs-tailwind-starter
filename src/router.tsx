import "./style.css";
import m, { Vnode } from "mithril";
import Layout from "./layouts/default";

// Error Boundary Component
const ErrorBoundary: any = {
	state: {
		error: null as Error | null,
		originalView: null as any,
	},

	oninit(vnode: Vnode) {
		this.state.error = null;
		this.state.originalView = vnode.children;
	},

	view(vnode: Vnode) {
		if (this.state.error) {
			return m(Layout, null, [
				m("div", { class: "min-h-screen p-8 bg-red-50" }, [
					m("div", { class: "max-w-3xl mx-auto" }, [
						m("h1", { class: "text-2xl font-bold text-red-700 mb-4" }, "Something went wrong"),
						m("div", { class: "bg-white rounded-lg shadow-lg p-6" }, [
							m("div", { class: "text-red-600 font-mono mb-4" }, this.state.error.message),
							m("pre", { class: "bg-gray-100 p-4 rounded overflow-auto text-sm" }, this.state.error.stack),
							m("button", {
								onclick: () => {
									this.state.error = null;
									m.redraw();
								},
								class: "mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
							}, "Try Again"),
						]),
					]),
				]),
			]);
		}
		return vnode.children;
	},

	onbeforeupdate(vnode: Vnode) {
		// Reset error when route changes
		if (vnode.children !== this.state.originalView) {
			this.state.error = null;
			this.state.originalView = vnode.children;
		}
	},
};

interface RouteErrorAttrs {
	error: Error;
}

// Route Error Component
const RouteError: m.Component<RouteErrorAttrs> = {
	view: (vnode) => {
		const { error } = vnode.attrs;
		return m("div", [
			m("div", { class: "min-h-screen p-8 bg-red-50" }, [
				m("div", { class: "max-w-3xl mx-auto" }, [
					m("h1", { class: "text-2xl font-bold text-red-700 mb-4" }, "Error Loading Route"),
					m("div", { class: "bg-white rounded-lg shadow-lg p-6" }, [
						m("div", { class: "text-red-600 font-mono mb-4" }, error.message),
						m("pre", { class: "bg-gray-100 p-4 rounded overflow-auto text-sm" }, error.stack),
						m("button", {
							onclick: () => window.location.reload(),
							class: "mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700",
						}, "Reload Page"),
					]),
				]),
			]),
		]);
	},
};

// Dynamic route generation with error handling
const modules = import.meta.glob("./pages/**/index.{jsx,tsx}");
const tempRoutes: Record<string, any> = {};

for (const path in modules) {
	let routePath = path
		.replace("./pages", "")
		.replace(/\/index\.(jsx|tsx)$/, "")
		.replace(/\[([^\]]+)\]/g, ":$1");

	if (!routePath.startsWith("/")) {
		routePath = "/" + routePath;
	}

	tempRoutes[routePath] = {
		onmatch: async () => {
			try {
				const module = await modules[path]() as { default: any };
				const Component = module.default;

				// Wrap component with error boundary
				return {
					view: (vnode: Vnode) => m(ErrorBoundary, null, [
						m(Component, vnode.attrs),
					]),
				};
			} catch (error) {
				// Handle route loading errors
				return {
					view: () => m(RouteError, { error: error as Error }),
				};
			}
		},
	};
}

// Not Found route with error boundary
tempRoutes["/:404..."] = {
	view: () =>
		m(ErrorBoundary, null, [
			m(Layout, null, [
				m("div", { class: "m-0 p-0" }, [
					m("h1", { class: "text-center font-bold text-3xl" }, "404 Not Found"),
				]),
			]),
		]),
};

export const routes = tempRoutes;

export function initRouter() {
	try {
		// Global error handler for uncaught errors
		window.onerror = (msg, url, lineNo, columnNo, error) => {
			console.error("[Global Error]", { msg, url, lineNo, columnNo, error });
			m.redraw(); // Ensure error state is rendered
		};

		// Global promise rejection handler
		window.onunhandledrejection = (event) => {
			console.error("[Unhandled Promise Rejection]", event.reason);
			m.redraw();
		};

		// Initialize router
		m.route(document.body, "/", routes);
	} catch (err) {
		console.error("[Router Initialization Error]", err);
		// Render fatal error directly to body
		m.render(document.body, m(RouteError, { error: err as Error }));
	}
}
