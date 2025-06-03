import { CoreDBMessage } from './CoreDBTypes'
import { BaseTransport } from './BaseTransport'
import * as net from 'net'

export class CoreDBTCPTransport extends BaseTransport {
    private socket?: net.Socket
    private buffer = '';

    constructor(
        private host: string = "localhost",
        private port: number = 3000
    ) {
        super()
    }

    async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket()

            this.socket.connect(this.port, this.host, () => {
                this.handleConnect()
                resolve()
            })

            this.socket.on('data', (data) => {
                this.buffer += data.toString()
                this.processBuffer()
            })

            this.socket.on('close', () => {
                this.handleDisconnect()
            })

            this.socket.on('error', reject)
        })
    }

    private processBuffer(): void {
        let messageEnd = this.buffer.indexOf('\n')
        while (messageEnd !== -1) {
            const messageStr = this.buffer.substring(0, messageEnd)
            this.buffer = this.buffer.substring(messageEnd + 1)

            try {
                const message = JSON.parse(messageStr) as CoreDBMessage
                this.messageHandler?.(message)
            } catch (error) {
                console.error('Failed to parse TCP message:', error)
            }

            messageEnd = this.buffer.indexOf('\n')
        }
    }

    disconnect(): void {
        this.socket?.end()
    }

    send(message: CoreDBMessage): void {
        if (!this.socket) {
            throw new Error('TCP socket is not connected')
        }
        this.socket.write(JSON.stringify(message) + '\n')
    }
}
