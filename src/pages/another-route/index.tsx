import m from "mithril";
import Layout from "@/layouts/default";

export default {
	view: () => m(Layout, null, [
		m("h2", { class: "text-2xl font-bold" }, "another route"),
	]),
};
