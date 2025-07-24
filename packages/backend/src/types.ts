// Re-export all types from CoreDBClient
export * from './core/coreDB/client/types'

// Common shared types that can be used across frontend and backend
export interface AppConfig {
    apiUrl: string
    wsUrl: string
    environment: 'development' | 'production' | 'test'
}

export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    timestamp: number
}

// Flow-related types that are shared between frontend and backend
export interface IFlowModel {
    id: string
    name: string
    type: string
    nodes: IFlowNodeModel[]
    connections: IFlowConnection[]
    metadata?: Record<string, any>
}

export interface IFlowNodeModel {
    id: string
    type: string
    typeUID?: string // For backward compatibility
    position: { x: number; y: number }
    data: Record<string, any>
    inputs?: Record<string, any>
    outputs?: Record<string, any>
    config?: {
        ins?: Record<string, { value: any }>
        outs?: Record<string, any>
    }
}

export interface IFlowConnection {
    id: string
    sourceNodeId: string
    sourceOutput: string
    sourcePortId?: string // For backward compatibility
    targetNodeId: string
    targetInput: string
    targetPortId?: string // For backward compatibility
}

// Backend node context interface
export interface IBackendBaseNodeContext {
    db: any // CoreDB instance
    global: any
    flow: any
    type: any
    node: { id: string }
}

export interface ISetupContext {
    global: any
    flow: any
    type: any
    node: any | { id: string }
    db?: any // Optional since it gets deleted
}
