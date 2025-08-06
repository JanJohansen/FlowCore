<template>
	<flow-node-base :context="props.context">
		<template #body>
			<div class="output-node-content">
				<div class="output-value">{{ value }}</div>
			</div>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { ref } from "vue"
	import { FlowNodeBase, ICustomNodeContext } from "../../../frontend-types"

	const props = defineProps<{
		context: ICustomNodeContext
	}>()

	const value = ref()

	props.context.db.onSet(props.context.node.id + ".ins.in1", (val: any) => {
		console.log("OutputNode received value:", val)
		value.value = val
	})
</script>

<style scoped>
	.output-node-content {
		padding: 8px;
	}

	.output-value {
		padding: 4px 8px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		border-radius: 4px;
		min-width: 100px;
		min-height: 1.5em;
	}
</style>
