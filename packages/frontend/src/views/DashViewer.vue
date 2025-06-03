<template>
	<PageLayout>
		<template #header>
			<div class="header-content">
				<h1>Dashboard Viewer</h1>
				<div class="viewer-actions">
					<select v-model="selectedDashboardId" @change="loadSelectedDashboard">
						<option value="">Select Dashboard</option>
						<option 
							v-for="dashboard in Object.values(dashStore.dashboards)" 
							:key="dashboard.id" 
							:value="dashboard.id"
						>
							{{ dashboard.name }}
						</option>
					</select>
					<button 
						class="action-button" 
						title="Toggle Fullscreen" 
						@click="toggleFullscreen"
						:class="{ active: dashStore.fullscreen }"
					>
						<i class="fa fa-expand"></i>
						Fullscreen
					</button>
					<button 
						class="action-button" 
						title="Refresh" 
						@click="refreshDashboard"
						:disabled="!dashStore.currentDashboard"
					>
						<i class="fa fa-refresh"></i>
						Refresh
					</button>
					<router-link to="/dash-designer" class="action-button" title="Edit">
						<i class="fa fa-edit"></i>
						Edit
					</router-link>
				</div>
			</div>
		</template>

		<div class="dash-viewer" :class="{ fullscreen: dashStore.fullscreen }">
			<div v-if="!dashStore.currentDashboard" class="no-dashboard">
				<div class="no-dashboard-content">
					<i class="fa fa-dashboard"></i>
					<h2>No Dashboard Selected</h2>
					<p>Select a dashboard from the dropdown above or create one in the designer.</p>
					<router-link to="/dash-designer" class="create-button">
						<i class="fa fa-plus"></i>
						Create Dashboard
					</router-link>
				</div>
			</div>
			
			<DashViewerCanvas 
				v-else
				:dashboard="dashStore.currentDashboard"
				class="viewer-canvas"
			/>
		</div>
	</PageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { useDashStore } from "../stores/dashStore"
import PageLayout from "../components/PageLayout.vue"
import DashViewerCanvas from "../components/Dash/DashViewerCanvas.vue"

const dashStore = useDashStore()
const selectedDashboardId = ref("")

// Methods
const loadSelectedDashboard = () => {
	if (selectedDashboardId.value) {
		dashStore.loadDashboard(selectedDashboardId.value)
	}
}

const toggleFullscreen = () => {
	dashStore.toggleFullscreen()
	
	// Handle browser fullscreen API
	if (dashStore.fullscreen) {
		if (document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen()
		}
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen()
		}
	}
}

const refreshDashboard = () => {
	if (dashStore.currentDashboard) {
		// Force re-render by temporarily clearing and reloading
		const currentId = dashStore.currentDashboard.id
		dashStore.currentDashboard = null
		setTimeout(() => {
			dashStore.loadDashboard(currentId)
		}, 100)
	}
}

// Handle browser fullscreen changes
const handleFullscreenChange = () => {
	const isFullscreen = !!document.fullscreenElement
	if (isFullscreen !== dashStore.fullscreen) {
		dashStore.fullscreen = isFullscreen
	}
}

onMounted(() => {
	dashStore.setDesignMode(false)
	
	// Set up fullscreen event listeners
	document.addEventListener('fullscreenchange', handleFullscreenChange)
	document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
	document.addEventListener('mozfullscreenchange', handleFullscreenChange)
	document.addEventListener('MSFullscreenChange', handleFullscreenChange)
	
	// Load current dashboard if available
	if (dashStore.currentDashboard) {
		selectedDashboardId.value = dashStore.currentDashboard.id
	}
})

// Watch for dashboard changes
watch(() => dashStore.currentDashboard, (newDashboard) => {
	if (newDashboard) {
		selectedDashboardId.value = newDashboard.id
	}
})
</script>

<style scoped>
.header-content {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.5rem 1rem;
	width: 100%;
}

.viewer-actions {
	display: flex;
	gap: 0.5rem;
	margin-left: auto;
	align-items: center;
}

.viewer-actions select {
	padding: 0.5rem;
	background-color: var(--bg-secondary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 4px;
	min-width: 200px;
}

.action-button {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	background-color: var(--bg-secondary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	text-decoration: none;
	border-radius: 4px;
	cursor: pointer;
	transition: background-color 0.2s;
}

.action-button:hover {
	background-color: var(--bg-primary);
}

.action-button.active {
	background-color: #007acc;
}

.action-button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.dash-viewer {
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	background-color: var(--bg-primary);
}

.dash-viewer.fullscreen {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
	background-color: var(--bg-primary);
}

.no-dashboard {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.no-dashboard-content {
	text-align: center;
	color: var(--text-secondary);
}

.no-dashboard-content i {
	font-size: 4rem;
	margin-bottom: 1rem;
	color: var(--text-secondary);
}

.no-dashboard-content h2 {
	margin-bottom: 0.5rem;
	color: var(--text-primary);
}

.no-dashboard-content p {
	margin-bottom: 2rem;
	max-width: 400px;
}

.create-button {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1.5rem;
	background-color: #007acc;
	color: white;
	text-decoration: none;
	border-radius: 6px;
	font-weight: 500;
	transition: background-color 0.2s;
}

.create-button:hover {
	background-color: #005a9e;
}

.viewer-canvas {
	flex: 1;
	width: 100%;
	height: 100%;
}

/* Fullscreen specific styles */
.dash-viewer.fullscreen .viewer-canvas {
	width: 100vw;
	height: 100vh;
}
</style>
