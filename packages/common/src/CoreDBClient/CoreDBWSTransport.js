import { BaseTransport } from './BaseTransport';
export class CoreDBWSTransport extends BaseTransport {
    url;
    ws;
    messageQueue = []; // Add message queue
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 1000; // Start with 1 second
    reconnectTimer;
    intentionalClose = false;
    constructor(url = "ws://localhost:3000") {
        super();
        this.url = url;
    }
    async connect() {
        this.intentionalClose = false;
        return this.createConnection();
    }
    async createConnection() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url);
                this.ws.onmessage = (event) => {
                    console.log("<--", event.data);
                    try {
                        const message = JSON.parse(event.data);
                        this.messageHandler?.(message);
                    }
                    catch (error) {
                        console.error('Failed to parse WebSocket message:', error);
                    }
                };
                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                    this.reconnectDelay = 1000; // Reset delay on successful connection
                    this.handleConnect();
                    // Process queued messages
                    while (this.messageQueue.length > 0) {
                        const message = this.messageQueue.shift();
                        if (message)
                            this.send(message);
                    }
                    resolve();
                };
                this.ws.onclose = () => {
                    this.handleDisconnect();
                    if (!this.intentionalClose) {
                        this.attemptReconnect();
                    }
                };
                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    if (this.ws?.readyState === WebSocket.CONNECTING) {
                        reject(error);
                    }
                };
            }
            catch (error) {
                reject(error);
            }
        });
    }
    attemptReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms...`);
            this.reconnectTimer = setTimeout(async () => {
                try {
                    await this.createConnection();
                }
                catch (error) {
                    console.error('Reconnection attempt failed:', error);
                    // Exponential backoff
                    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000); // Cap at 10 seconds
                }
            }, this.reconnectDelay);
        }
        else {
            console.error('Max reconnection attempts reached');
        }
    }
    disconnect() {
        this.intentionalClose = true;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        this.ws?.close();
    }
    send(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // Queue message instead of throwing error
            this.messageQueue.push(message);
            return;
        }
        console.log("-->", message);
        this.ws.send(JSON.stringify(message));
    }
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}
