import { CoreDBWebSocket } from './CoreDBWSServer'
import { CoreDB, CoreDBUser } from './CoreDB'
import { Server } from 'http'
import WebSocket from 'ws'

// Mock WebSocket for testing
jest.mock('ws', () => {
    const MockWebSocket = {
        OPEN: 1,
        CONNECTING: 0,
        CLOSING: 2,
        CLOSED: 3
    }

    return {
        WebSocketServer: jest.fn().mockImplementation(() => ({
            on: jest.fn(),
            clients: new Set(),
            close: jest.fn()
        })),
        WebSocket: MockWebSocket,
        default: MockWebSocket
    }
})

describe('CoreDB WebSocket Subscription System', () => {
    let server: Server
    let db: CoreDB
    let wsServer: CoreDBWebSocket
    let mockWS: jest.Mocked<WebSocket>

    beforeEach(() => {
        server = new Server()
        db = new CoreDB()

        // Create mock WebSocket instance
        mockWS = {
            readyState: 1, // WebSocket.OPEN
            send: jest.fn(),
            close: jest.fn(),
            on: jest.fn(),
            removeAllListeners: jest.fn()
        } as any

        wsServer = new CoreDBWebSocket(server, db)

        // Mock the internal WebSocketServer to have clients
        const mockWSS = (wsServer as any).wss
        mockWSS.clients = new Set([mockWS])

        // Set up client user manually since we're not going through the real connection process
        const clientUsers = (wsServer as any).clientUsers
        clientUsers.set(mockWS, new CoreDBUser(db))

        // Set up client subscriptions tracking
        const clientSubscriptions = (wsServer as any).clientSubscriptions
        clientSubscriptions.set(mockWS, new Map())
    })

    afterEach(() => {
        wsServer.close()
    })

    describe('onPatch subscription behavior', () => {
        test('should send initial full value followed by patches', () => {
            // Set up initial data
            db.set('testKey', { name: 'John', age: 30 })

            // Clear any previous calls
            mockWS.send.mockClear()

            // Subscribe to patches
            const message = {
                cmd: 'onPatch' as const,
                key: 'testKey'
            }

            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS, message)

            // Should have sent the initial full value
            expect(mockWS.send).toHaveBeenCalledTimes(1)
            expect(mockWS.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'update',
                    key: 'testKey',
                    patch: null, // null indicates full value
                    value: { name: 'John', age: 30 }
                })
            )

            // Clear calls and patch the value
            mockWS.send.mockClear()
            db.patch('testKey', { age: 31 })

            // Should have sent only the patch
            expect(mockWS.send).toHaveBeenCalledTimes(1)
            expect(mockWS.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'update',
                    key: 'testKey',
                    patch: { age: 31 },
                    value: null // null indicates only patch is sent
                })
            )
        })

        test('should send initial value as null for non-existent keys', () => {
            mockWS.send.mockClear()

            // Subscribe to a non-existent key
            const message = {
                cmd: 'onPatch' as const,
                key: 'nonExistentKey'
            }

            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS, message)

            // Should have sent the initial value as null (CoreDB returns null for non-existent keys)
            expect(mockWS.send).toHaveBeenCalledTimes(1)
            expect(mockWS.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'update',
                    key: 'nonExistentKey',
                    patch: null,
                    value: null
                })
            )
        })
    })

    describe('onSet subscription behavior', () => {
        test('should send initial full value followed by full values', () => {
            // Set up initial data
            db.set('testKey', { name: 'John', age: 30 })

            // Clear any previous calls
            mockWS.send.mockClear()

            // Subscribe to set changes
            const message = {
                cmd: 'onSet' as const,
                key: 'testKey'
            }

            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS, message)

            // Should have sent the initial full value
            expect(mockWS.send).toHaveBeenCalledTimes(1)
            expect(mockWS.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'update',
                    key: 'testKey',
                    patch: null, // null indicates full value
                    value: { name: 'John', age: 30 }
                })
            )

            // Clear calls and set a new value
            mockWS.send.mockClear()
            db.set('testKey', { name: 'Jane', age: 25 })

            // Should have sent the full new value
            expect(mockWS.send).toHaveBeenCalledTimes(1)
            expect(mockWS.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'update',
                    key: 'testKey',
                    patch: null, // null indicates full value
                    value: { name: 'Jane', age: 25 }
                })
            )
        })

        test('should send full value even for patches when using onSet', () => {
            // Set up initial data
            db.set('testKey', { name: 'John', age: 30 })

            // Subscribe to set changes
            const message = {
                cmd: 'onSet' as const,
                key: 'testKey'
            }

            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS, message)

            // Clear initial call and patch the value
            mockWS.send.mockClear()
            db.patch('testKey', { age: 31 })

            // Should have sent the full updated value (not just the patch)
            expect(mockWS.send).toHaveBeenCalledTimes(1)
            expect(mockWS.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'update',
                    key: 'testKey',
                    patch: null, // null indicates full value
                    value: { name: 'John', age: 31 } // Full value after applying patch
                })
            )
        })
    })

    describe('subscription management', () => {
        test('should not create duplicate subscriptions', () => {
            // Set up initial data
            db.set('testKey', 'initialValue')

            // Subscribe twice to the same key
            const message = {
                cmd: 'onPatch' as const,
                key: 'testKey'
            }

            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)

            mockWS.send.mockClear()
            handleMessage(mockWS, message)
            expect(mockWS.send).toHaveBeenCalledTimes(1)

            mockWS.send.mockClear()
            handleMessage(mockWS, message) // Second subscription attempt
            expect(mockWS.send).toHaveBeenCalledTimes(0) // Should not send again

            // Patch should only trigger one update
            mockWS.send.mockClear()
            db.patch('testKey', 'updatedValue')
            expect(mockWS.send).toHaveBeenCalledTimes(1)
        })

        test('should properly unsubscribe', () => {
            // Set up initial data and subscribe
            db.set('testKey', 'initialValue')

            const subscribeMessage = {
                cmd: 'onPatch' as const,
                key: 'testKey'
            }

            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS, subscribeMessage)

            // Clear initial calls
            mockWS.send.mockClear()

            // Unsubscribe
            const unsubscribeMessage = {
                cmd: 'unsubscribe' as const,
                key: 'testKey'
            }
            handleMessage(mockWS, unsubscribeMessage)

            // Patch should not trigger any updates
            db.patch('testKey', 'updatedValue')
            expect(mockWS.send).toHaveBeenCalledTimes(0)
        })
    })
})
