// Notification System Types

export interface INotification {
    id: string
    heading: string
    message: string
    timeout: number // > 0: auto-hide after ms, 0: manual dismiss only
    type?: 'notification' | 'alarm'
    timestamp?: number
    userId?: string
    groupId?: string
    ack?: boolean // For alarms only
    customComponent?: string // Optional Vue component name for custom rendering
    customProps?: Record<string, any> // Props for custom component
}

export interface INotificationState {
    notifications: Record<string, INotification>
    alarms: Record<string, INotification>
}

export interface IGroupNotification {
    notificationId: string
    notification: Omit<INotification, 'id'>
}

export interface IGroupAlarm {
    alarmId: string
    alarm: Omit<INotification, 'id'>
}

// Local API interfaces
export interface INotificationAPI {
    // User Notifications
    sendUserNotification(userId: string, notification: Omit<INotification, 'id' | 'userId'>): Promise<string>
    dismissUserNotification(userId: string, notificationId: string): Promise<void>
    
    // Group Notifications
    sendGroupNotification(groupId: string, notification: Omit<INotification, 'id' | 'groupId'>): Promise<string>
    
    // User Alarms
    sendUserAlarm(userId: string, alarm: Omit<INotification, 'id' | 'userId' | 'type'>): Promise<string>
    acknowledgeUserAlarm(userId: string, alarmId: string): Promise<void>
    dismissUserAlarm(userId: string, alarmId: string): Promise<void>
    
    // Group Alarms
    sendGroupAlarm(groupId: string, alarm: Omit<INotification, 'id' | 'groupId' | 'type'>): Promise<string>
    
    // Local notifications (not synced to coreDB)
    showLocalNotification(notification: Omit<INotification, 'id'>): string
    hideLocalNotification(notificationId: string): void
    
    // Utility methods
    clearAllNotifications(): void
    clearAllAlarms(): void
    getActiveNotifications(): INotification[]
    getActiveAlarms(): INotification[]
}

// Event types for notification system
export interface INotificationEvents {
    'notification:received': INotification
    'notification:dismissed': string
    'alarm:received': INotification
    'alarm:acknowledged': string
    'alarm:dismissed': string
}

// CoreDB subscription patterns
export interface ICoreDBNotificationPatterns {
    userNotifications: (userId: string) => `userNotifications:${string}`
    userAlarms: (userId: string) => `userAlarms:${string}`
    groupNotifications: (groupId: string) => `GroupNotifications:${string}`
    groupAlarms: (groupId: string) => `GroupAlarms:${string}`
}
