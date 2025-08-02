import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"
import monacoEditorEsmPlugin from "vite-plugin-monaco-editor-esm"

export default defineConfig({
	plugins: [
		vue({
			// Allow Vue files from extensions to be processed
			include: [/\.vue$/, /\.vue\?vue/]
		}),
		monacoEditorEsmPlugin()
	],
	resolve: {
		alias: {
			"@webapp/frontend": path.resolve(__dirname, "../frontend/src"),
			"@webapp/backend": path.resolve(__dirname, "../backend/src"),
			"@webapp/extensions": path.resolve(__dirname, "../extensions") // No src folder!
		}
	},
	optimizeDeps: {
		// Include extension directories for dependency optimization
		include: [
			// Add any common dependencies used in extensions
			"vue",
			"@webapp/backend",
			"@webapp/backend/types"
		],
		// Exclude extension directories from pre-bundling to allow dynamic imports
		exclude: ["@webapp/extensions"]
	},
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:3000",
				changeOrigin: true
			}
		}
	}
})
