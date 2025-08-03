<template>
	<PageLayout>
		<template #header>
			<h1>CoreDB Browser</h1>
			<div
				class="connection-badge"
				:class="{
					connected: isConnected
				}"
			>
				{{ connectionStatus }}
			</div>
		</template>

		<div class="win-container">
			<div class="win-content">
				<!-- Left Column - Types List -->
				<div class="win-sidebar">
					<div class="win-panel-header">Object Types</div>
					<div class="win-list">
						<div
							v-for="type in Object.keys(objectTypes)"
							:key="type"
							:class="['win-list-item', { active: selectedType === type }]"
							@click="selectedType = type"
						>
							{{ type }}
						</div>
					</div>
				</div>

				<!-- Right Column - Objects View -->
				<div class="win-main-panel">
					<div class="win-panel-header">
						<div class="header-content">
							<span>{{ selectedType ? `Objects of type: ${selectedType}` : "No type selected" }}</span>
							<div v-if="selectedType" class="search-container">
								<input
									type="text"
									v-model="searchQuery"
									placeholder="Search objects..."
									class="win-input search-input"
								/>
							</div>
						</div>
					</div>
					<div class="win-panel-content">
						<div v-if="selectedType" class="win-objects-view">
							<div v-for="(value, id) in filteredObjects" :key="id" class="win-object-item">
								<div class="win-object-header">{{ id }}</div>
								<!-- Using FlowNode component instead of inline implementation -->
								<!-- <FlowNode
									:nodeId="id"
									:nodeData="value"
									@showTooltip="showTooltip"
									@hideTooltip="hideTooltip"
								/> -->
								<!-- Keep the original JSON view as well for reference -->
								<details class="object-details">
									<summary>Raw JSON</summary>
									<pre class="win-object-content">{{ JSON.stringify(value, null, 2) }}</pre>
								</details>
							</div>
						</div>
						<div v-else class="win-empty-state">Select a type from the left panel to view objects</div>

						<!-- Using FlowNodeTooltip component -->
						<FlowNodeTooltip :visible="tooltipVisible" :content="tooltipContent" :style="tooltipStyle" />
					</div>
				</div>
			</div>

			<div class="win-statusbar">
				<div class="win-debug-panel">
					<div class="win-debug-controls">
						<div class="win-input-group">
							<label>Set Value</label>
							<div class="win-input-row">
								<input type="text" v-model="keyInput" placeholder="Key" class="win-input" />
								<input type="text" v-model="valueInput" placeholder="Value (JSON)" class="win-input" />
								<button @click="setValue" class="win-button">Set Value</button>
							</div>
						</div>
						<div class="win-input-group">
							<label>Subscribe</label>
							<div class="win-input-row">
								<input
									type="text"
									v-model="subscribeKeyInput"
									placeholder="Subscribe Key"
									class="win-input"
								/>
								<button @click="subscribeToKey" class="win-button">Subscribe</button>
							</div>
						</div>
					</div>
					<div class="win-updates-panel">
						<div class="win-panel-header">Updates Log</div>
						<div class="win-updates-content">
							<div v-for="(update, index) in updates" :key="index" class="win-update-item">
								<div class="win-update-header">Key: {{ update.key }}</div>
								<pre class="win-update-value">{{ JSON.stringify(update.value, null, 2) }}</pre>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<template #footer>
			<p class="footer-text">© 2023 Your Company</p>
		</template>
	</PageLayout>
</template>

