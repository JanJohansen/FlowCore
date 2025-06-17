<script setup lang="ts">
	import { onUnmounted, onMounted, ref, watch, toValue, watchEffect } from "vue"
	import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api"

	let editor: Monaco.editor.IStandaloneCodeEditor
	let monaco: typeof Monaco
	let manocaEditorRef = ref(null)
	let codeModel: Monaco.editor.ITextModel
	let libModel: Monaco.editor.ITextModel

    const props = defineProps<{
		sources:  {originalCode: string, lib: string, editedCode: string}
	}>()

	onMounted(async () => {
		// Import our 'monaco.ts' file here
		monaco = (await import("./monaco")).default

		codeModel = monaco.editor.createModel("", "typescript")
		codeModel.setValue(props.sources.originalCode)
		codeModel.onDidChangeContent((e: Monaco.editor.IModelContentChangedEvent)=>{
			props.sources.editedCode = codeModel.getValue()
		})

		// extra libraries -------------------------------------
		var libUri = "ts:filename/facts.d.ts"
		monaco.languages.typescript.javascriptDefaults.addExtraLib("", libUri)
		// When resolving definitions and references, the editor will try to use created models.
		// Creating a model for the library allows "peek definition/references" commands to work with the library.
        libModel = monaco.editor.createModel("", 'typescript', monaco.Uri.parse(libUri));
		libModel.setValue(props.sources.lib)

		// Create editor and show it!
		const editor = monaco.editor.create(manocaEditorRef.value!, {
			language: "javascript",
			theme: "hc-black", //"vs-dark"
			automaticLayout: true
		})

        editor.setModel(codeModel)

		watchEffect(()=>{
			codeModel.setValue(props.sources.originalCode)
			libModel.setValue(props.sources.lib)
		})
	})

	// watch(props.sources, ()=>{
	// 	codeModel.setValue(props.sources.originalCode)
	// 	libModel.setValue(props.sources.lib)
	// })
	
	onUnmounted(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose())
		editor?.dispose()
	})
</script>

<template>
	<div ref="manocaEditorRef" class="monaco-editor" />
</template>

<style scoped>
	.monaco-editor {
		width: 100%;
		height: 100%;
	}
</style>
