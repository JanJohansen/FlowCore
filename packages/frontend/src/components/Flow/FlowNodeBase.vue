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
			:node="node"
			:node-definition="nodeDefinition"
			:is-visible="showPropertyEditor"
			@close="showPropertyEditor = false"
		/>
		<div class="node-content">
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
						<div v-for="index in inputKeys.length" :key="`input-${index}`" class="port-row">
							<div v-if="inputKeys[index - 1]">
								<div
									v-if="!hasInputValue(inputKeys[index - 1])"
									class="port-connector input-connector"
									@pointerdown.stop="handleConnectionStart('input', inputKeys[index - 1], $event)"
									@pointerup.stop="handleConnectionEnd('input', inputKeys[index - 1], $event)"
								></div>
								<div v-else class="value-indicator">✓</div>
								<div class="port-label input-label">
									{{ inputKeys[index - 1] }}
								</div>
							</div>
						</div>
					</slot>
				</div>

				<!-- Right side: Output ports -->
				<div class="ports-container outputs-container">
					<slot name="outputs">
						<div v-for="index in outputKeys.length" :key="`output-${index}`" class="port-row">
							<div v-if="outputKeys[index - 1]">
								<div class="port-label output-label">{{ outputKeys[index - 1] }}</div>
								<div
									class="port-connector output-connector"
									@pointerdown.stop="handleConnectionStart('output', outputKeys[index - 1], $event)"
									@pointerup.stop="handleConnectionEnd('output', outputKeys[index - 1], $event)"
								></div>
							</div>
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
	export interface ICustomeNodeContext {
		node: { id: string }
		nodeDefinition: INodeDefinition
		db: any
	}
	import { computed, ref, onMounted, watch, onUnmounted, nextTick } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import type { INodeDefinition, IFlowNodeModel } from "./types"
	import { GRID_SIZE, NODE_WIDTH } from "./constants"
	import PropertyEditor from "./PropertyEditor.vue"

	interface Props {
		context: ICustomeNodeContext
		node: IFlowNodeModel
		nodeDefinition: INodeDefinition
	}
	const props = defineProps<Props>()

	if (!props.context) console.error("****** No context provided for node:", props.node)

	// Get the flowStore
	const flowStore = useFlowStore()

	// Use the ref in computed properties or pass directly to child components
	const nodeId = computed(() => props.node.id)
	const nodeTypeUID = computed(() => props.node.typeUID)
	const initialPosition = computed(() => props.node.position)

	// Property editor state
	const showPropertyEditor = ref(false)

	// Node action handlers - call FlowStore methods directly
	function handleEdit() {
		showPropertyEditor.value = true
	}

	function handleDuplicate() {
		// Call FlowStore method directly instead of emitting event
		flowStore.duplicateNode(nodeId.value)
	}

	function handleDelete() {
		// Call FlowStore method directly instead of emitting event
		flowStore.deleteNode(nodeId.value)
	}

	// NodePorts functionality
	const inputKeys = computed(() => Object.keys(props.nodeDefinition?.ins || {}))
	const outputKeys = computed(() => Object.keys(props.nodeDefinition?.outs || {}))
	const maxPorts = computed(() => Math.max(inputKeys.value.length, outputKeys.value.length))

	// Check if an input has a value set
	function hasInputValue(inputName: string): boolean {
		return !!(
			props.node.config?.ins &&
			props.node.config.ins[inputName] &&
			props.node.config.ins[inputName].value !== undefined
		)
	}

	// Connection handling - call FlowStore methods directly
	function handleConnectionStart(portType: string, portId: string, _event: PointerEvent) {
		console.log(`Starting connection from ${portType} port: ${portId} on node: ${props.node.id}`)

		// Get the port position from the nodePortPositions
		const nodePorts = flowStore.nodePortPositions.get(props.node.id)
		let portPosition = { x: 0, y: 0 }

		if (nodePorts) {
			// Find the port by index
			const portList = portType === "input" ? nodePorts.inputs : nodePorts.outputs
			const nodeDef = flowStore.getNodeDefinition(props.node.typeUID)
			const portKeys = portType === "input" ? Object.keys(nodeDef?.ins || {}) : Object.keys(nodeDef?.outs || {})

			const portIndex = portKeys.indexOf(portId)

			if (portIndex !== -1 && portList[portIndex]) {
				// Use the actual port position from our stored positions
				portPosition = {
					x: portList[portIndex].x,
					y: portList[portIndex].y
				}
			}
		}

		// Call FlowStore method directly instead of emitting event
		flowStore.startConnection({
			nodeId: props.node.id,
			portId: portId,
			portType: portType,
			x: portPosition.x,
			y: portPosition.y
		})

		// Add pointermove listener to track the dragging connection
		document.addEventListener("pointermove", handleConnectionDrag)
		document.addEventListener("pointerup", handleConnectionUp)
	}

	function handleConnectionEnd(portType: string, portId: string, _event: PointerEvent) {
		console.log(`Ending connection at ${portType} port: ${portId} on node: ${props.node.id}`)

		// Get the port position from the nodePortPositions
		const nodePorts = flowStore.nodePortPositions.get(props.node.id)
		let portPosition = { x: 0, y: 0 }

		if (nodePorts) {
			// Find the port by index
			const portList = portType === "input" ? nodePorts.inputs : nodePorts.outputs
			const nodeDef = flowStore.getNodeDefinition(props.node.typeUID)
			const portKeys = portType === "input" ? Object.keys(nodeDef?.ins || {}) : Object.keys(nodeDef?.outs || {})

			const portIndex = portKeys.indexOf(portId)

			if (portIndex !== -1 && portList[portIndex]) {
				// Use the actual port position from our stored positions
				portPosition = {
					x: portList[portIndex].x,
					y: portList[portIndex].y
				}
			}
		}

		// Call FlowStore method directly instead of emitting event
		flowStore.endConnection({
			nodeId: props.node.id,
			portId: portId,
			portType: portType,
			x: portPosition.x,
			y: portPosition.y
		})

		// Remove event listeners
		document.removeEventListener("pointermove", handleConnectionDrag)
		document.removeEventListener("pointerup", handleConnectionUp)
	}

	// Connection dragging handlers
	const handleConnectionDrag = (e: PointerEvent) => {
		// Convert pointer position to canvas coordinates
		const canvasElement = document.querySelector(".flow-canvas-container")
		if (!canvasElement) return

		const rect = canvasElement.getBoundingClientRect()
		const canvasX = e.clientX - rect.left
		const canvasY = e.clientY - rect.top

		// Convert to world coordinates
		const worldX = (canvasX - flowStore.flowState.pan.x) / flowStore.flowState.zoom
		const worldY = (canvasY - flowStore.flowState.pan.y) / flowStore.flowState.zoom

		// Update the dragging connection with world coordinates
		flowStore.updateDraggingConnection({ x: worldX, y: worldY })
	}

	const handleConnectionUp = () => {
		// If connection wasn't completed, cancel it
		if (flowStore.connectionState.dragging) {
			flowStore.cancelConnection()
		}

		// Remove event listeners
		document.removeEventListener("pointermove", handleConnectionDrag)
		document.removeEventListener("pointerup", handleConnectionUp)
	}

	// Node dragging
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

		// Stop event propagation to prevent canvas panning
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

		// Adjust for zoom level when calculating displacement
		const zoomFactor = flowStore.flowState.zoom || 1

		// Calculate new position
		const newX = snapToGrid(initialX + dx / zoomFactor)
		const newY = snapToGrid(initialY + dy / zoomFactor)

		// Only update if the position has actually changed (snapped to a new grid position)
		if (newX !== position.value.x || newY !== position.value.y) {
			position.value = { x: newX, y: newY }

			// Update the node position in the flowStore
			flowStore.updateNodePosition(nodeId.value, { x: newX, y: newY })
		}
	}

	const handlePointerUp = (e: PointerEvent) => {
		if (isDragging.value) {
			// Stop event propagation to prevent canvas panning
			e.stopPropagation()
		}

		isDragging.value = false
		document.removeEventListener("pointermove", handlePointerMove)
		document.removeEventListener("pointerup", handlePointerUp)
	}

	// Computed styles and classes
	const nodeStyles = computed(() => ({
		transform: `translate(${position.value.x}px, ${position.value.y}px)`
	}))

	const nodeClasses = computed(() => ({
		"is-dragging": isDragging.value
	}))

	function snapToGrid(value: number): number {
		return Math.round(value / GRID_SIZE) * GRID_SIZE
	}

	// Update port positions
	function updatePortPositions() {
		// Use nextTick to ensure the DOM is updated
		nextTick(() => {
			// Try to find the node element by ID
			const nodeElement = document.getElementById(nodeId.value)
			if (!nodeElement) {
				console.warn(`Node element with ID ${nodeId.value} not found, retrying...`)
				// Retry after a short delay
				setTimeout(updatePortPositions, 100)
				return
			}

			const nodeRect = nodeElement.getBoundingClientRect()

			// Get the current node position from the store
			const node = flowStore.flowState.nodes.find((n) => n.id === nodeId.value)
			if (!node) {
				console.error(`Node ${nodeId.value} not found in flowState`)
				return
			}

			// Use the node's actual position from the store
			const nodePosition = node.position

			const inputs = Array.from(nodeElement.querySelectorAll(".input-connector")).map((el, index) => {
				const rect = el.getBoundingClientRect()
				// Calculate the port's position relative to the node
				const relativeX = (rect.left + rect.width / 2 - nodeRect.left) / flowStore.flowState.zoom
				const relativeY = (rect.top + rect.height / 2 - nodeRect.top) / flowStore.flowState.zoom

				// Add the node's position to get the absolute position in world coordinates
				return {
					index,
					x: nodePosition.x + relativeX,
					y: nodePosition.y + relativeY
				}
			})

			const outputs = Array.from(nodeElement.querySelectorAll(".output-connector")).map((el, index) => {
				const rect = el.getBoundingClientRect()
				// Calculate the port's position relative to the node
				const relativeX = (rect.left + rect.width / 2 - nodeRect.left) / flowStore.flowState.zoom
				const relativeY = (rect.top + rect.height / 2 - nodeRect.top) / flowStore.flowState.zoom

				// Add the node's position to get the absolute position in world coordinates
				return {
					index,
					x: nodePosition.x + relativeX,
					y: nodePosition.y + relativeY
				}
			})

			// Log for debugging
			console.log(`Updating port positions for node ${nodeId.value}:`, { inputs, outputs })

			// Update the port positions in the store
			flowStore.updateNodePortPositions({
				nodeId: nodeId.value,
				ports: { inputs, outputs }
			})
		})
	}

	// Call updatePortPositions after the component is mounted
	onMounted(() => {
		// Use nextTick to ensure the DOM is updated
		nextTick(() => {
			// Add a small delay to ensure the DOM is fully rendered
			setTimeout(() => {
				updatePortPositions()
			}, 100)
		})

		// Add event listeners
		window.addEventListener("resize", updatePortPositions)
	})

	// Update port positions when the node is moved or when zoom changes
	watch(
		[position, () => flowStore.flowState.zoom],
		([newPosition, newZoom], [oldPosition, oldZoom]) => {
			// Only update port positions if position or zoom has actually changed
			if (
				!oldPosition ||
				!newPosition ||
				newPosition.x !== oldPosition.x ||
				newPosition.y !== oldPosition.y ||
				newZoom !== oldZoom
			) {
				updatePortPositions()
			}
		},
		{ deep: true }
	)

	// Also update port positions when the window is resized
	onMounted(() => {
		window.addEventListener("resize", updatePortPositions)
	})

	onUnmounted(() => {
		window.removeEventListener("resize", updatePortPositions)
	})
