<template>
	<flow-node-base :context="props.context" :node="props.node" :nodeDefinition="props.nodeDefinition">
		<template #header>-</template>
		<template #inputs>
			<input type="text" v-model="value" placeholder="Enter value..." @input="updateOutput" />
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { ref } from "vue"
	import { FlowNodeBase } from "../../../frontend-types"
	import type { ICustomNodeContext, IFlowNodeModel, INodeDefinition } from "../../../frontend-types"

	const props = defineProps<{
		context: ICustomNodeContext
		node: IFlowNodeModel
		nodeDefinition: INodeDefinition
	}>()

	const value = ref("")

	function updateOutput() {
		// Implementation will be in backend.ts
		console.log('{"value":' + value.value + "}")
		const val = JSON.parse('{"value":' + value.value + "}")

		props.context.db.set(props.context.node.id + ".outs.out", value.value)
	}
</script>

<style scoped>
	input {
		width: 100%;
		height: 100%;
		padding: 2px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		border-radius: 4px;
	}
</style>
