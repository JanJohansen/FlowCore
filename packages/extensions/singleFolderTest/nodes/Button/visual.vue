<template>
	<flow-node-base :context="props.context">
		<template #body>
			<button
				@pointerdown.stop=""
				@pointerdown.self.stop="handlePointerDown"
				@pointerup.self.stop="handlePointerUp"
			>
				TestButton
			</button>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { FlowNodeBase, ICustomNodeContext } from "../../../frontend-types"

	const props = defineProps<{
		context: ICustomNodeContext
	}>()

	// FIXME: Test - remove!
	props.context.nodeDefinition.ins!.runtimeInput = {
		type: "boolean",
		default: false
	}

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
