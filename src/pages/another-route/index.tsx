import m, { Vnode, Component } from "mithril";
import Layout from "@/layouts/default";

interface PageAttrs {}

const Page: Component<PageAttrs> = {
	view(): Vnode {
		return m(Layout, null, [
			m("div", { class: "max-w-4xl mx-auto p-6" }, [
				m("div", { class: "flex items-center justify-between mb-8" }, [
					m("h1", { class: "text-3xl font-bold text-slate-100" }, "Analytics Dashboard"),
					m("button", {
						onclick: () => m.route.set("/"),
						class: "px-4 py-2 text-sm font-medium text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors",
					}, "← Back to Home"),
				]),

				m("div", { class: "grid grid-cols-1 md:grid-cols-2 gap-6" }, [
					m("div", { class: "bg-slate-800/50 p-6 rounded-2xl shadow-sm border border-slate-700/50" }, [
						m("h2", { class: "text-lg font-semibold mb-4 text-slate-200" }, "Real-time Traffic"),
						m("div", { class: "h-32 bg-slate-800/80 rounded-lg flex items-end justify-around p-2" }, [
							m("div", { class: "w-4 bg-blue-500 rounded-t h-[40%]" }),
							m("div", { class: "w-4 bg-blue-500 rounded-t h-[70%]" }),
							m("div", { class: "w-4 bg-blue-500 rounded-t h-[50%]" }),
							m("div", { class: "w-4 bg-blue-500 rounded-t h-[90%]" }),
							m("div", { class: "w-4 bg-blue-500 rounded-t h-[60%]" }),
						]),
					]),
					m("div", { class: "bg-slate-800/50 p-6 rounded-2xl shadow-sm border border-slate-700/50" }, [
						m("h2", { class: "text-lg font-semibold mb-4 text-slate-200" }, "User Engagement"),
						m("div", { class: "space-y-4" }, [
							m("div", { class: "flex justify-between items-center" }, [
								m("span", { class: "text-sm text-slate-400" }, "Active Users"),
								m("span", { class: "font-mono font-bold text-green-400" }, "1,284"),
							]),
							m("div", { class: "flex justify-between items-center" }, [
								m("span", { class: "text-sm text-slate-400" }, "New Signups"),
								m("span", { class: "font-mono font-bold text-blue-400" }, "+42"),
							]),
							m("div", { class: "flex justify-between items-center" }, [
								m("span", { class: "text-sm text-slate-400" }, "Bounce Rate"),
								m("span", { class: "font-mono font-bold text-red-400" }, "24.5%"),
							]),
						]),
					]),
				]),
			]),
		]);
	},
};

export default Page;
