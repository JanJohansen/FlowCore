<template>
	<div class="format-selector">
		<div class="selector-content">
			<label>Format:</label>
			<select 
				:value="currentFormat.name" 
				@change="handleFormatChange"
				class="format-select"
			>
				<option 
					v-for="format in dashStore.availableFormats" 
					:key="format.name" 
					:value="format.name"
				>
					{{ format.name }} ({{ format.width }}×{{ format.height }})
				</option>
			</select>
			
			<div v-if="isCustomFormat" class="custom-dimensions">
				<input 
					type="number" 
					:value="currentFormat.width"
					@input="updateCustomDimension('width', $event)"
					placeholder="Width"
					class="dimension-input"
				/>
				<span>×</span>
				<input 
					type="number" 
					:value="currentFormat.height"
					@input="updateCustomDimension('height', $event)"
					placeholder="Height"
					class="dimension-input"
				/>
			</div>
			
			<div class="format-info">
				<span class="aspect-ratio">{{ currentFormat.aspectRatio }}</span>
				<span class="dimensions">{{ currentFormat.width }}×{{ currentFormat.height }}</span>
			</div>
		</div>
		
		<div class="zoom-controls">
			<button @click="zoomOut" title="Zoom Out">
				<i class="fa fa-search-minus"></i>
			</button>
			<span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
			<button @click="zoomIn" title="Zoom In">
				<i class="fa fa-search-plus"></i>
			</button>
			<button @click="resetZoom" title="Reset Zoom">
				<i class="fa fa-expand"></i>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useDashStore } from "../../stores/dashStore"
import type { IDashFormat } from "./types"

const dashStore = useDashStore()

// State
const zoomLevel = ref(1)

// Computed
const currentFormat = computed(() => dashStore.currentFormat)

const isCustomFormat = computed(() => 
	currentFormat.value.name === 'Custom'
)

// Methods
const handleFormatChange = (event: Event) => {
	const selectedName = (event.target as HTMLSelectElement).value
	const format = dashStore.availableFormats.find(f => f.name === selectedName)
	
	if (format && dashStore.currentDashboard) {
		dashStore.updateComponent = dashStore.updateComponent || (() => {})
		
		// Update dashboard format
		const updatedDashboard = {
			...dashStore.currentDashboard,
			format: { ...format }
		}
		
		dashStore.currentDashboard.format = updatedDashboard.format
		dashStore.saveDashboard(updatedDashboard)
	}
}

const updateCustomDimension = (dimension: 'width' | 'height', event: Event) => {
	if (!isCustomFormat.value || !dashStore.currentDashboard) return
	
	const value = parseInt((event.target as HTMLInputElement).value)
	if (isNaN(value) || value < 100) return
	
	const newFormat: IDashFormat = {
		...currentFormat.value,
		[dimension]: value,
		aspectRatio: 'Custom'
	}
	
	dashStore.currentDashboard.format = newFormat
	dashStore.saveDashboard(dashStore.currentDashboard)
}

const zoomIn = () => {
	zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3)
	applyZoom()
}

const zoomOut = () => {
	zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1)
	applyZoom()
}

const resetZoom = () => {
	zoomLevel.value = 1
	applyZoom()
}

const applyZoom = () => {
	// Apply zoom to canvas - this would need to be implemented in the canvas component
	// For now, we'll just store the zoom level
	console.log('Zoom level:', zoomLevel.value)
}
</script>

<style scoped>
.format-selector {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.5rem 1rem;
	background-color: var(--bg-secondary);
	border-bottom: 1px solid var(--border-color);
	gap: 1rem;
}

.selector-content {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.selector-content label {
	color: var(--text-primary);
	font-weight: 500;
}

.format-select {
	padding: 0.25rem 0.5rem;
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 4px;
	min-width: 200px;
}

.custom-dimensions {
	display: flex;
	align-items: center;
	gap: 0.25rem;
}

.dimension-input {
	width: 80px;
	padding: 0.25rem 0.5rem;
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 4px;
	text-align: center;
}

.format-info {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--text-secondary);
	font-size: 0.9rem;
}

.aspect-ratio {
	background-color: var(--bg-primary);
	padding: 0.125rem 0.375rem;
	border-radius: 3px;
	font-family: monospace;
}

.dimensions {
	font-family: monospace;
}

.zoom-controls {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.zoom-controls button {
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	cursor: pointer;
	transition: background-color 0.2s;
}

.zoom-controls button:hover {
	background-color: var(--border-color);
}

.zoom-level {
	color: var(--text-primary);
	font-family: monospace;
	min-width: 50px;
	text-align: center;
}
</style>
