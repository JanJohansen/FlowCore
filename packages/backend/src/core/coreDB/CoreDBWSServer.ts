import { WebSocketServer, WebSocket } from 'ws'
import { CoreDB, CoreDBUser } from './CoreDB'
import { Server } from 'http'

const SERVER_STATUS_KEY = 'serverStatus'

interface WSMessage {
    cmd?: 'set' | 'patch' | 'on' | 'onPatch' | 'onSet' | 'unsubscribe' | 'onCall'
    call?: 'get' | 'call'
    type?: 'response' | 'update' | 'callRequest' | 'callResponse'
    id?: number
    key?: string
    value?: any
    patch?: any
    args?: any[]
    success?: boolean
    error?: string
    result?: any
}

export class CoreDBWebSocket {
    private wss: WebSocketServer
    private db: CoreDB
    private clientUsers: Map<WebSocket, CoreDBUser> = new Map();
    private registeredFunctions: Map<string, WebSocket> = new Map(); // Track which client registered which function
    private pendingCalls: Map<number, WebSocket> = new Map(); // Track pending RPC calls

    constructor(server: Server, db?: CoreDB) {
        this.db = db || CoreDB.getGlobalInstance()
        this.wss = new WebSocketServer({ server })
        // Initialize serverStatus object with empty state
        this.db.patch(SERVER_STATUS_KEY, {
            type: "serverStatus",
            connected: 0,
            clients: {}
        })
        this.setupWebSocketServer()
    }

    private setupWebSocketServer(): void {
        this.wss.on('connection', (ws: WebSocket, req: any) => {
            console.log('New WebSocket client connected')
            const dbUser = new CoreDBUser(this.db)
            this.clientUsers.set(ws, dbUser)

            // Get client IP
            const ip = req.socket.remoteAddress

            // Update connected clients count and IPs
            const currentClients = this.wss.clients.size
            const clientsObj = this.db.get(SERVER_STATUS_KEY) || { connected: 0, clients: {} }
            clientsObj.connected = currentClients
            clientsObj.clients[ip] = true
            this.db.patch(SERVER_STATUS_KEY, clientsObj)

            ws.on('message', (data: string) => {
                try {
                    const message = JSON.parse(data) as WSMessage
                    console.log('<--', message)
                    this.handleMessage(ws, message)
                } catch (error) {
                    this.sendError(ws, 0, 'Invalid message format')
                }
            })

            ws.on('close', () => {
                this.cleanupClientSubscriptions(ws)
                this.cleanupClientRegistrations(ws)

                // Update connected clients count and remove IP
                const currentClients = this.wss.clients.size
                const clientsObj = this.db.get(SERVER_STATUS_KEY)
                clientsObj.connected = currentClients
                delete clientsObj.clients[ip]
                this.db.patch(SERVER_STATUS_KEY, clientsObj)

                console.log('WebSocket client disconnected')
            })
        })
    }

    private handleMessage(ws: WebSocket, message: WSMessage): void {
        // Handle response messages (from RPC calls)
        if (message.type === 'callResponse') {
            this.handleCallResponse(ws, message)
            return
        }

        // Handle commands (no return value expected)
        if (message.cmd) {
            switch (message.cmd) {
                case 'set':
                    // console.log('Received set command:', message);
                    this.handleSetCommand(ws, message)
                    break
                case 'patch':
                    // console.log('Received patch command:', message);
                    this.handlePatchCommand(ws, message)
                    break
                case 'on':
                    // console.log('Received subscribe command:', message)
                    this.handleSubscribeCommand(ws, message)
                    break
                case 'onPatch':
                    // console.log('Received onPatch subscribe command:', message)
                    this.handleOnPatchCommand(ws, message)
                    break
                case 'onSet':
                    // console.log('Received onSet subscribe command:', message)
                    this.handleOnSetCommand(ws, message)
                    break
                case 'unsubscribe':
                    // console.log('Received unsubscribe command:', message)
                    this.handleUnsubscribeCommand(ws, message)
                    break
                case 'onCall':
                    // console.log('Received onCall registration:', message)
                    this.handleOnCallRegistration(ws, message)
                    break
                default:
                    console.log('*** ERROR - Unknown command:', message.cmd)
            }
            return
        }

        // Handle calls (return value expected)
        if (message.call) {
            switch (message.call) {
                case 'get':
                    console.log('Received get call:', message)
                    this.handleGetCall(ws, message)
                    break
                case 'call':
                    console.log('Received function call:', message)
                    this.handleFunctionCall(ws, message)
                    break
                default:
                    console.log('ERROR - Unknown call:', message.call)
                    this.sendError(ws, message.id, 'Unknown call type')
            }
            return
        }

        console.log('ERROR - Message must specify either cmd, call, or be a response')
        this.sendError(ws, message.id, 'Message must specify either cmd, call, or be a response')
    }

    // Commands (no return value)
    private handleSetCommand(ws: WebSocket, message: WSMessage): void {
        if (!message.key || message.value === undefined) {
            // Commands don't expect returns, so just log the error
            console.log('ERROR - Missing key or value')
            return
        }

        try {
            const dbUser = this.clientUsers.get(ws)!
            dbUser.set(message.key, message.value)
        } catch (error) {
            console.log('ERROR - Failed to set value:', error)
        }
    }

    private handlePatchCommand(ws: WebSocket, message: WSMessage): void {
        if (!message.key || message.patch === undefined) {
            // Commands don't expect returns, so just log the error
            console.log('ERROR - Missing key or patch')
            return
        }

        try {
            const dbUser = this.clientUsers.get(ws)!
            dbUser.patch(message.key, message.patch)
        } catch (error) {
            console.log('ERROR - Failed to patch value:', error)
        }
    }

