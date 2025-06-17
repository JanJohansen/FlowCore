import { CoreDBMessage } from './types'
import { BaseTransport } from './BaseTransport'

export class CoreDBWSTransport extends BaseTransport {
    private ws?: WebSocket
    private messageQueue: CoreDBMessage[] = []; // Add message queue
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectDelay: number = 1000; // Start with 1 second
    private reconnectTimer?: NodeJS.Timeout
    private intentionalClose: boolean = false;

    constructor(private url: string = "ws://localhost:3000") {
        super()
    }

    async connect(): Promise<void> {
        this.intentionalClose = false
        return this.createConnection()
    }

    private async createConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(this.url)

                this.ws.onmessage = (event) => {
                    console.log("<--", event.data)
                    try {
                        const message = JSON.parse(event.data) as CoreDBMessage
                        this.messageHandler?.(message)
                    } catch (error) {
                        console.error('Failed to parse WebSocket message:', error)
                    }
                }

                this.ws.onopen = () => {
                    console.log('WebSocket connected')
                    this.reconnectAttempts = 0
                    this.reconnectDelay = 1000 // Reset delay on successful connection
                    this.handleConnect()

                    // Process queued messages
                    while (this.messageQueue.length > 0) {
                        const message = this.messageQueue.shift()
                        if (message) this.send(message)
                    }

                    resolve()
                }

                this.ws.onclose = () => {
                    this.handleDisconnect()
                    if (!this.intentionalClose) {
                        this.attemptReconnect()
                    }
                }

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error)
                    if (this.ws?.readyState === WebSocket.CONNECTING) {
                        reject(error)
                    }
                }

            } catch (error) {
                reject(error)
            }
        })
    }

    private attemptReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
        }

        this.reconnectAttempts++
        console.log(`Attempting to reconnect (${this.reconnectAttempts}) in ${this.reconnectDelay}ms...`)

        this.reconnectTimer = setTimeout(async () => {
            try {
                await this.createConnection()
            } catch (error) {
                console.error('Reconnection attempt failed:', error)
                // Exponential backoff
                this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 10000) // Cap at 10 seconds
            }
        }, this.reconnectDelay)
    }

    disconnect(): void {
        this.intentionalClose = true
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
        }
        this.ws?.close()
    }

    send(message: CoreDBMessage): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            // Queue message instead of throwing error
            this.messageQueue.push(message)
            return
        }
        console.log("-->", message)
        this.ws.send(JSON.stringify(message))
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN
    }
}
