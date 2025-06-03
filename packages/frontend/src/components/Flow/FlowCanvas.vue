<template>
	<div
		ref="canvasRef"
		class="flow-canvas-container"
		:class="{ 'drag-over': isDraggedOver }"
		@dragenter.prevent="handleDragEnter"
		@dragover.prevent="handleDragOver"
		@dragleave.prevent="handleDragLeave"
		@drop.prevent="handleDrop"
	>
		<!-- Add the NodeEditorModal component -->
		<NodeEditorModal
			:visible="flowStore.editState.isEditModalVisible"
			:nodeId="flowStore.editState.editingNodeId"
			@close="flowStore.closeNodeEditor"
			@save="handleNodeInputSave"
		/>

		<div class="flow-canvas" @pointerdown.prevent="handlePointerDown">
			<div
				class="canvas-content"
				:style="{
					transform: `translate(${flowStore.flowState.pan.x}px, ${flowStore.flowState.pan.y}px) scale(${flowStore.flowState.zoom})`,
					transformOrigin: '0 0'
				}"
			>
				<!-- Grid dots layer -->
				<div class="grid-dots-layer"></div>

				<!-- SVG Layer for connections -->
				<svg class="connections-layer" ref="svgElement">
					<!-- Existing connections -->
					<path
						v-for="conn in flowStore.flowState.connections"
						:key="conn.id"
						:d="calculateConnectionPath(conn)"
						class="connection-path"
					/>
					<!-- Active dragging connection -->
					<path
						v-if="flowStore.connectionState.dragging"
						:d="calculateDraggingPath"
						class="connection-path dragging"
					/>
				</svg>

				<!-- Nodes Layer -->
				<div class="nodes-layer">
					<component
						v-for="node in flowStore.flowState.nodes"
						:key="node.id"
						:is="nodeComponentMap[node.typeUID] || DefaultNode"
						:context="{
							node: { id: node.id },
							nodeDefinition: flowStore.getNodeDefinition(node.typeUID),
							db: flowStore.db
						}"
						:node="node"
						:node-definition="flowStore.getNodeDefinition(node.typeUID)"
					/>
				</div>
			</div>
		</div>

		<div class="canvas-overlay">
			<div class="zoom-pan-info">
				<div>Zoom: {{ flowStore.flowState.zoom.toFixed(2) }}</div>
				<div>Pos: {{ flowStore.flowState.pan.x.toFixed(0) }}, {{ flowStore.flowState.pan.y.toFixed(0) }}</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, provide, watchEffect, onMounted, onUnmounted } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import { GRID_SIZE, MIN_ZOOM, MAX_ZOOM } from "./constants"
	import DefaultNode from "./DefaultNode.vue"
	import NodeEditorModal from "./NodeEditorModal.vue"
	import type { IFlowConnection } from "./types"

	// State declarations
	const flowStore = useFlowStore()
	const isDraggedOver = ref(false)
	const dragStart = ref({ x: 0, y: 0 })
	const initialPanPos = ref({ x: 0, y: 0 })
	const svgElement = ref<SVGSVGElement | null>(null)
	const canvasRef = ref<HTMLElement | null>(null)

	// Add this line to reference the nodePortPositions from the flowStore
	const nodePortPositions = computed(() => flowStore.nodePortPositions)

	// Node component mapping
	const nodeComponentMap = computed(() => {
		return flowStore.nodeComponents || {}
	})

	// Save node input values
	function handleNodeInputSave(nodeId: string, inputValues: Record<string, any>) {
		flowStore.updateNodeInputValues(nodeId, inputValues)

		// Trigger port position update after a short delay to allow DOM to update
		setTimeout(() => {
			flowStore.triggerPortPositionUpdate(nodeId)
		}, 100)
	}

	// Add method to snap value to grid
	function snapToGrid(value: number): number {
		return Math.round(value / GRID_SIZE) * GRID_SIZE
	}

	// Create a reference to the component instance
	const flowCanvasRef = ref({
		gridSize: GRID_SIZE,
		value: null as any,
		$refs: {
			svgElement: null as SVGElement | null
		}
	})

	// Provide the flowCanvas reference to child components
	provide("flowCanvas", flowCanvasRef)

	// Update the SVG element reference when it's available
	watchEffect(() => {
		flowCanvasRef.value.$refs.svgElement = svgElement.value
	})

	// Pointer event handlers
	const handlePointerDown = (e: PointerEvent) => {
		// Only handle middle pointer button (panning)
		if (e.button === 0 && !e.target.closest(".flow-node-base")) {
			dragStart.value = { x: e.clientX, y: e.clientY }
			initialPanPos.value = {
				x: flowStore.flowState.pan.x,
				y: flowStore.flowState.pan.y
			}
			document.addEventListener("pointermove", handlePointerMove)
			document.addEventListener("pointerup", handlePointerUp)
		}
	}

	const handlePointerMove = (e: PointerEvent) => {
		// Calculate the difference in pointer position
		const dx = e.clientX - dragStart.value.x
		const dy = e.clientY - dragStart.value.y

		// Apply the difference directly to the pan position
		// No need to divide by zoom since we want 1:1 movement with the pointer
		flowStore.flowState.pan.x = initialPanPos.value.x + dx
		flowStore.flowState.pan.y = initialPanPos.value.y + dy
	}

	const handlePointerUp = () => {
		document.removeEventListener("pointermove", handlePointerMove)
		document.removeEventListener("pointerup", handlePointerUp)
	}

	// Zoom handling
	const handleZoom = (e: WheelEvent) => {
		e.preventDefault()

		// Get pointer position relative to canvas
		const rect = canvasRef.value.getBoundingClientRect()
		const pointerX = e.clientX - rect.left
		const pointerY = e.clientY - rect.top

		// Calculate new zoom level using a multiplicative factor
		const direction = e.deltaY > 0 ? 0.9 : 1.1 // Zoom out: 90%, Zoom in: 110%
		const oldZoom = flowStore.flowState.zoom
		const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom * direction))

		// Convert pointer position to world coordinates
		const worldX = (pointerX - flowStore.flowState.pan.x) / oldZoom
		const worldY = (pointerY - flowStore.flowState.pan.y) / oldZoom

		// Calculate new pan position to keep the point under pointer in the same position
		flowStore.flowState.pan.x = pointerX - worldX * newZoom
		flowStore.flowState.pan.y = pointerY - worldY * newZoom

		// Apply new zoom
		flowStore.flowState.zoom = newZoom
	}

	// Drag and drop handlers
	const handleDragEnter = () => {
		isDraggedOver.value = true
	}

	const handleDragOver = (e: DragEvent) => {
		e.dataTransfer.dropEffect = "copy"
	}

	const handleDragLeave = () => {
		isDraggedOver.value = false
	}

	const handleDrop = async (e: DragEvent) => {
		isDraggedOver.value = false

		const nodeType = e.dataTransfer.getData("node-type")
		if (!nodeType) return

		// Calculate position in canvas coordinates
		const rect = canvasRef.value.getBoundingClientRect()
		const canvasX = e.clientX - rect.left
		const canvasY = e.clientY - rect.top

		// Convert to world coordinates
		const worldX = (canvasX - flowStore.flowState.pan.x) / flowStore.flowState.zoom
		const worldY = (canvasY - flowStore.flowState.pan.y) / flowStore.flowState.zoom

		// Snap to grid
		const position = {
			x: snapToGrid(worldX),
			y: snapToGrid(worldY)
		}

		// Create the node
		const newNode = await flowStore.createNode(nodeType, position)
		const nodeId = newNode.id

		// Give the DOM time to update before trying to access the new node
		setTimeout(() => {
			// Force an update of port positions for the new node
			const nodeElement = document.getElementById(nodeId)
			if (nodeElement) {
				// The node exists, trigger a port position update
				flowStore.triggerPortPositionUpdate(nodeId)
			} else {
				// Try again with a longer delay
				setTimeout(() => {
					const nodeElement = document.getElementById(nodeId)
					if (nodeElement) {
						flowStore.triggerPortPositionUpdate(nodeId)
					}
				}, 500)
			}
		}, 200)
	}

	// Connection handling - now handled directly in FlowNodeBase

	// Calculate connection paths
	const calculateConnectionPath = (connection: IFlowConnection) => {
		// Get source and target node port positions
		const sourceNodePorts = nodePortPositions.value.get(connection.sourceNodeId)
		const targetNodePorts = nodePortPositions.value.get(connection.targetNodeId)

		if (!sourceNodePorts || !targetNodePorts) {
			console.warn("Missing port positions for connection:", connection)
			return "M0,0 C0,0 0,0 0,0" // Empty path if positions not available
		}

		// Get node definitions
		const sourceNodeDef = flowStore.getNodeDefinition(connection.sourceNodeId)
		const targetNodeDef = flowStore.getNodeDefinition(connection.targetNodeId)

		if (!sourceNodeDef || !targetNodeDef) {
			console.warn("Missing node definitions for connection:", connection)
			return "M0,0 C0,0 0,0 0,0"
		}

		// Get output keys for source node
		const outputKeys = Object.keys(sourceNodeDef.outs || {})
		const sourcePortIndex = outputKeys.indexOf(connection.sourcePortId)

		// Get input keys for target node
		const inputKeys = Object.keys(targetNodeDef.ins || {})
		const targetPortIndex = inputKeys.indexOf(connection.targetPortId)

		// Debug connection info in development
		if (import.meta.env.DEV) {
			console.log("Connection:", connection)
			console.log("Source port:", connection.sourcePortId, "index:", sourcePortIndex, "in keys:", outputKeys)
			console.log("Target port:", connection.targetPortId, "index:", targetPortIndex, "in keys:", inputKeys)
		}

		if (sourcePortIndex === -1 || targetPortIndex === -1) {
			console.warn(
				"Port not found in node definition:",
				sourcePortIndex === -1 ? `Source: ${connection.sourcePortId}` : `Target: ${connection.targetPortId}`
			)
			return "M0,0 C0,0 0,0 0,0"
		}

		// Find the specific output port
		const sourcePort = sourceNodePorts.outputs[sourcePortIndex]

		// Find the specific input port
		const targetPort = targetNodePorts.inputs[targetPortIndex]

		if (!sourcePort || !targetPort) {
			console.warn(
				"Port positions not found:",
				!sourcePort ? `Source: ${connection.sourcePortId}` : `Target: ${connection.targetPortId}`
			)
			return "M0,0 C0,0 0,0 0,0" // Empty path if ports not found
		}

		// Calculate bezier curve control points
		const dx = targetPort.x - sourcePort.x
		const bezierOffset = Math.min(Math.abs(dx) * 0.5, 150) // Control point offset

		// Create SVG path
		return `M${sourcePort.x},${sourcePort.y} C${sourcePort.x + bezierOffset},${sourcePort.y} ${
			targetPort.x - bezierOffset
		},${targetPort.y} ${targetPort.x},${targetPort.y}`
	}

	const calculateDraggingPath = computed(() => {
		if (!flowStore.connectionState.startPoint) return ""

		const { startPoint, endPoint } = flowStore.connectionState
		const sourceNodePorts = nodePortPositions.value.get(startPoint.nodeId)

		if (!sourceNodePorts) {
			return "M0,0 C0,0 0,0 0,0" // Empty path if positions not available
		}

		// Find the specific port (input or output)
		let sourcePort
		if (startPoint.portType === "output") {
			// Get the node definition
			const nodeDef = flowStore.getNodeDefinition(startPoint.nodeId)
			if (!nodeDef || !nodeDef.outs) {
				console.error("Node definition or outputs not found for:", startPoint.nodeId)
				return "M0,0 C0,0 0,0 0,0"
			}

			// Get output keys and find the index of the port
			const outputKeys = Object.keys(nodeDef.outs || {})
			const portIndex = outputKeys.indexOf(startPoint.portId)

			if (portIndex === -1 || !sourceNodePorts.outputs[portIndex]) {
				console.error("Output port not found:", startPoint.portId)
				return "M0,0 C0,0 0,0 0,0"
			}

			sourcePort = sourceNodePorts.outputs[portIndex]
		} else {
			// Get the node definition
			const nodeDef = flowStore.getNodeDefinition(startPoint.nodeId)
			if (!nodeDef || !nodeDef.ins) {
				console.error("Node definition or inputs not found for:", startPoint.nodeId)
				return "M0,0 C0,0 0,0 0,0"
			}

			// Get input keys and find the index of the port
			const inputKeys = Object.keys(nodeDef.ins || {})
			const portIndex = inputKeys.indexOf(startPoint.portId)

			if (portIndex === -1 || !sourceNodePorts.inputs[portIndex]) {
				console.error("Input port not found:", startPoint.portId)
				return "M0,0 C0,0 0,0 0,0"
			}

			sourcePort = sourceNodePorts.inputs[portIndex]
		}

		if (!sourcePort) {
			console.error("Source port not found:", startPoint.portId)
			return "M0,0 C0,0 0,0 0,0" // Empty path if port not found
		}

		// The endPoint is already in world coordinates from handleConnectionDrag
		const targetX = endPoint.x
		const targetY = endPoint.y

		// Calculate bezier curve control points
		const dx = targetX - sourcePort.x
		const bezierOffset = Math.min(Math.abs(dx) * 0.5, 150) // Control point offset

		// Create SVG path with direction based on port type
		if (startPoint.portType === "output") {
			// From output port: curve starts by going right
			return `M${sourcePort.x},${sourcePort.y} C${sourcePort.x + bezierOffset},${sourcePort.y} ${
				targetX - bezierOffset
			},${targetY} ${targetX},${targetY}`
		} else {
			// From input port: curve starts by going left
			return `M${sourcePort.x},${sourcePort.y} C${sourcePort.x - bezierOffset},${sourcePort.y} ${
				targetX + bezierOffset
			},${targetY} ${targetX},${targetY}`
		}
	})

	// Connection event handlers - now handled directly in FlowNodeBase

	// Event listeners
	onMounted(() => {
		const canvas = document.querySelector(".flow-canvas")
		canvas?.addEventListener("wheel", handleZoom, { passive: false })
	})

	onUnmounted(() => {
		document.removeEventListener("pointermove", handlePointerMove)
		document.removeEventListener("pointerup", handlePointerUp)
		const canvas = document.querySelector(".flow-canvas")
		canvas?.removeEventListener("wheel", handleZoom as EventListener)
	})

	// Expose methods and refs
	defineExpose({
		gridSize: GRID_SIZE,
		svgElement
	})

	// Debug logging for development (remove in production)
	if (import.meta.env.DEV) {
		watchEffect(() => {
			console.log("Node component map:", Object.keys(nodeComponentMap.value))
			console.log("Flow store node components:", Object.keys(flowStore.nodeComponents))

			// Log which component is being used for each node
			flowStore.flowState.nodes.forEach((node) => {
				const component = nodeComponentMap.value[node.typeUID] || DefaultNode
				console.log(`Node ${node.id} (${node.typeUID}) using component:`, component.name || "Unknown")
			})
		})
	}
