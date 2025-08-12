<template>
	<div class="flows-tree">
		<div class="flows-tree-header">
			<h3>Flows</h3>
			<div class="flows-tree-actions">
				<button @click="createFlowAtCurrent" title="New Flow"><i class="fa fa-file"></i></button>
				<button @click="createFolderAtCurrent" title="New Folder"><i class="fa fa-folder"></i></button>
			</div>
		</div>
		<div class="search-container">
			<input class="search-input" type="text" v-model="searchQuery" placeholder="Search flows..." />
		</div>
		<div class="flows-tree-content">
			<div class="tree-section">
				<template v-if="treeRoot.folder.length">
					<FlowsTreeItem
						v-for="child in treeRoot.folder"
						:key="child.type === 'folder' ? 'f:' + child.folderName : 'fl:' + child.flowId"
						:item="child"
						:selected-flow-id="flowStore.selectedFlowId"
						:base-path="[]"
						@select="handleSelect"
						@delete="handleDeleteFromPath"
						@create-folder="handleCreateFolderFromPath"
						@create-flow="handleCreateFlowFromPath"
					/>
				</template>
				<div v-else class="empty-state">No flows yet</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from "vue"
	import { useFlowStore } from "../../stores/flowStore"
	import FlowsTreeItem from "./FlowsTreeItem.vue"
	import type { IFlowTreeFolder, IFlowTreeModel } from "./types"

	const emit = defineEmits(["flow-selected"])
	const flowStore = useFlowStore()
	const searchQuery = ref("")

	const treeRoot = computed<IFlowTreeFolder>(() => {
		const root: IFlowTreeFolder = { type: "folder", folderName: "flows", folder: [] }
		const q = searchQuery.value.trim().toLowerCase()
		const insert = (segments: string[], fullPath: string) => {
			let cur = root
			for (let i = 0; i < Math.max(0, segments.length - 1); i++) {
				const seg = segments[i]
				let nextFolder: IFlowTreeFolder | undefined = cur.folder.find(
					(c): c is IFlowTreeFolder => c.type === "folder" && c.folderName === seg
				)
				if (!nextFolder) {
					const created: IFlowTreeFolder = { type: "folder", folderName: seg, folder: [] }
					;(cur.folder as any).push(created)
					nextFolder = created
				}
				cur = nextFolder as IFlowTreeFolder
			}
			// Store the full path in flowId; FlowsTreeItem shows the last segment already
			const fileNode: IFlowTreeModel = { type: "flow", flowId: fullPath, flow: [] }
			;(cur.folder as any).push(fileNode)
		}
		for (const [id, f] of Object.entries(flowStore.flows)) {
			if (f.isFolder) continue
			const p = (f.path || id).replace(/^\/+|\/+$/g, "")
			const segs = p.split("/").filter(Boolean)
			if (!segs.length) continue
			if (q && !p.toLowerCase().includes(q)) continue
			insert(segs, p)
		}
		const sort = (folder: IFlowTreeFolder) => {
			folder.folder.sort((a, b) => {
				if (a.type !== b.type) return a.type === "folder" ? -1 : 1
				const an = a.type === "folder" ? a.folderName : a.flowId.split("/").pop() || a.flowId
				const bn = b.type === "folder" ? b.folderName : b.flowId.split("/").pop() || b.flowId
				return an.localeCompare(bn)
			})
			folder.folder.forEach((c) => c.type === "folder" && sort(c))
		}
		sort(root)
		return root
	})

	const handleSelect = (flowKey: string) => {
		// Prefer direct key
		if (flowStore.flows[flowKey]) {
			flowStore.setSelectedFlow(flowKey)
			emit("flow-selected", flowKey)
			return
		}
		// Otherwise resolve by path
		const entry = Object.entries(flowStore.flows).find(([, f]) => (f.path || "") === flowKey)
		const resolvedKey = entry ? entry[0] : flowKey
		flowStore.setSelectedFlow(resolvedKey)
		emit("flow-selected", resolvedKey)
	}

	const createFlowAtCurrent = () => {
		const name = prompt("New flow path (e.g. foo/bar/MyFlow):")
		if (!name) return
		flowStore.addFlow(name)
	}
	const createFolderAtCurrent = () => {
		const name = prompt("New folder path (e.g. foo/bar):")
		if (!name) return
		const parts = name.split("/").filter(Boolean)
		const folderName = parts.pop() || ""
		if (!folderName) return
		flowStore.addFolder(parts, folderName)
	}

	const handleCreateFolderFromPath = (pathSegments: string[]) => {
		const name = prompt(`Folder name in ${pathSegments.join("/") || "/"}:`)
		if (!name) return
		flowStore.addFolder(pathSegments, name)
	}
	const handleCreateFlowFromPath = (pathSegments: string[]) => {
		const name = prompt(`Flow name in ${pathSegments.join("/") || "/"}:`)
		if (!name) return
		const full = [...pathSegments, name].filter(Boolean).join("/")
		flowStore.addFlow(full)
	}
	const handleDeleteFromPath = (pathSegments: string[]) => {
		const prefix = pathSegments.join("/")
		for (const [id, f] of Object.entries(flowStore.flows)) {
			const p = f.path || id
			if (p === prefix || p.startsWith(prefix + "/")) flowStore.deleteFlow(id)
		}
	}
</script>

<style scoped>
	.flows-tree {
		width: 260px;
		height: 100%;
		background: #252526;
		border-right: 1px solid #1e1e1e;
		display: flex;
		flex-direction: column;
	}
	.flows-tree-header {
		border-bottom: 1px solid #333;
		background: #2d2d2d;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 10px;
	}
	.flows-tree-actions {
		display: flex;
		gap: 6px;
	}
	.flows-tree-actions button {
		padding: 4px 8px;
		background: #3c3c3c;
		border: 1px solid #1e1e1e;
		color: #e0e0e0;
		border-radius: 4px;
		cursor: pointer;
	}
	.flows-tree-actions button:hover {
		background: #444;
	}
	.search-container {
		padding: 8px;
	}
	.search-input {
		width: 100%;
		padding: 6px 8px;
		background: #3c3c3c;
		border: 1px solid #1e1e1e;
		color: #e0e0e0;
		border-radius: 4px;
	}
	.flows-tree-content {
		flex: 1;
		overflow-y: auto;
		padding: 6px;
	}

	.folder {
		margin: 2px 0;
	}
	.folder-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 6px;
		color: #e0e0e0;
	}
	.folder-row .name {
		flex: 1;
	}
	.children {
		margin-left: 12px;
	}

	.file-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 6px;
		border-radius: 4px;
		color: #e0e0e0;
		cursor: pointer;
	}
	.file-row:hover {
		background: #2d2d2d;
	}
	.file-row.selected {
		background: #094771;
		color: #ffffff;
	}
	.file-row .name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.row-actions {
		display: none;
		gap: 6px;
	}
	.folder-row:hover .row-actions,
	.file-row:hover .row-actions {
		display: flex;
	}
	.row-actions button {
		background: transparent;
		border: none;
		color: #bbb;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: 3px;
	}
	.row-actions button:hover {
		color: #fff;
		background: rgba(255, 255, 255, 0.06);
	}

	.tree-section {
		margin-top: 4px;
	}
	.empty-state {
		color: #888;
		font-size: 12px;
		padding: 8px;
	}
</style>
