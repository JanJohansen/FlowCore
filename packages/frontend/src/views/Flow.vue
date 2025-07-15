<template>
	<PageLayout>
		<template #header>
			<div class="header-content">
				<h1>Flow Editor</h1>
				<div class="flow-actions">
					<testNodeUI msg="Test Node UI" />

					<button class="action-button" title="Save" @click="flowStore.saveFlow">
						<i class="fa fa-save"></i>
						Save
					</button>
					<button class="action-button" title="Load" @click="flowStore.loadFlow">
						<i class="fa fa-folder-open"></i>
						Load
					</button>
					<button class="action-button" title="Clear" @click="flowStore.clearFlow">
						<i class="fa fa-trash"></i>
						Clear
					</button>
				</div>
			</div>
		</template>

		<div class="flow-view">
			<FlowsTree @flow-selected="handleFlowSelected" />
			<div class="flow-editor-container">
				<FlowCanvas class="flow-canvas" />
				<FlowNodeTree @node-selected="handleNodeSelected" class="flow-node-tree" />
			</div>
		</div>
	</PageLayout>
</template>

<script setup lang="ts">
	import { onMounted, watchEffect } from "vue"
	import { useFlowStore } from "../stores/flowStore"
	import PageLayout from "../components/PageLayout.vue"
	import FlowCanvas from "../components/Flow/FlowCanvas.vue"
	import FlowNodeTree from "../components/Flow/FlowNodeTree.vue"
	import FlowsTree from "../components/Flow/FlowsTree.vue"

	import testNodeUI from "@webapp/extensions/nodes/core-nodes/testNodeUI.vue"

	const flowStore = useFlowStore()

	const handleFlowSelected = (flowId: string) => {
		flowStore.handleFlowSelected(flowId)
	}

	const handleNodeSelected = async (node: any) => {
		const newNodeId = await flowStore.handleNodeSelected(node)

		// Give the DOM time to update
		setTimeout(() => {
			flowStore.triggerPortPositionUpdate(newNodeId)
		}, 200)
	}

	watchEffect(() => {
		console.log("Flow state updated:", flowStore.flowState)
	})

	onMounted(() => {
		flowStore.loadFlow()
	})
</script>

<style scoped>
	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.flow-actions {
		display: flex;
		gap: 1rem;
	}

	.action-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.action-button:hover {
		background-color: var(--bg-tertiary, #363636);
	}

	.action-button i {
		font-size: 1rem;
	}

	.flow-view {
		display: flex;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.flow-editor-container {
		flex: 1;
		display: flex;
		flex-direction: row;
		width: 100%;
		height: 100%;
		min-height: 0;
		position: relative;
		overflow: hidden;
		background: #1e1e1e;
	}

	.flow-canvas {
		flex: 1;
		min-width: 0;
		position: relative;
		overflow: hidden;
		display: flex;
	}

	.flow-node-tree {
		width: 250px;
		height: 100%;
		border-left: 1px solid #333;
		background: #252525;
		overflow-y: auto;
		flex-shrink: 0;
	}
</style>
