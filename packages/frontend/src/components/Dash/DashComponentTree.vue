<template>
	<div class="component-tree">
		<div class="tree-header">
			<h3>Components</h3>
			<div class="search-box">
				<input 
					v-model="searchQuery" 
					placeholder="Search components..."
					class="search-input"
				/>
			</div>
		</div>
		
		<div class="tree-content">
			<div 
				v-for="category in filteredCategories" 
				:key="category.name"
				class="category-section"
			>
				<div 
					class="category-header"
					@click="toggleCategory(category.name)"
				>
					<i 
						class="fa"
						:class="expandedCategories.has(category.name) ? 'fa-chevron-down' : 'fa-chevron-right'"
					></i>
					<span>{{ category.name }}</span>
					<span class="component-count">({{ category.components.length }})</span>
				</div>
				
				<div 
					v-if="expandedCategories.has(category.name)"
					class="category-content"
				>
					<div
						v-for="component in category.components"
						:key="component.type"
						class="component-item"
						:draggable="true"
						@dragstart="handleDragStart($event, component.type)"
						@click="addComponentToCanvas(component.type)"
					>
						<i :class="['fa', component.icon]"></i>
						<span class="component-name">{{ component.name }}</span>
						<div class="component-description">
							{{ getComponentDescription(component) }}
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<!-- Custom component section -->
		<div class="custom-section">
			<div class="section-header">
				<h4>Custom Components</h4>
				<button 
					class="add-custom-btn"
					@click="showCustomDialog = true"
					title="Add Custom Component"
				>
					<i class="fa fa-plus"></i>
				</button>
			</div>
			
			<div class="custom-components">
				<div
					v-for="custom in customComponents"
					:key="custom.id"
					class="component-item custom"
					:draggable="true"
					@dragstart="handleDragStart($event, custom.type)"
					@click="addComponentToCanvas(custom.type)"
				>
					<i class="fa fa-puzzle-piece"></i>
					<span class="component-name">{{ custom.name }}</span>
				</div>
			</div>
		</div>
		
		<!-- Custom component dialog -->
		<div v-if="showCustomDialog" class="modal-overlay" @click="showCustomDialog = false">
			<div class="modal" @click.stop>
				<h3>Create Custom Component</h3>
				<div class="form-group">
					<label>Name:</label>
					<input v-model="customComponentName" placeholder="Component Name" />
				</div>
				<div class="form-group">
					<label>Type ID:</label>
					<input v-model="customComponentType" placeholder="custom-component-id" />
				</div>
				<div class="form-group">
					<label>Vue Template:</label>
					<textarea 
						v-model="customComponentTemplate" 
						placeholder="<div>{{ props.text }}</div>"
						rows="6"
					></textarea>
				</div>
				<div class="modal-actions">
					<button @click="createCustomComponent" :disabled="!isCustomComponentValid">Create</button>
					<button @click="showCustomDialog = false">Cancel</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue"
import { useDashStore } from "../../stores/dashStore"
import { DASH_COMPONENT_CATEGORIES } from "../Dash/types"

const dashStore = useDashStore()

// State
const searchQuery = ref("")
const expandedCategories = reactive(new Set([DASH_COMPONENT_CATEGORIES.BASIC]))
const showCustomDialog = ref(false)
const customComponentName = ref("")
const customComponentType = ref("")
const customComponentTemplate = ref("")
const customComponents = ref<any[]>([])

// Computed
const filteredCategories = computed(() => {
	const categories = new Map<string, any>()
	
	// Group components by category
	Object.values(dashStore.componentDefinitions).forEach(component => {
		if (!searchQuery.value || 
			component.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
			component.type.toLowerCase().includes(searchQuery.value.toLowerCase())) {
			
			if (!categories.has(component.category)) {
				categories.set(component.category, {
					name: component.category,
					components: []
				})
			}
			categories.get(component.category)!.components.push(component)
		}
	})
	
	return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name))
})

const isCustomComponentValid = computed(() => {
	return customComponentName.value.trim() && 
		   customComponentType.value.trim() && 
		   customComponentTemplate.value.trim()
})

// Methods
const toggleCategory = (categoryName: string) => {
	if (expandedCategories.has(categoryName)) {
		expandedCategories.delete(categoryName)
	} else {
		expandedCategories.add(categoryName)
	}
}

