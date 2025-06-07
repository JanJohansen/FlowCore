import { CoreDBWebSocket } from './CoreDBWSServer'
import { CoreDB } from './CoreDB'
import { Server } from 'http'
import WebSocket from 'ws'

// Mock WebSocket for testing
jest.mock('ws')

describe('CoreDB WebSocket RPC System', () => {
    let server: Server
    let db: CoreDB
    let wsServer: CoreDBWebSocket
    let mockWS1: jest.Mocked<WebSocket>
    let mockWS2: jest.Mocked<WebSocket>

    beforeEach(() => {
        server = new Server()
        db = new CoreDB()
        wsServer = new CoreDBWebSocket(server, db)

        // Create mock WebSocket instances
        mockWS1 = {
            readyState: WebSocket.OPEN,
            send: jest.fn(),
            close: jest.fn(),
            on: jest.fn(),
            removeAllListeners: jest.fn()
        } as any

        mockWS2 = {
            readyState: WebSocket.OPEN,
            send: jest.fn(),
            close: jest.fn(),
            on: jest.fn(),
            removeAllListeners: jest.fn()
        } as any
    })

    afterEach(() => {
        wsServer.close()
    })

    describe('RPC function registration', () => {
        test('should handle onCall registration message', () => {
            const message = {
                cmd: 'onCall' as const,
                key: 'testFunction'
            }

            // Simulate connection and message handling
            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS1, message)

            // Verify function is registered (internal state check would be needed)
            expect(mockWS1.send).not.toHaveBeenCalled() // onCall doesn't send response
        })

        test('should handle function call between clients', async () => {
            // Register function on client 1
            const registerMessage = {
                cmd: 'onCall' as const,
                key: 'add'
            }
            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS1, registerMessage)

            // Client 2 calls the function
            const callMessage = {
                call: 'call' as const,
                id: 1,
                key: 'add',
                value: [5, 3]
            }
            handleMessage(mockWS2, callMessage)

            // Verify call request is forwarded to client 1
            expect(mockWS1.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'callRequest',
                    id: 1,
                    key: 'add',
                    args: [5, 3]
                })
            )
        })

        test('should handle function response from client', () => {
            // First, register function and make call (setup)
            const registerMessage = { cmd: 'onCall' as const, key: 'add' }
            const callMessage = { call: 'call' as const, id: 1, key: 'add', value: [5, 3] }
            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            
            handleMessage(mockWS1, registerMessage)
            handleMessage(mockWS2, callMessage)

            // Clear previous calls
            mockWS1.send.mockClear()
            mockWS2.send.mockClear()

            // Client 1 responds with result
            const responseMessage = {
                type: 'callResponse' as const,
                id: 1,
                success: true,
                result: 8
            }
            handleMessage(mockWS1, responseMessage)

            // Verify response is forwarded to client 2
            expect(mockWS2.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'response',
                    id: 1,
                    success: true,
                    result: 8
                })
            )
        })
    })

    describe('Local RPC calls', () => {
        test('should handle local function calls on server', () => {
            // Register function locally on server
            db.onCall('serverFunction', (x: number) => x * 2)

            const callMessage = {
                call: 'call' as const,
                id: 1,
                key: 'serverFunction',
                value: [10]
            }

            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS1, callMessage)

            // Should respond directly without forwarding
            expect(mockWS1.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'response',
                    id: 1,
                    success: true,
                    result: 20
                })
            )
        })

        test('should fall back to remote call if local function not found', () => {
            // Register function on client 2
            const registerMessage = { cmd: 'onCall' as const, key: 'remoteFunction' }
            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS2, registerMessage)

            // Client 1 calls the function
            const callMessage = {
                call: 'call' as const,
                id: 1,
                key: 'remoteFunction',
                value: ['test']
            }
            handleMessage(mockWS1, callMessage)

            // Should forward to client 2
            expect(mockWS2.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'callRequest',
                    id: 1,
                    key: 'remoteFunction',
                    args: ['test']
                })
            )
        })
    })

    describe('Error handling', () => {
        test('should handle call to non-existent function', () => {
            const callMessage = {
                call: 'call' as const,
                id: 1,
                key: 'nonExistentFunction',
                value: []
            }

            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS1, callMessage)

            // Should send error response
            expect(mockWS1.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'response',
                    id: 1,
                    success: false,
                    error: "Function 'nonExistentFunction' not found"
                })
            )
        })

        test('should handle error response from client', () => {
            // Setup: register function and make call
            const registerMessage = { cmd: 'onCall' as const, key: 'errorFunction' }
            const callMessage = { call: 'call' as const, id: 1, key: 'errorFunction', value: [] }
            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            
            handleMessage(mockWS1, registerMessage)
            handleMessage(mockWS2, callMessage)
            mockWS2.send.mockClear()

            // Client 1 responds with error
            const errorResponse = {
                type: 'callResponse' as const,
                id: 1,
                success: false,
                error: 'Function failed'
            }
            handleMessage(mockWS1, errorResponse)

            // Should forward error to client 2
            expect(mockWS2.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'response',
                    id: 1,
                    success: false,
                    error: 'Function failed'
                })
            )
        })

        test('should handle missing call ID in response', () => {
            const responseMessage = {
                type: 'callResponse' as const,
                success: true,
                result: 'test'
                // Missing id
            }

            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
            
            handleMessage(mockWS1, responseMessage)

            expect(consoleSpy).toHaveBeenCalledWith('ERROR - Missing call ID in response')
            consoleSpy.mockRestore()
        })
    })

    describe('Client cleanup', () => {
        test('should clean up function registrations when client disconnects', () => {
            // Register function
            const registerMessage = { cmd: 'onCall' as const, key: 'testFunction' }
            const handleMessage = (wsServer as any).handleMessage.bind(wsServer)
            handleMessage(mockWS1, registerMessage)

            // Simulate client disconnect
            const cleanupRegistrations = (wsServer as any).cleanupClientRegistrations.bind(wsServer)
            cleanupRegistrations(mockWS1)

            // Try to call the function - should fail
            const callMessage = {
                call: 'call' as const,
                id: 1,
                key: 'testFunction',
                value: []
            }
            handleMessage(mockWS2, callMessage)

            expect(mockWS2.send).toHaveBeenCalledWith(
                JSON.stringify({
                    type: 'response',
                    id: 1,
                    success: false,
                    error: "Function 'testFunction' not found"
                })
            )
        })
    })
})
