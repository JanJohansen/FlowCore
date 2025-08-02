<template>
	<Teleport to="body">
		<div v-if="hasActiveNotifications" class="notification-portal" role="region" aria-label="Notifications">
			<div class="notification-container">
				<!-- Notifications -->
				<NotificationItem
					v-for="notification in sortedNotifications"
					:key="notification.id"
					:notification="notification"
					@dismiss="handleDismiss"
					@acknowledge="handleAcknowledge"
				>
					<!-- Custom component slot -->
					<template #custom-component="{ notification: notif, customProps }">
						<component
							v-if="notif.customComponent && customComponents[notif.customComponent]"
							:is="customComponents[notif.customComponent]"
							v-bind="customProps"
							:notification="notif"
						/>
						<p v-else class="notification-message">{{ notif.message }}</p>
					</template>
				</NotificationItem>

				<!-- Alarms -->
				<NotificationItem
					v-for="alarm in sortedAlarms"
					:key="alarm.id"
					:notification="alarm"
					@dismiss="handleDismiss"
					@acknowledge="handleAcknowledge"
				>
					<!-- Custom component slot -->
					<template #custom-component="{ notification: notif, customProps }">
						<component
							v-if="notif.customComponent && customComponents[notif.customComponent]"
							:is="customComponents[notif.customComponent]"
							v-bind="customProps"
							:notification="notif"
						/>
						<p v-else class="notification-message">{{ notif.message }}</p>
					</template>
				</NotificationItem>
			</div>

			<!-- Clear all button for multiple notifications -->
			<div v-if="totalCount > 1" class="notification-controls">
				<button @click="clearAll" class="clear-all-btn" title="Clear all notifications">
					Clear All ({{ totalCount }})
				</button>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
	import { computed, type Component } from "vue"
	import { useNotificationStore } from "../stores/notificationStore"
	import NotificationItem from "./NotificationItem.vue"
	import type { INotification } from "../types/notifications"

	interface Props {
		customComponents?: Record<string, Component>
	}

	const props = withDefaults(defineProps<Props>(), {
		customComponents: () => ({})
	})

	const notificationStore = useNotificationStore()

	// Computed properties
	const sortedNotifications = computed(() => {
		return Object.values(notificationStore.notifications).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
	})

	const sortedAlarms = computed(() => {
		return Object.values(notificationStore.alarms).sort((a, b) => {
			// Unacknowledged alarms first, then by timestamp
			if (a.ack !== b.ack) {
				return a.ack ? 1 : -1
			}
			return (b.timestamp || 0) - (a.timestamp || 0)
		})
	})

	const hasActiveNotifications = computed(() => {
		return sortedNotifications.value.length > 0 || sortedAlarms.value.length > 0
	})

	const totalCount = computed(() => {
		return sortedNotifications.value.length + sortedAlarms.value.length
	})

	// Event handlers
	const handleDismiss = (notificationId: string) => {
		notificationStore.dismissNotification(notificationId)
	}

	const handleAcknowledge = (notificationId: string) => {
		notificationStore.acknowledgeAlarm(notificationId)
	}

	const clearAll = () => {
		notificationStore.clearAllNotifications()
		notificationStore.clearAllAlarms()
	}
</script>

<style scoped>
	.notification-portal {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 9998;
		pointer-events: none;
	}

	.notification-container {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		pointer-events: auto;
	}

	.notification-controls {
		margin-top: 0.5rem;
		display: flex;
		justify-content: flex-end;
		pointer-events: auto;
	}

	.clear-all-btn {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.clear-all-btn:hover {
		background: var(--bg-primary);
		color: var(--text-primary);
		border-color: var(--text-tertiary);
	}

	/* Responsive adjustments */
	@media (max-width: 480px) {
		.notification-portal {
			bottom: 0.5rem;
			right: 0.5rem;
			left: 0.5rem;
		}

		.notification-container {
			align-items: stretch;
		}
	}
</style>