</script>

<style scoped>
	.flow-canvas-container {
		flex: 1;
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
		position: relative;
		background: #1e1e1e;
		overflow: hidden;
		display: flex;
	}

	.canvas-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		color: #fff;
		pointer-events: none;
	}

	.flow-canvas {
		flex: 1;
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	.canvas-content {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.drag-over {
		background-color: rgba(0, 120, 215, 0.1);
		outline: 2px dashed #0078d4;
	}

	.connections-layer {
		position: absolute;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: visible;
	}

	.nodes-layer {
		position: absolute;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.nodes-layer > * {
		pointer-events: auto;
	}

	.connection-path {
		fill: none;
		stroke: #666;
		stroke-width: 2px;
	}

	.connection-path.dragging {
		stroke: #0078d4;
		stroke-dasharray: 6, 3;
	}

	.grid-dots-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		background-color: transparent;
	}

	.grid-dots-layer::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 4px;
		height: 4px;
		background: #ff0000;
		border-radius: 50%;
	}

	.grid-dots-layer::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 2px;
		height: 2px;
		background: #333;
		border-radius: 50%;
		box-shadow: var(--grid-size) 0 #333, calc(var(--grid-size) * 2) 0 #333, calc(var(--grid-size) * 3) 0 #333,
			calc(var(--grid-size) * 4) 0 #333, 0 var(--grid-size) #333, var(--grid-size) var(--grid-size) #333,
			calc(var(--grid-size) * 2) var(--grid-size) #333, calc(var(--grid-size) * 3) var(--grid-size) #333,
			calc(var(--grid-size) * 4) var(--grid-size) #333, 0 calc(var(--grid-size) * 2) #333,
			var(--grid-size) calc(var(--grid-size) * 2) #333, calc(var(--grid-size) * 2) calc(var(--grid-size) * 2) #333,
			calc(var(--grid-size) * 3) calc(var(--grid-size) * 2) #333,
			calc(var(--grid-size) * 4) calc(var(--grid-size) * 2) #333;
		background-repeat: repeat;
	}
	.zoom-pan-info {
		position: absolute;
		bottom: 10px;
		left: 10px;
		color: darkgray;
		font-size: 0.7rem;
	}
</style>
