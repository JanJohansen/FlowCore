import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCoreDBStore } from '../services/CoreDB/CoreDBStore'

export const useConnectionStatusStore = defineStore('connectionStatus', () => {
    // Connection state
    const isConnected = ref(true) // Start optimistically
    const disconnectedAt = ref<Date | null>(null)
    const reconnectAttempts = ref(0)

    // Computed properties
    const isDisconnected = computed(() => !isConnected.value)
    const shouldShowOverlay = computed(() => isDisconnected.value)

    // Disconnection duration in seconds
    const disconnectionDuration = ref(0)
    let disconnectionTimer: NodeJS.Timeout | null = null

    // Update disconnection duration every second
    const startDisconnectionTimer = () => {
        if (disconnectionTimer) {
            clearInterval(disconnectionTimer)
        }

        disconnectionTimer = setInterval(() => {
            if (disconnectedAt.value) {
                disconnectionDuration.value = Math.floor(
                    (Date.now() - disconnectedAt.value.getTime()) / 1000
                )
            }
        }, 1000)
    }

    const stopDisconnectionTimer = () => {
        if (disconnectionTimer) {
            clearInterval(disconnectionTimer)
            disconnectionTimer = null
        }
        disconnectionDuration.value = 0
    }

    // Format duration for display
    const formattedDuration = computed(() => {
        const duration = disconnectionDuration.value
        if (duration < 60) {
            return `${duration} second${duration !== 1 ? 's' : ''}`
        } else {
            const minutes = Math.floor(duration / 60)
            const seconds = duration % 60
            return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`
        }
    })

    // Connection status change handler
    const handleConnectionStatusChange = (connected: boolean) => {
        console.log('Connection status changed:', connected)

        if (connected && !isConnected.value) {
            // Reconnected
            isConnected.value = true
            disconnectedAt.value = null
            stopDisconnectionTimer()
            console.log('Connection restored after', reconnectAttempts.value, 'attempts')
            reconnectAttempts.value = 0
        } else if (!connected && isConnected.value) {
            // Disconnected
            isConnected.value = false
            disconnectedAt.value = new Date()
            disconnectionDuration.value = 0
            startDisconnectionTimer()
            reconnectAttempts.value++
            console.log('Connection lost, attempt:', reconnectAttempts.value)
        }
    }

    // Initialize connection monitoring
    const initializeConnectionMonitoring = () => {
        console.log('Initializing connection status monitoring...')
        const coreDBStore = useCoreDBStore()

        // Set initial state based on current connection
        console.log('Initial CoreDB connection state:', coreDBStore.isConnected)
        isConnected.value = coreDBStore.isConnected

        // If initially disconnected, start the timer
        if (!isConnected.value) {
            disconnectedAt.value = new Date()
            startDisconnectionTimer()
        }

        // Subscribe to connection status changes
        const unsubscribe = coreDBStore.onConnectionStatusChange(handleConnectionStatusChange)
        console.log('Connection status monitoring initialized')

        return unsubscribe
    }

    // Cleanup function
    const cleanup = () => {
        stopDisconnectionTimer()
    }

    return {
        // State
        isConnected,
        isDisconnected,
        shouldShowOverlay,
        disconnectedAt,
        disconnectionDuration,
        formattedDuration,
        reconnectAttempts,

        // Methods
        initializeConnectionMonitoring,
        cleanup
    }
})
