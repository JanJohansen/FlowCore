<template>
	<div class="flows-tree">
		<div class="flows-tree-header">
			<h3>Flows</h3>
			<div class="flows-tree-actions">
				<button @click="handleNewFlow" title="New Flow">
					<i class="fa fa-file"></i>
				</button>
				<button @click="handleNewFolder" title="New Folder">
					<i class="fa fa-folder"></i>
				</button>
			</div>
		</div>

		<div class="search-container">
			<input type="text" v-model="searchQuery" placeholder="Search flows..." class="search-input" />
		</div>

		<div class="flows-tree-content">
			<div
				v-for="(flow, flowId) in flowStore.flows"
				:key="flowId"
				class="flow-item"
				:class="{ selected: flowId === flowStore.selectedFlowId }"
				@click="handleSelect(flowId)"
			>
				<div class="flow-item-content">
					<i class="fa fa-file item-icon"></i>
					<span class="item-name">{{ flow.path || flowId }}</span>
				</div>
				<div class="item-actions">
					<button class="item-action-btn" @click.stop="handleDelete(flowId)" title="Delete">
						<i class="fa fa-trash"></i>
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import FlowsTreeItem from "./FlowsTreeItem.vue"

	const emit = defineEmits(["flow-selected"])
	const flowStore = useFlowStore()
	const searchQuery = ref("")

	const handleSelect = (flowId: string) => {
		flowStore.setSelectedFlow(flowId)
		emit("flow-selected", flowId)
	}

	const handleNewFlow = () => {
		const flowPath = prompt("Enter flow <path>/name:")
		if (flowPath) {
			flowStore.addFlow(flowPath) // Adding to root level for now
			flowStore.setSelectedFlow(flowPath) // Automatically select the new flow
			emit("flow-selected", flowPath)
		}
	}

	const handleNewFolder = () => {
		const folderName = prompt("Enter folder name:")
		if (folderName) {
			flowStore.addFolder([], folderName) // Adding to root level for now
		}
	}

	const handleDelete = (path: string) => {
		if (confirm("Are you sure you want to delete the selected flow?")) {
			flowStore.deleteFlow(path)
		}
	}
</script>

<style scoped>
	.flows-tree {
		width: 250px;
		height: 100%;
		background: #252526;
		border-right: 1px solid #1e1e1e;
		display: flex;
		flex-direction: column;
	}

	.flows-tree-header {
		border-bottom: 1px solid #333;
		background: #2d2d2d;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px;
	}

	.flows-tree-actions {
		display: flex;
		gap: 8px;
	}

	.flows-tree-actions button {
		padding: 6px 12px;
		background: #3c3c3c;
		border: 1px solid #1e1e1e;
		color: #e0e0e0;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.flows-tree-actions button:hover {
		background: #444;
	}

	.search-container {
		padding: 12px;
	}

	.search-input {
		width: 100%;
		padding: 6px 8px;
		background: #3c3c3c;
		border: 1px solid #1e1e1e;
		color: #e0e0e0;
		border-radius: 4px;
	}

	.search-input:focus {
		outline: none;
		border-color: #007acc;
	}

	.flows-tree-content {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
	}

	.flow-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 8px;
		border-radius: 4px;
		cursor: pointer;
		user-select: none;
		color: #e0e0e0;
		transition: all 0.2s ease;
		margin: 2px 0;
	}

	.flow-item:hover {
		background: #2d2d2d;
	}

	.flow-item.selected {
		background: #094771;
		color: #ffffff;
	}

	.flow-item-content {
		display: flex;
		align-items: center;
		flex: 1;
		overflow: hidden;
	}

	.item-icon {
		margin-right: 8px;
		color: #75beff;
		width: 16px;
		text-align: center;
	}

	.item-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-actions {
		display: none;
	}

	.flow-item:hover .item-actions {
		display: flex;
	}

	.item-action-btn {
		background: transparent;
		border: none;
		color: #e0e0e0;
		cursor: pointer;
		padding: 2px 4px;
		font-size: 0.8em;
	}

	.item-action-btn:hover {
		color: #ff6b6b;
	}
</style>
