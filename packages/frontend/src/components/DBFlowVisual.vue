<template>
	<div class="flow-node">
		<div class="node-body">
			<!-- Header -->
			<div class="node-header">
				<div class="node-id">{{ nodeId }}</div>
				<div class="node-type">{{ getNodeType(nodeData) }}</div>
			</div>

			<!-- Input Ports -->
			<div class="io-section inputs-section">
				<div v-for="(key, index) in inputKeys" :key="`in-${index}`" class="io-row">
					<div class="io-item input-item">
						<div
							class="io-connector input-connector"
							@pointerenter="handleInputTooltip($event, key)"
							@pointerleave="$emit('hideTooltip')"
							ref="inputConnectorRefs"
						></div>
						<span class="io-label">{{ key }}</span>
						<span class="io-value">{{ formatIOValue(inputs[key].value) }}</span>
					</div>
				</div>
			</div>

			<!-- Splitter -->
			<div class="node-splitter"></div>

			<!-- Output Ports -->
			<div class="io-section outputs-section">
				<div v-for="(key, index) in outputKeys" :key="`out-${index}`" class="io-row">
					<div class="io-item output-item">
						<span class="io-value">{{ formatIOValue(outputs[key].value) }}</span>
						<span class="io-label">{{ key }}</span>
						<div
							class="io-connector output-connector"
							@pointerenter="handleOutputTooltip($event, key)"
							@pointerleave="$emit('hideTooltip')"
							ref="outputConnectorRefs"
						></div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch, watchEffect, onMounted } from "vue"

	// Props and emits
	const props = defineProps<{
		nodeId: string
		nodeData: any
	}>()

	const emit = defineEmits<{
		(e: "showTooltip", event: PointerEvent, metadata: any, position?: { x: number; y: number }): void
		(e: "hideTooltip"): void
	}>()

	// State
	const inputConnectorRefs = ref<HTMLElement[]>([])
	const outputConnectorRefs = ref<HTMLElement[]>([])
	const updatedInputs = ref<Record<string, boolean>>({})
	const updatedOutputs = ref<Record<string, boolean>>({})

	// Computed properties
	const inputs = computed(() => props.nodeData?.ins || {})
	const outputs = computed(() => props.nodeData?.outs || {})
	const inputKeys = computed(() => Object.keys(inputs.value))
	const outputKeys = computed(() => Object.keys(outputs.value))

	// Helper functions
	function getMetadata(obj: any, portName: string, portType: "input" | "output"): any {
		if (!obj) return {}

		const ioObj = portType === "input" ? obj.ins : obj.outs
		if (!ioObj || !ioObj[portName]) return {}
		return ioObj[portName]
		// return {
		// 	name: portName,
		// 	type: ioObj[portName].type || "unknown",
		// 	value: ioObj[portName].value,
		// 	...(ioObj[portName].meta || {}),
		// }
	}

	function handleInputTooltip(event: PointerEvent, portName: string) {
		const metadata = getMetadata(props.nodeData, portName, "input")
		handleTooltipShow(event, metadata, "input")
	}

	function handleOutputTooltip(event: PointerEvent, portName: string) {
		const metadata = getMetadata(props.nodeData, portName, "output")
		handleTooltipShow(event, metadata, "output")
	}

	function handleTooltipShow(event: PointerEvent, metadata: any, connectorType: "input" | "output") {
		if (!metadata) return

		const position = {
			x: event.clientX + (connectorType === "input" ? -10 : 10),
			y: event.clientY
		}

		emit("showTooltip", event, metadata, position)
	}

	function getNodeType(obj: any): string {
		if (!obj) return "Unknown"
		return obj.nodeType || obj.type || "Node"
	}

	function formatIOValue(value: any): string {
		if (value === null || value === undefined) return "-"

		if (typeof value === "object") {
			if (Array.isArray(value)) {
				return `Array(${value.length})`
			}
			return "{...}"
		}

		return String(value)
	}

	// Watch for value changes
	watchEffect(() => {
		// Watch inputs
		if (props.nodeData?.ins) {
			Object.keys(props.nodeData.ins).forEach((key) => {
				if (props.nodeData.ins[key]) {
					watch(
						() => JSON.stringify(props.nodeData.ins[key].value),
						(newVal, oldVal) => {
							if (newVal !== oldVal && oldVal !== undefined) {
								updatedInputs.value[key] = true
								// Reset animation after delay
								setTimeout(() => {
									updatedInputs.value[key] = false
								}, 2)
							}
						}
					)
				}
			})
		}

		// Watch outputs
		if (props.nodeData?.outs) {
			Object.keys(props.nodeData.outs).forEach((key) => {
				if (props.nodeData.outs[key]) {
					watch(
						() => JSON.stringify(props.nodeData.outs[key].value),
						(newVal, oldVal) => {
							if (newVal !== oldVal && oldVal !== undefined) {
								updatedOutputs.value[key] = true
								// Reset animation after delay
								setTimeout(() => {
									updatedOutputs.value[key] = false
								}, 3000)
							}
						}
					)
				}
			})
		}
	})

	// Handle connector references
	onMounted(() => {
		// This will ensure we have access to the connector elements for any external needs
		const inputElements = inputConnectorRefs.value
		const outputElements = outputConnectorRefs.value

		// If parent component needs access to these elements, we could expose them
		// through a method or provide/inject pattern
	})
</script>

<style scoped>
	.flow-node {
		position: relative;
		overflow: visible !important;
		min-width: calc(var(--grid-size) * 10);
		width: fit-content;
	}

	.node-body {
		background: #1e1e1e;
		border: 2px solid #444;
		border-radius: 4px;
		overflow: visible !important;
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.node-header {
		background: #333;
		height: var(--grid-size);
		padding: 0 calc(var(--grid-size) / 2);
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid #444;
		min-width: fit-content;
	}

	.node-id {
		font-weight: bold;
		color: #0078d4;
		font-size: 0.85em;
		margin-right: var(--grid-size);
	}

	.node-type {
		font-size: 0.75em;
		color: #aaa;
	}

	.io-section {
		padding: calc(var(--grid-size) / 2) 0;
		min-width: fit-content;
	}

	.node-splitter {
		height: 1px;
		background-color: #444;
		margin: 0;
		width: 100%;
	}

	.io-row {
		display: flex;
		align-items: center;
		height: var(--grid-size);
		padding: 0;
		margin: 0;
	}

	.io-item {
		display: flex;
		align-items: center;
		height: 100%;
		position: relative;
		padding: 0 calc(var(--grid-size) / 2);
	}

	.input-item {
		margin-left: calc(var(--grid-size) * -0.5);
	}

	.output-item {
		justify-content: flex-end;
		margin-right: calc(var(--grid-size) * -0.5);
	}

	.io-connector {
		width: var(--grid-size);
		height: var(--grid-size);
		min-width: var(--grid-size);
		border-radius: 50%;
		background: #555;
		cursor: pointer;
		border: 1px solid #333;
		position: relative;
		z-index: 1;
	}

	.io-connector:hover {
		background: #0078d4;
	}

	.io-label {
		font-size: 10px;
		color: #aaa;
		margin: 0 4px;
		white-space: nowrap;
	}

	.io-value {
		font-size: 10px;
		color: var(--text-secondary);
		background: #2a2a2a;
		padding: 1px 3px;
		border-radius: 2px;
		max-width: 70px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Remove value update animations */
	.value-updated {
		background-color: red;
		transition: background-color 0s step-end;
		color: white;
	}
</style>
