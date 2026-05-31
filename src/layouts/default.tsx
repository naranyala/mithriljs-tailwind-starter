import m from "mithril";

interface LayoutAttrs {}

const Layout: m.Component<LayoutAttrs> = {
	view: (vnode) => {
		const { children } = vnode;
		const menu = [
			{ label: "home", link: "/" },
			{ label: "another-route", link: "/another-route" },
			{ label: "not-found", link: "/not-found" },
		];

		return m("div", [], [
			m("nav", { class: "flex gap-4 w-full justify-center items-center mt-12" },
				menu.map((item) =>
					m("div", {
						onclick: () => m.route.set(item.link),
						class: "hover:underline cursor-pointer",
					}, item.label)
				)
			),
			m("main", { class: "border-2 rounded-xl m-4 p-4" }, children),
		]);
	},
};

export default Layout;
