<template>
	<flow-node-base :context="props.context" :node="props.node" :nodeDefinition="props.nodeDefinition">
		<template #header>
			<span class="node-title">{{ displayName }}</span>
		</template>
		<template #body>
			<div class="function-node">
				<button class="edit-button" @click.stop="openCodeEditor">Edit Files</button>
				<div v-if="logOutput" class="log-output">
					<pre>{{ logOutput }}</pre>
				</div>
			</div>

			<!-- Code Editor Modal using Teleport -->
			<code-editor-modal
				v-if="showEditor"
				:display-name="displayName"
				:backend-code="backendCode"
				:ui-code="nodeUICode"
				:input-definitions="inputDefinitions"
				:output-definitions="outputDefinitions"
				@close="showEditor = false"
				@save="saveCode"
			/>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue"
	import { FlowNodeBase } from "../../../frontend-types"
	import type { ICustomNodeContext, IFlowNodeModel, INodeDefinition } from "../../../frontend-types"
	import CodeEditorModal from "./CodeEditorModal.vue"

	import { useFlowStore } from "@webapp/frontend/src/stores/flowStore"

	const props = defineProps<{
		context: ICustomNodeContext
		node: IFlowNodeModel
		nodeDefinition: INodeDefinition
	}>()

	const showEditor = ref(false)
	const displayName = ref("Function")
	const backendCode = ref("")
	const nodeUICode = ref("")
	const inputDefinitions = ref<Record<string, any>>({})
	const outputDefinitions = ref<Record<string, any>>({})
	const logOutput = ref("Log output here:")

	// Listen for log output from the backend
	props.context.db.on(`${props.context.node.id}.outs._log`, (val: string) => {
		logOutput.value = val
	})

	// Load initial values
	onMounted(() => {
		const flowStore = useFlowStore()
		const nodeModel = flowStore.flowState.nodes.find((n) => n.id === props.context.node.id)

		if (nodeModel?.config?.ins) {
			displayName.value = nodeModel.config.ins.displayName?.value || "Function"
			backendCode.value = nodeModel.config.ins.backendCode?.value || ""
			nodeUICode.value = nodeModel.config.ins.nodeUICode?.value || ""
			inputDefinitions.value = nodeModel.config.ins.inputDefinitions?.value || {}
			outputDefinitions.value = nodeModel.config.ins.outputDefinitions?.value || {}
		}
	})

	function openCodeEditor() {
		showEditor.value = true
	}

	function saveCode(data: {
		displayName: string
		backendCode: string
		uiCode: string
		inputDefs: Record<string, any>
		outputDefs: Record<string, any>
	}) {
		// Update local refs
		displayName.value = data.displayName
		backendCode.value = data.backendCode
		nodeUICode.value = data.uiCode
		inputDefinitions.value = data.inputDefs
		outputDefinitions.value = data.outputDefs

		// Update the node's config in the flow store
		const flowStore = useFlowStore()
		const nodeModel = flowStore.flowState.nodes.find((n) => n.id === props.context.node.id)

		if (nodeModel) {
			// Ensure config and config.ins objects exist
			if (!nodeModel.config) {
				nodeModel.config = { ins: {} }
			}
			if (!nodeModel.config.ins) {
				nodeModel.config.ins = {}
			}

			// Update configuration input properties
			nodeModel.config.ins.displayName = { value: data.displayName }
			nodeModel.config.ins.backendCode = { value: data.backendCode }
			nodeModel.config.ins.nodeUICode = { value: data.uiCode }
			nodeModel.config.ins.inputDefinitions = { value: data.inputDefs }
			nodeModel.config.ins.outputDefinitions = { value: data.outputDefs }

			// Update the node in the store
			nodeModel.config = nodeModel.config
		}

		// Close the editor
		showEditor.value = false
	}
</script>

<style scoped>
	.function-node {
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.edit-button {
		background: #4a5568;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 6px 12px;
		cursor: pointer;
		font-size: 14px;
	}

	.edit-button:hover {
		background: #2d3748;
	}

	.log-output {
		background: #1a202c;
		color: #a0aec0;
		border-radius: 4px;
		padding: 8px;
		font-family: monospace;
		font-size: 12px;
		max-height: 100px;
		overflow-y: auto;
	}

	pre {
		margin: 0;
		white-space: pre-wrap;
	}
</style>
