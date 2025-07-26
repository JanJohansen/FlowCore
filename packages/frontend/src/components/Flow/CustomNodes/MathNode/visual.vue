<template>
	<flow-node-base :context="props.context" :node="props.node" :nodeDefinition="props.nodeDefinition">
		<template #body>
			<select v-model="operation" @change="updateOperation">
				<option value="add">Add</option>
				<option value="subtract">Subtract</option>
				<option value="multiply">Multiply</option>
				<option value="divide">Divide</option>
			</select>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { ref } from "vue"
	import FlowNodeBase, { ICustomNodeContext } from "../../FlowNodeBase.vue"
	import type { IFlowNodeModel, INodeDefinition } from "../../types"

	const props = defineProps<{
		context: ICustomNodeContext
		node: IFlowNodeModel
		nodeDefinition: INodeDefinition
	}>()

	const operation = ref("add")

	function updateOperation() {
		// Implementation
	}
</script>

<style scoped>
	select {
		width: 100%;
		padding: 4px 8px;
		border-radius: 4px;
		border: 1px solid var(--border-color);
		background: var(--bg-secondary);
		color: var(--text-primary);
	}
</style>
