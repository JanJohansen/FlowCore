/**
 * Backend example demonstrating usage of the common package
 */

import {
    generateId,
    deepMerge,
    DEFAULT_CONFIG,
    createExampleFlow,
    type IFlowModel,
    type SharedAppState,
    createInitialAppState,
    formatTimestamp
} from '@webapp/common'

// Example: Using shared utilities in backend
export function createBackendExample() {
    console.log('=== Backend Common Package Example ===')

    // Generate unique IDs
    const sessionId = generateId('session')
    const requestId = generateId('req')
    console.log(`Session ID: ${sessionId}`)
    console.log(`Request ID: ${requestId}`)

    // Use shared configuration
    console.log('Default configuration:', DEFAULT_CONFIG)

    // Create example flow using shared types
    const exampleFlow = createExampleFlow()
    console.log('Created example flow:', exampleFlow.name, 'with', exampleFlow.nodes.length, 'nodes')

    // Use shared app state
    const appState = createInitialAppState()
    appState.flows[exampleFlow.id] = exampleFlow
    appState.activeFlowId = exampleFlow.id
    appState.connectionStatus = 'connected'

    console.log('App state initialized with flow:', Object.keys(appState.flows))

    // Demonstrate deep merge with server configuration
    const baseServerConfig = {
        server: {
            port: 3000,
            host: 'localhost',
            cors: { enabled: true }
        },
        database: {
            type: 'json',
            path: './data/db.json'
        }
    }

    const environmentConfig = {
        server: {
            port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
            host: 'localhost',
            cors: {
                enabled: true,
                origins: ['http://localhost:5173', 'http://localhost:3000']
            }
        },
        logging: {
            level: 'info',
            timestamp: true
        }
    }

    const finalConfig = deepMerge(baseServerConfig, environmentConfig)
    console.log('Merged server configuration:', JSON.stringify(finalConfig, null, 2))

    return {
        sessionId,
        requestId,
        exampleFlow,
        appState,
        serverConfig: finalConfig
    }
}

// Example: Shared validation function
export function validateFlowModel(flow: any): flow is IFlowModel {
    return (
        typeof flow === 'object' &&
        typeof flow.id === 'string' &&
        typeof flow.name === 'string' &&
        typeof flow.type === 'string' &&
        Array.isArray(flow.nodes) &&
        Array.isArray(flow.connections)
    )
}

// Example: Shared logging utility
export function logWithTimestamp(message: string, data?: any) {
    const timestamp = formatTimestamp(Date.now())
    console.log(`[${timestamp}] ${message}`, data || '')
}

// Example: Initialize backend with shared functionality
export function initializeBackendWithCommon() {
    logWithTimestamp('Initializing backend with common package functionality')

    const example = createBackendExample()

    logWithTimestamp('Backend initialization complete', {
        sessionId: example.sessionId,
        flowsCount: Object.keys(example.appState.flows).length,
        serverPort: example.serverConfig.server.port
    })

    return example
}

// Export for use in main backend application
export default {
    createBackendExample,
    validateFlowModel,
    logWithTimestamp,
    initializeBackendWithCommon
}
