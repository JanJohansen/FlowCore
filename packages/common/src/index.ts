// Export all CoreDB client functionality
export * from './CoreDBClient/index'

// Re-export commonly used types and interfaces
export type {
    CoreDBTransport,
    CoreDBMessage,
    PendingResponse,
    ConnectionCallback,
    DisconnectionCallback
} from './CoreDBClient/types'

// Export main classes for direct import
export { CoreDBClient } from './CoreDBClient/CoreDBClient'
export { CoreDBWSTransport } from './CoreDBClient/CoreDBWSTransport'
export { BaseTransport } from './CoreDBClient/BaseTransport'

// Export TCP transport separately (Node.js only)
export { CoreDBTCPTransport } from './CoreDBClient/CoreDBTCPTransport'

// Export shared types, utilities, and constants
export * from './types'
export * from './utils'
export * from './constants'

// Export examples (optional)
export * from './example'

// Export NodeBackendBaseV1 for use in custom nodes (backend only)
// Note: This will only work in Node.js environment
export { NodeBackendBaseV1 } from './NodeBackendBaseV1'
