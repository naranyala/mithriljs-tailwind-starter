import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

import { viteSingleFile } from 'vite-plugin-singlefile'

import path from "node:path";

export default defineConfig({
	plugins: [tailwindcss(), viteSingleFile()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
