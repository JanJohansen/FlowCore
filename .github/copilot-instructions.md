# FlowCore Copilot Instructions

## Project Overview

FlowCore is a monorepo-based visual flow programming platform with real-time data synchronization, IoT integration, and
extensible node system. Built with TypeScript, Vue 3, Express, and a custom reactive database (CoreDB).

### Package Structure (pnpm workspace)

-   `@webapp/backend`: Express server with CoreDB, FlowCore, MQTT, and shared client
-   `@webapp/frontend`: Vue 3 SPA with flow designer and dashboards
-   `extensions`: Standalone Vue app for extension development

## Architecture

### Backend Core Components

-   **CoreDB**: Custom reactive key-value store (`packages/backend/src/core/coreDB/CoreDB.ts`) with subscription system,
    indexing, and RPC capabilities
-   **FlowCore**: Flow execution engine (`packages/backend/src/core/FlowCore/flowCore.ts`) that manages custom nodes and
    flow instantiation agains the CoreDB
-   **CoreDBClient**: Client-side interface (`packages/common/src/CoreDBClient/`) with WebSocket/TCP transports for
    real-time sync

### Essential Commands

```bash
# Open development setup (VS Code + terminals for frontend and backend)
start-dev.bat  # Windows preferred method

# Manual start
pnpm dev  # Starts all packages concurrently and watches for changes

# Manually build node extensions (also watched in development mode)
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

## CoreDB Patterns

### Data Operations

-   `patch()`: Merge updates (preserves existing properties)
-   `onPatch()`: Subscribe to partial updates
-   `set()`: Complete replacement
-   `onSet()`: Subscribe to complete value changes
-   `get()`: Synchronous retrieval

### RPC System

-   Server: `onCall(functionName, handler)` to register functions
-   Client: `call(functionName, ...args)` to invoke remote functions
-   Bi-directional communication over WebSocket

### Indexing

CoreDB will index objects when requested to do so by subscribing to an index using onSet or onPatch functions...
Examples:

-   TBD

## Vue Frontend Patterns

### State Management

-   Pinia stores in `packages/frontend/src/stores/`
-   CoreDB integration via reactive callback subscriptions

### Component Structure

-   `PageLayout.vue`: Main layout wrapper
-   Flow designer: `components/Flow/` with custom nodes system
-   Dashboard: `components/Dash/` with dynamic widget loading
-   Monaco Editor integration for code editing

### WebSocket Communication

-   CoreDBWSServer handles real-time sync
-   Automatic reconnection and resubscription

### Import Patterns

-   Use workspace imports: `@webapp/extensions/*`, `@webapp/backend/*`
-   Relative imports for local files

### TypeScript Configuration

-   Path mapping for workspace packages in `tsconfig.json`

## Critical Build Dependencies

-   `tsx watch` for backend development (not nodemon)
-   `vite` for frontend with Vue plugin
-   `tsc -w` for common package in watch mode
-   `pnpm` workspace for dependency management
