import m, { Vnode, Component } from "mithril";
import Fuse from "fuse.js";
import { signal, computed } from "@preact/signals";

interface MenuItem {
	title: string;
	description: string;
	icon: string;
	route: string;
}

interface MenuAttrs {
	items: MenuItem[];
}

interface MenuAttrs {
	items: MenuItem[];
}

interface MenuState {
	query: import("@preact/signals").Signal<string>;
	fuse: Fuse<MenuItem>;
}

const Menu: Component<MenuAttrs> = {
	oninit(vnode: Vnode<MenuAttrs>) {
		(vnode.state as any) = {
			query: signal(""),
			fuse: new Fuse(vnode.attrs.items, {
				keys: ["title", "description"],
				threshold: 0.3,
			}),
		};
	},

	view(vnode: Vnode<MenuAttrs>): Vnode {
		const { items } = vnode.attrs;
		const state = vnode.state as MenuState;
		const query = state.query;
		const fuse = state.fuse;

		const filteredItems = computed(() => {
			const q = query.value.trim();
			if (q === "") {
				return items;
			}
			const results = fuse.search(q);
			return results.map((r: any) => r.item);
		});

		const handleSearch = (e: Event) => {
			const target = e.target as HTMLInputElement;
			query.value = target.value;
		};

		return m("div", { class: "max-w-6xl mx-auto p-6 space-y-8" }, [
			// Search Header
			m("div", { class: "flex flex-col items-center space-y-4" }, [
				m("h1", { class: "text-4xl font-extrabold tracking-tight text-slate-100" }, "Application Launcher"),
				m("div", { class: "relative w-full max-w-md" }, [
					m("input", {
						type: "text",
						placeholder: "Search apps or features...",
						class: "w-full px-4 py-3 pl-10 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
						oninput: handleSearch,
					}),
					m("span", { class: "absolute left-3 top-3.5 text-slate-400" }, "🔍"),
				]),
			]),

			// Grid
			m("div", { class: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" },
				filteredItems.value.length > 0
					? filteredItems.value.map((item: MenuItem) =>
							m("div", {
								onclick: () => m.route.set(item.route),
								class: "group relative bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-700/50 hover:shadow-md hover:border-blue-500/30 cursor-pointer transition-all duration-200 hover:bg-slate-700/40",
							}, [
								m("div", { class: "text-3xl mb-4 group-hover:scale-110 transition-transform duration-200" }, item.icon),
								m("h3", { class: "text-xl font-semibold text-slate-100 mb-1" }, item.title),
								m("p", { class: "text-sm text-slate-400" }, item.description),
							])
					)
					: m("div", { class: "col-span-full text-center py-12 text-slate-500" }, "No matching items found.")
			),
		]);
	},
};

export default Menu;
