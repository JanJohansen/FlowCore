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
			"@": path.resolve(__dirname, "./src/"),
			"@webapp/backend": path.resolve(__dirname, "../backend/src/core/coreDB/client/index.ts"),
			"@webapp/backend/types": path.resolve(__dirname, "../backend/src/types.ts"),
			"@webapp/backend/": path.resolve(__dirname, "../backend/"),
			"@webapp/backend/src": path.resolve(__dirname, "../backend/src/"),
			"@webapp/extensions": path.resolve(__dirname, "../extensions/"),

			// Specific aliases for extension components and nodes
			"@webapp/extensions/singleFolderTest/nodes": path.resolve(
				__dirname,
				"../extensions/singleFolderTest/nodes/"
			),
			"@webapp/extensions/dk.johansenweb.core/frontend/src": path.resolve(
				__dirname,
				"../extensions/dk.johansenweb.core/frontend/src/"
			),

			// Generic wildcard for other extension files
			"@webapp/extensions/": path.resolve(__dirname, "../extensions/"),

			// Generic alias for importing frontend stuff included from extensions!
			"@webapp/frontend/": path.resolve(__dirname, "../frontend/"),
			"@webapp/frontend": path.resolve(__dirname, "./"),
			"@webapp/frontend/src": path.resolve(__dirname, "./src/")
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
