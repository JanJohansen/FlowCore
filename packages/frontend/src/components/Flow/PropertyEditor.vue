<template>
	<Teleport to="body">
		<div v-if="isVisible" class="property-editor-overlay" @click="handleOverlayClick">
			<div class="property-editor" @click.stop>
				<!-- Header -->
				<div class="header">
					<div class="header-content">
						<div class="node-info">
							<span class="node-type">{{ nodeDefinition?.typeName || "Unknown" }}</span>
							<span class="node-category">{{ nodeDefinition?.category }}</span>
						</div>
						<div class="header-actions">
							<button class="btn btn-icon" @click="resetToDefaults" title="Reset to defaults">
								<i class="fa fa-undo"></i>
							</button>
							<button class="btn btn-icon close-btn" @click="handleClose" title="Close">
								<i class="fa fa-times"></i>
							</button>
						</div>
					</div>
				</div>

				<!-- Content -->
				<div class="content">
					<div class="property-grid">
						<template v-for="(input, key) in nodeInputs" :key="key">
							<div class="property-row" :class="{ 'has-error': hasValidationError(key) }">
								<div class="property-label">
									<label :for="`prop-${key}`">{{ formatPropertyName(key) }}</label>
									<span
										v-if="input.description"
										class="property-description"
										:title="input.description"
									>
										<i class="fa fa-question-circle"></i>
									</span>
								</div>
								<div class="property-control">
									<PropertyControl
										:id="`prop-${key}`"
										:type="input.valueType"
										:value="localInputValues[key]"
										:config="input"
										:hasError="hasValidationError(key)"
										@update="updateValue(key, $event)"
									/>
									<div v-if="validationErrors[key]" class="validation-error">
										{{ validationErrors[key] }}
									</div>
								</div>
							</div>
						</template>
					</div>
				</div>

				<!-- Footer -->
				<div class="footer">
					<div class="footer-info">
						<span class="property-count">{{ Object.keys(nodeInputs).length }} properties</span>
						<span v-if="hasUnsavedChanges" class="unsaved-indicator">• Unsaved changes</span>
					</div>
					<div class="footer-actions">
						<button class="btn btn-secondary" @click="handleClose">Cancel</button>
						<button class="btn btn-primary" @click="handleSave" :disabled="hasValidationErrors">
							Save Changes
						</button>
					</div>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
	import { ref, computed, watch } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import PropertyControl from "./PropertyControl.vue"
	import type {
		INodeDefinition,
		IFlowNodeModel,
		numberNodeIO,
		enumNodeIO,
		enumArrayNodeIO,
		booleanNodeIO
	} from "./types"

	interface Props {
		node: IFlowNodeModel
		nodeDefinition: INodeDefinition
		isVisible: boolean
	}

	const props = defineProps<Props>()
	const emit = defineEmits(["close"])

	const flowStore = useFlowStore()

	// Store original values for change detection
	const originalValues = ref<Record<string, any>>({})
	const localInputValues = ref<Record<string, any>>({})
	const validationErrors = ref<Record<string, string>>({})

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
				case "enumArray":
					acc[key] = {
						...baseInput,
						enum: (input as enumArrayNodeIO).options || []
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

	// Computed properties for UI state
	const hasUnsavedChanges = computed(() => {
		return Object.keys(localInputValues.value).some(
			(key) => JSON.stringify(localInputValues.value[key]) !== JSON.stringify(originalValues.value[key])
		)
	})

	const hasValidationErrors = computed(() => {
		return Object.keys(validationErrors.value).length > 0
	})

	// Initialize local values when node changes
	watch(
		() => props.node,
		(newNode) => {
			if (!newNode) return

			originalValues.value = {}
			localInputValues.value = {}
			validationErrors.value = {}

			Object.keys(nodeInputs.value).forEach((key) => {
				const value = newNode.config[key]
				const inputDef = nodeInputs.value[key]
				const inputType = inputDef.valueType

				// Store original value
				originalValues.value[key] = value

				// Initialize local value based on type
				if (inputType === "enumArray") {
					localInputValues.value[key] = Array.isArray(value) ? [...value] : []
				} else if (inputType === "object" || inputType === "array") {
					if (typeof value === "string") {
						localInputValues.value[key] = value
					} else {
						localInputValues.value[key] = JSON.stringify(
							value || (inputType === "array" ? [] : {}),
							null,
							2
						)
					}
				} else {
					// Use default value if current value is undefined
					localInputValues.value[key] = value !== undefined ? value : inputDef.default
				}

				// Validate initial value
				validateValue(key, localInputValues.value[key])
			})
		},
		{ immediate: true }
	)

	// Utility functions
	function formatPropertyName(key: string): string {
		// Convert camelCase to Title Case
		return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
	}

	function hasValidationError(key: string): boolean {
		return key in validationErrors.value
	}

	function validateValue(key: string, value: any): void {
		const inputDef = nodeInputs.value[key]
		if (!inputDef) return

		// Clear previous error
		delete validationErrors.value[key]

		// Type-specific validation
		switch (inputDef.valueType) {
			case "number":
				if (value !== undefined && value !== null && value !== "") {
					const num = Number(value)
					if (isNaN(num)) {
						validationErrors.value[key] = "Must be a valid number"
					} else if (inputDef.min !== undefined && num < inputDef.min) {
						validationErrors.value[key] = `Must be at least ${inputDef.min}`
					} else if (inputDef.max !== undefined && num > inputDef.max) {
						validationErrors.value[key] = `Must be at most ${inputDef.max}`
					}
				}
				break

			case "object":
			case "array":
				if (value && typeof value === "string") {
					try {
						const parsed = JSON.parse(value)
						if (inputDef.valueType === "array" && !Array.isArray(parsed)) {
							validationErrors.value[key] = "Must be a valid JSON array"
						} else if (
							inputDef.valueType === "object" &&
							(Array.isArray(parsed) || typeof parsed !== "object")
						) {
							validationErrors.value[key] = "Must be a valid JSON object"
						}
					} catch (e) {
						validationErrors.value[key] = "Invalid JSON format"
					}
				}
				break

			case "enum":
				if (value && inputDef.enum && !inputDef.enum.includes(value)) {
					validationErrors.value[key] = "Invalid option selected"
				}
				break

			case "enumArray":
				if (Array.isArray(value) && inputDef.enum) {
					const invalidValues = value.filter((v) => !inputDef.enum.includes(v))
					if (invalidValues.length > 0) {
						validationErrors.value[key] = `Invalid options: ${invalidValues.join(", ")}`
					}
				}
				break
		}
	}

	function updateValue(key: string, value: any): void {
		localInputValues.value[key] = value
		validateValue(key, value)
	}

	function resetToDefaults(): void {
		Object.keys(nodeInputs.value).forEach((key) => {
			const inputDef = nodeInputs.value[key]
			const defaultValue = inputDef.default

			if (inputDef.valueType === "enumArray") {
				localInputValues.value[key] = Array.isArray(defaultValue) ? [...defaultValue] : []
			} else if (inputDef.valueType === "object" || inputDef.valueType === "array") {
				localInputValues.value[key] = JSON.stringify(
					defaultValue || (inputDef.valueType === "array" ? [] : {}),
					null,
					2
				)
			} else {
				localInputValues.value[key] = defaultValue
			}

			validateValue(key, localInputValues.value[key])
		})
	}

	// Event handlers
	function handleClose(): void {
		emit("close")
	}

	function handleOverlayClick(event: MouseEvent): void {
		if (event.target === event.currentTarget) {
			handleClose()
		}
	}

	function handleSave(): void {
		if (hasValidationErrors.value) {
			return
		}

		// Prepare values for saving
		const processedValues: Record<string, any> = {}

		Object.entries(nodeInputs.value).forEach(([key, inputDef]) => {
			const rawValue = localInputValues.value[key]

			switch (inputDef.valueType) {
				case "number":
					if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
						let numValue = Number(rawValue)
						if (inputDef.min !== undefined) {
							numValue = Math.max(inputDef.min, numValue)
						}
						if (inputDef.max !== undefined) {
							numValue = Math.min(inputDef.max, numValue)
						}
						processedValues[key] = numValue
					} else {
						processedValues[key] = inputDef.default
					}
					break

				case "boolean":
					processedValues[key] = Boolean(rawValue)
					break

				case "object":
				case "array":
					try {
						processedValues[key] = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue
					} catch (e) {
						// Use default value if parsing fails
						processedValues[key] = inputDef.default || (inputDef.valueType === "array" ? [] : {})
					}
					break

				case "enum":
					if (inputDef.enum && inputDef.enum.includes(rawValue)) {
						processedValues[key] = rawValue
					} else if (inputDef.enum && inputDef.enum.length > 0) {
						processedValues[key] = inputDef.enum[0]
					} else {
						processedValues[key] = inputDef.default
					}
					break

				case "enumArray":
					if (Array.isArray(rawValue)) {
						const validValues = rawValue.filter(
							(value: any) => inputDef.enum && inputDef.enum.includes(value)
						)
						processedValues[key] = validValues
					} else {
						processedValues[key] = []
					}
					break

				default:
					processedValues[key] = rawValue !== undefined ? rawValue : inputDef.default
			}
		})

		// Update node config in the store
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
		background-color: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(2px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
		animation: fadeIn 0.15s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.property-editor {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		width: 420px;
		max-width: 90vw;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Header */
	.header {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		padding: 12px 16px;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.node-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.node-type {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.node-category {
		font-size: 11px;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 500;
	}

	.header-actions {
		display: flex;
		gap: 4px;
	}

	.btn {
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		transition: all 0.15s ease;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		user-select: none;
	}

	.btn-icon {
		width: 28px;
		height: 28px;
		padding: 0;
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
	}

	.btn-icon:hover {
		background: var(--bg-primary);
		color: var(--text-primary);
		border-color: var(--primary-color);
		transform: translateY(-1px);
	}

	.close-btn:hover {
		background: var(--error-color);
		color: white;
		border-color: var(--error-color);
	}

	/* Content */
	.content {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
	}

	.property-grid {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.property-row {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 2px;
		align-items: start;
		padding: 2px 0;
		border-bottom: 1px solid transparent;
		/* transition: all 0.15s ease; */
	}

	.property-row:hover {
		background: var(--bg-secondary);
		/* margin: 0 -8px; */
		/* padding: 8px 8px; */
		border-radius: 4px;
	}

	.property-row.has-error {
		background: var(--error-bg);
		border-color: var(--error-color);
		border-radius: 4px;
		/* margin: 0 -8px; */
		/* padding: 8px 8px; */
	}

	.property-label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-top: 6px;
	}

	.property-label label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-primary);
		line-height: 1.3;
		margin: 0;
		cursor: pointer;
	}

	.property-description {
		color: var(--text-secondary);
		cursor: help;
		font-size: 11px;
		opacity: 0.7;
		transition: opacity 0.15s ease;
	}

	.property-description:hover {
		opacity: 1;
		color: var(--primary-color);
	}

	.property-control {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.validation-error {
		font-size: 10px;
		color: var(--error-color);
		background: var(--error-bg);
		padding: 2px 6px;
		border-radius: 3px;
		border: 1px solid var(--error-color);
		line-height: 1.2;
	}

	/* Footer */
	.footer {
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-color);
		padding: 12px 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.footer-info {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		color: var(--text-secondary);
	}

	.property-count {
		font-weight: 500;
	}

	.unsaved-indicator {
		color: var(--warning-color);
		font-weight: 600;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.footer-actions {
		display: flex;
		gap: 8px;
	}

	.btn-secondary {
		padding: 6px 12px;
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	.btn-secondary:hover {
		background: var(--bg-primary);
		border-color: var(--text-secondary);
		transform: translateY(-1px);
	}

	.btn-primary {
		padding: 6px 12px;
		background: var(--primary-color);
		color: white;
		border: 1px solid var(--primary-color);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--primary-color-dark);
		border-color: var(--primary-color-dark);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Scrollbar styling */
	.content::-webkit-scrollbar {
		width: 6px;
	}

	.content::-webkit-scrollbar-track {
		background: var(--bg-secondary);
	}

	.content::-webkit-scrollbar-thumb {
		background: var(--border-color);
		border-radius: 3px;
	}

	.content::-webkit-scrollbar-thumb:hover {
		background: var(--text-secondary);
	}

	/* Responsive design */
	@media (max-width: 640px) {
		.property-editor {
			width: 95vw;
			max-height: 90vh;
		}

		.property-row {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.property-label {
			padding-top: 0;
		}

		.header-content {
			flex-direction: column;
			gap: 8px;
			align-items: flex-start;
		}

		.footer {
			flex-direction: column;
			gap: 8px;
			align-items: stretch;
		}

		.footer-actions {
			justify-content: stretch;
		}

		.footer-actions .btn {
			flex: 1;
		}
	}

	/* Dark mode specific adjustments */
	@media (prefers-color-scheme: dark) {
		.property-editor {
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
		}
	}
</style>