<script setup lang="ts">
	import { ref, reactive, onMounted, onUnmounted, watch, computed } from "vue"
	import { CoreDbUser } from "../services/CoreDbUser"
	import FlowNode from "../components/DBFlowVisual.vue"
	import FlowNodeTooltip from "../components/FlowNodeTooltip.vue"
	import PageLayout from "../components/PageLayout.vue"

	// Initialize reactive refs
	const keyInput = ref("a")
	const valueInput = ref('{"type":"typeA"}')
	const subscribeKeyInput = ref("idx:type=?")
	const updates = ref<any[]>([])
	const objectTypes: { [typeName: string]: {} } = reactive({})
	const typeObjects: { [objectId: string]: any } = reactive({})
	const selectedType = ref("")

	// Add search functionality
	const searchQuery = ref("")

	// Computed property for filtered objects
	const filteredObjects = computed(() => {
		if (!searchQuery.value) return typeObjects

		const query = searchQuery.value.toLowerCase()
		return Object.entries(typeObjects).reduce((filtered, [id, value]) => {
			if (id.toLowerCase().includes(query)) {
				filtered[id] = value
			}
			return filtered
		}, {} as typeof typeObjects)
	})

	// Initialize store and get wrapper
	const db = new CoreDbUser()
	const isConnected = computed(() => CoreDbUser.isConnected)

	const connectionStatus = computed(() => {
		if (isConnected.value) return "Connected"
		return "Disconnected"
	})

	const setValue = async () => {
		try {
			const value = JSON.parse(valueInput.value)
			await db.set(keyInput.value, value)
		} catch (error) {
			console.error("Error setting value:", error)
		}
	}

	const subscribeToKey = () => {
		db.onPatch(subscribeKeyInput.value, (patch: any) => {
			updates.value.push({
				key: subscribeKeyInput.value,
				value: patch
			})
		})
	}

	const subscribeToObjectTypes = () => {
		console.log("Subscribing to idx:type=?")
		try {
			db.onPatch("idx:type=?", (patch: any) => {
				console.log("Received types patch:", patch)
				// merge types into objectTypes
				db.applyPatch(objectTypes, patch)
			})
		} catch (error) {
			console.error("Failed to subscribe:", error)
		}
	}

	let unsubscribeIndex: (() => void) | null = null
	let objectSubscriptions: Map<string, () => void> = new Map()

	watch(selectedType, (newType) => {
		// Cleanup previous subscriptions
		if (unsubscribeIndex) {
			unsubscribeIndex()
			unsubscribeIndex = null
		}

		objectSubscriptions.forEach((unsub) => unsub())
		objectSubscriptions.clear()
		Object.keys(typeObjects).forEach((key) => delete typeObjects[key])

		// Subscribe to new type if selected
		if (newType) {
			const typeIndex = `idx:type=${newType}`

			unsubscribeIndex = db.onPatch(typeIndex, (indexPatch: Record<string, unknown>) => {
				for (const [id, exists] of Object.entries(indexPatch)) {
					if (exists !== null) {
						// Only create new subscription if one doesn't exist
						if (!objectSubscriptions.has(id)) {
							const unsubscribe = db.onPatch(id, (patch: unknown) => {
								if (!typeObjects[id]) typeObjects[id] = {}
								db.applyPatch(typeObjects[id], patch)
							})
							objectSubscriptions.set(id, unsubscribe)
						}
					} else {
						// Cleanup subscription and remove object
						const unsubscribe = objectSubscriptions.get(id)
						if (unsubscribe) {
							unsubscribe()
							objectSubscriptions.delete(id)
						}
						delete typeObjects[id]
					}
				}
			})
		}
	})

	watch(isConnected, (newIsConnected) => {
		if (newIsConnected) {
			console.log("Connection established, subscribing to object types")
			subscribeToObjectTypes()
		}
	})

	onMounted(() => {
		console.log("HomeView mounted")
		if (CoreDbUser.isConnected) {
			subscribeToObjectTypes()
		}
	})

	onUnmounted(() => {
		db.unsubscribeAll()
	})

	// Tooltip state
	const tooltipVisible = ref(false)
	const tooltipStyle = ref({})
	const tooltipContent = ref<Record<string, any> | null>(null)

	// Show tooltip with metadata
	const showTooltip = (event: PointerEvent, metadata: any, position?: { x: number; y: number }) => {
		tooltipVisible.value = true
		tooltipContent.value = metadata

		// Position tooltip to the right of the cursor
		tooltipStyle.value = {
			left: `${event.clientX + 25}px`, // Increased offset to move further right
			top: `${event.clientY - 10}px` // Slight upward offset to center vertically
		}
	}

	// Hide tooltip
	const hideTooltip = () => {
		tooltipVisible.value = false
	}
</script>

