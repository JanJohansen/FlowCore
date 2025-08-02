import { CoreDbUser } from './CoreDbUser'
import { useNotificationStore } from '../stores/notificationStore'
import type { INotification, INotificationAPI } from '../types/notifications'

/**
 * Notification Service - Local TypeScript API for notification management
 * Provides programmatic methods for sending, dismissing, and managing notifications
 * Mirrors the external coreDB-based system functionality
 */
export class NotificationService implements INotificationAPI {
    private coreDBStore
    private db
    private notificationStore
    private static instance: NotificationService | null = null

    private constructor() {
        this.db = new CoreDbUser()
        this.notificationStore = useNotificationStore()
    }

    public static getInstance(): NotificationService {
        if (!this.instance) {
            this.instance = new NotificationService()
        }
        return this.instance
    }

    // Utility methods
    private generateId(): string {
        return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }

    private createNotificationData(
        notification: Omit<INotification, 'id' | 'userId' | 'timestamp' | 'type'>
    ) {
        return {
            ...notification,
            timestamp: Date.now()
        }
    }

    // User Notifications
    async sendUserNotification(
        userId: string,
        notification: Omit<INotification, 'id' | 'userId'>
    ): Promise<string> {
        const notificationId = this.generateId()
        const notificationData = this.createNotificationData(notification)

        try {
            await this.db.patchKey(`userNotifications:${userId}`, {
                [notificationId]: notificationData
            })

            console.log(`Sent notification to user ${userId}:`, notificationId)
            return notificationId
        } catch (error) {
            console.error('Failed to send user notification:', error)
            throw error
        }
    }

    async dismissUserNotification(userId: string, notificationId: string): Promise<void> {
        try {
            await this.db.patchKey(`userNotifications:${userId}`, {
                [notificationId]: null
            })

            console.log(`Dismissed notification ${notificationId} for user ${userId}`)
        } catch (error) {
            console.error('Failed to dismiss user notification:', error)
            throw error
        }
    }

    // Group Notifications
    async sendGroupNotification(
        groupId: string,
        notification: Omit<INotification, 'id' | 'groupId'>
    ): Promise<string> {
        const notificationId = this.generateId()
        const notificationData = this.createNotificationData(notification)

        try {
            await this.db.set(`GroupNotifications:${groupId}`, {
                [notificationId]: notificationData
            })

            console.log(`Sent group notification to group ${groupId}:`, notificationId)
            return notificationId
        } catch (error) {
            console.error('Failed to send group notification:', error)
            throw error
        }
    }

    // User Alarms
    async sendUserAlarm(
        userId: string,
        alarm: Omit<INotification, 'id' | 'userId' | 'type'>
    ): Promise<string> {
        const alarmId = this.generateId()
        const alarmData = {
            ...this.createNotificationData(alarm),
            ack: false
        }

        try {
            await this.db.patchKey(`userAlarms:${userId}`, {
                [alarmId]: alarmData
            })

            console.log(`Sent alarm to user ${userId}:`, alarmId)
            return alarmId
        } catch (error) {
            console.error('Failed to send user alarm:', error)
            throw error
        }
    }

    async acknowledgeUserAlarm(userId: string, alarmId: string): Promise<void> {
        try {
            // Get current alarm data first
            const currentAlarms = await this.db.get(`userAlarms:${userId}`) || {}
            const alarm = currentAlarms[alarmId]

            if (alarm) {
                await this.db.patchKey(`userAlarms:${userId}`, {
                    [alarmId]: { ...alarm, ack: true }
                })

                console.log(`Acknowledged alarm ${alarmId} for user ${userId}`)
            }
        } catch (error) {
            console.error('Failed to acknowledge user alarm:', error)
            throw error
        }
    }

    async dismissUserAlarm(userId: string, alarmId: string): Promise<void> {
        try {
            await this.db.patchKey(`userAlarms:${userId}`, {
                [alarmId]: null
            })

            console.log(`Dismissed alarm ${alarmId} for user ${userId}`)
        } catch (error) {
            console.error('Failed to dismiss user alarm:', error)
            throw error
        }
    }

    // Group Alarms
    async sendGroupAlarm(
        groupId: string,
        alarm: Omit<INotification, 'id' | 'groupId' | 'type'>
    ): Promise<string> {
        const alarmId = this.generateId()
        const alarmData = {
            ...this.createNotificationData(alarm),
            ack: false
        }

        try {
            await this.db.set(`GroupAlarms:${groupId}`, {
                [alarmId]: alarmData
            })

            console.log(`Sent group alarm to group ${groupId}:`, alarmId)
            return alarmId
        } catch (error) {
            console.error('Failed to send group alarm:', error)
            throw error
        }
    }

    // Local notifications (not synced to coreDB)
    showLocalNotification(notification: Omit<INotification, 'id'>): string {
        return this.notificationStore.addLocalNotification(notification)
    }

    hideLocalNotification(notificationId: string): void {
        this.notificationStore.dismissNotification(notificationId)
    }

    // Utility methods
    clearAllNotifications(): void {
        this.notificationStore.clearAllNotifications()
    }

    clearAllAlarms(): void {
        this.notificationStore.clearAllAlarms()
    }

    getActiveNotifications(): INotification[] {
        return this.notificationStore.activeNotifications
    }

    getActiveAlarms(): INotification[] {
        return this.notificationStore.activeAlarms
    }

    // Convenience methods for common use cases
    async sendBroadcastNotification(
        notification: Omit<INotification, 'id' | 'userId'>
    ): Promise<string> {
        return this.sendUserNotification('*', notification)
    }

    async sendBroadcastAlarm(
        alarm: Omit<INotification, 'id' | 'userId' | 'type'>
    ): Promise<string> {
        return this.sendUserAlarm('*', alarm)
    }

    // Quick notification methods
    async showSuccess(message: string, heading = 'Success', timeout = 5000): Promise<string> {
        return this.showLocalNotification({
            heading,
            message,
            timeout
        })
    }

    async showError(message: string, heading = 'Error', timeout = 0): Promise<string> {
        return this.showLocalNotification({
            heading,
            message,
            timeout
        })
    }

    async showWarning(message: string, heading = 'Warning', timeout = 8000): Promise<string> {
        return this.showLocalNotification({
            heading,
            message,
            timeout
        })
    }

    async showInfo(message: string, heading = 'Information', timeout = 6000): Promise<string> {
        return this.showLocalNotification({
            heading,
            message,
            timeout
        })
    }
}

// Export getter function instead of direct instance
export const getNotificationService = () => NotificationService.getInstance()