</script>

<style scoped>
	.flow-node-base {
		position: absolute;
		width: v-bind('NODE_WIDTH + "px"');
		min-width: 150px;
		user-select: none;
		cursor: move;
		overflow: visible;
		padding-top: 30px; /* Make room for the floating actions */
	}

	/* Floating actions styles (integrated from NodeActions.vue) */
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

	.above-ports {
		height: 1rem;
	}

	.node-content {
		position: relative;
		background: var(--bg-secondary, #2d2d2d);
		border: 1px solid var(--border-color, #444);
		border-radius: 6px;
		overflow: visible; /* Ensure children aren't clipped */
	}

	.flow-node-base:hover .node-content {
		z-index: 10;
		border-color: var(--border-color-hover, #666);
	}

	.flow-node-base.is-dragging .node-content {
		opacity: 0.8;
		z-index: 100;
	}

	.node-body {
		padding: 0px;
	}

	/* Add the NodeHeader styles directly */
	.node-header {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 2px;
		background: var(--bg-tertiary, #363636);
		border-bottom: 1px solid var(--border-color, #444);
		border-radius: 6px 6px 0 0;
		height: calc(var(--grid-size) * 1.5);
	}

	.upper-body {
		height: calc(var(--grid-size) * 0.5);
	}

	.node-title {
		font-size: 0.9em;
		font-weight: 500;
		color: var(--text-primary, #fff);
		user-select: none;
		/* Prevent blurry text during transforms */
		transform: translateZ(0);
		backface-visibility: hidden;
	}

	/* NodePorts styles */
	.node-ports {
		width: 100%;
		display: flex;
		justify-content: space-between;
	}

	.ports-container {
		display: flex;
		flex-direction: column;
		/* flex: 1; */
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

	.port-connector.has-value {
		background-color: #4caf50;
		cursor: default;
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
</style>
