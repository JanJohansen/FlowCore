interface WSMessage {
    cmd?: 'set' | 'on' | 'unsubscribe' | 'onCall'  // Added 'onCall' command
    call?: 'get' | 'call'
    type?: 'response' | 'update' | 'callRequest'    // Added 'callRequest' type
    id?: number
    key?: string
    value?: any
    patch?: any
    args?: any
    success?: boolean
    error?: string
    result?: any
}

export class CoreDBWSClient {
    private ws!: WebSocket  // Use definite assignment assertion
    private messageId: number = 0;
    private pendingResponses: Map<number, { resolve: Function, reject: Function }> = new Map();
    private subscriptions: Map<string, Set<(value: any) => void>> = new Map();
    private serverSubscriptions: Set<string> = new Set(); // Track server-side subscriptions
    private isConnected: boolean = false;
    private connectionPromise?: Promise<void>
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000;

    private globalInstance: CoreDBWSClient | undefined = undefined;
    private registeredFunctions: Map<string, Function> = new Map();

    constructor(url: string = "ws://localhost:3000") {
        if (this.globalInstance) return this.globalInstance

        this.globalInstance = this
        this.ws = this.createWebSocket(url)
        return this.globalInstance
    }

    private createWebSocket(url: string): WebSocket {
        const ws = new WebSocket(url)

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data) as WSMessage
            console.log("<--", message)
            this.handleMessage(message)
        }

        ws.onopen = () => {
            console.log('Connected to CoreDB WebSocket')
            this.isConnected = true
            if (this.reconnectAttempts > 0) {
                this.resubscribeAll()
            }
            this.reconnectAttempts = 0
        }

        ws.onclose = () => {
            this.isConnected = false
            this.handleDisconnect()
        }

        return ws
    }

    private async handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
            await new Promise(resolve => setTimeout(resolve, this.reconnectDelay))
            this.ws = this.createWebSocket(this.ws.url)
        } else {
            console.error('Max reconnection attempts reached')
        }
    }

    private async ensureConnection(): Promise<void> {
        if (this.isConnected) return

        if (!this.connectionPromise) {
            this.connectionPromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'))
                }, 2000)

                const checkConnection = () => {
                    if (this.isConnected) {
                        clearTimeout(timeout)
                        resolve()
                    } else {
                        setTimeout(checkConnection, 100)
                    }
                }

                checkConnection()
            })
        }

        return this.connectionPromise
    }

    private async sendMessage(message: WSMessage): Promise<void> {
        await this.ensureConnection()
        console.log("-->", message)
        this.ws.send(JSON.stringify(message))
    }

    private async sendCall(message: WSMessage): Promise<any> {
        await this.ensureConnection()

        return new Promise((resolve, reject) => {
            const id = ++this.messageId
            message.id = id
            this.pendingResponses.set(id, { resolve, reject })
            console.log("-->", message, this.isConnected ? "connected" : "disconnected")
            this.ws.send(JSON.stringify(message))
        })
    }

    private handleMessage(message: WSMessage): void {
        if (message.type === 'response') {
            const pending = this.pendingResponses.get(message.id!)
            if (pending) {
                this.pendingResponses.delete(message.id!)
                if (message.success) {
                    pending.resolve(message.result) // Use result for function calls
                } else {
                    pending.reject(new Error(message.error))
                }
            }
        } else if (message.type === 'update') {
            const callbacks = this.subscriptions.get(message.key!)
            callbacks?.forEach(callback => callback(message.patch))
        } else if (message.type === 'callRequest') {
            this.handleCallRequest(message)
        }
    }

    private async handleCallRequest(message: WSMessage): Promise<void> {
        const func = this.registeredFunctions.get(message.key!)
        if (!func) {
            this.sendMessage({
                type: 'response',
                id: message.id,
                success: false,
                error: `Function '${message.key}' not found`
            })
            return
        }

        try {
            const result = await func(message.value)
            this.sendMessage({
                type: 'response',
                id: message.id,
                success: true,
                result: result
            })
        } catch (error) {
            this.sendMessage({
                type: 'response',
                id: message.id,
                success: false,
                error: 'Function execution failed'
            })
        }
    }

    private async resubscribeAll(): Promise<void> {
        console.log("Resubscribing to all keys...", this.serverSubscriptions)
        this.connectionPromise = undefined // Reset connection promise
        await this.ensureConnection()

        // Resubscribe to all keys that were subscribed on the server
        for (const key of this.serverSubscriptions) {
            try {
                await this.sendMessage({
                    cmd: 'on',
                    key
                })
            } catch (error) {
                console.error(`Failed to resubscribe to ${key}:`, error)
            }
        }
    }

    public async set(key: string, patch: any): Promise<void> {
        await this.sendMessage({
            cmd: 'set',
            key,
            patch
        })
    }

    public on(key: string, callback: (patch: any) => void): () => void {
        let callbacks = this.subscriptions.get(key)

        if (!callbacks) {
            callbacks = new Set()
            this.subscriptions.set(key, callbacks)

            // Only subscribe on server if we haven't already
            if (!this.serverSubscriptions.has(key)) {
                this.serverSubscriptions.add(key)
                this.sendMessage({
                    cmd: 'on',
                    key
                })
            }
        }

        callbacks.add(callback)

        // Return unsubscribe function
        return () => {
            const callbacks = this.subscriptions.get(key)
            if (callbacks) {
                callbacks.delete(callback)

                // If no more local callbacks, unsubscribe from the server
                if (callbacks.size === 0) {
                    this.subscriptions.delete(key)
                    this.serverSubscriptions.delete(key)
                    this.sendMessage({
                        cmd: 'unsubscribe',
                        key
                    })
                }
            }
        }
    }

    public close(): void {
        this.serverSubscriptions.clear()
        this.subscriptions.clear()
        this.ws.close()
    }

    public onCall(key: string, callback: Function): () => void {
        this.registeredFunctions.set(key, callback)
        this.sendMessage({
            cmd: 'onCall',
            key
        })

        // Return unregister function
        return () => {
            this.registeredFunctions.delete(key)
            // Optionally notify server about unregistration
            this.sendMessage({
                cmd: 'unsubscribe',
                key
            })
        }
    }

    public async call(key: string, args: any): Promise<any> {
        const response = await this.sendCall({
            call: 'call',
            key,
            value: args
        })
        return response
    }

    public async get(key: string): Promise<any> {
        const response = await this.sendCall({
            call: 'get',
            key
        })
        return response
    }

    // Simple patch method for applying updates
    public patch(target: any, source: any): any {
        if (source === null || source === undefined) {
            return source
        }

        if (typeof source !== 'object' || Array.isArray(source)) {
            return source
        }

        const result = { ...target }
        for (const [key, value] of Object.entries(source)) {
            if (value === null) {
                delete result[key]
            } else if (typeof value === 'object' && !Array.isArray(value) && typeof target[key] === 'object') {
                result[key] = this.patch(target[key], value)
            } else {
                result[key] = value
            }
        }
        return result
    }
}

