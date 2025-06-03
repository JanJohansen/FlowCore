# Notification System Documentation

## Overview

The notification system provides a comprehensive solution for displaying notifications and alarms in the Vue.js application. It supports both local notifications and external notifications via coreDB, with configurable timeout behavior and custom component rendering.

## Architecture

### Components

1. **NotificationPortal.vue** - Main portal component that renders to document.body
2. **NotificationItem.vue** - Individual notification/alarm display component
3. **NotificationService.ts** - Local TypeScript API for programmatic notification management
4. **notificationStore.ts** - Pinia store for state management and coreDB subscriptions
5. **notifications.ts** - TypeScript interfaces and types

### Key Features

- **Portal Rendering**: Notifications render to document.body for full-screen coverage
- **Position**: Lower right corner of the screen with responsive design
- **Timeout Behavior**: 
  - `timeout > 0`: Auto-hide after specified milliseconds
  - `timeout = 0`: Manual dismiss only (persistent)
- **User/Broadcast Support**: Individual user notifications and broadcast notifications
- **Alarm System**: Special alarm notifications with acknowledgment capabilities
- **Custom Components**: Support for rendering custom Vue components within notifications
- **CoreDB Integration**: Real-time synchronization via coreDB subscriptions

## Usage

### Basic Local Notifications

```typescript
import { notificationService } from '@/services/NotificationService'

// Quick notification methods
notificationService.showSuccess("Operation completed!")
notificationService.showError("An error occurred")
notificationService.showWarning("Warning message")
notificationService.showInfo("Information message")

// Custom local notification
notificationService.showLocalNotification({
  heading: "Custom Notification",
  message: "This is a custom notification",
  timeout: 5000 // Auto-hide after 5 seconds
})

// Persistent notification (manual dismiss only)
notificationService.showLocalNotification({
  heading: "Important Notice",
  message: "This stays until manually dismissed",
  timeout: 0
})
```

### CoreDB-based Notifications

```typescript
// Send notification to specific user
await notificationService.sendUserNotification("userId123", {
  heading: "User Notification",
  message: "This is sent via coreDB",
  timeout: 8000
})

// Send broadcast notification (to all users)
await notificationService.sendBroadcastNotification({
  heading: "System Announcement",
  message: "This goes to all users",
  timeout: 10000
})

// Send group notification
await notificationService.sendGroupNotification("groupId", {
  heading: "Group Update",
  message: "This goes to all users in the group",
  timeout: 6000
})
```

### Alarm System

```typescript
// Send alarm to specific user
await notificationService.sendUserAlarm("userId123", {
  heading: "Critical Alert",
  message: "Immediate attention required",
  timeout: 0 // Persistent until acknowledged/dismissed
})

// Send broadcast alarm
await notificationService.sendBroadcastAlarm({
  heading: "System Alert",
  message: "Critical system event",
  timeout: 0
})

// Acknowledge alarm
await notificationService.acknowledgeUserAlarm("userId123", "alarmId")

// Dismiss alarm
await notificationService.dismissUserAlarm("userId123", "alarmId")
```

### Custom Components

```typescript
// Notification with custom Vue component
notificationService.showLocalNotification({
  heading: "Custom Component",
  message: "Fallback message",
  timeout: 0,
  customComponent: "MyCustomComponent",
  customProps: {
    data: "custom data",
    callback: () => console.log("Custom action")
  }
})
```

## CoreDB Integration

### Subscription Patterns

The system automatically subscribes to the following coreDB keys:

- **User Notifications**: `userNotifications:userId`
- **User Alarms**: `userAlarms:userId`
- **Group Notifications**: `GroupNotifications:groupId`
- **Group Alarms**: `GroupAlarms:groupId`
- **Broadcast**: `userNotifications:*` and `userAlarms:*`

### External API (via coreDB)

#### User Notifications
```typescript
// Subscribe
db.onPatch("userNotifications:userId", callback)

// Send
db.patch("userNotifications:userId", {
  notificationId: {
    heading: "Title",
    message: "Content",
    timeout: 5000
  }
})

// Dismiss
db.patch("userNotifications:userId", {
  notificationId: null
})
```

#### User Alarms
```typescript
// Subscribe
db.onPatch("userAlarms:userId", callback)

// Send
db.patch("userAlarms:userId", {
  alarmId: {
    heading: "Alert",
    message: "Critical event",
    timeout: 0
  }
})

// Acknowledge
db.patch("userAlarms:userId", {
  alarmId: { ...existingAlarm, ack: true }
})

// Dismiss
db.patch("userAlarms:userId", {
  alarmId: null
})
```

#### Group Notifications/Alarms
```typescript
// Send to group (automatically converts to individual user notifications)
db.set("GroupNotifications:groupId", {
  notificationId: {
    heading: "Group Update",
    message: "Message for all group members",
    timeout: 8000
  }
})

db.set("GroupAlarms:groupId", {
  alarmId: {
    heading: "Group Alert",
    message: "Critical group event",
    timeout: 0
  }
})
```

## Configuration

### Setting User ID

```typescript
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()
notificationStore.setUserId("currentUserId")
```

### Custom Components

Register custom components in the NotificationPortal:

```vue
<template>
  <NotificationPortal :custom-components="customComponents" />
</template>

<script setup>
import MyCustomComponent from './MyCustomComponent.vue'

const customComponents = {
  MyCustomComponent
}
</script>
```

## Styling

The notification system uses CSS custom properties for theming:

```css
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-tertiary: #999999;
  --border-color: #404040;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --info-color: #3b82f6;
}
```

## Best Practices

1. **Use appropriate timeouts**: Short for success messages, longer for warnings, persistent for errors
2. **Clear messaging**: Use descriptive headings and concise messages
3. **Limit notifications**: Avoid overwhelming users with too many simultaneous notifications
4. **Handle errors**: Always wrap coreDB operations in try-catch blocks
5. **Clean up**: The system automatically handles cleanup, but be mindful of subscription management
6. **Accessibility**: The system includes proper ARIA attributes and keyboard navigation support

## Demo

Visit the Home page to see the notification system in action with various demo buttons that showcase different notification types and behaviors.
