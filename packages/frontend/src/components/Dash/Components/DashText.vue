<template>
	<div class="dash-text" :style="textStyle">
		{{ displayText }}
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"

// Props
interface Props {
	component?: any
	text?: string
	fontSize?: number
	color?: string
	fontWeight?: string
	textAlign?: string
}

const props = withDefaults(defineProps<Props>(), {
	text: 'Sample Text',
	fontSize: 16,
	color: '#ffffff',
	fontWeight: 'normal',
	textAlign: 'left'
})

// Computed
const displayText = computed(() => {
	return props.component?.props?.text || props.text
})

const textStyle = computed(() => ({
	fontSize: (props.component?.props?.fontSize || props.fontSize) + 'px',
	color: props.component?.props?.color || props.color,
	fontWeight: props.component?.props?.fontWeight || props.fontWeight,
	textAlign: props.component?.props?.textAlign || props.textAlign,
	width: '100%',
	height: '100%',
	display: 'flex',
	alignItems: 'center',
	padding: '8px',
	wordWrap: 'break-word',
	overflow: 'hidden'
}))
</script>

<style scoped>
.dash-text {
	user-select: none;
}
</style>
