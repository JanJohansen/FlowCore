<template>
	<Teleport to="body">
		<div v-if="isVisible" class="property-editor-overlay" @click="handleOverlayClick">
			<div class="property-editor-modal" @click.stop>
				<div class="modal-header">
					<h3>Edit Node Properties</h3>
					<button class="close-btn" @click="handleClose">
						<i class="fa fa-times"></i>
					</button>
				</div>
				<div class="modal-content">
					<div v-for="(input, key) in nodeInputs" :key="key" class="input-group">
						<label :for="key">{{ key }}</label>
						<!-- String input -->
						<input
							v-if="input.valueType === 'string'"
							:id="key"
							type="text"
							v-model="localInputValues[key]"
							:placeholder="input.description || ''"
						/>
						<!-- Enum selector -->
						<select
							v-else-if="input.valueType === 'enum'"
							:id="key"
							v-model="localInputValues[key]"
							class="enum-select"
						>
							<option v-for="option in input.enum" :key="option" :value="option">
								{{ option }}
							</option>
						</select>
						<!-- Number input with optional slider -->
						<div v-else-if="input.valueType === 'number'" class="number-input-group">
							<input
								:id="key"
								type="number"
								v-model.number="localInputValues[key]"
								:min="input.min"
								:max="input.max"
								:step="input.step || 1"
							/>
							<input
								v-if="input.useSlider && input.min !== undefined && input.max !== undefined"
								type="range"
								v-model.number="localInputValues[key]"
								:min="input.min"
								:max="input.max"
								:step="input.step || 1"
								class="slider"
							/>
						</div>
						<!-- Boolean input -->
						<template v-else-if="input.valueType === 'boolean'">
							<!-- Checkbox style -->
							<input
								v-if="input.useCheckbox"
								:id="key"
								type="checkbox"
								v-model="localInputValues[key]"
								class="checkbox-input"
							/>
							<!-- Toggle switch style -->
							<div v-else class="toggle-switch">
								<input :id="key" type="checkbox" v-model="localInputValues[key]" class="toggle-input" />
								<label :for="key" class="toggle-label"></label>
							</div>
						</template>
						<!-- Object/Array input -->
						<div
							v-else-if="input.valueType === 'object' || input.valueType === 'array'"
							class="json-editor"
						>
							<textarea
								:id="key"
								v-model="localInputValues[key]"
								rows="3"
								class="json-textarea"
								@input="validateJson(key)"
								:class="{ 'invalid-json': !isValidJson[key] }"
							></textarea>
							<div v-if="!isValidJson[key]" class="json-error">Invalid JSON format</div>
						</div>
						<!-- Any/unknown type -->
						<input
							v-else
							:id="key"
							type="text"
							v-model="localInputValues[key]"
							:placeholder="input.description || 'Enter value...'"
						/>
					</div>
				</div>
				<div class="modal-footer">
					<button class="cancel-btn" @click="handleClose">Cancel</button>
					<button class="save-btn" @click="handleSave">Save</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
	import { ref, computed, watch } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import type { INodeDefinition, IFlowNodeModel, numberNodeIO, enumNodeIO, booleanNodeIO } from "./types"

	interface Props {
		node: IFlowNodeModel
		nodeDefinition: INodeDefinition
		isVisible: boolean
	}

	const props = defineProps<Props>()
	const emit = defineEmits(["close"])

	const flowStore = useFlowStore()

	// Compute node inputs from nodeDefinition and map to internal format
	const nodeInputs = computed(() => {
		const inputs = props.nodeDefinition?.config || {}
		return Object.entries(inputs).reduce((acc, [key, input]) => {
			const valueType = input.type
			const baseInput = {
				valueType,
				description: input.description,
				default: input.default
			}

			switch (valueType) {
				case "number":
					acc[key] = {
						...baseInput,
						min: (input as numberNodeIO).minVal,
						max: (input as numberNodeIO).maxVal,
						step: (input as numberNodeIO).step,
						useSlider: (input as numberNodeIO).useSlider
					}
					break
				case "enum":
					acc[key] = {
						...baseInput,
						enum: (input as enumNodeIO).options || []
					}
					break
				case "boolean":
					acc[key] = {
						...baseInput,
						useCheckbox: (input as booleanNodeIO).useCheckbox
					}
					break
				default:
					acc[key] = baseInput
			}
			return acc
		}, {} as Record<string, any>)
	})

	// Local state for input values
	const localInputValues = ref<Record<string, any>>({})
	const isValidJson = ref<Record<string, boolean>>({})

	// Initialize local values when node changes
	watch(
		() => props.node,
		(newNode) => {
			localInputValues.value = {}
			isValidJson.value = {}
			Object.keys(nodeInputs.value).forEach((key) => {
				const value = newNode.config[key]
				localInputValues.value[key] = value

				// Validate JSON for unknown types
				if (nodeInputs.value[key].valueType === "unknown" || nodeInputs.value[key].valueType === "object") {
					try {
						if (typeof value === "string") {
							JSON.parse(value)
							isValidJson.value[key] = true
						} else {
							localInputValues.value[key] = JSON.stringify(value, null, 2)
							isValidJson.value[key] = true
						}
					} catch {
						isValidJson.value[key] = false
					}
				}
			})
		},
		{ immediate: true }
	)

	// Validate JSON input
	function validateJson(key: string) {
		try {
			JSON.parse(localInputValues.value[key])
			isValidJson.value[key] = true
		} catch {
			isValidJson.value[key] = false
		}
	}

	// Handle modal close
	function handleClose() {
		emit("close")
	}

	// Handle overlay click
	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose()
		}
	}

	// Handle save
	function handleSave() {
		// Prepare values for saving
		const processedValues: Record<string, any> = {}

		Object.entries(nodeInputs.value).forEach(([key, input]) => {
			const rawValue = localInputValues.value[key]

			switch (input.valueType) {
				case "number":
					// Convert string to number and respect min/max bounds
					let numValue = Number(rawValue)
					if (input.min !== undefined) {
						numValue = Math.max(input.min, numValue)
					}
					if (input.max !== undefined) {
						numValue = Math.min(input.max, numValue)
					}
					processedValues[key] = numValue
					break

				case "boolean":
					// Ensure boolean type
					processedValues[key] = Boolean(rawValue)
					break

				case "object":
				case "array":
					try {
						processedValues[key] = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue
					} catch (e) {
						// Skip invalid JSON
						return
					}
					break

				case "enum":
					// Validate enum value is in options
					if (input.enum && input.enum.includes(rawValue)) {
						processedValues[key] = rawValue
					} else if (input.enum && input.enum.length > 0) {
						// Fall back to first option if invalid
						processedValues[key] = input.enum[0]
					}
					break

				default:
					// String and other types pass through as-is
					processedValues[key] = rawValue
			}
		})

		// Update node input values in the store
		flowStore.updateNodeInputValues(props.node.id, processedValues)
		handleClose()
	}
