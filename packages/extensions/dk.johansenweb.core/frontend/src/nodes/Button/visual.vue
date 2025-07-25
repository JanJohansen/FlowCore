<template>
	<flow-node-base :context="props.context" :node="props.node" :nodeDefinition="props.nodeDefinition">
		<template #body>
			<button
				@pointerdown.stop=""
				@pointerdown.self.stop="handlePointerDown"
				@pointerup.self.stop="handlePointerUp"
			>
				Button!
			</button>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { ref } from "vue"
	import { default as FlowNodeBase, ICustomeNodeContext } from "../../FlowNodeBase.vue"
	import { IFlowNodeModel, INodeDefinition } from "../../types"

	const props = defineProps<{
		context: ICustomeNodeContext
		node: IFlowNodeModel
		nodeDefinition: INodeDefinition
	}>()

	// props.context.db.on(props.context.node.id + ".ins.pressed", (val: boolean) => {})

	function handlePointerDown() {
		console.log("Pointer down on button", props.context)

		// Send down event
		const downOutputPath = `${props.context.node.id}.ins.pressed`
		props.context.db.set(downOutputPath, true)
	}

	function handlePointerUp() {
		console.log("Pointer up on button")

		// Send up event
		const upOutputPath = `${props.context.node.id}.ins.pressed`
		props.context.db.set(upOutputPath, false)
	}
</script>

<style scoped>
	button {
		width: 100%;
		padding: 2px;
		background: green;
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		border-radius: 4px;
	}
</style>
