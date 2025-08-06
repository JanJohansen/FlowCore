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
	import { ref, onUnmounted, watch } from "vue"
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
	props.context.nodeDefinition.config!["inputs"] = {
		type: "enumArray",
		options: topics
	}
	// Update node definition with new topics
	props.context.nodeDefinition.config!["outputs"] = {
		type: "enumArray",
		options: topics
	}

	watch(props.context.nodeDefinition.config?.inputs, () => {
		console.log("Inputs updated:", props.context.nodeDefinition.config?.inputs)
		props.context.node.config.inputs.forEach((topic: string) => {
			console.log("Updating input:", topic)
			const inName = topic.split(props.context.node.config.rootTopic + "/")[1] || topic
			props.context.nodeDefinition.ins![inName] = {
				type: "any",
				description: "Dynamic input based on selected MQTT topics"
			}
		})
	})

	watch(props.context.nodeDefinition.config?.outputs, () => {
		console.log("Outputs updated:", props.context.nodeDefinition.config?.outputs)
		props.context.node.config.outputs.forEach((topic: string) => {
			console.log("Updating output:", topic)
			const outName = topic.split(props.context.node.config.rootTopic + "/")[1] || topic
			props.context.nodeDefinition.outs![outName] = {
				type: "any",
				description: "Dynamic output based on selected MQTT topics"
			}
		})
	})

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