</script>

<style scoped>
	.property-editor-overlay {
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

	.property-editor-modal {
		background-color: var(--bg-primary);
		border-radius: 8px;
		width: 500px;
		max-width: 90%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.modal-header {
		padding: 1rem;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-content {
		padding: 1rem;
		overflow-y: auto;
	}

	.modal-footer {
		padding: 1rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.input-group {
		margin-bottom: 1.5rem;
	}

	.input-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}

	.input-group input[type="text"],
	.input-group input[type="number"],
	.input-group textarea,
	.enum-select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background-color: var(--bg-secondary);
		color: var(--text-primary);
		transition: border-color 0.2s;
	}

	.input-group input[type="text"]:focus,
	.input-group input[type="number"]:focus,
	.input-group textarea:focus,
	.enum-select:focus {
		border-color: var(--primary-color);
		outline: none;
	}

	.number-input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.slider {
		width: 100%;
		height: 6px;
		background: var(--border-color);
		border-radius: 3px;
		outline: none;
		opacity: 0.7;
		transition: opacity 0.2s;
		cursor: pointer;
		appearance: none;
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		background: var(--primary-color);
		border-radius: 50%;
		cursor: pointer;
	}

	.slider:hover {
		opacity: 1;
	}

	.toggle-switch {
		position: relative;
		width: 60px;
		height: 34px;
		margin-top: 0.5rem;
	}

	.toggle-input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-label {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 34px;
		transition: 0.4s;
	}

	.toggle-label:before {
		position: absolute;
		content: "";
		height: 26px;
		width: 26px;
		left: 4px;
		bottom: 3px;
		background-color: var(--text-primary);
		border-radius: 50%;
		transition: 0.4s;
	}

	.toggle-input:checked + .toggle-label {
		background-color: var(--primary-color);
	}

	.toggle-input:checked + .toggle-label:before {
		transform: translateX(26px);
		background-color: white;
	}

	.json-editor {
		position: relative;
	}

	.json-textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background-color: var(--bg-secondary);
		color: var(--text-primary);
		font-family: monospace;
		resize: vertical;
		line-height: 1.4;
	}

	.invalid-json {
		border-color: var(--error-color);
		background-color: var(--error-bg);
	}

	.json-error {
		color: var(--error-color);
		font-size: 0.875rem;
		margin-top: 0.25rem;
	}

	button {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--text-primary);
		cursor: pointer;
		padding: 0.5rem;
	}

	.save-btn {
		background-color: var(--primary-color);
		color: white;
	}

	.cancel-btn {
		background-color: var(--bg-secondary);
		color: var(--text-primary);
	}

	button:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
</style>
