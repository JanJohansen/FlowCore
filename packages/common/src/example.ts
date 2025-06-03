/**
 * Example usage of the common package functionality
 * This demonstrates how to use shared utilities, types, and CoreDB client
 */

import { 
    CoreDBClient, 
    CoreDBWSTransport, 
    generateId, 
    deepMerge, 
    DEFAULT_CONFIG,
    IFlowModel,
    IFlowNodeModel 
} from './index'

// Example: Using shared utilities
export function createExampleFlow(): IFlowModel {
    const flowId = generateId('flow')
    
    const inputNode: IFlowNodeModel = {
        id: generateId('node'),
        type: 'InputNode',
        typeUID: 'InputNode',
        position: { x: 100, y: 100 },
        data: { label: 'Input' },
        config: {
            ins: {
                value: { value: 'Hello World' }
            }
        }
    }
    
    const outputNode: IFlowNodeModel = {
        id: generateId('node'),
        type: 'OutputNode', 
        typeUID: 'OutputNode',
        position: { x: 300, y: 100 },
        data: { label: 'Output' }
    }
    
    return {
        id: flowId,
        name: 'Example Flow',
        type: 'RootFlow',
        nodes: [inputNode, outputNode],
        connections: [{
            id: generateId('connection'),
            sourceNodeId: inputNode.id,
            sourceOutput: 'output',
            sourcePortId: 'output',
            targetNodeId: outputNode.id,
            targetInput: 'input',
            targetPortId: 'input'
        }]
    }
}

// Example: Using CoreDB client
export async function createCoreDBExample(): Promise<CoreDBClient> {
    const transport = new CoreDBWSTransport(DEFAULT_CONFIG.WS_URL)
    const client = new CoreDBClient(transport)
    
    // Connect to the server
    await transport.connect()
    
    // Example usage
    const exampleFlow = createExampleFlow()
    await client.set(`flows/${exampleFlow.id}`, exampleFlow)
    
    // Subscribe to changes
    client.onPatch(`flows/${exampleFlow.id}`, (patch) => {
        console.log('Flow updated:', patch)
    })
    
    return client
}

// Example: Using shared utilities
export function mergeConfigurations(base: any, override: any): any {
    return deepMerge(base, override)
}

// Example: Creating a shared data structure
export interface SharedAppState {
    flows: Record<string, IFlowModel>
    activeFlowId?: string
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
}

export function createInitialAppState(): SharedAppState {
    return {
        flows: {},
        connectionStatus: 'disconnected'
    }
}
