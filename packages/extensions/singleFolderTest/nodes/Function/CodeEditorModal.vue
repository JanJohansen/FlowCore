<template>
	<Teleport to="body">
		<div class="modal-overlay">
			<div class="modal-container">
				<div class="modal-header">
					<h3>Function Node Editor</h3>
					<div class="tabs">
						<button
							v-for="tab in tabs"
							:key="tab.id"
							:class="['tab-button', { active: activeTab === tab.id }]"
							@click="activeTab = tab.id"
						>
							{{ tab.label }}
						</button>
					</div>
					<button class="close-button" @click="$emit('close')">×</button>
				</div>

				<div class="modal-body">
					<!-- Configuration Tab -->
					<div v-show="activeTab === 'config'" class="config-editor">
						<div class="config-section">
							<label class="config-label">Display Name</label>
							<input v-model="localDisplayName" placeholder="Function" class="config-input" />
							<p class="config-description">The name displayed in the node header</p>
						</div>
					</div>

					<!-- Backend Code Editor -->
					<div v-show="activeTab === 'backend'" class="editor-container">
						<MonacoEditor v-model:value="localBackendCode" language="javascript" :options="editorOptions" />
					</div>

					<!-- UI Code Editor -->
					<div v-show="activeTab === 'ui'" class="editor-container">
						<MonacoEditor v-model:value="localUICode" language="javascript" :options="editorOptions" />
					</div>

					<!-- Input Definitions Editor -->
					<div v-show="activeTab === 'inputs'" class="definitions-editor">
						<div v-for="(input, key) in localInputDefs" :key="key" class="definition-item">
							<div class="definition-header">
								<input v-model="input.name" placeholder="Input Name" class="name-input" />
								<select v-model="input.valueType" class="type-select">
									<option value="any">any</option>
									<option value="string">string</option>
									<option value="number">number</option>
									<option value="boolean">boolean</option>
									<option value="object">object</option>
								</select>
								<button @click="removeInput(key)" class="remove-btn">×</button>
							</div>
							<input v-model="input.description" placeholder="Description" class="description-input" />
						</div>
						<button @click="addInput" class="add-btn">+ Add Input</button>
					</div>

					<!-- Output Definitions Editor -->
					<div v-show="activeTab === 'outputs'" class="definitions-editor">
						<div v-for="(output, key) in localOutputDefs" :key="key" class="definition-item">
							<div class="definition-header">
								<input v-model="output.name" placeholder="Output Name" class="name-input" />
								<select v-model="output.valueType" class="type-select">
									<option value="any">any</option>
									<option value="string">string</option>
									<option value="number">number</option>
									<option value="boolean">boolean</option>
									<option value="object">object</option>
								</select>
								<button @click="removeOutput(key)" class="remove-btn">×</button>
							</div>
							<input v-model="output.description" placeholder="Description" class="description-input" />
						</div>
						<button @click="addOutput" class="add-btn">+ Add Output</button>
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
	import { ref, computed, onMounted } from "vue"
	import { MonacoEditor } from "../../../frontend-types"

	const props = defineProps<{
		displayName: string
		backendCode: string
		uiCode: string
		inputDefinitions: Record<string, any>
		outputDefinitions: Record<string, any>
	}>()

	const emit = defineEmits<{
		(e: "close"): void
		(
			e: "save",
			data: {
				displayName: string
				backendCode: string
				uiCode: string
				inputDefs: Record<string, any>
				outputDefs: Record<string, any>
			}
		): void
	}>()

	// Local state
	const localDisplayName = ref(props.displayName || "Function")
	const localBackendCode = ref(props.backendCode || getDefaultBackendCode())
	const localUICode = ref(props.uiCode || getDefaultUICode())
	const localInputDefs = ref<Record<string, any>>({})
	const localOutputDefs = ref<Record<string, any>>({})

	// Editor tabs
	const activeTab = ref("config")
	const tabs = [
		{ id: "config", label: "Configuration" },
		{ id: "backend", label: "Backend Code" },
		{ id: "ui", label: "UI Code" },
		{ id: "inputs", label: "Inputs" },
		{ id: "outputs", label: "Outputs" }
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

	// Initialize input and output definitions
	onMounted(() => {
		// Convert input definitions to our format
		if (props.inputDefinitions) {
			Object.entries(props.inputDefinitions).forEach(([key, value]) => {
				localInputDefs.value[key] = {
					name: key,
					valueType: value.valueType || "any",
					description: value.description || ""
				}
			})
		}

		// If no inputs, add a default one
		if (Object.keys(localInputDefs.value).length === 0) {
			addInput()
		}

		// Convert output definitions to our format
		if (props.outputDefinitions) {
			Object.entries(props.outputDefinitions).forEach(([key, value]) => {
				localOutputDefs.value[key] = {
					name: key,
					valueType: value.valueType || "any",
					description: value.description || ""
				}
			})
		}

		// If no outputs, add a default one
		if (Object.keys(localOutputDefs.value).length === 0) {
			addOutput()
		}
	})

	// Input/Output management
	function addInput() {
		const newKey = `input${Object.keys(localInputDefs.value).length + 1}`
		localInputDefs.value[newKey] = {
			name: newKey,
			valueType: "any",
			description: "Input description"
		}
	}

	function removeInput(key: string) {
		delete localInputDefs.value[key]
	}

	function addOutput() {
		const newKey = `output${Object.keys(localOutputDefs.value).length + 1}`
		localOutputDefs.value[newKey] = {
			name: newKey,
			valueType: "any",
			description: "Output description"
		}
	}

	function removeOutput(key: string) {
		delete localOutputDefs.value[key]
	}

	// Save all changes
	function saveChanges() {
		// Convert input definitions back to the expected format
		const formattedInputDefs: Record<string, any> = {}
		Object.values(localInputDefs.value).forEach((input) => {
			formattedInputDefs[input.name] = {
				valueType: input.valueType,
				description: input.description
			}
		})

		// Convert output definitions back to the expected format
		const formattedOutputDefs: Record<string, any> = {}
		Object.values(localOutputDefs.value).forEach((output) => {
			formattedOutputDefs[output.name] = {
				valueType: output.valueType,
				description: output.description
			}
		})

		emit("save", {
			displayName: localDisplayName.value,
			backendCode: localBackendCode.value,
			uiCode: localUICode.value,
			inputDefs: formattedInputDefs,
			outputDefs: formattedOutputDefs
		})
	}

	// Default code templates
	function getDefaultBackendCode() {
		return `// Function Node Backend Code
// Available parameters:
// - context: Enhanced context object with node, flow, global, nodeType storage
// - helpers: Helper functions for input/output operations and state management

// Context object structure:
// context.node.id - Node ID
// context.node.type - Node type
// context.node.name - Node name
// context.node.inputs - Current input values
// context.node.outputs - Current output values
// context.node.config - Node configuration
// context.node.state - Node-specific state storage
// context.flow - Flow-level state storage
// context.global - Global state storage
// context.nodeType - Type-specific state storage

// Helper functions:
// helpers.getInput(inputName) - Get current input value
// helpers.setOutput(outputName, value) - Set output value
// helpers.log(...args) - Log messages
// helpers.getNodeState(key) - Get node state
// helpers.setNodeState(key, value) - Set node state
// helpers.onNodeProperty(propName, callback) - Listen to node property changes
// helpers.onInput(inputName, callback) - Listen to input changes

// Example: Process input and set output
const input1Value = helpers.getInput('input1');
if (input1Value !== undefined) {
    const result = input1Value * 2;
    helpers.setOutput('output1', result);
    helpers.log('Processed input:', input1Value, '-> output:', result);
}

// Example: Use node state to count executions
let count = helpers.getNodeState('executionCount') || 0;
count++;
helpers.setNodeState('executionCount', count);
helpers.log('Execution count:', count);
`
	}

	function getDefaultUICode() {
		return `// Function Node UI Code
// This Vue.js component code will be used to create a custom UI
// for this function node.

// Available props:
// - context: Node context object
// - node: Node model
// - nodeDefinition: Node definition

// Example Vue component:
export default {
  setup(props) {
    const { ref, computed } = Vue;

    // Access node context
    const { context, node } = props;

    // Reactive state
    const localValue = ref('');

    // Computed properties
    const nodeId = computed(() => node.id);

    // Methods
    const handleClick = () => {
      console.log('Button clicked in node:', nodeId.value);
    };

    // Template (as a string)
    const template = \`
      <div class="custom-function-ui">
        <h4>Custom Function Node</h4>
        <input v-model="localValue" placeholder="Enter value" />
        <button @click="handleClick">Process</button>
        <p>Node ID: {{ nodeId }}</p>
      </div>
    \`;

    return {
      localValue,
      nodeId,
      handleClick,
      template
    };
  }
};
`
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

	.tabs {
		display: flex;
		gap: 4px;
		margin-right: 16px;
	}

	.tab-button {
		background: #2d2d2d;
		border: none;
		color: #ccc;
		padding: 6px 12px;
		border-radius: 4px 4px 0 0;
		cursor: pointer;
	}

	.tab-button.active {
		background: #1e1e1e;
		color: #fff;
		border-bottom: 2px solid #0078d4;
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
		display: block;
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
