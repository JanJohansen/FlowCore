<template>
	<flow-node-base :context="props.context">
		<template #body>
			<textarea
				v-text="JSON.stringify(props.context, null, 2)"
				placeholder="Enter MQTT topic here"
				class="textArea"
				@pointerdown.stop=""
			/>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { ref, onUnmounted } from "vue"
	import { FlowNodeBase, ICustomNodeContext } from "../../../frontend-types"

	const props = defineProps<{
		context: ICustomNodeContext
	}>()

	const servers = ref<string[]>([])
	const topics = ref<string[]>([])

	// TODO: Get list of existing MQTT servers - combined options + text field?
	props.context.db.onSet(props.context.node.id + ".servers", (val: string[]) => {
		console.log("Received server list:", val)
		servers.value = val
	})

	// Get list of topics from MQTT server
	props.context.db.onSet(props.context.node.id + ".topics", (val: string[]) => {
		console.log("Received topics from MQTT server:", val)
		topics.value = val
	})

	// Update node definition with new topics
	props.context.nodeDefinition.ins!["topic_1"] = {
		type: "enum",
		description: "MQTT topic for output 1",
		options: topics,
		default: ""
	}
	props.context.nodeDefinition.ins!["topic_1"] = {
		type: "enum",
		description: "MQTT topic for output 1",
		options: topics,
		default: ""
	}

	// watchEffect(() => {
	//     if (props.context.nodeDefinition.ins.topic_1.) {
	//         props.context.nodeDefinition.ins["topic_1"].options = topics.value
	//     }

	// // props.context.
	// setTimeout(() => {
	// 	console.log("Adding new input port to:", props.context.nodeDefinition)
	// 	// Add new input
	// 	props.context.nodeDefinition.ins!["NEW_INPUT"] = {
	// 		type: "string",
	// 		description: "Dynamically added input"
	// 	}
	// }, 5000)

	onUnmounted(() => {
		console.log("Cleaning up MQTT node:", props.context.node.id)
	})
</script>

<style scoped>
	.textArea {
		width: 100%;
		height: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
	}
</style>
