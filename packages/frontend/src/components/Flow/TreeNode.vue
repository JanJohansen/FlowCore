<template>
	<div class="tree-node" @click.stop="handleClick" draggable="true" @dragstart="handleDragStart">
		<span>{{ node.typeName }}</span>
	</div>
</template>

<script setup lang="ts">
	import { defineProps, defineEmits } from "vue"

	const props = defineProps({
		node: {
			type: Object,
			required: true
		}
	})

	const emit = defineEmits(["dragstart", "click"])

	const handleDragStart = (event: DragEvent) => {
		event.dataTransfer?.setData("node-type", props.node.typeUID)
	}

	const handleClick = () => {
		emit("click")
	}
</script>

<style scoped>
	.tree-node {
		padding: 6px 12px;
		margin: 2px 0;
		background-color: #2d2d2d;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		user-select: none;
	}

	.tree-node:hover {
		background-color: #3c3c3c;
	}
</style>
