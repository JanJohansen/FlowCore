# Full-Stack Vue Express Monorepo

A modern full-stack application built with Vue 3, Express.js, and TypeScript, organized as a pnpm monorepo with shared
code packages. Features real-time data synchronization via WebSocket, flow-based visual programming, and IoT device
integration.

## 🏗️ Project Structure

```
├── packages/
│   ├── backend/          # Node.js/Express server with CoreDB & Flow engine
│   ├── frontend/         # Vue 3 + Vite SPA with flow designer
│   └── common/           # Shared types, utilities, and CoreDB client
├── data/
│   └── db.json           # CoreDB database file
├── pnpm-workspace.yaml   # pnpm workspace configuration
├── package.json          # Root package.json with workspace scripts
├── start-dev.bat         # Development startup script (Windows)
├── start-dev.sh          # Development startup script (Linux/macOS)
└── README.md             # This file
```

## ✨ Features

-   **🔄 Real-time Data Sync**: WebSocket-based CoreDB for live data updates
-   **🎨 Visual Flow Designer**: Drag-and-drop interface for creating data flows
-   **🏠 IoT Integration**: MQTT support for smart home devices (Zigbee2MQTT)
-   **📊 Dashboard Builder**: Dynamic dashboard creation with real-time widgets
-   **🔧 Custom Nodes**: Extensible node system for flow programming
-   **📱 Responsive UI**: Modern Vue 3 interface with TypeScript
-   **🚀 Hot Reload**: Fast development with Vite and tsx watch mode

## 🚀 Quick Start

### Prerequisites

-   Node.js 18+
-   pnpm (installed globally)

### Installation

```bash
# Install all dependencies across workspaces
pnpm install

# Build all packages
pnpm build
```

### Development

```bash
# Start all services in development mode
pnpm dev

# Or use platform-specific startup scripts:
# Windows
start-dev.bat

# Linux/macOS
./start-dev.sh
```

This will start:

-   **Backend**: http://localhost:3000 (Express server with WebSocket)
-   **Frontend**: http://localhost:5173 (Vite dev server)
-   **Common**: Watch mode for shared package

### Production Build

```bash
# Build all packages for production
pnpm build

# Start production server
pnpm start
```

## 📦 Packages

### Backend (`@webapp/backend`)

-   **Tech Stack**: Node.js, Express, TypeScript, WebSocket, MQTT
-   **Features**:
    -   CoreDB server with real-time data synchronization
    -   Flow execution engine with custom node support
    -   MQTT integration for IoT devices (Zigbee2MQTT)
    -   WebSocket server for real-time frontend communication
    -   RESTful API endpoints
-   **Port**: 3000
-   **Database**: JSON-based CoreDB (`data/db.json`)

### Frontend (`@webapp/frontend`)

-   **Tech Stack**: Vue 3, Vite, TypeScript, Pinia, Monaco Editor
-   **Features**:
    -   Visual flow designer with drag-and-drop interface
    -   Real-time dashboard builder
    -   Code editor with syntax highlighting
    -   Responsive UI components
    -   Real-time data visualization
    -   WebSocket client for live updates
-   **Port**: 5173
-   **Build**: Vite with hot module replacement

## 🔧 Available Scripts

### Root Level

-   `pnpm dev` - Start all packages in development mode
-   `pnpm build` - Build all packages
-   `pnpm start` - Start production server
-   `pnpm clean` - Clean all build artifacts and node_modules

### Package Level

```bash
# Backend
pnpm --filter backend dev
pnpm --filter backend build
pnpm --filter backend test

# Frontend
pnpm --filter frontend dev
pnpm --filter frontend build
pnpm --filter frontend preview

# Common
pnpm --filter common build
pnpm --filter common watch
```

## 🔗 Shared Package Usage

The common package provides shared functionality across frontend and backend:

### Import Examples

```typescript
// Import CoreDB client
import { CoreDBClient, CoreDBWSTransport } from "@webapp/backend"

// Import shared types
import { IFlowModel, IFlowNodeModel } from "@webapp/backend/types"

// Import backend base classes
import { NodeBackendBaseV1 } from "@webapp/backend"
```

### Example Usage

```typescript
// Create CoreDB connection
const transport = new CoreDBWSTransport("ws://localhost:3000")
const client = new CoreDBClient(transport)

// Create custom node
class MyNode extends NodeBackendBaseV1 {
	setup() {
		this.ins.on("input", (value) => {
			this.outs.set("output", value * 2)
		})
	}
}
```

## 🏛️ Architecture

### Data Flow

```
Frontend (Vue) ↔ CoreDB Client ↔ WebSocket ↔ Backend (Express) ↔ CoreDB Server
```

### Shared Code Benefits

-   **Type Safety**: Shared TypeScript interfaces ensure consistency
-   **Code Reuse**: Common utilities and CoreDB client used by both apps
-   **Maintainability**: Single source of truth for shared logic
-   **Development Speed**: Changes to shared code automatically available to both apps

## 🛠️ Development Workflow

1. **Make changes** to any package
2. **Common package** rebuilds automatically in watch mode
3. **Frontend** hot-reloads with Vite
4. **Backend** restarts with tsx watch
5. **Type checking** ensures consistency across packages

## � Deployment

### Production Build

```bash
# Build all packages
pnpm build

# Start production server
pnpm start
```

### Environment Variables

```bash
# Backend
PORT=3000                    # Server port
NODE_ENV=production         # Environment mode
MQTT_URL=mqtt://localhost   # MQTT broker URL
MQTT_USERNAME=user          # MQTT username
MQTT_PASSWORD=pass          # MQTT password

# Frontend (build time)
VITE_API_URL=http://localhost:3000    # Backend API URL
VITE_WS_URL=ws://localhost:3000       # WebSocket URL
```

## 🔧 Troubleshooting

### Common Issues

**Port 3000 already in use**

```bash
# Kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**pnpm not found**

```bash
# Install pnpm globally
npm install -g pnpm
```

**TypeScript errors in shared package**

```bash
# Rebuild common package
pnpm --filter common build
```

### Development Tips

-   Use separate terminal windows for each package (via `start-dev.bat` or `start-dev.sh`)
-   Monitor backend logs for CoreDB and flow execution messages
-   Frontend hot reload works automatically with Vite
-   Common package changes trigger rebuilds in dependent packages
-   Use `pnpm --filter <package>` to run commands on specific packages
-   Database file (`data/db.json`) is tracked in git for shared development data

## 🤝 Contributing

1. **Setup**: `pnpm install`
2. **Development**: `pnpm dev` or `start-dev.bat`
3. **Make changes** to any package
4. **Test**: `pnpm build`
5. **Commit** changes with descriptive messages

## 📄 License

MIT License
