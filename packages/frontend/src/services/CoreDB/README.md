# CoreDB Service

## Overview

CoreDB is a real-time, reactive database client service that provides seamless data synchronization between frontend
applications and a backend database server. It implements a publish-subscribe pattern with automatic reconnection,
message queuing, and patch-based updates for efficient data management.

### Key Features

-   **Real-time Data Synchronization**: Automatic updates when data changes on the server
-   **Reactive Subscriptions**: Subscribe to specific data keys and receive live updates
-   **Automatic Reconnection**: Robust connection handling with exponential backoff
-   **Message Queuing**: Queues messages during disconnection and replays them on reconnect
-   **Patch-based Updates**: Efficient data merging using patch operations
-   **Multiple Transport Layers**: Support for WebSocket and TCP connections
-   **Function Calls**: Remote procedure call (RPC) functionality
-   **Vue.js Integration**: Seamless integration with Vue 3 and Pinia stores

### Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vue Components │    │   CoreDBStore    │    │  CoreDBClient   │
│                 │◄──►│   (Pinia Store)  │◄──►│                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │  Transport Layer │
                                               │  (WS/TCP)       │
                                               └─────────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │  Backend Server │
                                               │   (CoreDB)      │
                                               └─────────────────┘
```

## Component Documentation

### Core Components

#### 1. CoreDBStore.ts

**Purpose**: Pinia store that manages the global CoreDB connection and provides wrapper instances.

<augment_code_snippet path="src/services/CoreDB/CoreDBStore.ts" mode="EXCERPT">

```typescript
export const useCoreDBStore = defineStore('CoreDBStore', () => {
    const wsTransport = new CoreDBWSTransport('ws://localhost:3000')
    const client = new CoreDBClient(wsTransport)
    const isConnected = ref(false)
    const reconnecting = ref(false)

    const getWrapper = () => {
        return new CoreDBWrapper(client)
    }
```

</augment_code_snippet>

**Key Methods**:

-   `getWrapper()`: Creates a new CoreDBWrapper instance for component-level usage
-   `connect()`: Establishes connection to the CoreDB server
-   `cleanup()`: Properly disconnects and cleans up resources

#### 2. CoreDBClient.ts

**Purpose**: Main client class that handles communication with the CoreDB server.

<augment_code_snippet path="src/services/CoreDB/CoreDBClient.ts" mode="EXCERPT">

```typescript
export class CoreDBClient {
    private messageId = 0;
    private pendingResponses = new Map<number, PendingResponse>();
    private subscriptions = new Map<string, Set<(value: any) => void>>();
    private serverSubscriptions = new Set<string>();
    private registeredFunctions = new Map<string, Function>();
```

</augment_code_snippet>

**Key Features**:

-   Singleton pattern ensures single connection per application
-   Automatic resubscription on reconnection
-   Message routing and response handling
-   Function registration for RPC calls

#### 3. CoreDBWrapper.ts

**Purpose**: Component-level wrapper that provides subscription management and cleanup.

<augment_code_snippet path="src/services/CoreDB/CoreDBClient.ts" mode="EXCERPT">

```typescript
export class CoreDBWrapper {
    private client: CoreDBClient
    private subscriptions: (() => void)[] = [];

    public on(key: string, callback: (patch: any) => void): () => void {
        const unsubscribe = this.client.on(key, callback)
        this.subscriptions.push(unsubscribe)
        return unsubscribe
    }
```

</augment_code_snippet>

**Benefits**:

-   Automatic cleanup of subscriptions when component unmounts
-   Simplified API for component usage
-   Prevents memory leaks

### Transport Layer

#### 4. BaseTransport.ts

**Purpose**: Abstract base class defining the transport interface.

#### 5. CoreDBWSTransport.ts

**Purpose**: WebSocket transport implementation with reconnection logic.

<augment_code_snippet path="src/services/CoreDB/CoreDBWSTransport.ts" mode="EXCERPT">

```typescript
export class CoreDBWSTransport extends BaseTransport {
    private messageQueue: CoreDBMessage[] = [];
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;
```

</augment_code_snippet>

**Features**:

-   Message queuing during disconnection
-   Exponential backoff reconnection strategy
-   Automatic message replay on reconnect

#### 6. CoreDBTCPTransport.ts

**Purpose**: TCP socket transport for Node.js environments.

### Type Definitions

#### 7. CoreDBTypes.ts

**Purpose**: TypeScript interfaces and type definitions.

<augment_code_snippet path="src/services/CoreDB/CoreDBTypes.ts" mode="EXCERPT">

```typescript
export interface CoreDBMessage {
    cmd?: 'set' | 'on' | 'unsubscribe' | 'onCall';
    call?: 'get' | 'call';
    type?: 'response' | 'update' | 'callRequest';
    id?: number;
    key?: string;
    value?: any;
    patch?: any;
```

</augment_code_snippet>

## Usage Examples

### Basic Setup in Vue Component

```typescript
import { useCoreDBStore } from "@/services/CoreDB/CoreDBStore"
import { onUnmounted } from "vue"

export default {
	setup() {
		const coreDBStore = useCoreDBStore()
		const db = coreDBStore.getWrapper()

		// Subscribe to data changes
		db.on("user:123", (patch) => {
			console.log("User data updated:", patch)
		})

		// Clean up on component unmount
		onUnmounted(() => {
			db.unsubscribeAll()
		})

		return { db }
	}
}
```

### Flow Store Integration

<augment_code_snippet path="src/stores/flowStore.ts" mode="EXCERPT">

```typescript
// Initialize CoreDB connection
const db = useCoreDBStore().getWrapper()
db.on("customNodes", (val) => {
	console.log("Received customNodes patch:", val)
	customNodePaths.value = val
})

// Subscribe to flows
db.on("idx:type=RootFlow", (patch) => {
	for (let flowId in patch) {
		if (!flows[flowId]) flows[flowId] = {}
		db.on(flowId, (flowPatch) => {
			db.patch(flows[flowId], flowPatch)
		})
	}
})
```

</augment_code_snippet>

### Data Operations

```typescript
// Set data
await db.set("user:123", { name: "John", age: 30 })

// Get data
const userData = await db.get("user:123")

// Subscribe to changes
const unsubscribe = db.on("user:123", (patch) => {
	// Apply patch to local data
	localUser = db.patch(localUser, patch)
})

// Call remote function
const result = await db.call("calculateSum", { a: 5, b: 3 })

// Register function for remote calls
db.onCall("myFunction", (args) => {
	return { result: args.x * 2 }
})
```

## Technical Specifications

### Requirements

CoreDB is designed to fulfill the following requirements:

1. **Real-time Data Synchronization**: Provide instant updates when data changes
2. **Offline Resilience**: Handle network disconnections gracefully
3. **Scalable Architecture**: Support multiple clients and large datasets
4. **Type Safety**: Full TypeScript support with proper type definitions
5. **Framework Integration**: Seamless Vue.js and Pinia integration

### API Documentation

#### CoreDBWrapper Methods

| Method                  | Parameters                                    | Return Type     | Description                        |
| ----------------------- | --------------------------------------------- | --------------- | ---------------------------------- |
| `on(key, callback)`     | `key: string, callback: (patch: any) => void` | `() => void`    | Subscribe to data changes          |
| `set(key, patch)`       | `key: string, patch: any`                     | `Promise<void>` | Update data on server              |
| `get(key)`              | `key: string`                                 | `Promise<any>`  | Retrieve data from server          |
| `call(key, args)`       | `key: string, args: any`                      | `Promise<any>`  | Call remote function               |
| `onCall(key, callback)` | `key: string, callback: Function`             | `() => void`    | Register function for remote calls |
| `patch(target, source)` | `target: any, source: any`                    | `any`           | Apply patch to target object       |
| `unsubscribeAll()`      | -                                             | `void`          | Remove all subscriptions           |
| `close()`               | -                                             | `void`          | Close connection and cleanup       |

#### Error Handling

CoreDB implements comprehensive error handling:

-   **Connection Errors**: Automatic reconnection with exponential backoff
-   **Message Errors**: Failed messages are queued and retried
-   **Parse Errors**: Malformed messages are logged and ignored
-   **Function Errors**: Remote function failures return error responses

### Data Models

#### CoreDBMessage Structure

```typescript
interface CoreDBMessage {
	// Command messages (client to server)
	cmd?: "set" | "on" | "unsubscribe" | "onCall"

	// Call messages (client to server)
	call?: "get" | "call"

	// Response/Update messages (server to client)
	type?: "response" | "update" | "callRequest"

	// Message identification
	id?: number

	// Data payload
	key?: string
	value?: any
	patch?: any
	args?: any

	// Response data
	success?: boolean
	error?: string
	result?: any
}
```

### Configuration

#### Default Configuration

-   **WebSocket URL**: `ws://localhost:3000`
-   **Reconnection Attempts**: 5 maximum attempts
-   **Initial Reconnection Delay**: 1000ms
-   **Maximum Reconnection Delay**: 10000ms (with exponential backoff)

#### Customization

```typescript
// Custom WebSocket URL
const wsTransport = new CoreDBWSTransport("ws://your-server:8080")

// Custom TCP connection
const tcpTransport = new CoreDBTCPTransport("your-host", 9000)
```

## Software Engineering Perspective

### Design Patterns

1. **Singleton Pattern**: CoreDBClient ensures single connection instance
2. **Observer Pattern**: Subscription-based updates using callbacks
3. **Strategy Pattern**: Pluggable transport layers (WebSocket/TCP)
4. **Wrapper Pattern**: CoreDBWrapper provides simplified interface
5. **Factory Pattern**: CoreDBStore creates wrapper instances

### Error Handling Strategies

1. **Graceful Degradation**: Application continues working during disconnection
2. **Automatic Recovery**: Reconnection and resubscription without user intervention
3. **Message Queuing**: No data loss during temporary disconnections
4. **Comprehensive Logging**: Detailed error messages for debugging

### Performance Considerations

1. **Efficient Patching**: Only sends changed data, not full objects
2. **Connection Pooling**: Single connection shared across components
3. **Subscription Management**: Automatic cleanup prevents memory leaks
4. **Message Batching**: Queued messages are sent efficiently on reconnect

### Testing Approach

While no test files were found in the current codebase, recommended testing strategies include:

1. **Unit Tests**: Test individual methods and error conditions
2. **Integration Tests**: Test transport layer communication
3. **Connection Tests**: Test reconnection and message queuing
4. **Performance Tests**: Test with large datasets and many subscriptions

### Code Organization

```
src/services/CoreDB/
├── CoreDBStore.ts          # Pinia store integration
├── CoreDBClient.ts         # Main client and wrapper classes
├── CoreDBTypes.ts          # Type definitions
├── BaseTransport.ts        # Abstract transport interface
├── CoreDBWSTransport.ts    # WebSocket transport
├── CoreDBTCPTransport.ts   # TCP transport
├── CoreDBWSClient.ts       # Alternative WebSocket client
└── README.md              # This documentation
```

## Architectural Perspective

### System Integration

CoreDB serves as the data layer in a modern web application architecture:

1. **Frontend Layer**: Vue.js components consume reactive data
2. **State Management**: Pinia stores manage application state
3. **Data Layer**: CoreDB provides real-time synchronization
4. **Backend Layer**: CoreDB server manages persistent data

### Data Flow

```
User Action → Vue Component → CoreDB Wrapper → CoreDB Client → Transport → Server
                    ↑                                                        ↓
User Interface ← Reactive Update ← Subscription Callback ← Message ← Response
```

### Scalability Considerations

1. **Horizontal Scaling**: Multiple frontend clients can connect to same server
2. **Vertical Scaling**: Efficient message handling supports large datasets
3. **Load Distribution**: Connection pooling reduces server load
4. **Caching Strategy**: Local data caching with patch-based updates

### Security Implications

1. **Connection Security**: WebSocket connections can use WSS for encryption
2. **Authentication**: Server-side authentication should be implemented
3. **Data Validation**: All incoming data should be validated
4. **Access Control**: Subscription permissions should be enforced server-side

## Developer Guide

### Setup and Installation

1. **Prerequisites**: Node.js, Vue 3, Pinia
2. **Dependencies**: No external dependencies beyond Vue ecosystem
3. **Server Setup**: Requires compatible CoreDB server running on port 3000

### Development Workflow

1. **Import the Store**: Use `useCoreDBStore()` in your components
2. **Get Wrapper**: Call `getWrapper()` for component-level usage
3. **Subscribe to Data**: Use `on()` method for reactive updates
4. **Update Data**: Use `set()` method to modify server data
5. **Cleanup**: Call `unsubscribeAll()` in component cleanup

### Debugging Tips

1. **Connection Status**: Monitor `isConnected` and `reconnecting` reactive refs
2. **Message Logging**: All messages are logged to console with `-->` and `<--` prefixes
3. **Subscription Tracking**: Use browser dev tools to monitor subscription counts
4. **Network Tab**: Monitor WebSocket traffic in browser dev tools

### Common Issues

1. **Connection Refused**: Ensure CoreDB server is running on correct port
2. **Memory Leaks**: Always call `unsubscribeAll()` in component cleanup
3. **Stale Data**: Check if subscriptions are properly established
4. **Performance Issues**: Avoid subscribing to too many keys simultaneously

### Best Practices

1. **Use Wrapper**: Always use CoreDBWrapper instead of CoreDBClient directly
2. **Cleanup Subscriptions**: Implement proper cleanup in component lifecycle
3. **Error Handling**: Wrap async operations in try-catch blocks
4. **Key Naming**: Use consistent, hierarchical key naming conventions
5. **Patch Operations**: Understand patch semantics for efficient updates

### Extending CoreDB

#### Adding New Transport

```typescript
class CustomTransport extends BaseTransport {
	async connect(): Promise<void> {
		// Implementation
	}

	disconnect(): void {
		// Implementation
	}

	send(message: CoreDBMessage): void {
		// Implementation
	}
}
```

#### Custom Message Handlers

```typescript
// In CoreDBClient, extend handleMessage method
private async handleMessage(message: CoreDBMessage): Promise<void> {
  const handlers = {
    'response': this.handleResponseMessage.bind(this),
    'update': this.handleUpdateMessage.bind(this),
    'callRequest': this.handleCallRequest.bind(this),
    'customType': this.handleCustomMessage.bind(this) // Add custom handler
  }
  // ...
}
```

## Additional Sections

### Troubleshooting Guide

#### Connection Issues

**Problem**: Cannot connect to CoreDB server **Solutions**:

1. Verify server is running on correct port
2. Check firewall settings
3. Ensure WebSocket support in browser
4. Try TCP transport as alternative

**Problem**: Frequent disconnections **Solutions**:

1. Check network stability
2. Increase reconnection attempts
3. Monitor server logs for errors
4. Consider connection pooling

#### Performance Issues

**Problem**: Slow data updates **Solutions**:

1. Reduce subscription count
2. Optimize patch operations
3. Check server performance
4. Consider data pagination

**Problem**: Memory leaks **Solutions**:

1. Implement proper cleanup
2. Monitor subscription counts
3. Use browser memory profiler
4. Review component lifecycle

### Performance Tuning Recommendations

1. **Subscription Optimization**: Only subscribe to necessary data keys
2. **Batch Operations**: Group multiple set operations when possible
3. **Connection Reuse**: Use single CoreDBClient instance across application
4. **Message Compression**: Consider implementing message compression for large payloads
5. **Data Pagination**: Implement pagination for large datasets
6. **Debouncing**: Debounce rapid updates to prevent UI thrashing

### Migration Guides

#### From Direct WebSocket Usage

```typescript
// Old approach
const ws = new WebSocket("ws://localhost:3000")
ws.onmessage = (event) => {
	const data = JSON.parse(event.data)
	// Manual handling
}

// New approach
const db = useCoreDBStore().getWrapper()
db.on("dataKey", (patch) => {
	// Automatic patch handling
})
```

#### From REST API

```typescript
// Old approach
const response = await fetch("/api/data")
const data = await response.json()

// New approach
const data = await db.get("dataKey")
// Plus automatic updates via subscriptions
```

#### From Local State Management

```typescript
// Old approach (Vuex/Pinia only)
const store = useStore()
store.commit("updateData", newData)

// New approach (CoreDB + Pinia)
const db = useCoreDBStore().getWrapper()
await db.set("dataKey", newData) // Syncs to server
// Local state updates automatically via subscriptions
```

### Future Roadmap

#### Planned Improvements

1. **Enhanced Security**: Built-in authentication and authorization
2. **Offline Support**: Local storage and sync capabilities
3. **Query Language**: Advanced querying and filtering
4. **Performance Monitoring**: Built-in metrics and monitoring
5. **Schema Validation**: Runtime data validation
6. **Clustering Support**: Multi-server deployment support

#### Experimental Features

1. **GraphQL Integration**: GraphQL-style queries over CoreDB
2. **Time Travel**: Historical data access and rollback
3. **Conflict Resolution**: Automatic conflict resolution for concurrent updates
4. **Compression**: Built-in message compression
5. **Encryption**: End-to-end encryption for sensitive data

### Changelog

#### Version 1.0.0 (Current)

-   Initial implementation with WebSocket and TCP transports
-   Basic subscription and RPC functionality
-   Vue.js and Pinia integration
-   Automatic reconnection and message queuing
-   Patch-based data synchronization
-   Comprehensive error handling

#### Upcoming Version 1.1.0

-   Enhanced error reporting
-   Performance optimizations
-   Additional transport options
-   Improved TypeScript definitions

---

_This documentation reflects the current state of the CoreDB service. For the latest updates and additional information,
please refer to the source code and inline comments._
