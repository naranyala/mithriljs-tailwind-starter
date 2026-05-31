import m, { Vnode, Component } from "mithril";
import Layout from "@/layouts/default";

const Page: Component = {
	view(): Vnode {
		return m(Layout, null, [
			m("div", { class: "p-8" }, [
				m("h1", { class: "text-3xl font-bold mb-4" }, "User Profiles"),
				m("p", "Manage and view user information here."),
			]),
		]);
	},
};

export default Page;
