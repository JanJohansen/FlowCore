<template>
	<flow-node-base :context="props.context"> Node definition missing! </flow-node-base>
</template>

<script setup lang="ts">
	// Default node if no custom visual is provided.
	// Will load definition from file.

	import { default as FlowNodeBase, ICustomNodeContext } from "./FlowNodeBase.vue"

	const props = defineProps<{
		context: ICustomNodeContext
	}>()
</script>

<style scoped>
	input {
		width: 100%;
		padding: 2px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		border-radius: 4px;
	}
</style>
