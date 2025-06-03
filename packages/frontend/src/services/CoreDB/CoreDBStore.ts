import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CoreDBClient, CoreDBWSTransport } from '@webapp/common'
import { CoreDBWrapper } from './CoreDBClient'

// Connection status event callbacks type
type ConnectionStatusCallback = (isConnected: boolean) => void

export const useCoreDBStore = defineStore('CoreDBStore', () => {
    console.log('Initializing CoreDB store')
    const wsTransport = new CoreDBWSTransport('ws://localhost:3000')
    const client = new CoreDBClient(wsTransport)
    const isConnected = ref(false)
    const reconnecting = ref(false)

    // Connection status callbacks
    const connectionStatusCallbacks = new Set<ConnectionStatusCallback>()

    const getWrapper = () => {
        console.log('Creating new CoreDBWrapper instance')
        return new CoreDBWrapper(client)
    }

    // Add connection status callback
    const onConnectionStatusChange = (callback: ConnectionStatusCallback) => {
        connectionStatusCallbacks.add(callback)
        // Return unsubscribe function
        return () => {
            connectionStatusCallbacks.delete(callback)
        }
    }

    // Notify all callbacks of connection status change
    const notifyConnectionStatusChange = (connected: boolean) => {
        connectionStatusCallbacks.forEach(callback => {
            try {
                callback(connected)
            } catch (error) {
                console.error('Error in connection status callback:', error)
            }
        })
    }

    // Set up transport event handlers
    wsTransport.onConnect(() => {
        console.log('CoreDB store: Transport connected')
        isConnected.value = true
        reconnecting.value = false
        notifyConnectionStatusChange(true)
    })

    wsTransport.onDisconnect(() => {
        console.log('CoreDB store: Transport disconnected')
        isConnected.value = false
        notifyConnectionStatusChange(false)
    })

    // Connect immediately
    const connect = async () => {
        try {
            await wsTransport.connect()
            console.log('CoreDB store: Connection established')
            // Note: isConnected and callbacks will be handled by transport events
        } catch (error) {
            console.error('CoreDB store: Connection failed:', error)
            isConnected.value = false
            notifyConnectionStatusChange(false)
        }
    }

    // Initialize connection
    connect()

    return {
        getWrapper,
        isConnected,
        reconnecting,
        connect,
        onConnectionStatusChange,
        cleanup: () => {
            console.log('CoreDB store: Cleaning up')
            connectionStatusCallbacks.clear()
            wsTransport.disconnect()
        }
    }
})
