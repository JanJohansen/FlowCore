import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"
import monacoEditorEsmPlugin from "vite-plugin-monaco-editor-esm"

export default defineConfig({
	plugins: [vue(), monacoEditorEsmPlugin()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src/"),
			"@webapp/common": path.resolve(__dirname, "../common/src/index.ts")
		}
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
