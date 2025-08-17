<!-- 
Simplified FlowNodeBase using computed port positions
This eliminates complex DOM queries and position calculations
-->

<template>
	<div
		:id="nodeId"
		class="flow-node-base"
		:class="nodeClasses"
		:style="nodeStyles"
		@pointerdown="handlePointerDown($event)"
	>
		<PropertyEditor
			v-if="showPropertyEditor"
			:node="props.context.node"
			:node-definition="props.context.nodeDefinition"
			:is-visible="showPropertyEditor"
			@close="showPropertyEditor = false"
		/>
		<div class="node-content" :style="nodeContentStyles">
			<div class="floating-actions">
				<button class="floating-btn" @click.stop="handleEdit" title="Edit">
					<i class="fa fa-edit"></i>
				</button>
				<button class="floating-btn" @click.stop="handleDuplicate" title="Duplicate">
					<i class="fa fa-copy"></i>
				</button>
				<button class="floating-btn delete" @click.stop="handleDelete" title="Delete">
					<i class="fa fa-trash"></i>
				</button>
			</div>

			<div class="node-header">
				<slot name="header">
					<span class="node-title">{{ nodeTypeUID }}</span>
				</slot>
			</div>

			<div class="node-ports">
				<!-- Left side: Input ports -->
				<div class="ports-container inputs-container">
					<slot name="inputs">
						<div v-for="(inputKey, index) in inputKeys" :key="`input-${index}`" class="port-row">
							<div
								v-if="!hasInputValue(inputKey)"
								class="port-connector input-connector"
								@pointerdown.stop="handleConnectionStart('input', inputKey, $event)"
								@pointerup.stop="handleConnectionEnd('input', inputKey, $event)"
							></div>
							<div v-else class="value-indicator">✓</div>
							<div class="port-label input-label">{{ inputKey }}</div>
						</div>
					</slot>
				</div>

				<!-- Right side: Output ports -->
				<div class="ports-container outputs-container">
					<slot name="outputs">
						<div v-for="(outputKey, index) in outputKeys" :key="`output-${index}`" class="port-row">
							<div class="port-label output-label">{{ outputKey }}</div>
							<div
								class="port-connector output-connector"
								@pointerdown.stop="handleConnectionStart('output', outputKey, $event)"
								@pointerup.stop="handleConnectionEnd('output', outputKey, $event)"
							></div>
						</div>
					</slot>
				</div>
			</div>

			<div class="node-body">
				<slot name="body" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import { usePortPositions } from "./composables/usePortPositions"
	import type { ICustomNodeContext } from "./types"
	import { GRID_SIZE } from "./constants"
	import PropertyEditor from "./PropertyEditor.vue"

	interface Props {
		context: ICustomNodeContext
	}
	const props = defineProps<Props>()

	if (!props.context) console.error("****** No context provided for node!")

	// Get the flowStore
	const flowStore = useFlowStore()

	// Reactive references for the composable
	const node = computed(() => props.context.node)
	const nodeDefinition = computed(() => props.context.nodeDefinition)

	// Use the elegant port position composable
	const { portPositions, getPortPosition, nodeWidth, nodeHeight } = usePortPositions(node, nodeDefinition)

	// Computed properties
	const nodeId = computed(() => props.context.node.id)
	const nodeTypeUID = computed(() => props.context.node.typeUID)
	const initialPosition = computed(() => props.context.node.position)

	// Property editor state
	const showPropertyEditor = ref(false)

	// Node action handlers
	function handleEdit() {
		showPropertyEditor.value = true
	}

	function handleDuplicate() {
		flowStore.duplicateNode(nodeId.value)
	}

	function handleDelete() {
		flowStore.deleteNode(nodeId.value)
	}

	// Port configuration
	const inputKeys = computed(() => Object.keys(props.context.nodeDefinition?.ins || {}))
	const outputKeys = computed(() => Object.keys(props.context.nodeDefinition?.outs || {}))

	// Check if an input has a value set
	function hasInputValue(inputName: string): boolean {
		return !!(
			props.context.node.config?.ins &&
			props.context.node.config.ins[inputName] &&
			props.context.node.config.ins[inputName].value !== undefined
		)
	}

	// Simplified connection handling using computed positions
	function handleConnectionStart(portType: string, portId: string, _event: PointerEvent) {
		console.log(`Starting connection from ${portType} port: ${portId} on node: ${props.context.node.id}`)

		// Get port position using the elegant composable
		const portPosition = getPortPosition(portType as "input" | "output", portId)

		if (!portPosition) {
			console.error(`Port position not found for ${portType}:${portId}`)
			return
		}

		// Start connection with computed position
		flowStore.startConnection({
			nodeId: props.context.node.id,
			portId: portId,
			portType: portType,
			x: portPosition.x,
			y: portPosition.y
		})

		// Add event listeners for connection dragging
		document.addEventListener("pointermove", handleConnectionDrag)
		document.addEventListener("pointerup", handleConnectionUp)
	}

	function handleConnectionEnd(portType: string, portId: string, _event: PointerEvent) {
		console.log(`Ending connection at ${portType} port: ${portId} on node: ${props.context.node.id}`)

		// Get port position using the elegant composable
		const portPosition = getPortPosition(portType as "input" | "output", portId)

		if (!portPosition) {
			console.error(`Port position not found for ${portType}:${portId}`)
			return
		}

		// End connection with computed position
		flowStore.endConnection({
			nodeId: props.context.node.id,
			portId: portId,
			portType: portType,
			x: portPosition.x,
			y: portPosition.y
		})

		// Remove event listeners
		document.removeEventListener("pointermove", handleConnectionDrag)
		document.removeEventListener("pointerup", handleConnectionUp)
	}

	// Connection dragging handlers (simplified)
	const handleConnectionDrag = (e: PointerEvent) => {
		const canvasElement = document.querySelector(".flow-canvas-container")
		if (!canvasElement) return

		const rect = canvasElement.getBoundingClientRect()
		const canvasX = e.clientX - rect.left
		const canvasY = e.clientY - rect.top

		// Convert to world coordinates
		const worldX = (canvasX - flowStore.flowState.pan.x) / flowStore.flowState.zoom
		const worldY = (canvasY - flowStore.flowState.pan.y) / flowStore.flowState.zoom

		flowStore.updateDraggingConnection({ x: worldX, y: worldY })
	}

	const handleConnectionUp = () => {
		if (flowStore.connectionState.dragging) {
			flowStore.cancelConnection()
		}

		document.removeEventListener("pointermove", handleConnectionDrag)
		document.removeEventListener("pointerup", handleConnectionUp)
	}

	// Node dragging (simplified)
	const isDragging = ref(false)
	const position = ref({
		x: snapToGrid(initialPosition.value?.x || 0),
		y: snapToGrid(initialPosition.value?.y || 0)
	})

	let startX = 0
	let startY = 0
	let initialX = 0
	let initialY = 0

	const handlePointerDown = (e: PointerEvent) => {
		if (e.button !== 0) return // Only left pointer button

		// Don't initiate dragging if clicking on a port connector
		if ((e.target as HTMLElement).classList.contains("port-connector")) {
			return
		}

		e.stopPropagation()
		isDragging.value = true
		startX = e.clientX
		startY = e.clientY
		initialX = position.value.x
		initialY = position.value.y

		document.addEventListener("pointermove", handlePointerMove)
		document.addEventListener("pointerup", handlePointerUp)
	}

	const handlePointerMove = (e: PointerEvent) => {
		if (!isDragging.value) return

		const dx = e.clientX - startX
		const dy = e.clientY - startY
		const zoomFactor = flowStore.flowState.zoom || 1

		const newX = snapToGrid(initialX + dx / zoomFactor)
		const newY = snapToGrid(initialY + dy / zoomFactor)

		if (newX !== position.value.x || newY !== position.value.y) {
			position.value = { x: newX, y: newY }
			flowStore.updateNodePosition(nodeId.value, { x: newX, y: newY })
		}
	}

	const handlePointerUp = (e: PointerEvent) => {
		if (isDragging.value) {
			e.stopPropagation()
		}
		isDragging.value = false
		document.removeEventListener("pointermove", handlePointerMove)
		document.removeEventListener("pointerup", handlePointerUp)
	}

	// Computed styles
	const nodeStyles = computed(() => ({
		transform: `translate(${position.value.x}px, ${position.value.y}px)`
	}))

	const nodeContentStyles = computed(() => ({
		width: `${nodeWidth.value}px`,
		height: `${nodeHeight.value}px`
	}))

	const nodeClasses = computed(() => ({
		"is-dragging": isDragging.value
	}))

	function snapToGrid(value: number): number {
		return Math.round(value / GRID_SIZE) * GRID_SIZE
	}

	// Update the flow store with computed port positions whenever they change
	// This replaces all the complex DOM-based position calculations
	watch(
		portPositions,
		(newPositions) => {
			flowStore.updateNodePortPositions({
				nodeId: nodeId.value,
				ports: newPositions
			})
		},
		{ immediate: true, deep: true }
	)
