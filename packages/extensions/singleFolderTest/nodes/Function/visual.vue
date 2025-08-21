<template>
	<flow-node-base :context="props.context">
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
				:node-definition="nodeDefinition"
				@close="showEditor = false"
				@save="saveCode"
			/>
		</template>
	</flow-node-base>
</template>

<script setup lang="ts">
	import { ref, onMounted } from "vue"
	import { FlowNodeBase, ICustomNodeContext } from "../../../frontend-types"
	import CodeEditorModal from "./CodeEditorModal.vue"

	import { useFlowStore } from "@webapp/frontend/stores/flowStore.ts"

	const props = defineProps<{
		context: ICustomNodeContext
	}>()

	const showEditor = ref(false)
	const displayName = ref("Function")
	const backendCode = ref("")
	const nodeDefinition = ref<Record<string, any> | undefined>(undefined)
	const logOutput = ref("Log output here:")

	// Listen for log output from the backend
	props.context.db.onPatch(`${props.context.node.id}.outs._log`, (val: string) => {
		logOutput.value = val
	})

	// Load initial values
	onMounted(() => {
		const flowStore = useFlowStore()
		const nodeModel = flowStore.flowState.nodes.find((n) => n.id === props.context.node.id)

		if (nodeModel?.config) {
			displayName.value = nodeModel.config.displayName || "Function"
			backendCode.value = nodeModel.config.backendCode || ""
			nodeDefinition.value = nodeModel.config.nodeDefinition || undefined
		}
	})

	function openCodeEditor() {
		showEditor.value = true
	}

	function saveCode(data: { displayName: string; backendCode: string; nodeDefinition: Record<string, any> }) {
		// Update local refs
		displayName.value = data.displayName
		backendCode.value = data.backendCode
		nodeDefinition.value = data.nodeDefinition

		// Update the node's config in the flow store
		const flowStore = useFlowStore()
		const nodeModel = flowStore.flowState.nodes.find((n: any) => n.id === props.context.node.id)

		if (nodeModel) {
			// Ensure config object exists
			if (!nodeModel.config) {
				nodeModel.config = {}
			}

			// Update configuration properties directly
			nodeModel.config.displayName = data.displayName
			nodeModel.config.backendCode = data.backendCode
			nodeModel.config.nodeDefinition = data.nodeDefinition

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
