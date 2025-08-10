<template>
	<div class="flow-node-tree">
		<div class="search-container">
			<input type="text" v-model="searchQuery" placeholder="Search nodes" class="search-input" />
		</div>

		<div class="tree-container">
			<div v-for="group in groupedNodes" :key="group.category" class="tree-category">
				<div
					class="category-header"
					:class="{ expanded: expandedCategories.includes(group.category) }"
					@click="toggleCategory(group.category)"
				>
					<span class="twisty" aria-hidden="true">
						<svg viewBox="0 0 16 16" width="16" height="16">
							<path
								fill="currentColor"
								fill-rule="evenodd"
								d="M6.2 3.2a.75.75 0 0 0-1.4.4v8.8a.75.75 0 0 0 1.3.5l6.2-4.4a.75.75 0 0 0 0-1.2z"
							/>
						</svg>
					</span>
					<span class="category-label">{{ group.category }}</span>
				</div>

				<transition name="collapse">
					<div v-show="expandedCategories.includes(group.category)" class="category-nodes">
						<TreeNode
							v-for="node in group.nodes"
							:key="node.typeUID"
							:node="node"
							:selected="selectedNodeUID === node.typeUID"
							@dragstart="handleDragStart($event, node.typeUID)"
							@click="onNodeClick(node)"
						/>
					</div>
				</transition>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { ref, computed, watch } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import TreeNode from "../../components/Flow/TreeNode.vue"

	const emit = defineEmits(["node-selected"])
	const flowStore = useFlowStore()
	const searchQuery = ref("")
	const expandedCategories = ref<string[]>([])
	const selectedNodeUID = ref<string | null>(null)

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

	interface GroupedNodesEntry {
		category: string
		nodes: typeof filteredNodes.value
	}

	const groupedNodes = computed<GroupedNodesEntry[]>(() => {
		const groups: Record<string, typeof filteredNodes.value> = {}
		for (const node of filteredNodes.value) {
			const category = node.category || "Uncategorized"
			;(groups[category] ||= []).push(node)
		}
		return Object.entries(groups)
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([category, nodes]) => ({
				category,
				nodes: [...nodes].sort((a, b) => a.typeName.localeCompare(b.typeName))
			}))
	})

	// Auto-expand newly appearing categories (initial load behaves like VS Code remembering state)
	watch(
		groupedNodes,
		(groups) => {
			const existing = new Set(expandedCategories.value)
			for (const g of groups) {
				if (!existing.has(g.category)) existing.add(g.category)
			}
			expandedCategories.value = [...existing].sort()
		},
		{ immediate: true }
	)

	const toggleCategory = (category: string) => {
		if (expandedCategories.value.includes(category)) {
			expandedCategories.value = expandedCategories.value.filter((cat) => cat !== category)
		} else {
			expandedCategories.value = [...expandedCategories.value, category]
		}
	}

	const onNodeClick = (node: any) => {
		selectedNodeUID.value = node.typeUID
		emit("node-selected", node)
	}

	const handleDragStart = (event: DragEvent, nodeType: string) => {
		event.dataTransfer?.setData("node-type", nodeType)
	}
</script>

<style scoped>
	.flow-node-tree {
		width: 100%;
		height: 100%;
		background-color: #252526; /* VS Code side bar */
		color: #d4d4d4;
		font-family: var(--vscode-font-family, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif);
		border-right: 1px solid #333;
		display: flex;
		flex-direction: column;
	}

	.search-container {
		padding: 6px 8px;
		border-bottom: 1px solid #333;
	}

	.search-input {
		width: 100%;
		padding: 4px 6px;
		font-size: 13px;
		background: #3c3c3c;
		border: 1px solid #3c3c3c;
		color: #f0f0f0;
		border-radius: 2px;
		outline: none;
	}
	.search-input:focus {
		border-color: #007acc;
	}
	.search-input::placeholder {
		color: #c5c5c5;
		font-size: 12px;
	}

	.tree-container {
		flex: 1;
		overflow-y: auto;
		font-size: 13px;
		line-height: 1.3;
		padding-bottom: 8px;
	}

	.tree-category + .tree-category {
		margin-top: 4px;
	}

	.category-header {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px 2px 4px;
		cursor: pointer;
		user-select: none;
		color: #ccc;
		font-weight: 600;
		letter-spacing: 0.2px;
		text-transform: none;
		position: relative;
	}
	.category-header:hover {
		background: #2a2d2e;
		color: #fff;
	}

	.twisty {
		width: 16px;
		height: 16px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s ease-in-out;
		color: #c5c5c5;
	}
	.category-header.expanded .twisty {
		transform: rotate(90deg);
	}

	.category-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.category-nodes {
		margin-left: 16px; /* indent nodes under category */
	}

	/* Collapse animation */
	.collapse-enter-active,
	.collapse-leave-active {
		transition: all 0.12s ease-out;
		overflow: hidden;
	}
	.collapse-enter-from,
	.collapse-leave-to {
		height: 0;
		opacity: 0;
	}

	/* Scrollbar styling (Chromium/WebKit) */
	.tree-container::-webkit-scrollbar {
		width: 10px;
	}
	.tree-container::-webkit-scrollbar-track {
		background: transparent;
	}
	.tree-container::-webkit-scrollbar-thumb {
		background: #3a3d41;
		border: 2px solid #252526;
		border-radius: 5px;
	}
	.tree-container::-webkit-scrollbar-thumb:hover {
		background: #4d5156;
	}

	/* Selection color provided for reuse by child nodes */
	:root :where(.flow-node-tree) {
		--tree-hover-bg: #2a2d2e;
		--tree-active-bg: #094771;
		--tree-active-border: #007acc;
	}
</style>
