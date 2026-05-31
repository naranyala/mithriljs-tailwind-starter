import m, { Vnode, Component } from "mithril";
import { signal, computed, effect } from "@preact/signals";
import mitt from "mitt";

const bus = mitt();
const count = signal(0);

bus.on("counter:increment", () => count.value++);
bus.on("counter:decrement", () => count.value--);

interface ButtonAttrs {
	label?: string;
	onclick?: () => void;
}

const Button: Component<ButtonAttrs> = {
	view(vnode: Vnode<ButtonAttrs>): Vnode {
		const { label, onclick } = vnode.attrs;
		return m("button", {
			onclick: onclick,
			class: "m-2 p-2 rounded-xl bg-blue-400 hover:bg-blue-500 text-white"
		}, label ?? "sample");
	},
};

const Counter: Component = {
	view(): Vnode {
		const doubled = computed(() => count.value * 2);

		effect(() => {
			console.log(`${count.value} - ${doubled.value}`);
		});

		return m("div", { class: "grid justify-center items-center text-center m-4 p-4" }, [
			m("h2", { class: "my-8 text-4xl font-bold" }, `${count.value} /// ${doubled.value}`),

			m("div", [
				m(Button, { label: "➖", onclick: () => bus.emit("counter:decrement") }),
				m(Button, { label: "➕", onclick: () => bus.emit("counter:increment") }),
			]),
		]);
	},
};

export default Counter;
