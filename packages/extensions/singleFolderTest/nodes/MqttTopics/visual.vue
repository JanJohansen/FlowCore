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
	import { FlowNodeBase, ICustomNodeContext } from "../../../frontend-types"

	const props = defineProps<{
		context: ICustomNodeContext
	}>()

	// TODO: Get list of existing MQTT servers - combined options + text field?

	// Get list of topics from MQTT server
	const mqttServer = props.context.db.onSet(props.context.node.id + ".topics", (topics: string[]) => {
		console.log("Received topics from MQTT server:", topics)
		// Process the topics as needed
	})

	// props.context.
	setTimeout(() => {
		console.log("Adding new input port to:", props.context.nodeDefinition)
		// Add new input
		props.context.nodeDefinition.ins!["NEW_INPUT"] = {
			type: "string",
			description: "Dynamically added input"
		}
	}, 5000)
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
