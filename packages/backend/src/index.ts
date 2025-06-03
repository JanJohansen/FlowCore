import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createServer } from 'http'
import { CoreDB } from "./core/coreDB/CoreDB"
import { CoreDBWebSocket } from "./core/coreDB/CoreDBWSServer"
import { Z2M } from './z2m/Z2M'
import { FlowCore } from './core/FlowCore/flowCore'

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

// Save db periodically
setInterval(() => {
    console.log("Saving db to file")
    db.saveToFile(dbFile)
}, 5 * 60 * 1000) // 5 minutes

// Listen for termination signals
process.on('SIGINT', () => {
    console.log('Received SIGINT signal, shutting down gracefully')
    gracefulShutdown()
})

// ****************************************************************************
// const iterations = 10000
// const complexStart = performance.now()
// for (let i = 0; i < iterations; i++) {
//   db.set(`complex${i}`, {
//     id: i,
//     metadata: {
//       created: "Date.now()" + i,
//       status: 'active',
//       tags: ['tag1', 'tag2']
//     },
//     nested: {
//       level1: {
//         level2: {
//           value: i
//         }
//       }
//     }
//   })
// }
// console.log("Time: ", performance.now() - complexStart)

// Initialize FlowCore
const flowCore = new FlowCore(db)


// Initialize Z2M
const z2m = new Z2M({
    mqttUrl: 'mqtt://192.168.1.124:1883',  // Remove extra 'http://' and '/'
    username: 'MiX',
    password: 'jan190374',
    baseTopic: 'zigbee2mqtt'
})

// Wait for Z2M connection and device discovery
// z2m.mqtt.on('connect', () => {
//     // Subscribe to all devices of type 'light'
//     db.on('idx:z2m/byType/light=?', (lights) => {
//         console.log('Available lights:', Object.keys(lights));
//     });

//     // Subscribe to a specific device
//     db.on('z2m/device/living_room_light', (device) => {
//         if (device) {  // Add null check
//             console.log('Living room light state:', device.state);
//         }
//     });

//     // Send command to a device after a short delay to ensure discovery
//     // setTimeout(() => {
//     //     z2m.sendCommand('living_room_light', { state: 'ON', brightness: 255 })
//     //         .catch(console.error);
//     // }, 2000);  // 2 second delay
// });
