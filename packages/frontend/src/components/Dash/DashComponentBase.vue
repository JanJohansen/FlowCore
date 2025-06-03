<template>
	<div
		:id="component.id"
		class="dash-component"
		:class="{
			selected: selected,
			dragging: isDragging,
			resizing: isResizing
		}"
		:style="componentStyle"
		@pointerdown="handlePointerDown"
		@click="handleClick"
	>
		<!-- Component content -->
		<div class="component-content" :style="contentStyle">
			<component
				:is="componentType"
				v-bind="component.props"
				:inputs="component.inputs"
				@update:inputs="handleInputsUpdate"
				@output="handleOutput"
			/>
		</div>

		<!-- Selection overlay and resize handles -->
		<div v-if="selected && dashStore.isDesignMode" class="selection-overlay">
			<!-- Resize handles -->
			<div
				v-for="handle in resizeHandles"
				:key="handle"
				:class="['resize-handle', `resize-${handle}`]"
				@pointerdown.stop="startResize(handle, $event)"
			/>

			<!-- Component info -->
			<div class="component-info">
				{{ component.type }} ({{ component.size.width }}×{{ component.size.height }})
			</div>

			<!-- Action buttons -->
			<div class="component-actions">
				<button @click.stop="handleEdit" title="Edit">
					<i class="fa fa-edit"></i>
				</button>
				<button @click.stop="handleDuplicate" title="Duplicate">
					<i class="fa fa-copy"></i>
				</button>
				<button @click.stop="handleDelete" title="Delete">
					<i class="fa fa-trash"></i>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from "vue"
	import { useDashStore } from "../../stores/dashStore"
	import { loadDashComponent } from "./componentLoader"
	import type { IDashComponent, ResizeHandle } from "./types"
	import { RESIZE_HANDLES, Z_INDEX } from "./constants"

	// Props
	interface Props {
		component: IDashComponent
		selected: boolean
	}

	const props = defineProps<Props>()

	// Emits
	const emit = defineEmits<{
		select: [componentId: string]
		update: [componentId: string, updates: Partial<IDashComponent>]
		delete: [componentId: string]
	}>()

	const dashStore = useDashStore()

	// State
	const isDragging = ref(false)
	const isResizing = ref(false)
	const dragStart = ref({ x: 0, y: 0 })
	const initialPosition = ref({ x: 0, y: 0 })
	const initialSize = ref({ width: 0, height: 0 })
	const resizeHandle = ref<ResizeHandle | null>(null)

	// Computed
	const componentStyle = computed(() => ({
		position: "absolute",
		left: props.component.position.x + "px",
		top: props.component.position.y + "px",
		width: props.component.size.width + "px",
		height: props.component.size.height + "px",
		zIndex: props.selected ? Z_INDEX.SELECTED_COMPONENT : Z_INDEX.COMPONENTS,
		cursor: isDragging.value ? "grabbing" : "grab"
	}))

	const contentStyle = computed(() => ({
		width: "100%",
		height: "100%",
		overflow: "hidden",
		borderRadius: "4px"
	}))

	const componentType = computed(() => {
		return loadDashComponent({
			component: props.component,
			componentDefinitions: dashStore.componentDefinitions,
			isRuntime: false
		})
	})

	const resizeHandles = computed(() => RESIZE_HANDLES)

	// Methods
	const handleClick = (e: PointerEvent) => {
		e.stopPropagation()
		emit("select", props.component.id)
	}

	const handlePointerDown = (e: PointerEvent) => {
		if (!dashStore.isDesignMode || e.button !== 0) return

		e.stopPropagation()

		isDragging.value = true
		dragStart.value = { x: e.clientX, y: e.clientY }
		initialPosition.value = { ...props.component.position }

		document.addEventListener("pointermove", handleDrag)
		document.addEventListener("pointerup", handleDragEnd)
	}

	const handleDrag = (e: PointerEvent) => {
		if (!isDragging.value) return

		const dx = e.clientX - dragStart.value.x
		const dy = e.clientY - dragStart.value.y

		const newPosition = {
			x: initialPosition.value.x + dx,
			y: initialPosition.value.y + dy
		}

		// Snap to grid if enabled
		const snappedPosition = dashStore.snapToGrid(newPosition)

		emit("update", props.component.id, { position: snappedPosition })
	}

	const handleDragEnd = () => {
		isDragging.value = false
		document.removeEventListener("pointermove", handleDrag)
		document.removeEventListener("pointerup", handleDragEnd)
	}

	const startResize = (handle: ResizeHandle, e: PointerEvent) => {
		e.stopPropagation()

		isResizing.value = true
		resizeHandle.value = handle
		dragStart.value = { x: e.clientX, y: e.clientY }
		initialPosition.value = { ...props.component.position }
		initialSize.value = { ...props.component.size }

		document.addEventListener("pointermove", handleResize)
		document.addEventListener("pointerup", handleResizeEnd)
	}

	const handleResize = (e: PointerEvent) => {
		if (!isResizing.value || !resizeHandle.value) return

		const dx = e.clientX - dragStart.value.x
		const dy = e.clientY - dragStart.value.y

		let newPosition = { ...initialPosition.value }
		let newSize = { ...initialSize.value }

		// Calculate new size and position based on resize handle
		switch (resizeHandle.value) {
			case "nw":
				newPosition.x = initialPosition.value.x + dx
				newPosition.y = initialPosition.value.y + dy
				newSize.width = initialSize.value.width - dx
				newSize.height = initialSize.value.height - dy
				break
			case "n":
				newPosition.y = initialPosition.value.y + dy
				newSize.height = initialSize.value.height - dy
				break
			case "ne":
				newPosition.y = initialPosition.value.y + dy
				newSize.width = initialSize.value.width + dx
				newSize.height = initialSize.value.height - dy
				break
			case "w":
				newPosition.x = initialPosition.value.x + dx
				newSize.width = initialSize.value.width - dx
				break
			case "e":
				newSize.width = initialSize.value.width + dx
				break
			case "sw":
				newPosition.x = initialPosition.value.x + dx
				newSize.width = initialSize.value.width - dx
				newSize.height = initialSize.value.height + dy
				break
			case "s":
				newSize.height = initialSize.value.height + dy
				break
			case "se":
				newSize.width = initialSize.value.width + dx
				newSize.height = initialSize.value.height + dy
				break
		}

		// Enforce minimum size
		newSize.width = Math.max(50, newSize.width)
		newSize.height = Math.max(30, newSize.height)

		// Snap to grid if enabled
		const snappedPosition = dashStore.snapToGrid(newPosition)
		const snappedSize = dashStore.snapSizeToGrid(newSize)

		emit("update", props.component.id, {
			position: snappedPosition,
			size: snappedSize
		})
	}

	const handleResizeEnd = () => {
		isResizing.value = false
		resizeHandle.value = null
		document.removeEventListener("pointermove", handleResize)
		document.removeEventListener("pointerup", handleResizeEnd)
	}

	const handleEdit = () => {
		// TODO: Open component editor
		console.log("Edit component:", props.component.id)
	}

	const handleDuplicate = () => {
		// TODO: Duplicate component
		console.log("Duplicate component:", props.component.id)
	}

	const handleDelete = () => {
		emit("delete", props.component.id)
	}

	const handleInputsUpdate = (inputs: Record<string, any>) => {
		emit("update", props.component.id, { inputs })
	}

	const handleOutput = (outputName: string, value: any) => {
		// Handle component outputs - integrate with CoreDB
		const outputKey = `dash:${props.component.id}:${outputName}`
		dashStore.db.set(outputKey, value)
	}
