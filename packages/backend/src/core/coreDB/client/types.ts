export interface CoreDBMessage {
    cmd?: 'set' | 'patch' | 'on' | 'onPatch' | 'onSet' | 'unsubscribe' | 'onCall'
    call?: 'get' | 'call'
    type?: 'response' | 'update' | 'callRequest'
    id?: number
    key?: string
    value?: any
    patch?: any
    args?: any
    success?: boolean
    error?: string
    result?: any
}

export interface PendingResponse {
    resolve: Function
    reject: Function
}

export interface CoreDBTransport {
    connect(): Promise<void>
    disconnect(): void
    send(message: CoreDBMessage): void
    onMessage(handler: (message: CoreDBMessage) => void): void
    onConnect(handler: () => void): void
    onDisconnect(handler: () => void): void
    isConnected(): boolean
}

export type ConnectionCallback = () => void
export type DisconnectionCallback = () => void
