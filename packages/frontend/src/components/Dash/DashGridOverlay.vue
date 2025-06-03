<template>
	<div class="grid-overlay" :style="gridStyle">
		<svg class="grid-svg" :width="format.width" :height="format.height">
			<!-- Vertical lines -->
			<line
				v-for="x in verticalLines"
				:key="'v' + x"
				:x1="x"
				:y1="0"
				:x2="x"
				:y2="format.height"
				class="grid-line"
			/>
			<!-- Horizontal lines -->
			<line
				v-for="y in horizontalLines"
				:key="'h' + y"
				:x1="0"
				:y1="y"
				:x2="format.width"
				:y2="y"
				class="grid-line"
			/>
		</svg>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useDashStore } from "../../stores/dashStore"

const dashStore = useDashStore()

const format = computed(() => dashStore.currentFormat)
const gridSize = computed(() => dashStore.currentDashboard?.gridSize || 10)

const verticalLines = computed(() => {
	const lines = []
	for (let x = 0; x <= format.value.width; x += gridSize.value) {
		lines.push(x)
	}
	return lines
})

const horizontalLines = computed(() => {
	const lines = []
	for (let y = 0; y <= format.value.height; y += gridSize.value) {
		lines.push(y)
	}
	return lines
})

const gridStyle = computed(() => ({
	position: 'absolute',
	top: 0,
	left: 0,
	width: '100%',
	height: '100%',
	pointerEvents: 'none',
	zIndex: 1
}))
</script>

<style scoped>
.grid-overlay {
	opacity: 0.3;
}

.grid-svg {
	display: block;
}

.grid-line {
	stroke: var(--border-color);
	stroke-width: 0.5;
}
</style>
