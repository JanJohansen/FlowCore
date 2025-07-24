import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createServer } from 'http'
import { CoreDB } from "./core/coreDB/CoreDB"
import { CoreDBWebSocket } from "./core/coreDB/CoreDBWSServer"
import { Z2M } from './z2m/Z2M'
import { FlowCore } from './core/FlowCore/flowCore'

import { NodeBackendBaseV1 } from './core/FlowCore/NodeBackendBaseV1'
export { NodeBackendBaseV1 }

console.log("**************************************************************************************")
console.log("**************************************************************************************")
console.log("**************************************************************************************")
console.log("Initializing FlowCore backend...")

// ****************************************************************************
// Initialize CoreDB and WebSocket server
// const __filename = fileURLToPath(import.meta.url);
const dbFile = "../../data/db.json"

const app = express()
const PORT = process.env.PORT || 3000

// Create HTTP server instance
const server = createServer(app)

// Initialize CoreDB and WebSocket server
// const db = new CoreDB()
const db = CoreDB.loadFromFile(dbFile)
const wsServer = new CoreDBWebSocket(server, db)

app.use(cors())
app.use(express.json())

// Serve static files from the Vue build output in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, '../../frontend/dist')))
}

// API routes
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Express!' })
})

// Handle SPA routing in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(join(__dirname, '../../frontend/dist/index.html'))
    })
}

// Use server.listen instead of app.listen
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`WebSocket server is ready`)
})


// ****************************************************************************
// Handle graceful shutdown
const gracefulShutdown = () => {
    console.log('Received kill signal, shutting down gracefully')
    db.saveToFile(dbFile)
    wsServer.close()
    server.close(() => {
        console.log('Closed out remaining connections')
        process.exit(0)
    })
}

// Listen for termination signals
process.on('SIGINT', () => {
    console.log('Received SIGINT signal, shutting down gracefully')
    gracefulShutdown()
})

// ****************************************************************************
// Save db periodically
setInterval(() => {
    console.log("Saving db to file")
    db.saveToFile(dbFile)
}, 5 * 60 * 1000) // 5 minutes


// ****************************************************************************
// Initialize FlowCore
const flowCore = new FlowCore(db)

// ****************************************************************************
// Initialize Zigbee2MQTT
const z2m = new Z2M({
    mqttUrl: 'mqtt://192.168.1.124:1883',  // Remove extra 'http://' and '/'
    username: 'MiX',
    password: 'jan190374',
    baseTopic: 'zigbee2mqtt'
})