export class CoreDBWSWrapper {
    private client: CoreDBWSClient | CoreDBWSWrapper
    private subscriptions: (() => void)[] = [];

    constructor(db: CoreDBWSClient | CoreDBWSWrapper | undefined = undefined) {
        this.client = db || new CoreDBWSClient()
    }

    // Add patch method to wrapper
    public patch(target: any, source: any): any {
        if (this.client instanceof CoreDBWSClient) {
            return this.client.patch(target, source)
        } else {
            return this.client.patch(target, source)
        }
    }

    // Subscribe to a key. Received patch should be applied to the target object or be a value
    public on(key: string, callback: (patch: any) => void): () => void {
        const unsubscribe = this.client.on(key, callback)
        this.subscriptions.push(unsubscribe)
        return () => {
            unsubscribe()
            this.subscriptions = this.subscriptions.filter(sub => sub !== unsubscribe)
        }
    }

    // Set a key. Patch will update target value
    public async set(key: string, patch: any): Promise<void> {
        await this.client.set(key, patch)
    }

    public unsubscribeAll(): void {
        this.subscriptions.forEach(unsub => unsub())
        this.subscriptions = []
    }

    public close(): void {
        this.unsubscribeAll()
        this.client.close()
    }

    // Get a value by key
    public async get(key: string): Promise<any> {
        return await this.client.get(key)
    }
}
