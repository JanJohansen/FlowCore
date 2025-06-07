<template>
	<PageLayout>
		<template #header>
			<div class="header-content">
				<h1>Vue Component Editor</h1>
				<div class="editor-actions">
					<button class="action-button" @click="saveComponent" :disabled="!currentComponentName">
						<i class="fa fa-save"></i>
						Save
					</button>
					<button class="action-button" @click="compileAndPreview" :disabled="!editorValue">
						<i class="fa fa-play"></i>
						Compile & Preview
					</button>
					<button class="action-button" @click="newComponent">
						<i class="fa fa-plus"></i>
						New
					</button>
				</div>
			</div>
		</template>

		<div class="component-editor">
			<!-- Component List Panel -->
			<div class="component-list-panel">
				<ComponentList
					:components="savedComponents"
					:selected-component="currentComponentName"
					@component-selected="loadComponent"
					@component-deleted="deleteComponent"
					@component-duplicated="duplicateComponent"
				/>
			</div>

			<!-- Editor Panel -->
			<div class="editor-panel">
				<div class="editor-header">
					<input
						v-model="currentComponentName"
						placeholder="Component Name"
						class="component-name-input"
						@input="onComponentNameChange"
					/>
					<div class="editor-tabs">
						<button class="tab-button active" title="Vue Single File Component Editor">Vue SFC</button>
					</div>
				</div>
				<div class="editor-container">
					<MonacoEditor v-model:value="editorValue" language="html" :options="editorOptions" />
				</div>
			</div>

			<!-- Preview Panel -->
			<div class="preview-panel">
				<div class="preview-header">
					<h3>Live Preview</h3>
					<div class="compilation-status" :class="compilationStatus.type">
						{{ compilationStatus.message }}
					</div>
				</div>
				<div class="preview-container">
					<div v-if="compilationError" class="error-display">
						<h4>Compilation Error:</h4>
						<pre>{{ compilationError }}</pre>
					</div>
					<div v-else-if="compiledComponent" class="component-preview">
						<component :is="compiledComponent" />
					</div>
					<div v-else class="preview-placeholder">
						<p>Click "Compile & Preview" to see your component</p>
					</div>
				</div>
			</div>
		</div>
	</PageLayout>
</template>

