import m, { Vnode, Component } from "mithril";

interface LayoutAttrs {
	children?: any;
}

const Layout: Component<LayoutAttrs> = {
	view(vnode: Vnode<LayoutAttrs>) {
		return m("div", { class: "min-h-screen bg-slate-900 text-slate-100" }, [
			vnode.children,
		]);
	}
};

export default Layout;
