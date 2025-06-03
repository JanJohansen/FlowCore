<template>
	<flow-node-base>
		<template #body>
			<div>{{ tick }}</div>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { default as FlowNodeBase, ICustomeNodeContext } from "../../FlowNodeBase.vue"
	import { ref } from "vue"

	const props = defineProps<{
		context: ICustomeNodeContext
	}>()

	const tick = ref(0)

	props.context.db.on(props.context.node.id + ".tick", (newTick: number) => {
		tick.value = newTick
	})
</script>

<style scoped></style>