<script setup lang="ts">
	import { ref, onMounted, computed } from "vue"
	import * as Vue from "vue"
	import type { SFCParseResult } from "@vue/compiler-sfc"
	import type { CompileOptions } from "@vue/compiler-dom"
	import { parse } from "@vue/compiler-sfc"
	import { compile } from "@vue/compiler-dom"
	import PageLayout from "../components/PageLayout.vue"
	import MonacoEditor from "../components/MonacoEditor.vue"
	import ComponentList from "../components/ComponentEditor/ComponentList.vue"

	// Reactive state
	const editorValue = ref("")
	const currentComponentName = ref("")
	const savedComponents = ref<Record<string, string>>({})
	const compiledComponent = ref<any>(null)
	const compilationError = ref("")
	const compilationStatus = ref({ type: "idle", message: "Ready" })

	// Monaco editor options
	const editorOptions = {
		theme: "vs-dark",
		automaticLayout: true,
		minimap: { enabled: false },
		scrollBeyondLastLine: false,
		fontSize: 14,
		tabSize: 2,
		wordWrap: "on",
		lineNumbers: "on",
		folding: true,
		bracketMatching: "always"
	}

	// Default Vue SFC template
	const defaultTemplate =
		`<template>
  <div class="custom-component">
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
    <button @click="handleClick">Click me!</button>
  </div>
</template>

<scr` +
		`ipt setup lang="ts">
import { ref } from 'vue'

const title = ref('My Custom Component')
const message = ref('This is a custom Vue component created in the editor.')

const handleClick = () => {
  message.value = 'Button was clicked at ' + new Date().toLocaleTimeString()
}
</scr` +
		`ipt>

<style scoped>
.custom-component {
  padding: 20px;
  border: 2px solid #42b883;
  border-radius: 8px;
  background: #f9f9f9;
  color: #333;
}

.custom-component h3 {
  color: #42b883;
  margin-bottom: 10px;
}

.custom-component button {
  background: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.custom-component button:hover {
  background: #369870;
}
</style>`

	// Initialize with default template
	onMounted(() => {
		loadSavedComponents()
		if (!editorValue.value) {
			editorValue.value = defaultTemplate
		}
	})

	// Load saved components from localStorage
	const loadSavedComponents = () => {
		const saved = localStorage.getItem("vue-component-editor-components")
		if (saved) {
			try {
				savedComponents.value = JSON.parse(saved)
			} catch (error) {
				console.error("Failed to load saved components:", error)
			}
		}
	}

	// Save component to localStorage
	const saveComponent = () => {
		if (!currentComponentName.value.trim()) {
			alert("Please enter a component name")
			return
		}

		savedComponents.value[currentComponentName.value] = editorValue.value
		localStorage.setItem("vue-component-editor-components", JSON.stringify(savedComponents.value))

		compilationStatus.value = { type: "success", message: "Component saved successfully" }
		setTimeout(() => {
			compilationStatus.value = { type: "idle", message: "Ready" }
		}, 2000)
	}

	// Load component from saved list
	const loadComponent = (componentName: string) => {
		if (savedComponents.value[componentName]) {
			currentComponentName.value = componentName
			editorValue.value = savedComponents.value[componentName]
			compiledComponent.value = null
			compilationError.value = ""
		}
	}

	// Delete component
	const deleteComponent = (componentName: string) => {
		if (confirm(`Are you sure you want to delete "${componentName}"?`)) {
			delete savedComponents.value[componentName]
			localStorage.setItem("vue-component-editor-components", JSON.stringify(savedComponents.value))

			if (currentComponentName.value === componentName) {
				currentComponentName.value = ""
				editorValue.value = defaultTemplate
				compiledComponent.value = null
				compilationError.value = ""
			}
		}
	}

	// Duplicate component
	const duplicateComponent = (originalName: string, newName: string) => {
		if (savedComponents.value[originalName] && !savedComponents.value[newName]) {
			savedComponents.value[newName] = savedComponents.value[originalName]
			localStorage.setItem("vue-component-editor-components", JSON.stringify(savedComponents.value))

			// Load the duplicated component
			loadComponent(newName)
		}
	}

	// Create new component
	const newComponent = () => {
		currentComponentName.value = ""
		editorValue.value = defaultTemplate
		compiledComponent.value = null
		compilationError.value = ""
	}

	// Handle component name change
	const onComponentNameChange = () => {
		// Auto-save when name changes and component exists
		if (currentComponentName.value && savedComponents.value[currentComponentName.value]) {
			savedComponents.value[currentComponentName.value] = editorValue.value
			localStorage.setItem("vue-component-editor-components", JSON.stringify(savedComponents.value))
		}
	}

	// Compile and preview component
	const compileAndPreview = async () => {
		if (!editorValue.value.trim()) {
			compilationError.value = "No code to compile"
			return
		}

		try {
			compilationStatus.value = { type: "loading", message: "Compiling..." }
			compilationError.value = ""

			// Parse and compile the SFC
			const parsed: SFCParseResult = parse(editorValue.value, {
				filename: "component.vue",
				sourceMap: false
			})

			let descriptor
			if (parsed.descriptor) {
				descriptor = parsed.descriptor
			} else {
				throw new Error("Failed to parse Vue SFC")
			}

			if (!descriptor.template) {
				throw new Error("Component must have a template block")
			}

			// Compile template
			const templateResult = compile(descriptor.template.content, {
				mode: "module"
			})

			if (templateResult.errors.length > 0) {
				throw new Error("Template compilation errors: " + templateResult.errors.join(", "))
			}

			// Extract script content
			let scriptContent = ""
			if (descriptor.scriptSetup) {
				// For script setup, we need to handle it differently
				scriptContent = descriptor.scriptSetup.content
			} else if (descriptor.script) {
				scriptContent = descriptor.script.content
			}

			// Create a simple component definition for preview
			// This is a simplified approach - in a real implementation you'd want more sophisticated compilation
			const componentDefinition = {
				template: descriptor.template.content,
				setup() {
					// Import Vue functions that might be used in the script
					const { ref, computed, onMounted, reactive, watch } = Vue

					// Execute the script content in a safe context
					try {
						// Create a function that returns the setup function result
						const setupFunction = new Function(
							"ref",
							"computed",
							"onMounted",
							"reactive",
							"watch",
							"Vue",
							`
						${scriptContent}

						// Return all the variables and functions that should be available in the template
						return {
							title: typeof title !== 'undefined' ? title : ref('Default Title'),
							message: typeof message !== 'undefined' ? message : ref('Default Message'),
							handleClick: typeof handleClick !== 'undefined' ? handleClick : () => console.log('Click handler')
						}
					`
						)

						return setupFunction(ref, computed, onMounted, reactive, watch, Vue)
					} catch (error) {
						console.error("Script execution error:", error)
						return {
							title: ref("Script Error"),
							message: ref("Error in component script: " + error.message),
							handleClick: () => console.log("Error handler")
						}
					}
				}
			}

			compiledComponent.value = componentDefinition
			compilationStatus.value = { type: "success", message: "Compilation successful" }
		} catch (error) {
			compilationError.value = (error as Error)?.message ?? String(error)
			compilationStatus.value = { type: "error", message: "Compilation failed" }
			compiledComponent.value = null
		}
	}
