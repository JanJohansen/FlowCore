// Frontend-specific re-exports for Vue components
import { default as FlowNodeBase } from "@webapp/frontend/src/components/Flow/FlowNodeBase.vue"
import type { IFlowNodeModel, INodeDefinition, ICustomNodeContext } from "@webapp/frontend/src/components/Flow/types"
import { useFlowStore } from "@webapp/frontend/src/stores/flowStore"
import MonacoEditor from "@webapp/frontend/src/components/MonacoEditor.vue"

// Re-export commonly needed components for frontend extensions
export {
    FlowNodeBase,
    useFlowStore,
    MonacoEditor,
}

// Export types separately
export type {
    ICustomNodeContext,
    IFlowNodeModel,
    INodeDefinition,
}
