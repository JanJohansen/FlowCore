import { CoreDBTransport, CoreDBMessage, PendingResponse } from '@webapp/common'

export class CoreDBClient {
    private messageId = 0;
    private pendingResponses = new Map<number, PendingResponse>();
    private subscriptions = new Map<string, Set<(value: any) => void>>();
    private serverSubscriptions = new Set<string>();
    private registeredFunctions = new Map<string, Function>();
    private static instance: CoreDBClient | null = null;

    constructor(private transport: CoreDBTransport) {
        if (CoreDBClient.instance) {
            return CoreDBClient.instance
        }
        CoreDBClient.instance = this
        this.setupTransport()
    }

    private setupTransport(): void {
        this.transport.onMessage(this.handleMessage.bind(this))
        this.transport.onConnect(this.handleConnect.bind(this))
        this.transport.onDisconnect(this.handleDisconnect.bind(this))
    }

    private handleConnect(): void {
        this.resubscribeAll()
    }

    private handleDisconnect(): void {
        // Could add reconnection logic here if needed
    }

    private async handleMessage(message: CoreDBMessage): Promise<void> {
        const handlers: Record<string, (message: CoreDBMessage) => void> = {
            'response': this.handleResponseMessage.bind(this),
            'update': this.handleUpdateMessage.bind(this),
            'callRequest': this.handleCallRequest.bind(this)
        }

        const handler = handlers[message.type || '']
        if (handler) {
            handler(message)
        }
    }

    private handleResponseMessage(message: CoreDBMessage): void {
        const pending = this.pendingResponses.get(message.id!)
        if (!pending) return

        this.pendingResponses.delete(message.id!)
        if (message.success) {
            pending.resolve(message.result)
        } else {
            pending.reject(new Error(message.error))
        }
    }

    private handleUpdateMessage(message: CoreDBMessage): void {
        // Handle patch callbacks
        const patchCallbacks = this.subscriptions.get(message.key! + ':patch')
        patchCallbacks?.forEach(callback => callback(message.patch))

        // Handle set callbacks
        const setCallbacks = this.subscriptions.get(message.key! + ':set')
        setCallbacks?.forEach(callback => callback(message.value))

        // Handle legacy callbacks (deprecated)
        const legacyCallbacks = this.subscriptions.get(message.key!)
        legacyCallbacks?.forEach(callback => callback(message.patch))
    }

    private async handleCallRequest(message: CoreDBMessage): Promise<void> {
        const func = this.registeredFunctions.get(message.key!)
        if (!func) {
            this.sendErrorResponse(message.id!, `Function '${message.key}' not found`)
            return
        }

        try {
            const result = await func(message.value)
            this.sendSuccessResponse(message.id!, result)
        } catch (error) {
            this.sendErrorResponse(message.id!, 'Function execution failed')
        }
    }

    private sendErrorResponse(id: number, error: string): void {
        this.sendMessage({
            type: 'response',
            id,
            success: false,
            error
        })
    }

    private sendSuccessResponse(id: number, result: any): void {
        this.sendMessage({
            type: 'response',
            id,
            success: true,
            result
        })
    }

