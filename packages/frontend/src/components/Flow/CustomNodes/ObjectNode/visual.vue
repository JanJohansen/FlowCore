<template>
	<flow-node-base :context="props.context" :node="props.node" :node-definition="nodeDefinition">
		<template #body>
			<button>------------------------- Very Wide Button -------------------------</button>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { reactive } from "vue"
	import FlowNodeBase, { ICustomeNodeContext } from "../../FlowNodeBase.vue"
	import { IFlowNodeModel, INodeDefinition } from "../../types"

	const props = defineProps<{
		context: ICustomeNodeContext
		node: IFlowNodeModel
		nodeDefinition: INodeDefinition
	}>()

	const nodeDefinition = reactive<INodeDefinition>({
		typeName: "Overwritten Z2M Object",
		typeUID: "com.flow.Z2MObject",
		category: "MQTT",
		version: "1.0.0",
		author: "System",
		description: "Displays object data in a structured format",
		company: "Flow System",
		license: "MIT",
		ins: {
			objectId: {
				valueType: "string",
				description: "override Object ID"
			}
		},
		outs: {
			data: {
				valueType: "object",
				description: "Object data"
			}
		}
	})

	setTimeout(() => {
		console.log("Adding new input port to:", nodeDefinition)
		// Add new input
		nodeDefinition.ins!["NEW_INPUT"] = {
			valueType: "string",
			description: "Dynamically added input"
		}
		nodeDefinition.ins!.objectId.description = "Changed description"
	}, 5000)
</script>

<style scoped>
	.object-node {
		min-width: calc(var(--grid-size) * 12);
	}

	.node-header {
		background: #333;
		padding: 4px 8px;
		display: flex;
	}

	.io-connector {
		width: var(--grid-size);
		height: var(--grid-size);
		min-width: var(--grid-size);
		border-radius: 50%;
		background: #555;
		cursor: pointer;
		border: 1px solid #333;
	}

	.io-connector:hover {
		background: #0078d4;
	}

	.io-label {
		font-size: 10px;
		color: #aaa;
		margin: 0 4px;
	}
</style>
