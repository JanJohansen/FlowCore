<template>
	<router-view></router-view>
	<ConnectionStatusOverlay />
	<NotificationPortal />
</template>

<script setup lang="ts">
	import { onMounted, onUnmounted } from "vue"
	import ConnectionStatusOverlay from "./components/ConnectionStatusOverlay.vue"
	import NotificationPortal from "./components/NotificationPortal.vue"
	import { useConnectionStatusStore } from "./stores/connectionStatusStore"

	// Initialize connection status monitoring
	const connectionStatusStore = useConnectionStatusStore()
	let unsubscribeConnectionMonitoring: (() => void) | null = null

	onMounted(() => {
		// Start monitoring connection status
		unsubscribeConnectionMonitoring = connectionStatusStore.initializeConnectionMonitoring()
	})

	onUnmounted(() => {
		// Clean up connection monitoring
		if (unsubscribeConnectionMonitoring) {
			unsubscribeConnectionMonitoring()
		}
		connectionStatusStore.cleanup()
	})
</script>

<style>
	/* Global styles */
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

	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	html,
	body {
		width: 100vw;
		height: 100vh;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	body {
		font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		line-height: 1.5;
		background-color: var(--bg-primary);
		color: var(--text-primary);
	}
</style>
