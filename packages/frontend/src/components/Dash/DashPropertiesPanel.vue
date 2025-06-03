<template>
	<div class="properties-panel">
		<div class="panel-header">
			<h3>Properties</h3>
			<button 
				class="close-btn"
				@click="dashStore.showProperties = false"
				title="Close Properties Panel"
			>
				<i class="fa fa-times"></i>
			</button>
		</div>
		
		<div class="panel-content">
			<div v-if="!selectedComponent" class="no-selection">
				<i class="fa fa-mouse-pointer"></i>
				<p>Select a component to edit its properties</p>
			</div>
			
			<div v-else class="component-properties">
				<!-- Component Info -->
				<div class="property-section">
					<h4>Component Info</h4>
					<div class="property-row">
						<label>Type:</label>
						<span>{{ selectedComponent.type }}</span>
					</div>
					<div class="property-row">
						<label>ID:</label>
						<span class="component-id">{{ selectedComponent.id }}</span>
					</div>
				</div>
				
				<!-- Position & Size -->
				<div class="property-section">
					<h4>Position & Size</h4>
					<div class="property-grid">
						<div class="property-row">
							<label>X:</label>
							<input 
								type="number" 
								:value="selectedComponent.position.x"
								@input="updatePosition('x', $event)"
							/>
						</div>
						<div class="property-row">
							<label>Y:</label>
							<input 
								type="number" 
								:value="selectedComponent.position.y"
								@input="updatePosition('y', $event)"
							/>
						</div>
						<div class="property-row">
							<label>Width:</label>
							<input 
								type="number" 
								:value="selectedComponent.size.width"
								@input="updateSize('width', $event)"
							/>
						</div>
						<div class="property-row">
							<label>Height:</label>
							<input 
								type="number" 
								:value="selectedComponent.size.height"
								@input="updateSize('height', $event)"
							/>
						</div>
					</div>
				</div>
				
				<!-- Component Props -->
				<div class="property-section">
					<h4>Properties</h4>
					<div 
						v-for="(value, key) in selectedComponent.props" 
						:key="key"
						class="property-row"
					>
						<label>{{ key }}:</label>
						<component
							:is="getInputComponent(key, value)"
							:value="value"
							@input="updateProp(key, $event)"
						/>
					</div>
					
					<!-- Add new property -->
					<div class="add-property">
						<button @click="showAddProperty = !showAddProperty">
							<i class="fa fa-plus"></i>
							Add Property
						</button>
						
						<div v-if="showAddProperty" class="add-property-form">
							<input 
								v-model="newPropertyName" 
								placeholder="Property name"
								@keyup.enter="addProperty"
							/>
							<input 
								v-model="newPropertyValue" 
								placeholder="Property value"
								@keyup.enter="addProperty"
							/>
							<button @click="addProperty">Add</button>
						</div>
					</div>
				</div>
				
				<!-- Vue Code Editor -->
				<div class="property-section">
					<h4>Vue Code</h4>
					<div class="code-editor-container">
						<DashCodeEditor
							:value="selectedComponent.vueCode || getDefaultVueCode()"
							@update="updateVueCode"
							language="vue"
						/>
					</div>
				</div>
				
				<!-- Inputs/Outputs -->
				<div class="property-section">
					<h4>Data Connections</h4>
					
					<div class="io-section">
						<h5>Inputs</h5>
						<div 
							v-for="(value, key) in selectedComponent.inputs" 
							:key="'input-' + key"
							class="io-row"
						>
							<span class="io-name">{{ key }}:</span>
							<input 
								:value="value"
								@input="updateInput(key, $event)"
								placeholder="CoreDB key or value"
							/>
						</div>
					</div>
					
					<div class="io-section">
						<h5>Outputs</h5>
						<div 
							v-for="(value, key) in selectedComponent.outputs" 
							:key="'output-' + key"
							class="io-row"
						>
							<span class="io-name">{{ key }}:</span>
							<span class="io-value">{{ value }}</span>
						</div>
					</div>
				</div>
				
				<!-- Actions -->
				<div class="property-section">
					<h4>Actions</h4>
					<div class="action-buttons">
						<button @click="duplicateComponent">
							<i class="fa fa-copy"></i>
							Duplicate
						</button>
						<button @click="deleteComponent" class="danger">
							<i class="fa fa-trash"></i>
							Delete
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useDashStore } from "../../stores/dashStore"
import DashCodeEditor from "./DashCodeEditor.vue"

