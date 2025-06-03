<template>
	<PageLayout>
		<template #header>
			<h1>Home</h1>
		</template>

		<div class="home-content">
			<h2>Welcome to the Application</h2>
			<p>This is the home page with notification system integration.</p>

			<!-- Notification Demo Section -->
			<div class="notification-demo">
				<h3>Notification System Demo</h3>
				<div class="demo-buttons">
					<button @click="showSuccessNotification" class="demo-btn success">Show Success</button>
					<button @click="showErrorNotification" class="demo-btn error">Show Error</button>
					<button @click="showWarningNotification" class="demo-btn warning">Show Warning</button>
					<button @click="showInfoNotification" class="demo-btn info">Show Info</button>
					<button @click="showPersistentNotification" class="demo-btn persistent">Show Persistent</button>
					<button @click="showAlarm" class="demo-btn alarm">Show Alarm</button>
					<button @click="sendUserNotification" class="demo-btn user">Send User Notification</button>
					<button @click="sendBroadcastAlarm" class="demo-btn broadcast">Send Broadcast Alarm</button>
				</div>
			</div>
		</div>

		<template #footer>
			<p class="footer-text">© 2023 Your Company</p>
		</template>
	</PageLayout>
</template>

<script setup lang="ts">
	import PageLayout from "../components/PageLayout.vue"
	import { onMounted, ref } from "vue"
	import { getNotificationService } from "@/services/NotificationService"

	const notificationService = ref()

	onMounted(() => {
		notificationService.value = getNotificationService()
	})

	// Demo notification methods
	const showSuccessNotification = () => {
		notificationService.value.showSuccess("Operation completed successfully!")
	}

	const showErrorNotification = () => {
		notificationService.value.showError("An error occurred while processing your request.")
	}

	const showWarningNotification = () => {
		notificationService.value.showWarning("This action may have unintended consequences.")
	}

	const showInfoNotification = () => {
		notificationService.value.showInfo("Here's some useful information for you.")
	}

	const showPersistentNotification = () => {
		notificationService.value.showLocalNotification({
			heading: "Persistent Notification",
			message: "This notification will stay until manually dismissed.",
			timeout: 0
		})
	}

	const showAlarm = () => {
		notificationService.value.showLocalNotification({
			heading: "System Alert",
			message: "Critical system event requires attention!",
			timeout: 0,
			type: "alarm"
		})
	}

	const sendUserNotification = async () => {
		try {
			await notificationService.value.sendUserNotification("testUser", {
				heading: "User Notification",
				message: "This is a notification sent via coreDB to a specific user.",
				timeout: 8000
			})
		} catch (error) {
			console.error("Failed to send user notification:", error)
			notificationService.value.showError("Failed to send user notification")
		}
	}

	const sendBroadcastAlarm = async () => {
		try {
			await notificationService.value.sendBroadcastAlarm({
				heading: "Broadcast Alarm",
				message: "This is a broadcast alarm sent to all users via coreDB.",
				timeout: 0
			})
		} catch (error) {
			console.error("Failed to send broadcast alarm:", error)
			notificationService.value.showError("Failed to send broadcast alarm")
		}
	}
</script>

<style scoped>
	.home-content {
		padding: 1rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.home-content h2 {
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}

	.home-content p {
		color: var(--text-secondary);
		margin-bottom: 2rem;
	}

	.notification-demo {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1.5rem;
		margin-top: 2rem;
	}

	.notification-demo h3 {
		color: var(--text-primary);
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	.demo-buttons {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.demo-btn {
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		color: white;
	}

	.demo-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.demo-btn.success {
		background: var(--success-color);
	}

	.demo-btn.error {
		background: var(--error-color);
	}

	.demo-btn.warning {
		background: var(--warning-color);
	}

	.demo-btn.info {
		background: var(--info-color);
	}

	.demo-btn.persistent {
		background: #6366f1;
	}

	.demo-btn.alarm {
		background: #dc2626;
		animation: pulse-subtle 2s infinite;
	}

	.demo-btn.user {
		background: #8b5cf6;
	}

	.demo-btn.broadcast {
		background: #f59e0b;
	}

	@keyframes pulse-subtle {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	@media (max-width: 600px) {
		.demo-buttons {
			grid-template-columns: 1fr;
		}
	}
</style>
