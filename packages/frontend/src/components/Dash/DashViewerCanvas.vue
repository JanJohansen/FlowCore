<template>
	<div class="dash-viewer-canvas">
		<div class="viewer-content" :style="canvasStyle">
			<!-- Runtime dashboard components -->
			<component
				v-for="component in dashboard.components"
				:key="component.id"
				:is="getRuntimeComponent(component)"
				:style="getComponentStyle(component)"
				:component="component"
				@output="handleComponentOutput"
			/>
		</div>

		<!-- Viewer controls overlay -->
		<div v-if="showControls" class="viewer-controls">
			<button @click="refreshComponents" title="Refresh">
				<i class="fa fa-refresh"></i>
			</button>
			<button @click="toggleControls" title="Hide Controls">
				<i class="fa fa-eye-slash"></i>
			</button>
		</div>

		<!-- Hidden controls toggle -->
		<button v-else class="show-controls-btn" @click="toggleControls" title="Show Controls">
			<i class="fa fa-eye"></i>
		</button>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onUnmounted } from "vue"
	import { useDashStore } from "../../stores/dashStore"
	import { loadDashComponent } from "./componentLoader"
	import type { IDashboard, IDashComponent } from "./types"

	// Props
	interface Props {
		dashboard: IDashboard
	}

	const props = defineProps<Props>()

	const dashStore = useDashStore()

	// State
	const showControls = ref(false)
	const componentOutputs = ref<Record<string, any>>({})

	// Computed
	const canvasStyle = computed(() => ({
		width: props.dashboard.format.width + "px",
		height: props.dashboard.format.height + "px",
		backgroundColor: props.dashboard.backgroundColor,
		margin: "0 auto",
		position: "relative",
		overflow: "hidden",
		borderRadius: "4px",
		boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
	}))

	// Methods
	const getRuntimeComponent = (component: IDashComponent) => {
		return loadDashComponent({
			component,
			componentDefinitions: dashStore.componentDefinitions,
			isRuntime: true
		})
	}

	const getComponentStyle = (component: IDashComponent) => ({
		position: "absolute",
		left: component.position.x + "px",
		top: component.position.y + "px",
		width: component.size.width + "px",
		height: component.size.height + "px",
		zIndex: component.zIndex || 10
	})

	const handleComponentOutput = (outputName: string, value: any, componentId?: string) => {
		if (!componentId) return

		// Store output value
		componentOutputs.value[`${componentId}:${outputName}`] = value

		// Send to CoreDB
		const outputKey = `dash:${componentId}:${outputName}`
		dashStore.db.set(outputKey, value)

		// Trigger any connected inputs
		props.dashboard.components.forEach((comp) => {
			Object.entries(comp.inputs).forEach(([inputKey, inputValue]) => {
				if (inputValue === `output:${componentId}:${outputName}`) {
					// Update connected component input
					const updatedInputs = { ...comp.inputs }
					updatedInputs[inputKey] = value
					dashStore.updateComponent(comp.id, { inputs: updatedInputs })
				}
			})
		})
	}

	const refreshComponents = () => {
		// Force re-render of all components
		const currentDashboard = props.dashboard
		dashStore.currentDashboard = null
		setTimeout(() => {
			dashStore.currentDashboard = currentDashboard
		}, 100)
	}

	const toggleControls = () => {
		showControls.value = !showControls.value
	}

	// Handle keyboard shortcuts
	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === "F11") {
			event.preventDefault()
			dashStore.toggleFullscreen()
		} else if (event.key === "r" && event.ctrlKey) {
			event.preventDefault()
			refreshComponents()
		} else if (event.key === "h" && event.ctrlKey) {
			event.preventDefault()
			toggleControls()
		}
	}

	// Lifecycle
	onMounted(() => {
		document.addEventListener("keydown", handleKeydown)

		// Initialize component inputs from CoreDB
		props.dashboard.components.forEach((component) => {
			Object.entries(component.inputs).forEach(([key, value]) => {
				if (typeof value === "string" && value.startsWith("coredb:")) {
					const coredbKey = value.replace("coredb:", "")
					dashStore.db.get(coredbKey).then((coredbValue) => {
						if (coredbValue !== undefined) {
							const updatedInputs = { ...component.inputs }
							updatedInputs[key] = coredbValue
							dashStore.updateComponent(component.id, { inputs: updatedInputs })
						}
					})
				}
			})
		})
	})

	onUnmounted(() => {
		document.removeEventListener("keydown", handleKeydown)
	})
</script>

<style scoped>
	.dash-viewer-canvas {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-primary);
		position: relative;
		overflow: auto;
		padding: 20px;
	}

	.viewer-content {
		position: relative;
		border: 1px solid var(--border-color);
	}

	.viewer-controls {
		position: absolute;
		top: 10px;
		right: 10px;
		display: flex;
		gap: 0.5rem;
		background-color: rgba(0, 0, 0, 0.7);
		padding: 0.5rem;
		border-radius: 6px;
		z-index: 1000;
	}

	.viewer-controls button {
		background-color: transparent;
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.viewer-controls button:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.show-controls-btn {
		position: absolute;
		top: 10px;
		right: 10px;
		background-color: rgba(0, 0, 0, 0.5);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0.5rem;
		border-radius: 50%;
		cursor: pointer;
		opacity: 0.7;
		transition: opacity 0.2s;
		z-index: 1000;
	}

	.show-controls-btn:hover {
		opacity: 1;
	}

	/* Fallback component styling */
	:deep(.fallback-component) {
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--bg-secondary);
		border: 2px dashed var(--border-color);
		color: var(--text-secondary);
		font-family: monospace;
		font-size: 0.8rem;
		border-radius: 4px;
		width: 100%;
		height: 100%;
	}

	/* Dashboard component styling */
	:deep(.dash-button) {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s;
		width: 100%;
		height: 100%;
	}

	:deep(.dash-button-primary) {
		background-color: #007acc;
		color: white;
	}

	:deep(.dash-button-primary:hover) {
		background-color: #005a9e;
	}

	:deep(.dash-button-secondary) {
		background-color: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
	}

	:deep(.dash-button-secondary:hover) {
		background-color: var(--border-color);
	}

	/* Scrollbar styling */
	.dash-viewer-canvas::-webkit-scrollbar {
		width: 8px;
		height: 8px;
	}

	.dash-viewer-canvas::-webkit-scrollbar-track {
		background: var(--bg-secondary);
	}

	.dash-viewer-canvas::-webkit-scrollbar-thumb {
		background: var(--border-color);
		border-radius: 4px;
	}

	.dash-viewer-canvas::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>
