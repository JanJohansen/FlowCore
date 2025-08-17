<template>
	<router-view></router-view>
	<ConnectionStatusOverlay />
	<NotificationPortal />
</template>

<script setup lang="ts">
	import ConnectionStatusOverlay from "./components/ConnectionStatusOverlay.vue"
	import NotificationPortal from "./components/NotificationPortal.vue"
</script>

<style>
	/* Global styles */
	:root {
		--bg-primary: #1a1a1a;
		--bg-secondary: #2d2d2d;
		--bg-tertiary: #404040;
		--text-primary: #ffffff;
		--text-secondary: #cccccc;
		--text-tertiary: #999999;
		--border-color: #404040;
		--primary-color: #3b82f6;
		--primary-color-dark: #2563eb;
		--success-color: #10b981;
		--error-color: #ef4444;
		--error-bg: rgba(239, 68, 68, 0.1);
		--warning-color: #f59e0b;
		--info-color: #3b82f6;
		--grid-size: 20px;
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
