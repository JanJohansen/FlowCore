<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as monaco from 'monaco-editor'

const props = defineProps<{
  value: string
  language: string
  options?: any
}>()

const emit = defineEmits<{
  (e: 'update:value', value: string): void
}>()

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!editorContainer.value) return
  
  // Create the editor
  editor = monaco.editor.create(editorContainer.value, {
    value: props.value,
    language: props.language,
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    ...props.options
  })
  
  // Listen for changes
  editor.onDidChangeModelContent(() => {
    if (editor) {
      const value = editor.getValue()
      emit('update:value', value)
    }
  })
})

// Update editor when value prop changes
watch(() => props.value, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue)
  }
})

// Update language when it changes
watch(() => props.language, (newLanguage) => {
  if (editor) {
    monaco.editor.setModelLanguage(editor.getModel()!, newLanguage)
  }
})

// Clean up
onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
    editor = null
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