<style scoped>
	.win-container {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #202020;
		color: #ffffff;
		font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
	}

	.win-titlebar {
		background: #1f1f1f;
		border-bottom: 1px solid #383838;
		padding: 8px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		-webkit-app-region: drag; /* Makes titlebar draggable like native apps */
	}

	.win-title {
		font-weight: 600;
		font-size: 14px;
	}

	.connection-badge {
		font-size: 12px;
		padding: 4px 8px;
		border-radius: 4px;
		background-color: #333;
	}

	.connection-badge.connected {
		background-color: #2e7d32;
	}

	.win-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.win-sidebar {
		width: 200px;
		border-right: 1px solid #383838;
		display: flex;
		flex-direction: column;
	}

	.win-panel-header {
		padding: 10px;
		font-weight: 600;
		background: #2d2d2d;
		border-bottom: 1px solid #383838;
	}

	.win-list {
		overflow-y: auto;
		flex: 1;
	}

	.win-list-item {
		padding: 8px 16px;
		cursor: pointer;
		border-bottom: 1px solid #2d2d2d;
	}

	.win-list-item:hover {
		background: #2a2a2a;
	}

	.win-list-item.active {
		background: #0078d4;
	}

	.win-main-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
	}

	.search-container {
		flex: 0 0 auto;
	}

	.search-input {
		width: 200px;
	}

	.win-panel-content {
		flex: 1;
		overflow-y: auto;
		position: relative;
	}

	.win-objects-view {
		padding: 10px;
		display: flex;
		flex-wrap: wrap;
		gap: 20px;
	}

	.win-object-item {
		margin-bottom: 0; /* Remove bottom margin since we're using gap */
		background: #2d2d2d;
		border-radius: 4px;
		overflow: hidden;
		padding: 1rem;
		width: fit-content; /* Only take width needed for content */
		max-width: 100%; /* Ensure it doesn't overflow container on small screens */
		flex: 0 0 auto; /* Don't grow or shrink */
	}

	.win-object-header {
		padding: 8px 12px;
		background: #333;
		font-weight: 600;
		border-bottom: 1px solid #444;
		margin: -1rem -1rem 1rem -1rem; /* Adjust header to account for parent padding */
	}

	.win-object-content {
		padding: 10px;
		margin: 0;
		white-space: pre-wrap;
		font-family: "Consolas", monospace;
		font-size: 12px;
		color: #d4d4d4;
		background: #1e1e1e;
		overflow-x: auto;
	}

	.win-empty-state {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		color: #888;
		font-style: italic;
	}

	.win-statusbar {
		border-top: 1px solid #383838;
		background: #1f1f1f;
		padding: 10px;
	}

	.win-debug-panel {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.win-debug-controls {
		display: flex;
		gap: 20px;
	}

	.win-input-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.win-input-row {
		display: flex;
		gap: 5px;
	}

	.win-input {
		background: #333;
		border: 1px solid #555;
		color: #fff;
		padding: 5px 8px;
		border-radius: 3px;
	}

	.win-button {
		background: #0078d4;
		color: white;
		border: none;
		padding: 5px 10px;
		border-radius: 3px;
		cursor: pointer;
	}

	.win-button:hover {
		background: #106ebe;
	}

	.win-updates-panel {
		margin-top: 10px;
		border: 1px solid #383838;
		border-radius: 4px;
		overflow: hidden;
	}

	.win-updates-content {
		max-height: 200px;
		overflow-y: auto;
		background: #1e1e1e;
	}

	.win-update-item {
		padding: 8px;
		border-bottom: 1px solid #333;
	}

	.win-update-header {
		font-weight: 600;
		margin-bottom: 5px;
		color: #0078d4;
	}

	.win-update-value {
		margin: 0;
		font-family: "Consolas", monospace;
		font-size: 12px;
		white-space: pre-wrap;
	}

	.object-details {
		border-top: 1px solid #444;
		margin: 1rem -1rem -1rem -1rem; /* Adjust details to account for parent padding */
	}

	.object-details summary {
		padding: 8px;
		cursor: pointer;
		background: #333;
		user-select: none;
	}

	.object-details summary:hover {
		background: #3a3a3a;
	}
</style>
