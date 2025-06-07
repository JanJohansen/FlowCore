<template>
	<div class="component-list">
		<div class="list-header">
			<h3>Saved Components</h3>
			<div class="search-box">
				<input 
					v-model="searchQuery" 
					placeholder="Search components..."
					class="search-input"
				/>
			</div>
		</div>
		
		<div class="list-content">
			<div v-if="filteredComponents.length === 0" class="empty-state">
				<p v-if="Object.keys(components).length === 0">
					No components saved yet.
				</p>
				<p v-else>
					No components match your search.
				</p>
			</div>
			
			<div 
				v-for="componentName in filteredComponents" 
				:key="componentName"
				class="component-item"
				:class="{ active: componentName === selectedComponent }"
				@click="selectComponent(componentName)"
			>
				<div class="component-info">
					<div class="component-name">{{ componentName }}</div>
					<div class="component-meta">
						<span class="component-size">
							{{ getComponentSize(componentName) }} chars
						</span>
						<span class="component-date">
							{{ getComponentDate(componentName) }}
						</span>
					</div>
				</div>
				<div class="component-actions">
					<button 
						class="action-btn duplicate-btn"
						@click.stop="duplicateComponent(componentName)"
						title="Duplicate component"
					>
						<i class="fa fa-copy"></i>
					</button>
					<button 
						class="action-btn delete-btn"
						@click.stop="deleteComponent(componentName)"
						title="Delete component"
					>
						<i class="fa fa-trash"></i>
					</button>
				</div>
			</div>
		</div>
		
		<div class="list-footer">
			<div class="component-count">
				{{ Object.keys(components).length }} component{{ Object.keys(components).length !== 1 ? 's' : '' }}
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Props {
	components: Record<string, string>
	selectedComponent?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
	(e: 'component-selected', componentName: string): void
	(e: 'component-deleted', componentName: string): void
	(e: 'component-duplicated', originalName: string, newName: string): void
}>()

const searchQuery = ref('')

const filteredComponents = computed(() => {
	const query = searchQuery.value.toLowerCase().trim()
	if (!query) {
		return Object.keys(props.components).sort()
	}
	
	return Object.keys(props.components)
		.filter(name => name.toLowerCase().includes(query))
		.sort()
})

const selectComponent = (componentName: string) => {
	emit('component-selected', componentName)
}

const deleteComponent = (componentName: string) => {
	emit('component-deleted', componentName)
}

const duplicateComponent = (componentName: string) => {
	const newName = prompt(`Enter name for duplicated component:`, `${componentName}_copy`)
	if (newName && newName.trim() && newName !== componentName) {
		emit('component-duplicated', componentName, newName.trim())
	}
}

const getComponentSize = (componentName: string): string => {
	const content = props.components[componentName] || ''
	return content.length.toLocaleString()
}

const getComponentDate = (componentName: string): string => {
	// Since we don't store dates, we'll show a placeholder
	// In a real implementation, you'd store metadata with timestamps
	return 'Recently saved'
}
</script>

<style scoped>
.component-list {
	display: flex;
	flex-direction: column;
	height: 100%;
	background: var(--bg-secondary);
}

.list-header {
	padding: 1rem;
	border-bottom: 1px solid var(--border-color);
}

.list-header h3 {
	margin: 0 0 0.75rem 0;
	font-size: 1rem;
	color: var(--text-primary);
}

.search-box {
	position: relative;
}

.search-input {
	width: 100%;
	background: var(--bg-primary);
	border: 1px solid var(--border-color);
	color: var(--text-primary);
	padding: 0.5rem;
	border-radius: 4px;
	font-size: 0.875rem;
}

.search-input::placeholder {
	color: var(--text-tertiary);
}

.list-content {
	flex: 1;
	overflow-y: auto;
	padding: 0.5rem;
}

.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100px;
	color: var(--text-secondary);
	font-style: italic;
	text-align: center;
}

.component-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.75rem;
	margin-bottom: 0.25rem;
	background: var(--bg-primary);
	border: 1px solid var(--border-color);
	border-radius: 4px;
	cursor: pointer;
	transition: all 0.2s;
}

.component-item:hover {
	background: var(--bg-secondary);
	border-color: var(--text-tertiary);
}

.component-item.active {
	background: var(--info-color);
	border-color: var(--info-color);
	color: white;
}

.component-info {
	flex: 1;
	min-width: 0;
}

.component-name {
	font-weight: 500;
	font-size: 0.875rem;
	margin-bottom: 0.25rem;
	word-break: break-word;
}

.component-meta {
	display: flex;
	flex-direction: column;
	gap: 0.125rem;
	font-size: 0.75rem;
	opacity: 0.8;
}

.component-item.active .component-meta {
	opacity: 0.9;
}

.component-actions {
	display: flex;
	gap: 0.25rem;
	opacity: 0;
	transition: opacity 0.2s;
}

.component-item:hover .component-actions {
	opacity: 1;
}

.action-btn {
	background: transparent;
	border: 1px solid currentColor;
	color: inherit;
	padding: 0.25rem;
	border-radius: 3px;
	cursor: pointer;
	font-size: 0.75rem;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;
}

.action-btn:hover {
	background: currentColor;
	color: var(--bg-primary);
}

.duplicate-btn {
	color: var(--info-color);
}

.delete-btn {
	color: var(--error-color);
}

.component-item.active .action-btn {
	color: white;
	border-color: rgba(255, 255, 255, 0.5);
}

.component-item.active .action-btn:hover {
	background: rgba(255, 255, 255, 0.2);
	color: white;
}

.list-footer {
	padding: 0.75rem 1rem;
	border-top: 1px solid var(--border-color);
	background: var(--bg-primary);
}

.component-count {
	font-size: 0.75rem;
	color: var(--text-secondary);
	text-align: center;
}

/* Scrollbar styling */
.list-content::-webkit-scrollbar {
	width: 6px;
}

.list-content::-webkit-scrollbar-track {
	background: var(--bg-primary);
}

.list-content::-webkit-scrollbar-thumb {
	background: var(--border-color);
	border-radius: 3px;
}

.list-content::-webkit-scrollbar-thumb:hover {
	background: var(--text-tertiary);
}
</style>
