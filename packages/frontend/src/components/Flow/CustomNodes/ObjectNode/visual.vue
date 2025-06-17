<template>
	<flow-node-base :context="props.context" :node="props.node" :node-definition="nodeDefinition">
		<template #body>
			<button>ClicButt!</button>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	// import { reactive } from "vue"
	import FlowNodeBase, { ICustomeNodeContext } from "../../FlowNodeBase.vue"
	import { IFlowNodeModel, INodeDefinition } from "../../types"

	const props = defineProps<{
		context: ICustomeNodeContext
		node: IFlowNodeModel
		nodeDefinition: INodeDefinition
	}>()

	props.nodeDefinition.ins.objectId = {
		type: "enum",
		options: ["option1", "option2", "option3"]
	}

	// const nodeDefinition = reactive<INodeDefinition>({
	// 	typeName: "Overwritten Z2M Object",
	// 	typeUID: "com.flow.Z2MObject",
	// 	category: "MQTT",
	// 	version: "1.0.0",
	// 	author: "System",
	// 	description: "Displays object data in a structured format",
	// 	company: "Flow System",
	// 	license: "MIT",
	// 	ins: {
	// 		objectId: {
	// 			valueType: "string",
	// 			description: "override Object ID"
	// 		}
	// 	},
	// 	outs: {
	// 		data: {
	// 			valueType: "object",
	// 			description: "Object data"
	// 		}
	// 	}
	// })

	setTimeout(() => {
		console.log("Adding new input port to:", props.nodeDefinition)
		// Add new input
		props.nodeDefinition.ins!["NEW_INPUT"] = {
			type: "string",
			description: "Dynamically added input"
		}
		props.nodeDefinition.ins!.objectId.description = "Changed description"
	}, 5000)
</script>

<style scoped></style>
