import { CoreDBTransport, CoreDBMessage } from './types'

export abstract class BaseTransport implements CoreDBTransport {
    protected messageHandler?: (message: CoreDBMessage) => void
    protected connectHandler?: () => void
    protected disconnectHandler?: () => void
    protected connected = false;

    abstract connect(): Promise<void>
    abstract disconnect(): void
    abstract send(message: CoreDBMessage): void

    onMessage(handler: (message: CoreDBMessage) => void): void {
        this.messageHandler = handler
    }

    onConnect(handler: () => void): void {
        this.connectHandler = handler
    }

    onDisconnect(handler: () => void): void {
        this.disconnectHandler = handler
    }

    isConnected(): boolean {
        return this.connected
    }

    protected handleConnect(): void {
        this.connected = true
        this.connectHandler?.()
    }

    protected handleDisconnect(): void {
        this.connected = false
        this.disconnectHandler?.()
    }
}
