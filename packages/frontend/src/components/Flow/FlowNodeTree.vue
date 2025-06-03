<template>
	<div class="flow-node-tree">
		<div class="search-container">
			<input type="text" v-model="searchQuery" placeholder="Search nodes..." class="search-input" />
		</div>

		<div class="tree-container">
			<div v-for="(nodes, category) in groupedNodes" :key="category" class="tree-category">
				<div class="category-header" @click="toggleCategory(category)">
					<span>{{ category }}</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon"
					>
						<polyline points="6 9 12 15 18 9" />
					</svg>
				</div>

				<transition name="fade">
					<div v-show="expandedCategories.includes(category)" class="category-nodes">
						<TreeNode
							v-for="node in nodes"
							:key="node.typeUID"
							:node="node"
							@dragstart="handleDragStart($event, node.typeUID)"
							@click="$emit('node-selected', node)"
						/>
					</div>
				</transition>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import TreeNode from "../../components/Flow/TreeNode.vue"

	const emit = defineEmits(["node-selected"])
	const flowStore = useFlowStore()
	const searchQuery = ref("")
	const expandedCategories = ref<string[]>([])

	const filteredNodes = computed(() => {
		if (!searchQuery.value) {
			return flowStore.availableNodes
		}

		const query = searchQuery.value.toLowerCase()
		return flowStore.availableNodes.filter(
			(node) =>
				node.typeName.toLowerCase().includes(query) ||
				node.description?.toLowerCase().includes(query) ||
				node.category.toLowerCase().includes(query)
		)
	})

	const groupedNodes = computed(() => {
		return filteredNodes.value.reduce((acc, node) => {
			const category = node.category || "Uncategorized"
			if (!acc[category]) {
				acc[category] = []
			}
			acc[category].push(node)
			return acc
		}, {} as Record<string, typeof filteredNodes.value>)
	})

	const toggleCategory = (category: string) => {
		if (expandedCategories.value.includes(category)) {
			expandedCategories.value = expandedCategories.value.filter((cat) => cat !== category)
		} else {
			expandedCategories.value = [...expandedCategories.value, category]
		}
	}

	const handleDragStart = (event: DragEvent, nodeType: string) => {
		event.dataTransfer?.setData("node-type", nodeType)
	}
</script>

<style scoped>
	.flow-node-tree {
		width: 100%;
		height: 100%;
		background-color: #1e1e1e;
		color: #ffffff;
		font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
		border-right: 1px solid #3c3c3c;
	}

	.search-container {
		padding: 8px 12px;
		background-color: #252526;
		border-bottom: 1px solid #3c3c3c;
	}

	.search-input {
		width: 100%;
		padding: 4px 8px;
		border-radius: 4px;
		background-color: #3c3c3c;
		color: #ffffff;
		border: none;
	}

	.tree-container {
		height: calc(100% - 42px);
		overflow-y: auto;
	}

	.tree-category {
		margin-bottom: 8px;
	}

	.category-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background-color: #2d2d2d;
		cursor: pointer;
		user-select: none;
	}

	.category-header .icon {
		transition: transform 0.2s;
	}

	.category-header.expanded .icon {
		transform: rotate(180deg);
	}

	.category-nodes {
		max-height: 500px; /* Set a reasonable max height for expanded nodes */
		overflow-y: auto;
	}

	.fade-enter-active,
	.fade-leave-active {
		transition: opacity 0.3s;
	}
	.fade-enter,
	.fade-leave-to {
		opacity: 0;
	}

	/* Custom scrollbar */
	::-webkit-scrollbar {
		width: 6px;
	}

	::-webkit-scrollbar-track {
		background-color: #1e1e1e;
	}

	::-webkit-scrollbar-thumb {
		background-color: #3c3c3c;
		border-radius: 4px;
	}

	::-webkit-scrollbar-thumb:hover {
		background-color: #555555;
	}
</style>
