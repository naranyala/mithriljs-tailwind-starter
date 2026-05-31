import m, { Vnode, Component } from "mithril";
import Layout from "@/layouts/default";
import Menu from "@/lib/Menu";

interface MenuItem {
	title: string;
	description: string;
	icon: string;
	route: string;
}

const APP_MENU: MenuItem[] = [
	{
		title: "Home Dashboard",
		description: "Overview of your application activities.",
		icon: "🏠",
		route: "/",
	},
	{
		title: "Analytics View",
		description: "Explore detailed usage statistics.",
		icon: "📊",
		route: "/another-route",
	},
	{
		title: "Settings",
		description: "Configure your application preferences.",
		icon: "⚙️",
		route: "/settings",
	},
	{
		title: "User Profiles",
		description: "Manage and view user information.",
		icon: "👤",
		route: "/users",
	},
	{
		title: "Messages",
		description: "Check your incoming notifications.",
		icon: "✉️",
		route: "/messages",
	},
	{
		title: "Help Center",
		description: "Find answers to common questions.",
		icon: "❓",
		route: "/help",
	},
];

interface PageAttrs {}

const Page: Component<PageAttrs> = {
	view(): Vnode {
		return m(Layout, null, [
			m(Menu, { items: APP_MENU }),
		]);
	},
};

export default Page;