const dashStore = useDashStore()

// State
const showAddProperty = ref(false)
const newPropertyName = ref("")
const newPropertyValue = ref("")

// Computed
const selectedComponent = computed(() => dashStore.selectedComponent)

// Methods
const updatePosition = (axis: 'x' | 'y', event: Event) => {
	const value = parseInt((event.target as HTMLInputElement).value)
	if (!isNaN(value) && selectedComponent.value) {
		const newPosition = { ...selectedComponent.value.position }
		newPosition[axis] = value
		dashStore.updateComponent(selectedComponent.value.id, { 
			position: dashStore.snapToGrid(newPosition) 
		})
	}
}

const updateSize = (dimension: 'width' | 'height', event: Event) => {
	const value = parseInt((event.target as HTMLInputElement).value)
	if (!isNaN(value) && selectedComponent.value) {
		const newSize = { ...selectedComponent.value.size }
		newSize[dimension] = Math.max(30, value) // Minimum size
		dashStore.updateComponent(selectedComponent.value.id, { 
			size: dashStore.snapSizeToGrid(newSize) 
		})
	}
}

const updateProp = (key: string, event: Event) => {
	if (!selectedComponent.value) return
	
	const value = (event.target as HTMLInputElement).value
	const newProps = { ...selectedComponent.value.props }
	
	// Try to parse as JSON for complex values
	try {
		newProps[key] = JSON.parse(value)
	} catch {
		newProps[key] = value
	}
	
	dashStore.updateComponent(selectedComponent.value.id, { props: newProps })
}

const addProperty = () => {
	if (!selectedComponent.value || !newPropertyName.value) return
	
	const newProps = { ...selectedComponent.value.props }
	
	// Try to parse as JSON for complex values
	try {
		newProps[newPropertyName.value] = JSON.parse(newPropertyValue.value)
	} catch {
		newProps[newPropertyName.value] = newPropertyValue.value
	}
	
	dashStore.updateComponent(selectedComponent.value.id, { props: newProps })
	
	// Reset form
	newPropertyName.value = ""
	newPropertyValue.value = ""
	showAddProperty.value = false
}

const updateVueCode = (code: string) => {
	if (!selectedComponent.value) return
	dashStore.updateComponent(selectedComponent.value.id, { vueCode: code })
}

const updateInput = (key: string, event: Event) => {
	if (!selectedComponent.value) return
	
	const value = (event.target as HTMLInputElement).value
	const newInputs = { ...selectedComponent.value.inputs }
	newInputs[key] = value
	
	dashStore.updateComponent(selectedComponent.value.id, { inputs: newInputs })
	
	// Set up CoreDB listener for this input
	if (value.startsWith('coredb:')) {
		const coredbKey = value.replace('coredb:', '')
		dashStore.db.onPatch(coredbKey, (newValue) => {
			// Update component input value
			const component = dashStore.selectedComponent
			if (component && component.inputs[key] === value) {
				const updatedInputs = { ...component.inputs }
				updatedInputs[key] = newValue
				dashStore.updateComponent(component.id, { inputs: updatedInputs })
			}
		})
	}
}

const getInputComponent = (key: string, value: any) => {
	// Return appropriate input component based on value type
	if (typeof value === 'boolean') {
		return 'input' // Could be enhanced with checkbox component
	}
	if (typeof value === 'number') {
		return 'input'
	}
	return 'input'
}