    private handleSubscribeCommand(ws: WebSocket, message: WSMessage): void {
        if (!message.key) {
            console.log('ERROR - Missing key')
            return
        }

        const dbUser = this.clientUsers.get(ws)!
        dbUser.onPatch(message.key!, (patch) => {
            this.sendMessage(ws, {
                type: 'update',
                key: message.key,
                patch: patch,
                value: dbUser.get(message.key!)
            })
        })
    }

    private handleOnPatchCommand(ws: WebSocket, message: WSMessage): void {
        if (!message.key) {
            console.log('ERROR - Missing key')
            return
        }

        const dbUser = this.clientUsers.get(ws)!
        dbUser.onPatch(message.key!, (patch) => {
            this.sendMessage(ws, {
                type: 'update',
                key: message.key,
                patch: patch,
                value: dbUser.get(message.key!)
            })
        })
    }

    private handleOnSetCommand(ws: WebSocket, message: WSMessage): void {
        if (!message.key) {
            console.log('ERROR - Missing key')
            return
        }

        const dbUser = this.clientUsers.get(ws)!
        dbUser.onSet(message.key!, (value) => {
            this.sendMessage(ws, {
                type: 'update',
                key: message.key,
                patch: null, // No patch for set callbacks
                value: value
            })
        })
    }

    private handleUnsubscribeCommand(ws: WebSocket, message: WSMessage): void {
        if (!message.key) {
            console.log('ERROR - Missing key')
            return
        }

        const dbUser = this.clientUsers.get(ws)!
        dbUser.unsubscribe(message.key)
    }

    // Calls (with return value)
    private handleGetCall(ws: WebSocket, message: WSMessage): void {
        if (!message.key) {
            this.sendError(ws, message.id, 'Missing key')
            return
        }

        try {
            const dbUser = this.clientUsers.get(ws)!
            const value = dbUser.get(message.key) // Use the dbUser instance to get the value
            this.sendMessage(ws, {
                type: 'response',
                id: message.id,
                success: true,
                result: value  // Changed from 'value' to 'result' to match client expectation
            })
        } catch (error) {
            this.sendError(ws, message.id, 'Failed to get value')
        }
    }

    private handleOnCallRegistration(ws: WebSocket, message: WSMessage): void {
        if (!message.key) {
            console.log('ERROR - Missing function key in onCall registration')
            return
        }

        this.registeredFunctions.set(message.key, ws)
        console.log(`Registered function '${message.key}' for client`)
    }

    private async handleFunctionCall(callerWs: WebSocket, message: WSMessage): Promise<void> {
        if (!message.key) {
            this.sendError(callerWs, message.id, 'Missing function key')
            return
        }

        // First check if the function is registered locally on the server
        const dbUser = this.clientUsers.get(callerWs)!
        try {
            const result = await dbUser.call(message.key, ...(message.value || []))
            this.sendMessage(callerWs, {
                type: 'response',
                id: message.id,
                success: true,
                result: result
            })
            return
        } catch (localError) {
            // Function not found locally, try remote clients
        }

        const targetWs = this.registeredFunctions.get(message.key)
        if (!targetWs) {
            this.sendError(callerWs, message.id, `Function '${message.key}' not found`)
            return
        }

        try {
            // Track this pending call
            this.pendingCalls.set(message.id!, callerWs)

            // Forward the call to the target client
            this.sendMessage(targetWs, {
                type: 'callRequest',
                id: message.id,
                key: message.key,
                args: message.value || []
            })
        } catch (error) {
            this.pendingCalls.delete(message.id!)
            this.sendError(callerWs, message.id, 'Function call failed')
        }
    }

    private handleCallResponse(ws: WebSocket, message: WSMessage): void {
        if (!message.id) {
            console.log('ERROR - Missing call ID in response')
            return
        }

        const callerWs = this.pendingCalls.get(message.id)
        if (!callerWs) {
            console.log('ERROR - No pending call found for ID:', message.id)
            return
        }

        // Remove from pending calls
        this.pendingCalls.delete(message.id)

        // Forward the response to the original caller
        this.sendMessage(callerWs, {
            type: 'response',
            id: message.id,
            success: message.success,
            result: message.result,
            error: message.error
        })
    }

    private cleanupClientSubscriptions(ws: WebSocket): void {
        const dbUser = this.clientUsers.get(ws)
        if (dbUser) {
            dbUser.unsubscribeAll()
            this.clientUsers.delete(ws)
        }
    }

    private cleanupClientRegistrations(ws: WebSocket): void {
        for (const [key, registeredWs] of this.registeredFunctions.entries()) {
            if (registeredWs === ws) {
                this.registeredFunctions.delete(key)
            }
        }
    }

    private sendMessage(ws: WebSocket, message: WSMessage): void {
        console.log('-->', message)
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message))
        }
    }

    private sendSuccess(ws: WebSocket, id?: number): void {
        this.sendMessage(ws, {
            type: 'response',
            id,
            success: true
        })
    }

    private sendError(ws: WebSocket, id?: number, error?: string): void {
        this.sendMessage(ws, {
            type: 'response',
            id,
            success: false,
            error
        })
    }

    public close(): void {
        this.wss.clients.forEach(client => {
            const dbUser = this.clientUsers.get(client)
            if (dbUser) {
                dbUser.unsubscribeAll()
            }
            client.close()
        })
        this.wss.close()
    }
}
