<template>
	<div class="property-control" :class="`type-${type}`">
		<!-- String input -->
		<input
			v-if="type === 'string'"
			:id="id"
			type="text"
			:value="value"
			:placeholder="config.description || 'Enter text...'"
			:class="{ 'has-error': hasError }"
			@input="$emit('update', ($event.target as HTMLInputElement).value)"
			class="control-input"
		/>

		<!-- Number input -->
		<div v-else-if="type === 'number'" class="number-control">
			<input
				:id="id"
				type="number"
				:value="value"
				:min="config.min"
				:max="config.max"
				:step="config.step || 1"
				:class="{ 'has-error': hasError }"
				@input="handleNumberInput"
				class="control-input number-input"
			/>
			<input
				v-if="config.useSlider && config.min !== undefined && config.max !== undefined"
				type="range"
				:value="value"
				:min="config.min"
				:max="config.max"
				:step="config.step || 1"
				@input="handleNumberInput"
				class="range-slider"
			/>
		</div>

		<!-- Boolean input -->
		<div v-else-if="type === 'boolean'" class="boolean-control">
			<label class="toggle-switch" :for="id">
				<input
					:id="id"
					type="checkbox"
					:checked="value"
					@change="$emit('update', ($event.target as HTMLInputElement).checked)"
					class="toggle-input"
				/>
				<span class="toggle-slider"></span>
				<span class="toggle-label-text">{{ value ? "Enabled" : "Disabled" }}</span>
			</label>
		</div>

		<!-- Enum selector -->
		<select
			v-else-if="type === 'enum'"
			:id="id"
			:value="value"
			:class="{ 'has-error': hasError }"
			@change="$emit('update', ($event.target as HTMLSelectElement).value)"
			class="control-select"
		>
			<option v-for="option in config.enum" :key="option" :value="option">
				{{ option }}
			</option>
		</select>

		<!-- Enum array (multi-select with chips) -->
		<div v-else-if="type === 'enumArray'" class="enum-array-control">
			<div class="selected-chips">
				<span v-for="selected in (value as string[])" :key="selected" class="chip">
					{{ selected }}
					<button @click="removeFromArray(selected)" class="chip-remove">
						<i class="fa fa-times"></i>
					</button>
				</span>
			</div>
			<select @change="addToArray" class="control-select enum-array-select">
				<option value="">Add option...</option>
				<option v-for="option in availableOptions" :key="option" :value="option">
					{{ option }}
				</option>
			</select>
		</div>

		<!-- Object/Array JSON editor -->
		<div v-else-if="type === 'object' || type === 'array'" class="json-control">
			<div class="json-editor-header">
				<span class="json-type">{{ type.toUpperCase() }}</span>
				<button @click="formatJson" class="btn-format" title="Format JSON">
					<i class="fa fa-magic"></i>
				</button>
			</div>
			<textarea
				:id="id"
				:value="stringValue"
				rows="4"
				:class="{ 'has-error': hasError }"
				@input="handleJsonInput"
				class="json-textarea"
				placeholder="Enter valid JSON..."
			></textarea>
		</div>

		<!-- Any/unknown type -->
		<input
			v-else
			:id="id"
			type="text"
			:value="value"
			:placeholder="config.description || 'Enter value...'"
			:class="{ 'has-error': hasError }"
			@input="$emit('update', ($event.target as HTMLInputElement).value)"
			class="control-input"
		/>
	</div>
</template>