const handleDragStart = (e: DragEvent, componentType: string) => {
	e.dataTransfer!.setData("component-type", componentType)
	e.dataTransfer!.effectAllowed = "copy"
}

const addComponentToCanvas = (componentType: string) => {
	if (!dashStore.currentDashboard) return
	
	// Add component at center of canvas
	const format = dashStore.currentFormat
	const position = {
		x: format.width / 2 - 100,
		y: format.height / 2 - 50
	}
	
	const component = dashStore.addComponent(componentType, position)
	dashStore.selectComponent(component.id)
}

const getComponentDescription = (component: any) => {
	const inputCount = component.inputs?.length || 0
	const outputCount = component.outputs?.length || 0
	return `${inputCount} inputs, ${outputCount} outputs`
}

const createCustomComponent = () => {
	if (!isCustomComponentValid.value) return
	
	const customComponent = {
		type: customComponentType.value,
		name: customComponentName.value,
		icon: 'fa-puzzle-piece',
		category: DASH_COMPONENT_CATEGORIES.CUSTOM,
		defaultSize: { width: 200, height: 100 },
		defaultProps: {},
		inputs: [],
		outputs: [],
		vueTemplate: customComponentTemplate.value
	}
	
	// Add to component definitions
	dashStore.componentDefinitions[customComponent.type] = customComponent
	
	// Add to custom components list
	customComponents.value.push({
		id: customComponent.type,
		name: customComponent.name,
		type: customComponent.type
	})
	
	// Save to CoreDB
	dashStore.db.set(`customDashComponent:${customComponent.type}`, customComponent)
	
	// Reset form
	customComponentName.value = ""
	customComponentType.value = ""
	customComponentTemplate.value = ""
	showCustomDialog.value = false
}

// Initialize expanded categories
expandedCategories.add(DASH_COMPONENT_CATEGORIES.BASIC)
expandedCategories.add(DASH_COMPONENT_CATEGORIES.INPUT)
</script>

<style scoped>
.component-tree {
	height: 100%;
	display: flex;
	flex-direction: column;
	background-color: var(--bg-secondary);
	border-right: 1px solid var(--border-color);
}

.tree-header {
	padding: 1rem;
	border-bottom: 1px solid var(--border-color);
}

.tree-header h3 {
	margin: 0 0 0.5rem 0;
	color: var(--text-primary);
}

.search-input {
	width: 100%;
	padding: 0.5rem;
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 4px;
}

.tree-content {
	flex: 1;
	overflow-y: auto;
	padding: 0.5rem;
}

.category-section {
	margin-bottom: 0.5rem;
}

.category-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem;
	background-color: var(--bg-primary);
	border-radius: 4px;
	cursor: pointer;
	color: var(--text-primary);
	font-weight: 500;
}

.category-header:hover {
	background-color: var(--border-color);
}

.component-count {
	margin-left: auto;
	font-size: 0.8rem;
	color: var(--text-secondary);
}

.category-content {
	padding-left: 1rem;
	margin-top: 0.25rem;
}

.component-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem;
	margin-bottom: 0.25rem;
	background-color: var(--bg-primary);
	border-radius: 4px;
	cursor: pointer;
	transition: background-color 0.2s;
	color: var(--text-primary);
}

.component-item:hover {
	background-color: var(--border-color);
}

.component-item.custom {
	border-left: 3px solid #007acc;
}

.component-name {
	font-weight: 500;
}

.component-description {
	font-size: 0.8rem;
	color: var(--text-secondary);
	margin-left: auto;
}

.custom-section {
	border-top: 1px solid var(--border-color);
	padding: 1rem;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 0.5rem;
}

.section-header h4 {
	margin: 0;
	color: var(--text-primary);
}

.add-custom-btn {
	background-color: #007acc;
	border: none;
	color: white;
	padding: 0.25rem 0.5rem;
	border-radius: 4px;
	cursor: pointer;
}

.add-custom-btn:hover {
	background-color: #005a9e;
}

.custom-components {
	max-height: 200px;
	overflow-y: auto;
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
	min-width: 500px;
	max-width: 700px;
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
.form-group textarea {
	width: 100%;
	padding: 0.5rem;
	background-color: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	border-radius: 4px;
	font-family: monospace;
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
</style>
