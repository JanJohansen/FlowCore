<template>
	<div v-if="visible" class="modal-overlay" @click.self="close">
		<div class="modal-container">
			<div class="modal-header">
				<h3>Edit Node: {{ nodeDefinition?.typeName || "Unknown" }}</h3>
				<button class="close-btn" @click="close">×</button>
			</div>
			<div class="modal-body">
				<div v-if="nodeDefinition?.ins && Object.keys(nodeDefinition.ins).length > 0">
					<div v-for="(port, portId) in nodeDefinition.ins" :key="portId" class="input-row">
						<div class="input-label">
							<label :for="`input-${portId}`">{{ portId }}</label>
							<span class="input-type">({{ port.valueType }})</span>
							<span v-if="port.description" class="input-description">{{ port.description }}</span>
						</div>
						<div class="input-control">
							<input
								:id="`input-${portId}`"
								:value="rawInputValues[portId] || ''"
								@input="handleInput(portId, $event.target.value)"
								:placeholder="getPlaceholderForType(port.valueType)"
								:class="{ 'invalid-json': !inputValidation[portId]?.isValid && rawInputValues[portId] }"
							/>
							<button
								class="clear-btn"
								@click="clearInput(portId)"
								:class="{ active: rawInputValues[portId] !== undefined }"
								:title="
									rawInputValues[portId] !== undefined
										? 'Clear value (allow external connection)'
										: 'No value set'
								"
							>
								<i class="fa fa-times"></i>
							</button>
						</div>
					</div>
				</div>
				<div v-else class="no-inputs">
					<p>This node has no configurable inputs.</p>
				</div>
			</div>
			<div class="modal-footer">
				<button class="cancel-btn" @click="close">Cancel</button>
				<button class="save-btn" @click="saveChanges">Save Changes</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, reactive, onMounted, watch } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import type { INodeDefinition, IFlowNodeModel } from "./Types"

	const props = defineProps<{
		visible: boolean
		nodeId: string
	}>()

	const emit = defineEmits<{
		(e: "close"): void
		(e: "save", nodeId: string, inputValues: Record<string, any>): void
	}>()

	const flowStore = useFlowStore()
	const nodeDefinition = ref<INodeDefinition | null>(null)
	const node = ref<IFlowNodeModel | null>(null)
	const inputValues = reactive<Record<string, any>>({})
	const rawInputValues = reactive<Record<string, string>>({})
	const inputValidation = reactive<Record<string, { isValid: boolean; parsedValue: any }>>({})

	// Initialize the component when it becomes visible or nodeId changes
	watch(
		() => [props.visible, props.nodeId],
		([isVisible, id]) => {
			if (isVisible && id) {
				loadNodeData(id)
			}
		},
		{ immediate: true }
	)

	function loadNodeData(nodeId: string) {
		// Find the node in the flow state
		node.value = flowStore.flowState.nodes.find((n) => n.id === nodeId) || null

		if (node.value) {
			// Get the node definition
			nodeDefinition.value = flowStore.getNodeDefinition(node.value.typeUID)

			// Initialize input values from node config
			Object.keys(inputValues).forEach((key) => delete inputValues[key])

			if (node.value.config?.ins) {
				Object.entries(node.value.config.ins).forEach(([key, data]) => {
					if (data.value !== undefined) {
						inputValues[key] = data.value
					}
				})
			}
		}
	}

	function getPlaceholderForType(type: string): string {
		switch (type) {
			case "number":
				return "Enter a number..."
			case "boolean":
				return "true or false"
			case "object":
				return "{}"
			case "array":
				return "[]"
			default:
				return "Enter value..."
		}
	}

	function handleInput(portId: string, value: string) {
		rawInputValues[portId] = value
		validateInput(portId)
	}

	function validateInput(portId: string) {
		const value = rawInputValues[portId]
		if (!value) {
			delete inputValidation[portId]
			delete inputValues[portId]
			return
		}

		try {
			// Try parsing as direct JSON first
			let parsedValue = JSON.parse(value)
			inputValidation[portId] = { isValid: true, parsedValue }
			inputValues[portId] = parsedValue
		} catch {
			inputValidation[portId] = { isValid: false, parsedValue: null }
			delete inputValues[portId]
		}
	}

	function clearInput(portId: string) {
		delete rawInputValues[portId]
		delete inputValidation[portId]
		delete inputValues[portId]
	}

	function formatValueForDisplay(value: any): string {
		if (value === undefined || value === null) {
			return ""
		}
		return JSON.stringify(value)
	}

	function saveChanges() {
		if (!node.value) return

		const invalidInputs = Object.entries(rawInputValues)
			.filter(([key]) => rawInputValues[key] && !inputValidation[key]?.isValid)
			.map(([key]) => key)

		if (invalidInputs.length > 0) {
			alert(`Warning: The following inputs have invalid JSON and will not be saved: ${invalidInputs.join(", ")}`)
		}

		// Only save valid values
		const cleanValues: Record<string, any> = {}
		Object.entries(inputValues).forEach(([key, value]) => {
			if (value !== undefined) {
				cleanValues[key] = value
			}
		})

		emit("save", node.value.id, cleanValues)
		close()
	}

	function close() {
		emit("close")
	}
</script>

<style scoped>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-container {
		background-color: var(--bg-secondary, #2d2d2d);
		border-radius: 4px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		width: 500px;
		max-width: 90%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-color, #404040);
	}

	.modal-header h3 {
		margin: 0;
		color: var(--text-primary, #fff);
		font-size: 1.2em;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--text-secondary, #ccc);
		font-size: 1.5em;
		cursor: pointer;
	}

	.modal-body {
		padding: 16px;
		overflow-y: auto;
		flex-grow: 1;
	}

	.input-row {
		margin-bottom: 16px;
	}

	.input-label {
		margin-bottom: 4px;
	}

	.input-label label {
		font-weight: 500;
		color: var(--text-primary, #fff);
	}

	.input-type {
		color: var(--text-secondary, #ccc);
		font-size: 0.9em;
		margin-left: 8px;
	}

	.input-description {
		display: block;
		color: var(--text-secondary, #ccc);
		font-size: 0.9em;
		margin-top: 2px;
	}

	.input-control {
		display: flex;
		align-items: center;
	}

	.input-control input {
		flex-grow: 1;
		padding: 8px;
		background: var(--bg-tertiary, #1a1a1a);
		border: 1px solid var(--border-color, #404040);
		color: var(--text-primary, #fff);
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.input-control input:focus {
		outline: none;
		border-color: #2196f3;
		box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
	}

	.input-control input.invalid-json {
		border-color: #f44336;
		border-width: 3px;
	}

	.input-control input.invalid-json:focus {
		border-color: #f44336;
		box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
	}

	.clear-btn {
		background: none;
		border: none;
		color: var(--text-secondary, #ccc);
		margin-left: 8px;
		cursor: pointer;
		opacity: 0.5;
	}

	.clear-btn.active {
		opacity: 1;
	}

	.no-inputs {
		color: var(--text-secondary, #ccc);
		text-align: center;
		padding: 20px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		padding: 12px 16px;
		border-top: 1px solid var(--border-color, #404040);
	}

	.cancel-btn,
	.save-btn {
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
	}

	.cancel-btn {
		background: none;
		border: 1px solid var(--border-color, #404040);
		color: var(--text-secondary, #ccc);
		margin-right: 8px;
	}

	.save-btn {
		background: #2196f3;
		border: none;
		color: white;
	}

	.invalid-json {
		border-color: #f44336 !important;
	}
</style>