<script setup lang="ts">
	import { computed } from "vue"

	interface Props {
		id: string
		type: string
		value: any
		config: any
		hasError?: boolean
	}

	const props = defineProps<Props>()
	const emit = defineEmits(["update"])

	// Computed for JSON string representation
	const stringValue = computed(() => {
		if (props.type === "object" || props.type === "array") {
			if (typeof props.value === "string") {
				return props.value
			}
			return JSON.stringify(props.value, null, 2)
		}
		return props.value
	})

	// Available options for enum array (exclude already selected)
	const availableOptions = computed(() => {
		if (props.type !== "enumArray" || !props.config.enum) return []
		const selected = Array.isArray(props.value) ? props.value : []
		return props.config.enum.filter((option: string) => !selected.includes(option))
	})

	// Handle number input with validation
	function handleNumberInput(event: Event) {
		const target = event.target as HTMLInputElement
		let numValue = Number(target.value)

		if (props.config.min !== undefined) {
			numValue = Math.max(props.config.min, numValue)
		}
		if (props.config.max !== undefined) {
			numValue = Math.min(props.config.max, numValue)
		}

		emit("update", numValue)
	}

	// Handle JSON input
	function handleJsonInput(event: Event) {
		const target = event.target as HTMLTextAreaElement
		emit("update", target.value)
	}

	// Format JSON
	function formatJson() {
		try {
			const parsed = JSON.parse(stringValue.value)
			const formatted = JSON.stringify(parsed, null, 2)
			emit("update", formatted)
		} catch (e) {
			// Invalid JSON, do nothing
		}
	}

	// Add to enum array
	function addToArray(event: Event) {
		const target = event.target as HTMLSelectElement
		const option = target.value
		if (option) {
			const currentArray = Array.isArray(props.value) ? props.value : []
			emit("update", [...currentArray, option])
			target.value = "" // Reset select
		}
	}

	// Remove from enum array
	function removeFromArray(option: string) {
		const currentArray = Array.isArray(props.value) ? props.value : []
		emit(
			"update",
			currentArray.filter((item: string) => item !== option)
		)
	}
</script>

<style scoped>
	.property-control {
		width: 100%;
	}

	.control-input,
	.control-select {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid var(--border-color);
		border-radius: 4px;
		background-color: var(--bg-secondary);
		color: var(--text-primary);
		font-size: 13px;
		line-height: 1.4;
		transition: all 0.15s ease;
	}

	.control-input:focus,
	.control-select:focus {
		border-color: var(--primary-color);
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
		outline: none;
	}

	.has-error {
		border-color: var(--error-color) !important;
		box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1) !important;
	}

	/* Number control */
	.number-control {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.number-input {
		max-width: 120px;
	}

	.range-slider {
		width: 100%;
		height: 4px;
		background: var(--border-color);
		border-radius: 2px;
		outline: none;
		appearance: none;
		cursor: pointer;
	}

	.range-slider::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		background: var(--primary-color);
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.range-slider::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	/* Boolean control */
	.boolean-control {
		display: flex;
		align-items: center;
	}

	.toggle-switch {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
	}

	.toggle-input {
		position: relative;
		width: 44px;
		height: 24px;
		appearance: none;
		background: var(--border-color);
		border-radius: 12px;
		outline: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.toggle-input:checked {
		background: var(--primary-color);
	}

	.toggle-input::before {
		content: "";
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		transition: transform 0.2s ease;
	}

	.toggle-input:checked::before {
		transform: translateX(20px);
	}

	.toggle-label-text {
		font-size: 12px;
		color: var(--text-secondary);
		min-width: 60px;
	}

	/* Enum array control */
	.enum-array-control {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.selected-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		min-height: 24px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px 6px;
		background: var(--primary-color);
		color: white;
		border-radius: 12px;
		font-size: 11px;
		line-height: 1.2;
	}

	.chip-remove {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.8);
		cursor: pointer;
		padding: 0;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 8px;
	}

	.chip-remove:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.enum-array-select {
		font-size: 12px;
	}

	/* JSON control */
	.json-control {
		border: 1px solid var(--border-color);
		border-radius: 4px;
		overflow: hidden;
	}

	.json-editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 8px;
		background: var(--bg-tertiary);
		border-bottom: 1px solid var(--border-color);
	}

	.json-type {
		font-size: 10px;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.btn-format {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 2px;
		font-size: 10px;
		transition: all 0.15s ease;
	}

	.btn-format:hover {
		background: var(--bg-secondary);
		color: var(--primary-color);
	}

	.json-textarea {
		width: 100%;
		padding: 8px;
		border: none;
		background: var(--bg-secondary);
		color: var(--text-primary);
		font-family: "Consolas", "Monaco", "Courier New", monospace;
		font-size: 12px;
		line-height: 1.4;
		resize: vertical;
		min-height: 60px;
	}

	.json-textarea:focus {
		outline: none;
		background: var(--bg-primary);
	}
</style>