    private async resubscribeAll(): Promise<void> {
        console.log("Resubscribing to all keys...", this.serverSubscriptions)

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

    private sendMessage(message: CoreDBMessage): void {
        this.transport.send(message)
    }

    private async sendCall(message: CoreDBMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            const id = ++this.messageId
            message.id = id
            this.pendingResponses.set(id, { resolve, reject })
            this.sendMessage(message)
        })
    }

    /**
     * Completely overwrites/replaces the value of a key
     * @param key The key to set
     * @param value The new value to set (completely replaces existing value)
     */
    public async set(key: string, value: any): Promise<void> {
        await this.sendMessage({
            cmd: 'set',
            key,
            value
        })
    }

    /**
     * Performs partial updates to a key's value using the provided patch object
     * @param key The key to update
     * @param patch The patch object containing the changes to apply
     */
    public async patch(key: string, patch: any): Promise<void> {
        await this.sendMessage({
            cmd: 'patch',
            key,
            patch
        })
    }

    /**
     * Subscribe to patch changes on a key (receives patch objects)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives patch)
     * @returns Unsubscribe function
     */
    public onPatch(key: string, callback: (patch: any) => void): () => void {
        let callbacks = this.subscriptions.get(key + ':patch')

        if (!callbacks) {
            callbacks = new Set()
            this.subscriptions.set(key + ':patch', callbacks)

            if (!this.serverSubscriptions.has(key)) {
                this.serverSubscriptions.add(key)
                this.sendMessage({
                    cmd: 'onPatch',
                    key
                })
            }
        }

        callbacks.add(callback)

        return () => {
            const callbacks = this.subscriptions.get(key + ':patch')
            if (callbacks) {
                callbacks.delete(callback)
                if (callbacks.size === 0) {
                    this.subscriptions.delete(key + ':patch')
                    // Only unsubscribe from server if no set callbacks either
                    const setCallbacks = this.subscriptions.get(key + ':set')
                    if (!setCallbacks || setCallbacks.size === 0) {
                        this.serverSubscriptions.delete(key)
                        this.sendMessage({
                            cmd: 'unsubscribe',
                            key
                        })
                    }
                }
            }
        }
    }

    /**
     * Subscribe to complete value changes on a key (receives full values)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives complete value)
     * @returns Unsubscribe function
     */
    public onSet(key: string, callback: (value: any) => void): () => void {
        let callbacks = this.subscriptions.get(key + ':set')

        if (!callbacks) {
            callbacks = new Set()
            this.subscriptions.set(key + ':set', callbacks)

            if (!this.serverSubscriptions.has(key)) {
                this.serverSubscriptions.add(key)
                this.sendMessage({
                    cmd: 'onSet',
                    key
                })
            }
        }

        callbacks.add(callback)

        return () => {
            const callbacks = this.subscriptions.get(key + ':set')
            if (callbacks) {
                callbacks.delete(callback)
                if (callbacks.size === 0) {
                    this.subscriptions.delete(key + ':set')
                    // Only unsubscribe from server if no patch callbacks either
                    const patchCallbacks = this.subscriptions.get(key + ':patch')
                    if (!patchCallbacks || patchCallbacks.size === 0) {
                        this.serverSubscriptions.delete(key)
                        this.sendMessage({
                            cmd: 'unsubscribe',
                            key
                        })
                    }
                }
            }
        }
    }

    /**
     * @deprecated Use onPatch() instead. This method will be removed in a future version.
     * Subscribe to changes on a key (receives patch objects)
     */
    public on(key: string, callback: (patch: any) => void): () => void {
        console.warn('CoreDBClient.on() is deprecated. Use onPatch() instead.')
        return this.onPatch(key, callback)
    }

    public onCall(key: string, callback: Function): () => void {
        this.registeredFunctions.set(key, callback)
        this.sendMessage({
            cmd: 'onCall',
            key
        })

        return () => {
            this.registeredFunctions.delete(key)
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

    public close(): void {
        this.transport.disconnect()
        this.serverSubscriptions.clear()
        this.subscriptions.clear()
        this.registeredFunctions.clear()
        this.pendingResponses.clear()
    }

    public unsubscribeAll(): void {
        // Unsubscribe from all server subscriptions
        for (const key of this.serverSubscriptions) {
            this.sendMessage({
                cmd: 'unsubscribe',
                key
            })
        }

        // Clear all local subscriptions and server subscriptions
        this.subscriptions.clear()
        this.serverSubscriptions.clear()
    }

    public applyPatch(target: any, source: any): any {
        // If source is null/undefined, return null
        if (source === null || source === undefined) {
            return null
        }

        // If source is not an object, return the source value directly
        if (typeof source !== "object") {
            return source
        }

        // Create a new object if target is null/undefined
        if (target === null || target === undefined) {
            target = Array.isArray(source) ? [] : {}
        }

        // Handle arrays
        if (Array.isArray(source)) {
            return source.map((item, index) => this.applyPatch(target[index], item))
        }

        // Deep merge objects
        Object.keys(source).forEach((key) => {
            if (source[key] === null) {
                // Delete property if source value is null
                delete target[key]
            } else if (typeof source[key] === "object") {
                // Recursively patch nested objects
                target[key] = this.applyPatch(target[key], source[key])
                // Remove the property if the recursive patch returned null
                if (target[key] === null) {
                    delete target[key]
                }
            } else {
                // Direct assignment for primitive values
                target[key] = source[key]
            }
        })

        return target
    }
}

export class CoreDBWrapper {
    private client: CoreDBClient
    private subscriptions: (() => void)[] = [];

    constructor(client: CoreDBClient) {
        this.client = client
    }

    public applyPatch(target: any, source: any): any {
        return this.client.applyPatch(target, source)
    }

    /**
     * @deprecated Use applyPatch() instead. This method will be removed in a future version.
     */
    public patch(target: any, source: any): any {
        console.warn('CoreDBWrapper.patch() is deprecated. Use applyPatch() instead.')
        return this.client.applyPatch(target, source)
    }

    /**
     * Subscribe to patch changes on a key (receives patch objects)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives patch)
     * @returns Unsubscribe function
     */
    public onPatch(key: string, callback: (patch: any) => void): () => void {
        const unsubscribe = this.client.onPatch(key, callback)
        this.subscriptions.push(unsubscribe)
        return () => {
            unsubscribe()
            this.subscriptions = this.subscriptions.filter(sub => sub !== unsubscribe)
        }
    }

    /**
     * Subscribe to complete value changes on a key (receives full values)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives complete value)
     * @returns Unsubscribe function
     */
    public onSet(key: string, callback: (value: any) => void): () => void {
        const unsubscribe = this.client.onSet(key, callback)
        this.subscriptions.push(unsubscribe)
        return () => {
            unsubscribe()
            this.subscriptions = this.subscriptions.filter(sub => sub !== unsubscribe)
        }
    }

    /**
     * @deprecated Use onPatch() instead. This method will be removed in a future version.
     * Subscribe to changes on a key (receives patch objects)
     */
    public on(key: string, callback: (patch: any) => void): () => void {
        console.warn('CoreDBWrapper.on() is deprecated. Use onPatch() instead.')
        return this.onPatch(key, callback)
    }

    /**
     * Performs partial updates to a key's value using the provided patch object
     * @param key The key to update
     * @param patch The patch object containing the changes to apply
     */
    public async patchKey(key: string, patch: any): Promise<void> {
        await this.client.patch(key, patch)
    }

    /**
     * Completely overwrites/replaces the value of a key
     * @param key The key to set
     * @param value The new value to set (completely replaces existing value)
     */
    public async set(key: string, value: any): Promise<void> {
        await this.client.set(key, value)
    }

    public async get(key: string): Promise<any> {
        return await this.client.get(key)
    }

    public async call(key: string, args: any): Promise<any> {
        return await this.client.call(key, args)
    }

    public onCall(key: string, callback: Function): () => void {
        return this.client.onCall(key, callback)
    }

    public unsubscribeAll(): void {
        this.subscriptions.forEach(unsub => unsub())
        this.subscriptions = []
    }

    public close(): void {
        this.unsubscribeAll()
        this.client.close()
    }
}
