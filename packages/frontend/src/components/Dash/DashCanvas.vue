<template>
	<div 
		ref="canvasRef"
		class="dash-canvas"
		:class="{ 'drag-over': isDraggedOver }"
		@dragenter.prevent="handleDragEnter"
		@dragover.prevent="handleDragOver"
		@dragleave.prevent="handleDragLeave"
		@drop.prevent="handleDrop"
		@pointerdown="handleCanvasPointerDown"
	>
		<div 
			class="canvas-content"
			:style="canvasStyle"
		>
			<!-- Grid overlay -->
			<DashGridOverlay v-if="dashStore.showGrid && dashStore.currentDashboard" />
			
			<!-- Dashboard components -->
			<DashComponentBase
				v-for="component in dashStore.currentDashboard?.components || []"
				:key="component.id"
				:component="component"
				:selected="component.id === dashStore.selectedComponentId"
				@select="dashStore.selectComponent(component.id)"
				@update="handleComponentUpdate"
				@delete="dashStore.deleteComponent(component.id)"
			/>
			
			<!-- Selection rectangle (for future multi-select) -->
			<div 
				v-if="selectionRect.visible"
				class="selection-rectangle"
				:style="selectionRectStyle"
			/>
		</div>
		
		<!-- Canvas info overlay -->
		<div class="canvas-info">
			<div v-if="dashStore.currentDashboard">
				{{ dashStore.currentDashboard.name }} - {{ dashStore.currentFormat.name }}
			</div>
			<div v-else>
				No dashboard loaded
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue"
import { useDashStore } from "../../stores/dashStore"
import DashComponentBase from "./DashComponentBase.vue"
import DashGridOverlay from "./DashGridOverlay.vue"
import type { IDashComponent, IDashPosition } from "./types"

const dashStore = useDashStore()

// Refs
const canvasRef = ref<HTMLElement | null>(null)
const isDraggedOver = ref(false)

// Selection rectangle state
const selectionRect = reactive({
	visible: false,
	startX: 0,
	startY: 0,
	endX: 0,
	endY: 0
})

// Computed styles
const canvasStyle = computed(() => {
	if (!dashStore.currentDashboard) return {}
	
	const format = dashStore.currentFormat
	return {
		width: format.width + 'px',
		height: format.height + 'px',
		backgroundColor: dashStore.currentDashboard.backgroundColor,
		margin: '20px auto',
		position: 'relative',
		border: '1px solid var(--border-color)',
		borderRadius: '4px',
		overflow: 'hidden'
	}
})

const selectionRectStyle = computed(() => ({
	position: 'absolute',
	left: Math.min(selectionRect.startX, selectionRect.endX) + 'px',
	top: Math.min(selectionRect.startY, selectionRect.endY) + 'px',
	width: Math.abs(selectionRect.endX - selectionRect.startX) + 'px',
	height: Math.abs(selectionRect.endY - selectionRect.startY) + 'px',
	border: '1px dashed #007acc',
	backgroundColor: 'rgba(0, 122, 204, 0.1)',
	pointerEvents: 'none'
}))

// Drag and drop handlers
const handleDragEnter = () => {
	isDraggedOver.value = true
}

const handleDragOver = (e: DragEvent) => {
	e.dataTransfer!.dropEffect = "copy"
}

const handleDragLeave = () => {
	isDraggedOver.value = false
}

const handleDrop = (e: DragEvent) => {
	isDraggedOver.value = false
	
	const componentType = e.dataTransfer!.getData("component-type")
	if (!componentType || !dashStore.currentDashboard) return
	
	// Calculate position relative to canvas content
	const rect = canvasRef.value!.getBoundingClientRect()
	const contentRect = canvasRef.value!.querySelector('.canvas-content')!.getBoundingClientRect()
	
	const position: IDashPosition = {
		x: e.clientX - contentRect.left,
		y: e.clientY - contentRect.top
	}
	
	// Add component
	const component = dashStore.addComponent(componentType, position)
	dashStore.selectComponent(component.id)
}

// Canvas interaction handlers
const handleCanvasPointerDown = (e: PointerEvent) => {
	// Only handle if clicking on canvas background
	if (e.target === canvasRef.value || e.target === canvasRef.value?.querySelector('.canvas-content')) {
		dashStore.selectComponent(null)
		
		// Start selection rectangle (for future multi-select)
		const rect = canvasRef.value!.querySelector('.canvas-content')!.getBoundingClientRect()
		selectionRect.startX = e.clientX - rect.left
		selectionRect.startY = e.clientY - rect.top
		selectionRect.endX = selectionRect.startX
		selectionRect.endY = selectionRect.startY
		selectionRect.visible = true
		
		document.addEventListener('pointermove', handleSelectionDrag)
		document.addEventListener('pointerup', handleSelectionEnd)
	}
}

const handleSelectionDrag = (e: PointerEvent) => {
	if (!selectionRect.visible) return
	
	const rect = canvasRef.value!.querySelector('.canvas-content')!.getBoundingClientRect()
	selectionRect.endX = e.clientX - rect.left
	selectionRect.endY = e.clientY - rect.top
}

const handleSelectionEnd = () => {
	selectionRect.visible = false
	document.removeEventListener('pointermove', handleSelectionDrag)
	document.removeEventListener('pointerup', handleSelectionEnd)
}

// Component update handler
const handleComponentUpdate = (componentId: string, updates: Partial<IDashComponent>) => {
	dashStore.updateComponent(componentId, updates)
}
</script>

<style scoped>
.dash-canvas {
	width: 100%;
	height: 100%;
	overflow: auto;
	background-color: var(--bg-primary);
	position: relative;
}

.dash-canvas.drag-over {
	background-color: rgba(0, 122, 204, 0.1);
}

.canvas-content {
	position: relative;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.selection-rectangle {
	z-index: 1000;
}

.canvas-info {
	position: absolute;
	bottom: 10px;
	left: 10px;
	background-color: rgba(0, 0, 0, 0.7);
	color: var(--text-primary);
	padding: 0.5rem;
	border-radius: 4px;
	font-size: 0.8rem;
	pointer-events: none;
}

/* Scrollbar styling */
.dash-canvas::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.dash-canvas::-webkit-scrollbar-track {
	background: var(--bg-secondary);
}

.dash-canvas::-webkit-scrollbar-thumb {
	background: var(--border-color);
	border-radius: 4px;
}

.dash-canvas::-webkit-scrollbar-thumb:hover {
	background: #555;
}
</style>
