# FlowCore Copilot Instructions

## Project Overview

FlowCore is a monorepo-based visual flow programming platform with real-time data synchronization, IoT integration, and
extensible node system. Built with TypeScript, Vue 3, Express, and a custom reactive database (CoreDB).

## Architecture Understanding

### Core Components

-   **CoreDB**: Custom reactive key-value store (`packages/backend/src/core/coreDB/CoreDB.ts`) with subscription system,
    indexing, and RPC capabilities
-   **FlowCore**: Flow execution engine (`packages/backend/src/core/FlowCore/flowCore.ts`) that manages custom nodes and
    flow processing
-   **CoreDBClient**: Client-side interface (`packages/common/src/CoreDBClient/`) with WebSocket transport for real-time
    sync
-   **Z2M Integration**: Zigbee2MQTT bridge (`packages/backend/src/z2m/Z2M.ts`) for IoT device integration

### Package Structure (pnpm workspace)

-   `@webapp/backend`: Express server with CoreDB, FlowCore, and MQTT
-   `@webapp/frontend`: Vue 3 SPA with flow designer and dashboards
-   `@webapp/common`: Shared types and CoreDB client
-   `extensions`: Standalone Vue app for extension development

## Development Workflows

### Essential Commands

```bash
# Start all services (opens VS Code + terminals)
start-dev.bat  # Windows preferred method

# Alternative manual start
pnpm dev  # Starts all packages concurrently

# Build node collections (when adding custom nodes)
pnpm run build:nodes
```

### Testing

-   Backend: `jest` with `tsx` for TypeScript execution
-   Focus areas: CoreDB operations, RPC calls, flow execution
-   Test files: `*.test.ts` in respective source directories

## Custom Node System

### Node Structure (Critical Pattern)

Each custom node has a specific file structure in `packages/frontend/src/components/Flow/CustomNodes/[NodeName]/`:

-   `definition.ts`: Node metadata and port definitions
-   `backend.ts`: Server-side execution logic extending `NodeBackendBaseV1`
-   `visual.vue`: Frontend Vue component for node appearance
-   Additional files: modals, utilities, documentation

### Node Development Pattern

1. Define inputs/outputs in `definition.ts` with `INodeDefinition` interface
2. Implement `NodeBackendBaseV1` in `backend.ts` with `setup()` method
3. Create Vue component in `visual.vue` for node UI
4. Use `this.ins.on()` for input listeners and `this.outs.set()` for outputs

### Extension Loading

FlowCore watches `CustomNodes` folder and hot-reloads changes. Use file system operations through CoreDB RPC:

-   `flowCore:saveCustomNodeFile`
-   `flowCore:loadCustomNodeFile`
-   `flowCore:deleteCustomNodeFile`

## CoreDB Patterns

### Data Operations

-   `patch()`: Merge updates (preserves existing properties)
-   `set()`: Complete replacement
-   `get()`: Synchronous retrieval
-   `onPatch()`: Subscribe to partial updates
-   `onSet()`: Subscribe to complete value changes

### RPC System

-   Server: `onCall(functionName, handler)` to register functions
-   Client: `call(functionName, ...args)` to invoke remote functions
-   Bi-directional communication over WebSocket

### Indexing

CoreDB automatically indexes object properties for efficient queries. Use `getByIndex()` for property-based lookups.

## Vue Frontend Patterns

### State Management

-   Pinia stores in `packages/frontend/src/stores/`
-   CoreDB integration via reactive subscriptions
-   Connection status monitoring in `connectionStatusStore.ts`

### Component Structure

-   `PageLayout.vue`: Main layout wrapper
-   Flow designer: `components/Flow/` with custom nodes system
-   Dashboard: `components/Dash/` with dynamic widget loading
-   Monaco Editor integration for code editing

## Integration Points

### MQTT/IoT Integration

Z2M class handles Zigbee2MQTT communication:

-   Device discovery and state tracking
-   Automatic CoreDB persistence of device states
-   Topic structure: `zigbee2mqtt/[device]/[property]`

### WebSocket Communication

-   CoreDBWSServer handles real-time sync
-   Message types: `update`, `response`, `callRequest`
-   Automatic reconnection and resubscription

## File Conventions

### Import Patterns

-   Use workspace imports: `@webapp/common`, `@webapp/backend`
-   ES modules throughout (`"type": "module"` in package.json)
-   Relative imports for local files

### TypeScript Configuration

-   Shared `tsconfig.json` with ES2022 target
-   Path mapping for workspace packages
-   Strict mode enabled across all packages

## Critical Build Dependencies

-   `tsx watch` for backend development (not nodemon)
-   `vite` for frontend with Vue plugin
-   `tsc -w` for common package in watch mode
-   `pnpm` workspace for dependency management

When modifying flows or nodes, always consider the backend-frontend split and ensure proper CoreDB synchronization for
real-time updates.
