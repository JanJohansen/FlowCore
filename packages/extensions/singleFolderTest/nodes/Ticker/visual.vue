<template>
	<flow-node-base>
		<template #body>
			<div>{{ tick }}</div>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { ref } from "vue"
	import { FlowNodeBase } from "../../../frontend-types"
	import type { ICustomNodeContext, IFlowNodeModel, INodeDefinition } from "../../../frontend-types"

	const props = defineProps<{
		context: ICustomNodeContext
	}>()

	const tick = ref(0)

	props.context.db.onPatch(props.context.node.id + ".tick", (newTick: number) => {
		tick.value = newTick
	})
</script>

<style scoped></style>
