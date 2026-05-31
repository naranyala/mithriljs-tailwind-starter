import m from "mithril";
import Layout from "@/layouts/default";
import Counter from "@/lib/Counter";

export default {
	view: () => m(Layout, null, [
		m(Counter),
	]),
};
