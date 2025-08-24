<template>
	<div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script setup lang="ts">
	import { ref, onMounted, onBeforeUnmount, watch } from "vue"
	import * as monaco from "monaco-editor"

	const props = defineProps<{
		value: string
		language: string
		options?: any
		extraLib?: string // TypeScript declaration content to enhance intellisense/type-checking
		fontSize?: number // Optional initial font size, can be updated reactively
	}>()

	const emit = defineEmits<{
		(e: "update:value", value: string): void
	}>()

	const editorContainer = ref<HTMLElement | null>(null)
	let editor: monaco.editor.IStandaloneCodeEditor | null = null

	// Keep a model and disposables for the extra lib so peek/defs work and we can clean up
	let extraLibModel: monaco.editor.ITextModel | null = null
	let extraLibDisposables: monaco.IDisposable[] = []
	const extraLibUri = monaco.Uri.parse("ts:flowcore/extraLib.d.ts")

	// Initialize JS/TS diagnostics and compiler options once
	let defaultsInitialized = false
	function ensureMonacoDefaults() {
		if (defaultsInitialized) return
		// Enable diagnostics for both JS and TS
		monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: false,
			noSyntaxValidation: false
		})
		monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: false,
			noSyntaxValidation: false
		})
		// Basic compiler options – enable type checking for JS
		monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
			checkJs: true,
			allowJs: true,
			allowNonTsExtensions: true,
			target: monaco.languages.typescript.ScriptTarget.ES2020,
			module: monaco.languages.typescript.ModuleKind.ESNext
		})
		// TS compiler options kept minimal to avoid surprising strictness
		monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
			allowJs: true,
			allowNonTsExtensions: true,
			target: monaco.languages.typescript.ScriptTarget.ES2020,
			module: monaco.languages.typescript.ModuleKind.ESNext
		})
		defaultsInitialized = true
	}

	onMounted(() => {
		if (!editorContainer.value) return

		// Ensure global defaults are set for diagnostics
		ensureMonacoDefaults()

		// Register extra lib (if provided) before creating the editor so language service is ready
		if (props.extraLib != null) {
			// Add to both JS and TS defaults to cover either language
			extraLibDisposables.push(
				monaco.languages.typescript.javascriptDefaults.addExtraLib(props.extraLib, extraLibUri.toString())
			)
			extraLibDisposables.push(
				monaco.languages.typescript.typescriptDefaults.addExtraLib(props.extraLib, extraLibUri.toString())
			)
			// Create a model for better navigation (peek definition, references)
			extraLibModel = monaco.editor.createModel(props.extraLib, "typescript", extraLibUri)
		}

		// Create the editor
		editor = monaco.editor.create(editorContainer.value, {
			value: props.value,
			language: props.language,
			theme: "vs-dark",
			automaticLayout: true,
			minimap: { enabled: false },
			scrollBeyondLastLine: false,
			mouseWheelZoom: true,
			fontSize: typeof props.fontSize === "number" ? props.fontSize : 14,
			...props.options
		})

		// Listen for changes
		editor.onDidChangeModelContent(() => {
			if (editor) {
				const value = editor.getValue()
				emit("update:value", value)
			}
		})
	})

	// Update editor when value prop changes
	watch(
		() => props.value,
		(newValue) => {
			if (editor && newValue !== editor.getValue()) {
				editor.setValue(newValue)
			}
		}
	)

	// Update language when it changes
	watch(
		() => props.language,
		(newLanguage) => {
			if (editor) {
				monaco.editor.setModelLanguage(editor.getModel()!, newLanguage)
			}
		}
	)

	// Zoom helpers
	function clamp(n: number, min: number, max: number) {
		return Math.min(max, Math.max(min, n))
	}

	function setFontSize(size: number) {
		if (!editor) return
		const next = clamp(size, 8, 48)
		editor.updateOptions({ fontSize: next })
	}

	function getFontSize(): number | null {
		if (!editor) return null
		// Prefer reading current option if available
		try {
			return editor.getOption?.(monaco.editor.EditorOption.fontSize) as unknown as number
		} catch {
			return null
		}
	}

	// React to external fontSize prop changes
	watch(
		() => props.fontSize,
		(newSize) => {
			if (typeof newSize === "number") setFontSize(newSize)
		}
	)

	// React to extraLib changes dynamically
	watch(
		() => props.extraLib,
		(newLib) => {
			// Dispose previous registrations
			extraLibDisposables.forEach((d) => d.dispose())
			extraLibDisposables = []
			if (extraLibModel) {
				extraLibModel.dispose()
				extraLibModel = null
			}

			if (newLib != null) {
				// Re-register for both JS and TS
				extraLibDisposables.push(
					monaco.languages.typescript.javascriptDefaults.addExtraLib(newLib, extraLibUri.toString())
				)
				extraLibDisposables.push(
					monaco.languages.typescript.typescriptDefaults.addExtraLib(newLib, extraLibUri.toString())
				)
				extraLibModel = monaco.editor.createModel(newLib, "typescript", extraLibUri)
			}
		},
		{ immediate: false }
	)

	// Clean up
	onBeforeUnmount(() => {
		if (editor) {
			editor.dispose()
			editor = null
		}
		// Clean up extra libs/models
		extraLibDisposables.forEach((d) => d.dispose())
		extraLibDisposables = []
		if (extraLibModel) {
			extraLibModel.dispose()
			extraLibModel = null
		}
	})
</script>

<style scoped>
	.monaco-editor-container {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
