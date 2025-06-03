<template>
	<flow-node-base :context="props.context" :node="props.node" :node-definition="props.nodeDefinition">
		Node definition missing!
	</flow-node-base>
</template>

<script setup lang="ts">
	// Default node if no custom visual is provided.
	// Will load definition from file.

	import { default as FlowNodeBase, ICustomeNodeContext } from "./FlowNodeBase.vue"

	const props = defineProps<{
		context: ICustomeNodeContext
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
