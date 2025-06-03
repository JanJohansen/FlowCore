<template>
	<button 
		class="dash-button"
		:class="buttonClass"
		:style="buttonStyle"
		@click="handleClick"
		:disabled="isDisabled"
	>
		{{ displayText }}
	</button>
</template>

<script setup lang="ts">
import { computed } from "vue"

// Props
interface Props {
	component?: any
	text?: string
	variant?: string
	disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	text: 'Button',
	variant: 'primary',
	disabled: false
})

// Emits
const emit = defineEmits<{
	output: [outputName: string, value: any]
	click: []
}>()

// Computed
const displayText = computed(() => {
	return props.component?.props?.text || props.text
})

const buttonVariant = computed(() => {
	return props.component?.props?.variant || props.variant
})

const isDisabled = computed(() => {
	return props.component?.props?.disabled || props.disabled
})

const buttonClass = computed(() => [
	'dash-button',
	`dash-button-${buttonVariant.value}`
])

const buttonStyle = computed(() => ({
	width: '100%',
	height: '100%',
	border: 'none',
	borderRadius: '4px',
	cursor: isDisabled.value ? 'not-allowed' : 'pointer',
	fontWeight: '500',
	transition: 'all 0.2s',
	opacity: isDisabled.value ? 0.6 : 1
}))

// Methods
const handleClick = () => {
	if (!isDisabled.value) {
		emit('click')
		emit('output', 'click', {
			timestamp: Date.now(),
			componentId: props.component?.id
		})
	}
}
</script>

<style scoped>
.dash-button {
	font-family: inherit;
	font-size: 14px;
}

.dash-button-primary {
	background-color: #007acc;
	color: white;
}

.dash-button-primary:hover:not(:disabled) {
	background-color: #005a9e;
}

.dash-button-secondary {
	background-color: var(--bg-secondary);
	color: var(--text-primary);
	border: 1px solid var(--border-color);
}

.dash-button-secondary:hover:not(:disabled) {
	background-color: var(--border-color);
}

.dash-button-success {
	background-color: #28a745;
	color: white;
}

.dash-button-success:hover:not(:disabled) {
	background-color: #218838;
}

.dash-button-danger {
	background-color: #dc3545;
	color: white;
}

.dash-button-danger:hover:not(:disabled) {
	background-color: #c82333;
}

.dash-button-warning {
	background-color: #ffc107;
	color: #212529;
}

.dash-button-warning:hover:not(:disabled) {
	background-color: #e0a800;
}
</style>
