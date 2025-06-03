<template>
	<PageLayout>
		<template #header>
			<div class="header-content">
				<h1>Dashboard Designer</h1>
				<div class="dash-actions">
					<button class="action-button" title="New Dashboard" @click="createNewDashboard">
						<i class="fa fa-plus"></i>
						New
					</button>
					<button class="action-button" title="Save" @click="saveDashboard" :disabled="!dashStore.currentDashboard">
						<i class="fa fa-save"></i>
						Save
					</button>
					<button class="action-button" title="Load" @click="showLoadDialog = true">
						<i class="fa fa-folder-open"></i>
						Load
					</button>
					<button 
						class="action-button" 
						title="Toggle Grid" 
						@click="dashStore.showGrid = !dashStore.showGrid"
						:class="{ active: dashStore.showGrid }"
					>
						<i class="fa fa-th"></i>
						Grid
					</button>
					<button 
						class="action-button" 
						title="Toggle Properties" 
						@click="dashStore.showProperties = !dashStore.showProperties"
						:class="{ active: dashStore.showProperties }"
					>
						<i class="fa fa-cog"></i>
						Properties
					</button>
					<router-link to="/dash-viewer" class="action-button" title="Preview">
						<i class="fa fa-eye"></i>
						Preview
					</router-link>
				</div>
			</div>
		</template>

		<div class="dash-designer">
			<!-- Component Palette -->
			<DashComponentTree class="component-tree" />
			
			<!-- Main Canvas Area -->
			<div class="canvas-area">
				<DashFormatSelector v-if="dashStore.currentDashboard" />
				<DashCanvas class="dash-canvas" />
			</div>
			
			<!-- Properties Panel -->
			<DashPropertiesPanel 
				v-if="dashStore.showProperties" 
				class="properties-panel" 
			/>
		</div>

		<!-- Modals -->
		<div v-if="showNewDashboardDialog" class="modal-overlay" @click="showNewDashboardDialog = false">
			<div class="modal" @click.stop>
				<h3>Create New Dashboard</h3>
				<div class="form-group">
					<label>Name:</label>
					<input v-model="newDashboardName" placeholder="Dashboard Name" />
				</div>
				<div class="form-group">
					<label>Format:</label>
					<select v-model="selectedFormat">
						<option v-for="format in dashStore.availableFormats" :key="format.name" :value="format">
							{{ format.name }} ({{ format.aspectRatio }})
						</option>
					</select>
				</div>
				<div class="modal-actions">
					<button @click="confirmCreateDashboard" :disabled="!newDashboardName.trim()">Create</button>
					<button @click="showNewDashboardDialog = false">Cancel</button>
				</div>
			</div>
		</div>

		<div v-if="showLoadDialog" class="modal-overlay" @click="showLoadDialog = false">
			<div class="modal" @click.stop>
				<h3>Load Dashboard</h3>
				<div class="dashboard-list">
					<div 
						v-for="dashboard in Object.values(dashStore.dashboards)" 
						:key="dashboard.id"
						class="dashboard-item"
						@click="loadDashboard(dashboard.id)"
					>
						<div class="dashboard-name">{{ dashboard.name }}</div>
						<div class="dashboard-format">{{ dashboard.format.name }}</div>
					</div>
				</div>
				<div class="modal-actions">
					<button @click="showLoadDialog = false">Cancel</button>
				</div>
			</div>
		</div>
	</PageLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useDashStore } from "../stores/dashStore"
import PageLayout from "../components/PageLayout.vue"
import DashCanvas from "../components/Dash/DashCanvas.vue"
import DashComponentTree from "../components/Dash/DashComponentTree.vue"
import DashPropertiesPanel from "../components/Dash/DashPropertiesPanel.vue"
import DashFormatSelector from "../components/Dash/DashFormatSelector.vue"
import type { IDashFormat } from "../components/Dash/types"
import { DASH_FORMATS } from "../components/Dash/types"

const dashStore = useDashStore()

// Modal states
const showNewDashboardDialog = ref(false)
const showLoadDialog = ref(false)
const newDashboardName = ref("")
const selectedFormat = ref<IDashFormat>(DASH_FORMATS[0])

// Methods
const createNewDashboard = () => {
	newDashboardName.value = ""
	selectedFormat.value = DASH_FORMATS[0]
	showNewDashboardDialog.value = true
}

const confirmCreateDashboard = () => {
	if (newDashboardName.value.trim()) {
		const dashboard = dashStore.createDashboard(newDashboardName.value.trim(), selectedFormat.value)
		dashStore.loadDashboard(dashboard.id)
		showNewDashboardDialog.value = false
	}
}

const saveDashboard = () => {
	if (dashStore.currentDashboard) {
		dashStore.saveDashboard(dashStore.currentDashboard)
	}
}

const loadDashboard = (dashboardId: string) => {
	dashStore.loadDashboard(dashboardId)
	showLoadDialog.value = false
}

onMounted(() => {
	dashStore.setDesignMode(true)
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

.dash-actions {
	display: flex;
	gap: 0.5rem;
	margin-left: auto;
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

.dash-designer {
	display: flex;
	height: 100%;
	width: 100%;
}

.component-tree {
	width: 250px;
	flex-shrink: 0;
	border-right: 1px solid var(--border-color);
}

.canvas-area {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.dash-canvas {
	flex: 1;
}

.properties-panel {
	width: 300px;
	flex-shrink: 0;
	border-left: 1px solid var(--border-color);
}

/* Modal styles */
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal {
	background-color: var(--bg-secondary);
	border: 1px solid var(--border-color);
	border-radius: 8px;
	padding: 1.5rem;
	min-width: 400px;
	max-width: 600px;
}

.modal h3 {
	margin-bottom: 1rem;
	color: var(--text-primary);
}

.form-group {
	margin-bottom: 1rem;
}

.form-group label {
	display: block;
	margin-bottom: 0.5rem;
	color: var(--text-primary);
}

.form-group input,
.form-group select {
	width: 100%;
	padding: 0.5rem;
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 4px;
}

.modal-actions {
	display: flex;
	gap: 0.5rem;
	justify-content: flex-end;
	margin-top: 1.5rem;
}

.modal-actions button {
	padding: 0.5rem 1rem;
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 4px;
	cursor: pointer;
}

.modal-actions button:hover {
	background-color: var(--bg-secondary);
}

.modal-actions button:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}

.dashboard-list {
	max-height: 300px;
	overflow-y: auto;
}

.dashboard-item {
	padding: 0.75rem;
	border: 1px solid var(--border-color);
	border-radius: 4px;
	margin-bottom: 0.5rem;
	cursor: pointer;
	transition: background-color 0.2s;
}

.dashboard-item:hover {
	background-color: var(--bg-primary);
}

.dashboard-name {
	font-weight: 500;
	color: var(--text-primary);
}

.dashboard-format {
	font-size: 0.9rem;
	color: var(--text-secondary);
}
</style>