</script>

<style scoped>
	.flow-node-base {
		position: absolute;
		user-select: none;
		cursor: move;
		overflow: visible;
		padding-top: 30px; /* Make room for the floating actions */
	}

	/* Floating actions styles */
	.floating-actions {
		position: absolute;
		top: -30px;
		right: 0;
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: opacity 0.2s;
		z-index: 1000;
		pointer-events: all;
		overflow: visible;
		padding: 4px;
	}

	.floating-btn {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--bg-secondary, #2d2d2d);
		border: 1px solid var(--border-color, #444);
		color: var(--text-secondary, #999);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition: all 0.2s;
	}

	.node-content:hover .floating-actions {
		opacity: 1;
	}

	.floating-btn:hover {
		background: var(--bg-tertiary, #3d3d3d);
		color: var(--text-primary, #fff);
		transform: translateY(-1px);
	}

	.floating-btn.delete:hover {
		background: var(--error, #ff4444);
		border-color: var(--error, #ff4444);
		color: white;
	}

	.floating-btn i {
		font-size: 0.8rem;
		line-height: 1;
	}

	.node-content {
		position: relative;
		background: var(--bg-secondary, #2d2d2d);
		border: 1px solid var(--border-color, #444);
		border-radius: 6px;
		overflow: visible;
		display: flex;
		flex-direction: column;
	}

	.flow-node-base:hover .node-content {
		z-index: 10;
		border-color: var(--border-color-hover, #666);
	}

	.flow-node-base.is-dragging .node-content {
		opacity: 0.8;
		z-index: 100;
	}

	.node-header {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2px;
		background: var(--bg-tertiary, #363636);
		border-bottom: 1px solid var(--border-color, #444);
		border-radius: 6px 6px 0 0;
		height: calc(var(--grid-size) * 1.5);
		flex-shrink: 0;
	}

	.node-title {
		font-size: 0.9em;
		font-weight: 500;
		color: var(--text-primary, #fff);
		user-select: none;
		white-space: nowrap;
		transform: translateZ(0);
		backface-visibility: hidden;
	}

	.node-ports {
		display: flex;
		justify-content: space-between;
		flex: 1;
	}

	.ports-container {
		display: flex;
		flex-direction: column;
	}

	.inputs-container {
		align-items: flex-start;
	}

	.outputs-container {
		align-items: flex-end;
	}

	.port-row {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--grid-size);
	}

	.port-label {
		font-size: 0.9em;
		color: var(--text-secondary, #ccc);
		white-space: nowrap;
	}

	.input-label {
		margin-left: 16px;
	}

	.output-label {
		margin-right: 16px;
	}

	.port-connector {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--connector-bg, #666);
		cursor: pointer;
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
	}

	.input-connector {
		left: 4px;
		transform: translate(-50%, -50%);
	}

	.output-connector {
		right: 4px;
		transform: translate(50%, -50%);
	}

	.port-connector:hover {
		background: var(--connector-hover-bg, #888);
	}

	.value-indicator {
		width: 12px;
		height: 12px;
		cursor: pointer;
		position: absolute;
		top: 30%;
		transform: translateY(-30%);
		font-size: 0.8em;
		color: #4caf50;
	}

	.node-body {
		padding: 0px;
		flex: 1;
	}
</style>
