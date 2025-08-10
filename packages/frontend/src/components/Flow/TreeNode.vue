<template>
	<div
		class="tree-node"
		:class="{ selected }"
		@click.stop="handleClick"
		draggable="true"
		@dragstart="handleDragStart"
		role="treeitem"
		:aria-selected="selected ? 'true' : 'false'"
		@keydown.enter.prevent="handleClick"
		tabindex="0"
	>
		<div class="label">{{ node.typeName }}</div>
		<div class="label">{{ node.description }}</div>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		node: { type: Object, required: true },
		selected: { type: Boolean, default: false }
	})

	const emit = defineEmits(["dragstart", "click"])

	const handleDragStart = (event: DragEvent) => {
		event.dataTransfer?.setData("node-type", (props.node as any).typeUID)
	}

	const handleClick = () => {
		emit("click")
	}
</script>

<style scoped>
	.tree-node {
		position: relative;
		padding: 2px 6px 2px 4px;
		margin: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		user-select: none;
		border-left: 2px solid transparent;
		border-radius: 0;
		color: #cccccc;
		font-size: 13px;
		line-height: 18px;
	}
	.tree-node:hover {
		background: var(--tree-hover-bg, #2a2d2e);
		color: #fff;
	}
	.tree-node.selected {
		background: var(--tree-active-bg, #094771);
		color: #fff;
		border-left-color: var(--tree-active-border, #007acc);
	}
	.tree-node:focus-visible {
		outline: 1px solid #007acc;
		outline-offset: -1px;
	}
	.label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
	}
</style>
