// This file provides re-exports specifically for backend usage

// Backend-safe imports - use relative path to avoid package export issues
export { NodeBackendBaseV1 } from "../backend/src/core/FlowCore/NodeBackendBaseV1"

// Export ICustomNodeContext type (backend nodes need this interface)
export type { ICustomNodeContext } from "@webapp/frontend/src/components/Flow/FlowNodeBase.vue"

// Export backend-safe types only
export type {
    IFlowNodeModel,
    INodeDefinition,
} from "@webapp/frontend/src/components/Flow/types"