</script>

<style scoped>
	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0 1rem;
	}

	.editor-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-button {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.action-button:hover:not(:disabled) {
		background: var(--bg-primary);
	}

	.action-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.component-editor {
		display: flex;
		height: 100%;
		gap: 1px;
		background: var(--border-color);
	}

	.component-list-panel {
		width: 250px;
		background: var(--bg-secondary);
		border-right: 1px solid var(--border-color);
	}

	.editor-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
	}

	.preview-panel {
		width: 400px;
		background: var(--bg-secondary);
		border-left: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
	}

	.editor-header {
		display: flex;
		align-items: center;
		padding: 0.5rem;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		gap: 1rem;
	}

	.component-name-input {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
		min-width: 200px;
	}

	.editor-tabs {
		display: flex;
		gap: 2px;
	}

	.tab-button {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.25rem 0.75rem;
		border-radius: 4px 4px 0 0;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.tab-button.active {
		background: var(--bg-secondary);
		border-bottom-color: var(--bg-secondary);
	}

	.editor-container {
		flex: 1;
		overflow: hidden;
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		background: var(--bg-primary);
		border-bottom: 1px solid var(--border-color);
	}

	.preview-header h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--text-primary);
	}

	.compilation-status {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 500;
	}

	.compilation-status.idle {
		background: var(--bg-secondary);
		color: var(--text-secondary);
	}

	.compilation-status.loading {
		background: var(--info-color);
		color: white;
	}

	.compilation-status.success {
		background: var(--success-color);
		color: white;
	}

	.compilation-status.error {
		background: var(--error-color);
		color: white;
	}

	.preview-container {
		flex: 1;
		padding: 1rem;
		overflow: auto;
	}

	.error-display {
		color: var(--error-color);
	}

	.error-display h4 {
		margin-bottom: 0.5rem;
	}

	.error-display pre {
		background: var(--bg-primary);
		padding: 1rem;
		border-radius: 4px;
		border: 1px solid var(--error-color);
		white-space: pre-wrap;
		font-size: 0.875rem;
	}

	.component-preview {
		border: 1px solid var(--border-color);
		border-radius: 4px;
		padding: 1rem;
		background: white;
		min-height: 200px;
	}

	.preview-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 200px;
		color: var(--text-secondary);
		font-style: italic;
	}
</style>
