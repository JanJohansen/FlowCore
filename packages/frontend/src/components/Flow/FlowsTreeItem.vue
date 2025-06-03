<template>
	<div class="tree-item">
		<div class="item-header" :class="{ selected: isSelected }">
			<div class="item-content" @click="handleClick">
				<i v-if="isFolder" :class="expanded ? 'fa fa-chevron-down' : 'fa fa-chevron-right'" />
				<i :class="icon" class="item-icon" />
				<span class="item-name">{{ itemName }}</span>
			</div>
			<div class="item-actions">
				<button class="item-action-btn" @click="handleDelete" title="Delete">
					<i class="fa fa-trash"></i>
				</button>
			</div>
		</div>

		<div v-if="isFolder && expanded" class="item-children">
			<FlowsTreeItem
				v-for="child in item.folder"
				:key="child.type === 'folder' ? child.folderName : child.flowId"
				:item="child"
				:selected-flow-id="selectedFlowId"
				@select="$emit('select', $event)"
				@delete="handleChildDelete"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from "vue"
	import type { IFlowTreeFolder, IFlowTreeModel } from "./types"

	const props = defineProps<{
		item: IFlowTreeFolder | IFlowTreeModel
		selectedFlowId: string | null
	}>()

	const emit = defineEmits<{
		(e: "select", flowId: string): void
		(e: "delete", path: string[]): void
	}>()

	const expanded = ref(true)

	const isFolder = computed(() => props.item.type === "folder")
	const itemName = computed(() =>
		isFolder.value ? (props.item as IFlowTreeFolder).folderName : (props.item as IFlowTreeModel).flowId
	)

	const icon = computed(() => (isFolder.value ? "fa fa-folder" : "fa fa-file"))

	const isSelected = computed(() => {
		if (!isFolder.value) {
			return (props.item as IFlowTreeModel).flowId === props.selectedFlowId
		}
		return false
	})

	const handleClick = () => {
		if (isFolder.value) {
			expanded.value = !expanded.value
		} else {
			emit("select", (props.item as IFlowTreeModel).flowId)
		}
	}

	const handleDelete = () => {
		emit("delete", [itemName.value])
	}

	const handleChildDelete = (childPath: string[]) => {
		emit("delete", [itemName.value, ...childPath])
		console.log("Deleting child:", childPath)
	}
</script>

<style scoped>
	.tree-item {
		font-size: 0.9em;
	}

	.item-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: 4px;
		cursor: pointer;
		user-select: none;
		color: #e0e0e0;
		transition: all 0.2s ease;
		margin: 2px 0;
	}

	.item-header:hover {
		background: #2d2d2d;
	}

	.item-header.selected {
		background: #094771;
		color: #ffffff;
	}

	.item-header i {
		width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8em;
	}

	.item-icon {
		margin-right: 8px;
		color: #007acc;
	}

	.item-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Folder icon specific styles */
	.fa-folder {
		color: #dcb67a;
	}

	/* File icon specific styles */
	.fa-file {
		color: #75beff;
	}

	/* Chevron icon styles */
	.fa-chevron-right,
	.fa-chevron-down {
		color: #888;
		margin-right: 4px;
		transition: transform 0.2s ease;
	}

	.fa-chevron-down {
		transform: rotate(0deg);
	}

	.fa-chevron-right {
		transform: rotate(-90deg);
	}

	.item-children {
		margin-left: 4px;
	}

	/* Animation for expand/collapse */
	.item-children {
		transition: all 0.3s ease-in-out;
	}

	.item-content {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.item-actions {
		display: none;
		gap: 4px;
	}

	.item-header:hover .item-actions {
		display: flex;
	}

	.item-action-btn {
		padding: 4px;
		background: transparent;
		border: none;
		color: #888;
		cursor: pointer;
		border-radius: 3px;
		transition: all 0.2s ease;
	}

	.item-action-btn:hover {
		color: #ff4444;
		background: rgba(255, 68, 68, 0.1);
	}
</style>
