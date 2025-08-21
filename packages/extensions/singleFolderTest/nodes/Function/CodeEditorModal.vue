<template>
	<Teleport to="body">
		<div class="modal-overlay">
			<div class="modal-container">
				<div class="modal-header">
					<!-- Heading removed per request; close button remains -->
					<button class="close-button" @click="$emit('close')">×</button>
				</div>

				<div class="modal-body">
					<div class="side-tabs">
						<div class="tabs-vertical">
							<button
								v-for="tab in tabs"
								:key="tab.id"
								:class="['tab-button-vertical', { active: activeTab === tab.id }]"
								@click="activeTab = tab.id"
							>
								{{ tab.label }}
							</button>
						</div>
						<div class="tab-content">
							<!-- Configuration Tab -->
							<div v-show="activeTab === 'config'" class="config-editor">
								<div class="config-label">Node Definition (JSON/object)</div>
								<div class="editor-container" style="height: 300px">
									<MonacoEditor v-model:value="localDefinitionCode" language="json" :options="{}" />
								</div>
							</div>

							<!-- Backend Code Editor -->
							<div v-show="activeTab === 'backend'" class="editor-container">
								<MonacoEditor v-model:value="localBackendCode" language="javascript" :options="{}" />
							</div>
						</div>
					</div>
				</div>

				<div class="modal-footer">
					<button class="cancel-btn" @click="$emit('close')">Cancel</button>
					<button class="save-btn" @click="saveChanges">Save Changes</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue"
	import { MonacoEditor } from "../../../frontend-types"

	const props = defineProps<{
		displayName: string
		backendCode: string
		nodeDefinition?: Record<string, any>
	}>()

	const emit = defineEmits<{
		(e: "close"): void
		(
			e: "save",
			data: {
				displayName: string
				backendCode: string
				nodeDefinition: Record<string, any>
			}
		): void
	}>()

	// Local state
	const localDisplayName = ref(props.displayName || "Function")
	const localBackendCode = ref(props.backendCode || getDefaultBackendCode())
	const localDefinitionCode = ref<string>(
		props.nodeDefinition ? JSON.stringify(props.nodeDefinition, null, 2) : getDefaultDefinitionCode()
	)

	// Editor tabs
	const activeTab = ref("config")
	const tabs = [
		{ id: "config", label: "Configuration" },
		{ id: "backend", label: "Backend Code" }
	]

	// Monaco editor options
	const editorOptions = {
		theme: "vs-dark",
		automaticLayout: true,
		minimap: { enabled: false },
		scrollBeyondLastLine: false,
		fontSize: 14,
		tabSize: 2
	}

	onMounted(() => {
		// nothing extra right now
	})

	// Save all changes
	function saveChanges() {
		let parsedDefinition: Record<string, any> | null = null
		try {
			parsedDefinition = JSON.parse(localDefinitionCode.value)
		} catch (err: any) {
			// Allow simple TS-like export-less object as fallback by attempting eval-safe parsing
			try {
				// eslint-disable-next-line no-new-func
				const fn = new Function("return (" + localDefinitionCode.value + ")")
				parsedDefinition = fn()
			} catch (err2) {
				window.alert("Definition is not valid JSON or object literal. Please fix and try again.")
				return
			}
		}

		emit("save", {
			displayName: localDisplayName.value,
			backendCode: localBackendCode.value,
			nodeDefinition: parsedDefinition!
		})
	}

	// Default code templates
	function getDefaultBackendCode() {
		return `// Function Node Backend Code\n// Write JavaScript that runs on the backend for this node.\n// You can export setup/cleanup via returning an object: { setup, cleanup } if needed.\n// Example: process an input and set an output when available.\n`
	}

	function getDefaultDefinitionCode() {
		const def = {
			displayName: "UserFunction",
			ins: {},
			outs: {},
			description:
				"User defined function node, defined by backend script and front end IO configuration (this json).",
			typeUID: "com.flow.userfunction_1234",
			category: "Basic",
			version: "1.0.0",
			author: "Jan Johansen",
			company: "JJ inc.",
			license: "MIT"
		}
		return JSON.stringify(def, null, 2)
	}
</script>

<style scoped>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 1000;
	}

	.modal-container {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		margin: 20px;
		background: #1e1e1e;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		background: #252526;
		border-bottom: 1px solid #333;
	}

	.modal-header h3 {
		margin: 0;
		color: #e0e0e0;
		flex: 1;
	}

	/* Layout for body with left-side vertical tabs */
	.side-tabs {
		display: flex;
		height: 100%;
	}

	.tabs-vertical {
		width: 160px;
		background: #252526;
		border-right: 1px solid #333;
		display: flex;
		flex-direction: column;
		padding: 8px;
		gap: 6px;
	}

	.tab-button-vertical {
		background: transparent;
		border: none;
		color: #ccc;
		text-align: left;
		padding: 8px 12px;
		border-radius: 4px;
		cursor: pointer;
	}

	.tab-button-vertical.active {
		background: #1e1e1e;
		color: #fff;
		border-left: 3px solid #0078d4;
	}

	.tab-content {
		flex: 1;
		overflow: hidden;
		padding: 12px;
	}

	.close-button {
		background: none;
		border: none;
		color: #ccc;
		font-size: 24px;
		cursor: pointer;
	}

	.modal-body {
		flex: 1;
		overflow: hidden;
		position: relative;
	}

	.editor-container {
		height: 100%;
		width: 100%;
	}

	.config-editor {
		height: 100%;
		overflow-y: auto;
		padding: 16px;
	}

	.config-section {
		background: #252526;
		border-radius: 4px;
		padding: 16px;
		margin-bottom: 16px;
	}

	.config-label {
		color: #e0e0e0;
		font-weight: bold;
		margin-bottom: 8px;
	}

	.config-input {
		width: 100%;
		background: #333;
		border: 1px solid #444;
		color: #fff;
		padding: 8px;
		border-radius: 4px;
		font-size: 14px;
	}

	.config-description {
		color: #a0a0a0;
		font-size: 12px;
		margin: 4px 0 0 0;
	}

	.definitions-editor {
		height: 100%;
		overflow-y: auto;
		padding: 16px;
	}

	.definition-item {
		background: #252526;
		border-radius: 4px;
		padding: 12px;
		margin-bottom: 12px;
	}

	.definition-header {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}

	.name-input {
		flex: 1;
		background: #333;
		border: 1px solid #444;
		color: #fff;
		padding: 6px;
		border-radius: 4px;
	}

	.type-select {
		width: 100px;
		background: #333;
		border: 1px solid #444;
		color: #fff;
		padding: 6px;
		border-radius: 4px;
	}

	.description-input {
		width: 100%;
		background: #333;
		border: 1px solid #444;
		color: #fff;
		padding: 6px;
		border-radius: 4px;
	}

	.remove-btn {
		background: #c53030;
		color: white;
		border: none;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.add-btn {
		background: #2c5282;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 8px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		padding: 12px 16px;
		background: #252526;
		border-top: 1px solid #333;
		gap: 8px;
	}

	.cancel-btn {
		background: #4a5568;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
	}

	.save-btn {
		background: #2c5282;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
	}
</style>
