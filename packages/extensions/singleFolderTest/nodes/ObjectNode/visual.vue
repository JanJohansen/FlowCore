<template>
	<flow-node-base :context="props.context">
		<template #body>
			<button>ClicButt!</button>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { FlowNodeBase, ICustomNodeContext } from "../../../frontend-types"

	const props = defineProps<{
		context: ICustomNodeContext
	}>()

	// props.context.nodeDefinition.ins!.objectId = {
	// 	type: "enum",
	// 	options: ["option1", "option2", "option3"]
	// }

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
		console.log("Adding new input port to:", props.context.nodeDefinition)
		// Add new input
		props.context.nodeDefinition.ins!["NEW_INPUT"] = {
			type: "string",
			description: "Dynamically added input"
		}
		props.context.nodeDefinition.ins!.objectId.description = "Changed description"
	}, 5000)
</script>

<style scoped></style>