</script>

<style scoped>
	.dash-component {
		border: 1px solid transparent;
		transition: border-color 0.2s;
	}

	.dash-component.selected {
		border-color: #007acc;
	}

	.dash-component.dragging {
		opacity: 0.8;
	}

	.dash-component.resizing {
		opacity: 0.9;
	}

	.component-content {
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 4px;
	}

	.selection-overlay {
		position: absolute;
		top: -1px;
		left: -1px;
		right: -1px;
		bottom: -1px;
		pointer-events: none;
	}

	.resize-handle {
		position: absolute;
		background-color: #007acc;
		border: 1px solid white;
		pointer-events: auto;
		width: 8px;
		height: 8px;
	}

	.resize-nw {
		top: -4px;
		left: -4px;
		cursor: nw-resize;
	}
	.resize-n {
		top: -4px;
		left: 50%;
		transform: translateX(-50%);
		cursor: n-resize;
	}
	.resize-ne {
		top: -4px;
		right: -4px;
		cursor: ne-resize;
	}
	.resize-w {
		top: 50%;
		left: -4px;
		transform: translateY(-50%);
		cursor: w-resize;
	}
	.resize-e {
		top: 50%;
		right: -4px;
		transform: translateY(-50%);
		cursor: e-resize;
	}
	.resize-sw {
		bottom: -4px;
		left: -4px;
		cursor: sw-resize;
	}
	.resize-s {
		bottom: -4px;
		left: 50%;
		transform: translateX(-50%);
		cursor: s-resize;
	}
	.resize-se {
		bottom: -4px;
		right: -4px;
		cursor: se-resize;
	}

	.component-info {
		position: absolute;
		top: -25px;
		left: 0;
		background-color: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 11px;
		white-space: nowrap;
		pointer-events: none;
	}

	.component-actions {
		position: absolute;
		top: -25px;
		right: 0;
		display: flex;
		gap: 2px;
		pointer-events: auto;
	}

	.component-actions button {
		background-color: rgba(0, 0, 0, 0.8);
		border: none;
		color: white;
		padding: 2px 4px;
		border-radius: 3px;
		cursor: pointer;
		font-size: 10px;
	}

	.component-actions button:hover {
		background-color: rgba(0, 0, 0, 1);
	}
</style>
