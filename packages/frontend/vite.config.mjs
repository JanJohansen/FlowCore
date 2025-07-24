import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from "path"
import monacoEditorEsmPlugin from "vite-plugin-monaco-editor-esm"

export default defineConfig({
	plugins: [vue(), monacoEditorEsmPlugin()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src/"),
			"@webapp/backend": path.resolve(__dirname, "../backend/src/core/coreDB/client/index.ts"),
			"@webapp/backend/types": path.resolve(__dirname, "../backend/src/types.ts"),
			"@webapp/extensions": path.resolve(__dirname, "../extensions/")
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
