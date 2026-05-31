import "./style.css";
import m, { Vnode } from "mithril";
import Layout from "./layouts/default";

// Error Boundary Component
interface ErrorBoundaryState extends m.Component<{}, any> {
	error: Error | null;
	originalView: any;
}

const ErrorBoundary: ErrorBoundaryState = {
	error: null,
	originalView: null,

	oninit(vnode: Vnode) {
		this.error = null;
		this.originalView = vnode.children;
	},

	onbeforeupdate(vnode: Vnode) {
		if (vnode.children !== this.originalView) {
			this.error = null;
			this.originalView = vnode.children;
		}
	},

	view(vnode: Vnode) {
		if (this.error) {
			return m(Layout, null, [
				m("div", { class: "min-h-screen p-8 bg-red-50" }, [
					m("div", { class: "max-w-3xl mx-auto" }, [
						m("h1", { class: "text-2xl font-bold text-red-700 mb-4" }, "Something went wrong"),
						m("div", { class: "bg-white rounded-lg shadow-lg p-6" }, [
							m("div", { class: "text-red-600 font-mono mb-4" }, this.error.message),
							m("pre", { class: "bg-gray-100 p-4 rounded overflow-auto text-sm" }, this.error.stack),
							m("button", {
								onclick: () => {
									this.error = null;
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
};

interface RouteErrorAttrs {
	error: Error;
}

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

				return {
					view: (vnode: Vnode) => m(ErrorBoundary, null, [
						m(Component, vnode.attrs),
					]),
				};
			} catch (error) {
				return {
					view: () => m(RouteError, { error: error as Error }),
				};
			}
		},
	};
}

tempRoutes["/:404..."] = {
	view: () =>
		m(ErrorBoundary, null, [
			m(Layout, null, [
				m("div", { class: "flex flex-col items-center justify-center min-h-screen p-4 text-center" }, [
					m("h1", { class: "text-6xl font-bold text-blue-500 mb-4" }, "404"),
					m("h2", { class: "text-2xl font-semibold mb-4" }, "Page Not Found"),
					m("p", { class: "text-slate-400 mb-8 max-w-md" }, "The page you are looking for might have been removed or is temporarily unavailable."),
					m("button", {
						onclick: () => m.route.set("/"),
						class: "px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900",
					}, "Back to Home"),
				]),
			]),
		]),
};

export const routes = tempRoutes;

export function initRouter() {
	try {
		window.onerror = (msg, url, lineNo, columnNo, error) => {
			console.error("[Global Error]", { msg, url, lineNo, columnNo, error });
			m.redraw();
		};

		window.onunhandledrejection = (event) => {
			console.error("[Unhandled Promise Rejection]", event.reason);
			m.redraw();
		};

		m.route(document.body, "/", routes);
	} catch (err) {
		console.error("[Router Initialization Error]", err);
		m.render(document.body, m(RouteError, { error: err as Error }));
	}
}