const getDefaultVueCode = () => {
	if (!selectedComponent.value) return ''
	
	const definition = dashStore.componentDefinitions[selectedComponent.value.type]
	return definition?.vueTemplate || '<div>{{ props.text || "Component" }}</div>'
}

const duplicateComponent = () => {
	if (!selectedComponent.value) return
	
	const original = selectedComponent.value
	const newPosition = {
		x: original.position.x + 20,
		y: original.position.y + 20
	}
	
	const newComponent = dashStore.addComponent(original.type, newPosition)
	
	// Copy properties
	dashStore.updateComponent(newComponent.id, {
		size: { ...original.size },
		props: { ...original.props },
		vueCode: original.vueCode
	})
	
	dashStore.selectComponent(newComponent.id)
}

const deleteComponent = () => {
	if (!selectedComponent.value) return
	
	if (confirm('Are you sure you want to delete this component?')) {
		dashStore.deleteComponent(selectedComponent.value.id)
	}
}
</script>

<style scoped>
.properties-panel {
	height: 100%;
	display: flex;
	flex-direction: column;
	background-color: var(--bg-secondary);
	border-left: 1px solid var(--border-color);
}

.panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1rem;
	border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
	margin: 0;
	color: var(--text-primary);
}

.close-btn {
	background: none;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: 0.25rem;
}

.close-btn:hover {
	color: var(--text-primary);
}

.panel-content {
	flex: 1;
	overflow-y: auto;
	padding: 1rem;
}

.no-selection {
	text-align: center;
	color: var(--text-secondary);
	padding: 2rem;
}

.no-selection i {
	font-size: 2rem;
	margin-bottom: 1rem;
	display: block;
}

.property-section {
	margin-bottom: 1.5rem;
	padding-bottom: 1rem;
	border-bottom: 1px solid var(--border-color);
}

.property-section:last-child {
	border-bottom: none;
}

.property-section h4 {
	margin: 0 0 0.75rem 0;
	color: var(--text-primary);
	font-size: 0.9rem;
	font-weight: 600;
}

.property-section h5 {
	margin: 0 0 0.5rem 0;
	color: var(--text-secondary);
	font-size: 0.8rem;
	font-weight: 500;
}

.property-row {
	display: flex;
	align-items: center;
	margin-bottom: 0.5rem;
}

.property-row label {
	min-width: 60px;
	color: var(--text-secondary);
	font-size: 0.8rem;
}

.property-row input {
	flex: 1;
	padding: 0.25rem 0.5rem;
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 3px;
	font-size: 0.8rem;
}

.property-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 0.5rem;
}

.component-id {
	font-family: monospace;
	font-size: 0.7rem;
	color: var(--text-secondary);
}

.add-property button {
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	padding: 0.25rem 0.5rem;
	border-radius: 3px;
	cursor: pointer;
	font-size: 0.8rem;
}

.add-property-form {
	margin-top: 0.5rem;
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.add-property-form input {
	padding: 0.25rem 0.5rem;
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 3px;
	font-size: 0.8rem;
}

.code-editor-container {
	height: 200px;
	border: 1px solid var(--border-color);
	border-radius: 4px;
	overflow: hidden;
}

.io-section {
	margin-bottom: 1rem;
}

.io-row {
	display: flex;
	align-items: center;
	margin-bottom: 0.25rem;
	font-size: 0.8rem;
}

.io-name {
	min-width: 80px;
	color: var(--text-secondary);
}

.io-value {
	color: var(--text-primary);
	font-family: monospace;
}

.action-buttons {
	display: flex;
	gap: 0.5rem;
}

.action-buttons button {
	flex: 1;
	padding: 0.5rem;
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 4px;
	cursor: pointer;
	font-size: 0.8rem;
}

.action-buttons button:hover {
	background-color: var(--border-color);
}

.action-buttons button.danger {
	background-color: #dc3545;
	border-color: #dc3545;
	color: white;
}

.action-buttons button.danger:hover {
	background-color: #c82333;
}
</style>
