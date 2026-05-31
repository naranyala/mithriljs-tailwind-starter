import m, { Vnode, Component } from "mithril";
import Layout from "@/layouts/default";

const Page: Component = {
	view(): Vnode {
		return m(Layout, null, [
			m("div", { class: "p-8" }, [
				m("h1", { class: "text-3xl font-bold mb-4" }, "Help Center"),
				m("p", "Find answers to common questions here."),
			]),
		]);
	},
};

export default Page;
