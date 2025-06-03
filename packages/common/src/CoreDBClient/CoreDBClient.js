export class CoreDBClient {
    transport;
    messageId = 0;
    pendingResponses = new Map();
    subscriptions = new Map();
    serverSubscriptions = new Set();
    registeredFunctions = new Map();
    static instance = null;
    constructor(transport) {
        this.transport = transport;
        if (CoreDBClient.instance) {
            return CoreDBClient.instance;
        }
        CoreDBClient.instance = this;
        this.setupTransport();
    }
    setupTransport() {
        this.transport.onMessage(this.handleMessage.bind(this));
        this.transport.onConnect(this.handleConnect.bind(this));
        this.transport.onDisconnect(this.handleDisconnect.bind(this));
    }
    handleConnect() {
        this.resubscribeAll();
    }
    handleDisconnect() {
        // Could add reconnection logic here if needed
    }
    async handleMessage(message) {
        const handlers = {
            'response': this.handleResponseMessage.bind(this),
            'update': this.handleUpdateMessage.bind(this),
            'callRequest': this.handleCallRequest.bind(this)
        };
        const handler = handlers[message.type || ''];
        if (handler) {
            handler(message);
        }
    }
    handleResponseMessage(message) {
        const pending = this.pendingResponses.get(message.id);
        if (!pending)
            return;
        this.pendingResponses.delete(message.id);
        if (message.success) {
            pending.resolve(message.result);
        }
        else {
            pending.reject(new Error(message.error));
        }
    }
    handleUpdateMessage(message) {
        // Handle patch callbacks
        const patchCallbacks = this.subscriptions.get(message.key + ':patch');
        patchCallbacks?.forEach(callback => callback(message.patch));
        // Handle set callbacks
        const setCallbacks = this.subscriptions.get(message.key + ':set');
        setCallbacks?.forEach(callback => callback(message.value));
        // Handle legacy callbacks (deprecated)
        const legacyCallbacks = this.subscriptions.get(message.key);
        legacyCallbacks?.forEach(callback => callback(message.patch));
    }
    async handleCallRequest(message) {
        const func = this.registeredFunctions.get(message.key);
        if (!func) {
            this.sendErrorResponse(message.id, `Function '${message.key}' not found`);
            return;
        }
        try {
            const result = await func(message.value);
            this.sendSuccessResponse(message.id, result);
        }
        catch (error) {
            this.sendErrorResponse(message.id, 'Function execution failed');
        }
    }
    sendErrorResponse(id, error) {
        this.sendMessage({
            type: 'response',
            id,
            success: false,
            error
        });
    }
    sendSuccessResponse(id, result) {
        this.sendMessage({
            type: 'response',
            id,
            success: true,
            result
        });
    }
    async resubscribeAll() {
        console.log("Resubscribing to all keys...", this.serverSubscriptions);
        for (const key of this.serverSubscriptions) {
            try {
                await this.sendMessage({
                    cmd: 'on',
                    key
                });
            }
            catch (error) {
                console.error(`Failed to resubscribe to ${key}:`, error);
            }
        }
    }
    sendMessage(message) {
        this.transport.send(message);
    }
    async sendCall(message) {
        return new Promise((resolve, reject) => {
            const id = ++this.messageId;
            message.id = id;
            this.pendingResponses.set(id, { resolve, reject });
            this.sendMessage(message);
        });
    }
    /**
     * Completely overwrites/replaces the value of a key
     * @param key The key to set
     * @param value The new value to set (completely replaces existing value)
     */
    async set(key, value) {
        await this.sendMessage({
            cmd: 'set',
            key,
            value
        });
    }
    /**
     * Performs partial updates to a key's value using the provided patch object
     * @param key The key to update
     * @param patch The patch object containing the changes to apply
     */
    async patch(key, patch) {
        await this.sendMessage({
            cmd: 'patch',
            key,
            patch
        });
    }
    /**
     * Subscribe to patch changes on a key (receives patch objects)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives patch)
     * @returns Unsubscribe function
     */
    onPatch(key, callback) {
        let callbacks = this.subscriptions.get(key + ':patch');
        if (!callbacks) {
            callbacks = new Set();
            this.subscriptions.set(key + ':patch', callbacks);
            if (!this.serverSubscriptions.has(key)) {
                this.serverSubscriptions.add(key);
                this.sendMessage({
                    cmd: 'onPatch',
                    key
                });
            }
        }
        callbacks.add(callback);
        return () => {
            const callbacks = this.subscriptions.get(key + ':patch');
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscriptions.delete(key + ':patch');
                    // Only unsubscribe from server if no set callbacks either
                    const setCallbacks = this.subscriptions.get(key + ':set');
                    if (!setCallbacks || setCallbacks.size === 0) {
                        this.serverSubscriptions.delete(key);
                        this.sendMessage({
                            cmd: 'unsubscribe',
                            key
                        });
                    }
                }
            }
        };
    }
    /**
     * Subscribe to complete value changes on a key (receives full values)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives complete value)
     * @returns Unsubscribe function
     */
    onSet(key, callback) {
        let callbacks = this.subscriptions.get(key + ':set');
        if (!callbacks) {
            callbacks = new Set();
            this.subscriptions.set(key + ':set', callbacks);
            if (!this.serverSubscriptions.has(key)) {
                this.serverSubscriptions.add(key);
                this.sendMessage({
                    cmd: 'onSet',
                    key
                });
            }
        }
        callbacks.add(callback);
        return () => {
            const callbacks = this.subscriptions.get(key + ':set');
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscriptions.delete(key + ':set');
                    // Only unsubscribe from server if no patch callbacks either
                    const patchCallbacks = this.subscriptions.get(key + ':patch');
                    if (!patchCallbacks || patchCallbacks.size === 0) {
                        this.serverSubscriptions.delete(key);
                        this.sendMessage({
                            cmd: 'unsubscribe',
                            key
                        });
                    }
                }
            }
        };
    }
    /**
     * @deprecated Use onPatch() instead. This method will be removed in a future version.
     * Subscribe to changes on a key (receives patch objects)
     */
    on(key, callback) {
        console.warn('CoreDBClient.on() is deprecated. Use onPatch() instead.');
        return this.onPatch(key, callback);
    }
    onCall(key, callback) {
        this.registeredFunctions.set(key, callback);
        this.sendMessage({
            cmd: 'onCall',
            key
        });
        return () => {
            this.registeredFunctions.delete(key);
            this.sendMessage({
                cmd: 'unsubscribe',
                key
            });
        };
    }
    async call(key, args) {
        const response = await this.sendCall({
            call: 'call',
            key,
            value: args
        });
        return response;
    }
    async get(key) {
        const response = await this.sendCall({
            call: 'get',
            key
        });
        return response;
    }
    close() {
        this.transport.disconnect();
        this.serverSubscriptions.clear();
        this.subscriptions.clear();
        this.registeredFunctions.clear();
        this.pendingResponses.clear();
    }
    unsubscribeAll() {
        // Unsubscribe from all server subscriptions
        for (const key of this.serverSubscriptions) {
            this.sendMessage({
                cmd: 'unsubscribe',
                key
            });
        }
        // Clear all local subscriptions and server subscriptions
        this.subscriptions.clear();
        this.serverSubscriptions.clear();
    }
    applyPatch(target, source) {
        // If source is null/undefined, return null
        if (source === null || source === undefined) {
            return null;
        }
        // If source is not an object, return the source value directly
        if (typeof source !== "object") {
            return source;
        }
        // Create a new object if target is null/undefined
        if (target === null || target === undefined) {
            target = Array.isArray(source) ? [] : {};
        }
        // Handle arrays
        if (Array.isArray(source)) {
            return source.map((item, index) => this.applyPatch(target[index], item));
        }
        // Deep merge objects
        Object.keys(source).forEach((key) => {
            if (source[key] === null) {
                // Delete property if source value is null
                delete target[key];
            }
            else if (typeof source[key] === "object") {
                // Recursively patch nested objects
                target[key] = this.applyPatch(target[key], source[key]);
                // Remove the property if the recursive patch returned null
                if (target[key] === null) {
                    delete target[key];
                }
            }
            else {
                // Direct assignment for primitive values
                target[key] = source[key];
            }
        });
        return target;
    }
}
export class CoreDBWrapper {
    client;
    subscriptions = [];
    constructor(client) {
        this.client = client;
    }
    applyPatch(target, source) {
        return this.client.applyPatch(target, source);
    }
    /**
     * @deprecated Use applyPatch() instead. This method will be removed in a future version.
     */
    patch(target, source) {
        console.warn('CoreDBWrapper.patch() is deprecated. Use applyPatch() instead.');
        return this.client.applyPatch(target, source);
    }
    /**
     * Subscribe to patch changes on a key (receives patch objects)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives patch)
     * @returns Unsubscribe function
     */
    onPatch(key, callback) {
        const unsubscribe = this.client.onPatch(key, callback);
        this.subscriptions.push(unsubscribe);
        return () => {
            unsubscribe();
            this.subscriptions = this.subscriptions.filter(sub => sub !== unsubscribe);
        };
    }
    /**
     * Subscribe to complete value changes on a key (receives full values)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives complete value)
     * @returns Unsubscribe function
     */
    onSet(key, callback) {
        const unsubscribe = this.client.onSet(key, callback);
        this.subscriptions.push(unsubscribe);
        return () => {
            unsubscribe();
            this.subscriptions = this.subscriptions.filter(sub => sub !== unsubscribe);
        };
    }
    /**
     * @deprecated Use onPatch() instead. This method will be removed in a future version.
     * Subscribe to changes on a key (receives patch objects)
     */
    on(key, callback) {
        console.warn('CoreDBWrapper.on() is deprecated. Use onPatch() instead.');
        return this.onPatch(key, callback);
    }
    /**
     * Performs partial updates to a key's value using the provided patch object
     * @param key The key to update
     * @param patch The patch object containing the changes to apply
     */
    async patchKey(key, patch) {
        await this.client.patch(key, patch);
    }
    /**
     * Completely overwrites/replaces the value of a key
     * @param key The key to set
     * @param value The new value to set (completely replaces existing value)
     */
    async set(key, value) {
        await this.client.set(key, value);
    }
    async get(key) {
        return await this.client.get(key);
    }
    async call(key, args) {
        return await this.client.call(key, args);
    }
    onCall(key, callback) {
        return this.client.onCall(key, callback);
    }
    unsubscribeAll() {
        this.subscriptions.forEach(unsub => unsub());
        this.subscriptions = [];
    }
    close() {
        this.unsubscribeAll();
        this.client.close();
    }
}
