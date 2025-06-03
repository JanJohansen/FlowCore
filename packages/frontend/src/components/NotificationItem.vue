<template>
  <Transition name="notification-slide" appear>
    <div 
      :class="[
        'notification-item',
        `notification-${notification.type || 'notification'}`,
        { 'notification-persistent': notification.timeout === 0 }
      ]"
      role="alert"
      :aria-live="notification.type === 'alarm' ? 'assertive' : 'polite'"
    >
      <!-- Progress bar for timed notifications -->
      <div 
        v-if="notification.timeout > 0" 
        class="notification-progress"
        :style="{ width: `${progressPercentage}%` }"
      ></div>

      <!-- Notification content -->
      <div class="notification-content">
        <div class="notification-header">
          <h4 class="notification-heading">{{ notification.heading }}</h4>
          <div class="notification-actions">
            <!-- Acknowledge button for alarms -->
            <button
              v-if="notification.type === 'alarm' && !notification.ack"
              @click="acknowledgeAlarm"
              class="notification-btn notification-btn-ack"
              title="Acknowledge alarm"
            >
              <i class="fa fa-check"></i>
            </button>
            <!-- Dismiss button -->
            <button
              @click="dismiss"
              class="notification-btn notification-btn-dismiss"
              title="Dismiss notification"
            >
              <i class="fa fa-times"></i>
            </button>
          </div>
        </div>

        <div class="notification-body">
          <!-- Custom component slot -->
          <div v-if="notification.customComponent" class="notification-custom">
            <slot 
              name="custom-component" 
              :notification="notification"
              :customProps="notification.customProps"
            >
              <!-- Fallback if custom component not provided -->
              <p class="notification-message">{{ notification.message }}</p>
            </slot>
          </div>
          <!-- Default message display -->
          <p v-else class="notification-message">{{ notification.message }}</p>
        </div>

        <!-- Timestamp for persistent notifications -->
        <div v-if="notification.timeout === 0" class="notification-timestamp">
          {{ formatTimestamp(notification.timestamp) }}
        </div>
      </div>

      <!-- Alarm indicator -->
      <div v-if="notification.type === 'alarm'" class="alarm-indicator">
        <div class="alarm-pulse" :class="{ 'alarm-acknowledged': notification.ack }"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { INotification } from '@/types/notifications'

interface Props {
  notification: INotification
}

interface Emits {
  (e: 'dismiss', notificationId: string): void
  (e: 'acknowledge', notificationId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Timer management
const startTime = ref(Date.now())
const currentTime = ref(Date.now())
let timer: NodeJS.Timeout | null = null
let progressTimer: NodeJS.Timeout | null = null

// Progress calculation for timed notifications
const progressPercentage = computed(() => {
  if (props.notification.timeout <= 0) return 0
  
  const elapsed = currentTime.value - startTime.value
  const remaining = Math.max(0, props.notification.timeout - elapsed)
  return (remaining / props.notification.timeout) * 100
})

// Auto-dismiss logic
const startAutoTimer = () => {
  if (props.notification.timeout > 0) {
    timer = setTimeout(() => {
      emit('dismiss', props.notification.id)
    }, props.notification.timeout)

    // Update progress every 100ms
    progressTimer = setInterval(() => {
      currentTime.value = Date.now()
    }, 100)
  }
}

const clearTimers = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

// Event handlers
const dismiss = () => {
  clearTimers()
  emit('dismiss', props.notification.id)
}

const acknowledgeAlarm = () => {
  emit('acknowledge', props.notification.id)
}

// Utility functions
const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString()
}

// Lifecycle
onMounted(() => {
  startAutoTimer()
})

onUnmounted(() => {
  clearTimers()
})
</script>

<style scoped>
.notification-item {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 320px;
  max-width: 400px;
}

.notification-notification {
  border-left: 4px solid #3b82f6;
}

.notification-alarm {
  border-left: 4px solid #ef4444;
}

.notification-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
  transition: width 0.1s linear;
  z-index: 1;
}

.notification-content {
  padding: 1rem;
  position: relative;
  z-index: 2;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.notification-heading {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
  margin-right: 0.5rem;
}

.notification-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.notification-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.notification-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.notification-btn-ack {
  border-color: #10b981;
  color: #10b981;
}

.notification-btn-ack:hover {
  background: #10b981;
  color: white;
}

.notification-btn-dismiss {
  border-color: #6b7280;
}

.notification-message {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.notification-timestamp {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-tertiary);
  text-align: right;
}

.alarm-indicator {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 8px;
  height: 8px;
}

.alarm-pulse {
  width: 100%;
  height: 100%;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

.alarm-acknowledged {
  background: #10b981;
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* Transition animations */
.notification-slide-enter-active {
  transition: all 0.3s ease-out;
}

.notification-slide-leave-active {
  transition: all 0.3s ease-in;
}

.notification-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
