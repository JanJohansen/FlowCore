import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import { useCoreDBStore } from '@/services/CoreDB/CoreDBStore'
import type { INotification } from '@/types/notifications'

export const useNotificationStore = defineStore('notificationStore', () => {
    // State
    const notifications = ref<Record<string, INotification>>({})
    const alarms = ref<Record<string, INotification>>({})
    const currentUserId = ref<string>('*') // Default to broadcast, can be set by app

    // CoreDB setup
    const coreDBStore = useCoreDBStore()
    const db = coreDBStore.getWrapper()

    // Subscription cleanup functions
    const subscriptions: (() => void)[] = []

    // Computed
    const activeNotifications = computed(() => Object.values(notifications.value))
    const activeAlarms = computed(() => Object.values(alarms.value))
    const totalCount = computed(() => activeNotifications.value.length + activeAlarms.value.length)

    // Utility functions
    const generateId = () => `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

    const createNotification = (
        data: Omit<INotification, 'id' | 'timestamp' | 'type'>,
        type: 'notification' | 'alarm' = 'notification'
    ): INotification => ({
        ...data,
        id: generateId(),
        type,
        timestamp: Date.now()
    })

    // CoreDB subscription methods
    const subscribeToUserNotifications = (userId: string) => {
        const key = `userNotifications:${userId}`
        console.log(`Subscribing to ${key}`)

        const unsubscribe = db.onPatch(key, (patch: Record<string, any>) => {
            console.log('Received user notifications patch:', patch)

            for (const [notificationId, notificationData] of Object.entries(patch)) {
                if (notificationData === null) {
                    // Remove notification
                    delete notifications.value[notificationId]
                } else if (notificationData && typeof notificationData === 'object') {
                    // Add or update notification
                    const notification: INotification = {
                        ...notificationData,
                        id: notificationId,
                        type: 'notification',
                        timestamp: notificationData.timestamp || Date.now(),
                        userId
                    }
                    notifications.value[notificationId] = notification
                }
            }
        })

        subscriptions.push(unsubscribe)
        return unsubscribe
    }

    const subscribeToUserAlarms = (userId: string) => {
        const key = `userAlarms:${userId}`
        console.log(`Subscribing to ${key}`)

        const unsubscribe = db.onPatch(key, (patch: Record<string, any>) => {
            console.log('Received user alarms patch:', patch)

            for (const [alarmId, alarmData] of Object.entries(patch)) {
                if (alarmData === null) {
                    // Remove alarm
                    delete alarms.value[alarmId]
                } else if (alarmData && typeof alarmData === 'object') {
                    // Add or update alarm
                    const alarm: INotification = {
                        ...alarmData,
                        id: alarmId,
                        type: 'alarm',
                        timestamp: alarmData.timestamp || Date.now(),
                        userId,
                        ack: alarmData.ack || false
                    }
                    alarms.value[alarmId] = alarm
                }
            }
        })

        subscriptions.push(unsubscribe)
        return unsubscribe
    }

    // Public methods
    const setUserId = (userId: string) => {
        currentUserId.value = userId
        initializeSubscriptions()
    }

    const initializeSubscriptions = () => {
        // Clean up existing subscriptions
        subscriptions.forEach(unsub => unsub())
        subscriptions.length = 0

        // Subscribe to current user's notifications and alarms
        if (currentUserId.value && currentUserId.value !== '*') {
            subscribeToUserNotifications(currentUserId.value)
            subscribeToUserAlarms(currentUserId.value)
        }

        // Always subscribe to broadcast notifications
        subscribeToUserNotifications('*')
        subscribeToUserAlarms('*')
    }

    const addLocalNotification = (notificationData: Omit<INotification, 'id' | 'timestamp' | 'type'>) => {
        const notification = createNotification(notificationData, 'notification')
        notifications.value[notification.id] = notification
        return notification.id
    }

    const addLocalAlarm = (alarmData: Omit<INotification, 'id' | 'timestamp' | 'type'>) => {
        const alarm = createNotification(alarmData, 'alarm')
        alarms.value[alarm.id] = alarm
        return alarm.id
    }

    const dismissNotification = async (notificationId: string) => {
        const notification = notifications.value[notificationId] || alarms.value[notificationId]

        if (notification) {
            if (notification.userId && notification.userId !== '*') {
                // Remove from coreDB for user-specific notifications
                const key = notification.type === 'alarm' ?
                    `userAlarms:${notification.userId}` :
                    `userNotifications:${notification.userId}`

                try {
                    await db.patchKey(key, { [notificationId]: null })
                } catch (error) {
                    console.error('Failed to dismiss notification in coreDB:', error)
                }
            }

            // Remove from local state
            if (notification.type === 'alarm') {
                delete alarms.value[notificationId]
            } else {
                delete notifications.value[notificationId]
            }
        }
    }

    const acknowledgeAlarm = async (alarmId: string) => {
        const alarm = alarms.value[alarmId]

        if (alarm && alarm.type === 'alarm') {
            // Update local state
            alarm.ack = true

            if (alarm.userId && alarm.userId !== '*') {
                // Update in coreDB
                const key = `userAlarms:${alarm.userId}`

                try {
                    await db.patchKey(key, {
                        [alarmId]: { ...alarm, ack: true }
                    })
                } catch (error) {
                    console.error('Failed to acknowledge alarm in coreDB:', error)
                }
            }
        }
    }

    const clearAllNotifications = () => {
        Object.keys(notifications.value).forEach(id => {
            dismissNotification(id)
        })
    }

    const clearAllAlarms = () => {
        Object.keys(alarms.value).forEach(id => {
            dismissNotification(id)
        })
    }

    // Initialize subscriptions on store creation
    initializeSubscriptions()

    // Cleanup on store destruction
    onUnmounted(() => {
        subscriptions.forEach(unsub => unsub())
        db.unsubscribeAll()
    })

    return {
        // State
        notifications,
        alarms,
        currentUserId,

        // Computed
        activeNotifications,
        activeAlarms,
        totalCount,

        // Methods
        setUserId,
        addLocalNotification,
        addLocalAlarm,
        dismissNotification,
        acknowledgeAlarm,
        clearAllNotifications,
        clearAllAlarms,
        initializeSubscriptions
    }
})
