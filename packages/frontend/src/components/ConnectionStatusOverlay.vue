<template>
	<Teleport to="body">
		<Transition name="overlay-fade">
			<div
				v-if="!CoreDbUser.isConnected.value"
				class="connection-overlay"
				role="dialog"
				aria-modal="true"
				aria-labelledby="connection-status-title"
			>
				<div class="overlay-content">
					<div class="spinner-container">
						<div class="loading-spinner" aria-hidden="true"></div>
					</div>

					<div class="status-content">
						<h2 id="connection-status-title" class="status-title">Please wait - connecting to backend</h2>

						<div class="status-details">
							<div class="connection-dots">
								<span class="dot" :class="{ active: dotIndex >= 1 }"></span>
								<span class="dot" :class="{ active: dotIndex >= 2 }"></span>
								<span class="dot" :class="{ active: dotIndex >= 3 }"></span>
							</div>
						</div>

						<div class="status-message">
							<p>Attempting to reconnect...</p>
						</div>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
	import { ref, onMounted, onUnmounted } from "vue"

	import { CoreDbUser } from "../services/CoreDbUser"

	// Animated dots for visual feedback
	const dotIndex = ref(0)
	let dotTimer: NodeJS.Timeout | null = null

	const animateDots = () => {
		dotTimer = setInterval(() => {
			dotIndex.value = (dotIndex.value + 1) % 4
		}, 500)
	}

	const stopDotAnimation = () => {
		if (dotTimer) {
			clearInterval(dotTimer)
			dotTimer = null
		}
	}

	onMounted(() => {
		animateDots()
	})

	onUnmounted(() => {
		stopDotAnimation()
	})
</script>

<style scoped>
	.connection-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		user-select: none;
	}

	.overlay-content {
		background: linear-gradient(135deg, var(--bg-secondary) 0%, #1e1e1e 100%);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		padding: 3rem 2.5rem;
		text-align: center;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
		max-width: 400px;
		width: 90%;
	}

	.spinner-container {
		margin-bottom: 2rem;
	}

	.loading-spinner {
		width: 60px;
		height: 60px;
		border: 4px solid rgba(255, 255, 255, 0.1);
		border-left: 4px solid #007acc;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.status-content {
		color: var(--text-primary);
	}

	.status-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.status-details {
		margin-bottom: 2rem;
	}

	.disconnection-time {
		font-size: 1.1rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
	}

	.connection-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.3);
		transition: background-color 0.3s ease;
	}

	.dot.active {
		background-color: #007acc;
	}

	.status-message {
		color: var(--text-secondary);
	}

	.status-message p {
		margin-bottom: 0.5rem;
	}

	.attempt-count {
		font-size: 0.9rem;
		color: #ffa500;
		font-weight: 500;
	}

	/* Transition animations */
	.overlay-fade-enter-active,
	.overlay-fade-leave-active {
		transition: all 0.3s ease;
	}

	.overlay-fade-enter-from,
	.overlay-fade-leave-to {
		opacity: 0;
		transform: scale(0.95);
	}

	.overlay-fade-enter-to,
	.overlay-fade-leave-from {
		opacity: 1;
		transform: scale(1);
	}

	/* Responsive design */
	@media (max-width: 480px) {
		.overlay-content {
			padding: 2rem 1.5rem;
			margin: 1rem;
		}

		.status-title {
			font-size: 1.3rem;
		}

		.loading-spinner {
			width: 50px;
			height: 50px;
		}
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.connection-overlay {
			background-color: rgba(0, 0, 0, 0.95);
		}

		.overlay-content {
			border: 2px solid var(--text-primary);
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner {
			animation: none;
			border-left-color: #007acc;
		}

		.overlay-fade-enter-active,
		.overlay-fade-leave-active {
			transition: opacity 0.2s ease;
		}

		.overlay-fade-enter-from,
		.overlay-fade-leave-to {
			transform: none;
		}
	}
</style>
