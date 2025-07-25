import { defineStore } from 'pinia'
import { ref, reactive, markRaw, watchEffect } from 'vue'
import {
    NODE_WIDTH
} from '../components/Flow/constants'
import type {
    IFlowModel,
    IFlowNodeModel,
    IFlowConnection,
    INodeDefinition,
    INodeDefinitions,
    ConnectionPoint
} from '../components/Flow/types'
import { useCoreDBStore } from '../services/CoreDB/CoreDBStore'

// Utility functions
function createID(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export const useFlowStore = defineStore('flowStore', () => {
    // ===== Flow State =====
    let flowState = reactive<IFlowModel>({
        nodes: [],
        connections: [],
        zoom: 1,
        pan: { x: 0, y: 0 },
        id: createID(),
        path: '',
        notes: ''
    })

    // ===== Node Registry =====
    const availableNodes = ref<INodeDefinition[]>([])
    const nodeComponents = reactive<Record<string, any>>({})
    const nodeDefinitions = reactive<INodeDefinitions>({})

    const selectedFlowId = ref<string | null>(null)

    // ===== Connection State =====
    const connectionState = reactive({
        dragging: false,
        startPoint: null as ConnectionPoint | null,
        endPoint: { x: 0, y: 0 }
    })

    // ===== Node Port Positions =====
    const nodePortPositions = ref(
        new Map<
            string,
            {
                inputs: Array<{ index: number; x: number; y: number }>
                outputs: Array<{ index: number; x: number; y: number }>
            }
        >()
    )

    // ===== Flow State Methods =====
    const saveFlow = () => {
        // localStorage.setItem(LOCAL_STORAGE_KEYS.FLOW_STATE, JSON.stringify(flowState))
        // const patch: any = { persist: true, type: "RootFlow" }
        flowState.persist = true
        flowState.type = "RootFlow"
        console.log("Saving flow:", flowState)
        // patch[flowState.id] = flowState
        db.set(flowState.id, flowState)
    }

    const loadFlow = () => {
        // const savedFlow = localStorage.getItem(LOCAL_STORAGE_KEYS.FLOW_STATE)
        // if (savedFlow) {
        //     const parsedFlow = JSON.parse(savedFlow)
        //     Object.assign(flowState, parsedFlow)
        // }
    }

    const clearFlow = () => {
        if (confirm('Are you sure you want to clear the current flow?')) {
            flowState.nodes = []
            flowState.connections = []
        }
    }

    const createNode = async (typeUID: string, position: { x: number, y: number }): Promise<IFlowNodeModel> => {
        // Load the component for this node type if not already loaded
        if (!nodeComponents[typeUID]) {
            const component = await getNodeComponent(typeUID)
            if (component) {
                nodeComponents[typeUID] = component
            }
        }


        const newNode: IFlowNodeModel = {
            id: `${typeUID}_${Date.now()}`,
            typeUID,
            position,
            size: {
                width: NODE_WIDTH,
                height: NODE_WIDTH
            },
            config: {
                ins: {},
                outs: {}
            }
        }

        flowState.nodes.push(newNode)

        return newNode
    }

    const deleteNode = (nodeId: string) => {
        // Remove connections associated with this node
        flowState.connections = flowState.connections.filter(
            conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
        )

        // Remove the node
        const nodeIndex = flowState.nodes.findIndex(node => node.id === nodeId)
        if (nodeIndex !== -1) {
            flowState.nodes.splice(nodeIndex, 1)
        }
    }

    const duplicateNode = async (nodeId: string) => {
        // Find the node to duplicate
        const originalNode = flowState.nodes.find(n => n.id === nodeId)
        if (!originalNode) {
            console.warn(`Node ${nodeId} not found for duplication`)
            return
        }

        // Create a new position offset from the original
        const newPosition = {
            x: originalNode.position.x + 50,
            y: originalNode.position.y + 50
        }

        // Create a new node with the same typeUID
        const newNode = await createNode(originalNode.typeUID, newPosition)

        // Copy the configuration from the original node
        if (originalNode.config) {
            newNode.config = JSON.parse(JSON.stringify(originalNode.config))
        }

        console.log(`Duplicated node ${nodeId} as ${newNode.id}`)
        return newNode
    }

    const updateNodePosition = (nodeId: string, position: { x: number, y: number }) => {
        const node = flowState.nodes.find(n => n.id === nodeId)
        if (node) {
            node.position = position
        }
    }

    // ===== Connection Methods =====
    const startConnection = (point: ConnectionPoint) => {
        connectionState.dragging = true
        connectionState.startPoint = point

        // Initialize endPoint with the same position as startPoint
        // The actual pointer position will be updated by handleConnectionDrag
        connectionState.endPoint = {
            x: point.x,
            y: point.y
        }
    }

    const updateDraggingConnection = (point: { x: number, y: number }) => {
        connectionState.endPoint = point
    }

    const endConnection = (point: ConnectionPoint) => {
        if (!connectionState.startPoint) return

        // Ensure we're connecting from output to input
        let sourcePoint: ConnectionPoint
        let targetPoint: ConnectionPoint

        if (connectionState.startPoint.portType === 'output' && point.portType === 'input') {
            sourcePoint = connectionState.startPoint
            targetPoint = point
        } else if (connectionState.startPoint.portType === 'input' && point.portType === 'output') {
            sourcePoint = point
            targetPoint = connectionState.startPoint
        } else {
            // Invalid connection (output to output or input to input)
            connectionState.dragging = false
            connectionState.startPoint = null
            return
        }

        // Create the connection
        const newConnection: IFlowConnection = {
            id: `conn_${Date.now()}`,
            sourceNodeId: sourcePoint.nodeId,
            sourcePortId: sourcePoint.portId,
            targetNodeId: targetPoint.nodeId,
            targetPortId: targetPoint.portId
        }

        // Remove any existing connections to the same input port
        flowState.connections = flowState.connections.filter(
            conn => !(conn.targetNodeId === targetPoint.nodeId && conn.targetPortId === targetPoint.portId)
        )

        // Add the new connection
        flowState.connections.push(newConnection)

        // Reset connection state
        connectionState.dragging = false
        connectionState.startPoint = null
    }

    const cancelConnection = () => {
        connectionState.dragging = false
        connectionState.startPoint = null
    }

    // ************************************************************************
    // Node Registry Methods
    // ************************************************************************




    const loadNodeDefinitions = async (customNodePaths: string[]) => {
        console.log("Loading node definitions from paths:", customNodePaths)

        const definitions = await Promise.all(
            customNodePaths.map(async (nodePath) => {
                const def = await loadNodeDefinition(nodePath)
                if (def) {
                    nodeDefinitions[def.typeUID] = def

                    // Also load and store the component for this node type
                    const component = await loadNodeComponent(nodePath)
                    if (component) {
                        nodeComponents[def.typeUID] = markRaw(component)
                        console.log(`Loaded component for node: ${def.typeUID} from ${nodePath}`)
                    }

                    console.log(`Loaded definition for node: ${def.typeUID} v.${def.version} @ ${nodePath}`, def)
                }
                return def
            })
        )

        availableNodes.value = definitions.filter(Boolean) as INodeDefinition[]
        console.log("Available nodes:", availableNodes.value)
        console.log("Node components:", Object.keys(nodeComponents))
    }

    const loadNodeDefinition = async (nodePath: string): Promise<INodeDefinition | null> => {
        try {
            // Change from @/components/Flow/CustomNodes to relative path
            const definitionModule = await import(/* @vite-ignore */ `../components/Flow/CustomNodes/${nodePath}/definition`)
            return definitionModule.nodeDefinition
        } catch (error) {
            console.warn(`Failed to load definition from path: ${nodePath}`, error)
            return null
        }
    }

    const loadNodeComponent = async (nodePath: string) => {
        try {
            // Change from @/components/Flow/CustomNodes to relative path
            const visualModule = await import(/* @vite-ignore */ `../components/Flow/CustomNodes/${nodePath}/visual.vue`)
            return markRaw(visualModule.default)
        } catch (error) {
            console.warn(`Failed to load component from path: ${nodePath}`, error)
            return null
        }
    }

    const getNodeComponent = async (nodeType: string) => {
        console.log(`Getting component for node type: ${nodeType}`)

        if (nodeComponents[nodeType]) {
            return nodeComponents[nodeType]
        }

        // Find the correct folder path for this node type
        const nodeDef = nodeDefinitions[nodeType]
        if (!nodeDef) {
            console.warn(`No definition found for node type: ${nodeType}`)
            return null
        }

        // Get the folder name using the mapping function
        const folderName = getNodeFolderByTypeUID(nodeType)

        if (!folderName) {
            console.warn(`No folder mapping found for node type: ${nodeType}`)
            return null
        }

        console.log(`Loading component for node type ${nodeType} from folder ${folderName}`)
        const component = await loadNodeComponent(folderName)
        if (component) {
            nodeComponents[nodeType] = markRaw(component)
            console.log(`Successfully loaded component for ${nodeType}`)
        } else {
            console.error(`Failed to load component for ${nodeType}`)
        }
        return component
    }

    function getNodeFolderByTypeUID(typeUID: string): string | null {
        // Map typeUID to folder name - this should match your actual folder structure
        const typeToFolderMap: Record<string, string> = {
            'com.flow.function': 'Function',
            'com.flow.math': 'MathNode',
            'com.flow.input': 'InputNode',
            'com.flow.output': 'OutputNode',
            'com.flow.button': 'Button',
            'com.flow.ticker': 'Ticker',
            'com.flow.Z2MObject': 'ObjectNode'
        }

        return typeToFolderMap[typeUID] || null
    }

    // Enhanced getNodeDefinition function that can handle both node IDs and typeUIDs
    const getNodeDefinition = (nodeIdOrType: string): INodeDefinition | undefined => {
        console.log(`Getting node definition for: ${nodeIdOrType}`)

        // First, check if this is a direct typeUID
        if (nodeDefinitions[nodeIdOrType]) {
            return nodeDefinitions[nodeIdOrType]
        }

        // If not found directly, it might be a node ID, so find the node and get its typeUID
        const node = flowState.nodes.find(n => n.id === nodeIdOrType)
        if (node) {
            return nodeDefinitions[node.typeUID]
        }

        console.warn(`No node definition found for: ${nodeIdOrType}`)
        return undefined
    }

    // ************************************************************************
    // ===== Flow Tree Methods =====
    // ************************************************************************
    const setSelectedFlow = (flowId: string) => {
        selectedFlowId.value = flowId
        // Load the selected flow data into flowState

        // flowState = flows[flowId]

        if (flows[flowId]) {
            Object.assign(flowState, flows[flowId])
        } else {
            console.warn(`Flow with ID ${flowId} not found`)
        }

    }

    const addFlow = (path: string) => {
        // Create a new flow with the given path
        flows[path] = {
            nodes: [],
            connections: [],
            zoom: 1,
            pan: { x: 0, y: 0 },
            id: createID(),
            path: path, // Default to My Flows if no path
            notes: ''
        }
    }

    const deleteFlow = (flowId: string) => {
        // Delete the flow
        if (flows[flowId]) {
            delete flows[flowId]
            db.set(flowId, null)
        }
    }

    const createFolder = (path: string) => {
        // Create an empty folder in the tree structure
        // We'll store it as a special flow with a type of 'folder'
        const folderId = `folder_${createID()}`
        flows[folderId] = {
            nodes: [],
            connections: [],
            zoom: 1,
            pan: { x: 0, y: 0 },
            id: folderId,
            path: path,
            notes: '',
            isFolder: true // Mark this as a folder
        }

        console.log(`Folder created at path: ${path}`)
        return true
    }

    const deleteFolder = (path: string) => {
        // Delete all flows in this folder
        Object.entries(flows).forEach(([flowId, flow]) => {
            if (flow.path && flow.path.startsWith(path)) {
                delete flows[flowId]
            }
        })
    }

    const addFolder = (parentPath: string[], folderName: string) => {
        // Create a folder path string from the array
        const path = parentPath.length > 0 ? parentPath.join('/') + '/' + folderName : folderName
        return createFolder(path)
    }

    // ===== Node Port Position Methods =====
    const updateNodePortPositions = (data: {
        nodeId: string
        ports: {
            inputs: Array<{ index: number; x: number; y: number }>
            outputs: Array<{ index: number; x: number; y: number }>
        }
    }) => {
        // console.log(`Setting port positions for node ${data.nodeId}:`, data.ports)
        nodePortPositions.value.set(data.nodeId, data.ports)
        updateConnectionPaths()
    }

    const updateConnectionPaths = () => {
        // This would update SVG paths for connections
        // Implementation depends on your rendering approach
    }

    // Trigger a port position update for a specific node
    const triggerPortPositionUpdate = (nodeId: string) => {
        // This is a no-op function that will be observed by components
        // to trigger their port position update logic
        console.log(`Triggering port position update for node ${nodeId}`)
        // We can use a simple approach like this:
        const node = flowState.nodes.find(n => n.id === nodeId)
        if (node) {
            // Make a small change to the node to trigger watchers
            node.position = { ...node.position }
        }
    }

    // Update node input values
    const updateNodeInputValues = (nodeId: string, inputValues: Record<string, any>) => {
        const node = flowState.nodes.find(n => n.id === nodeId)
        if (!node) return

        // Initialize config.ins if it doesn't exist
        if (!node.config) {
            node.config = { ins: {} }
        } else if (!node.config.ins) {
            node.config.ins = {}
        }

        // Update input values
        Object.entries(inputValues).forEach(([key, value]) => {
            node.config.ins[key] = { value }
        })

        // Remove any inputs that are not in the inputValues
        Object.keys(node.config.ins).forEach(key => {
            if (!(key in inputValues)) {
                delete node.config.ins[key]
            }
        })
    }

    // ===== Initialize =====
    // Initialize CoreDB connection
    const db = useCoreDBStore().getWrapper()
    db.onPatch("customNodePaths", (val) => {
        console.log("Received customNodePaths patch:", val)
        loadNodeDefinitions(val)
    })


    // get flows: IFlows
    const flows = reactive<Record<string, IFlowModel>>({})

    db.onPatch("idx:type=RootFlow", (patch) => {
        console.log("Received flows patch:", patch)
        for (let flowId in patch) {
            if (!flows[flowId]) {
                flows[flowId] = {
                    nodes: [],
                    connections: [],
                    zoom: 1,
                    pan: { x: 0, y: 0 },
                    id: flowId,
                    path: '',
                    notes: ''
                }
            }
            db.onPatch(flowId, (flowPatch) => {
                console.log("Received flow patch for " + flowId + ":", flowPatch)
                db.patch(flows[flowId], flowPatch)
            })
        }
    })

    // Handler for when a flow is selected
    const handleFlowSelected = (flowId: string) => {
        console.log("Flow selected:", flowId)
        setSelectedFlow(flowId)
    }

    // Handler for when a node is selected from the node tree
    const handleNodeSelected = async (node: any) => {
        console.log("Node selected:", node)

        // Calculate a position in the center of the current view
        const position = {
            x: -flowState.pan.x + window.innerWidth / (2 * flowState.zoom),
            y: -flowState.pan.y + window.innerHeight / (2 * flowState.zoom)
        }

        // Create the node at the calculated position
        const newNode = await createNode(node.typeUID, position)
        console.log("Created node:", newNode.id)

        // Return the new node ID for any additional processing
        return newNode.id
    }

    return {
        db,
        // State
        flowState,
        availableNodes,
        nodeComponents,
        selectedFlowId,
        connectionState,
        nodePortPositions,

        // Flow State Methods
        saveFlow,
        loadFlow,
        clearFlow,
        createNode,
        deleteNode,
        duplicateNode,
        updateNodePosition,

        // Connection Methods
        startConnection,
        updateDraggingConnection,
        endConnection,
        cancelConnection,

        // Node Registry Methods
        getNodeDefinition,

        // Flow Tree Methods
        setSelectedFlow,
        addFlow,
        deleteFlow,
        addFolder,

        // Node Port Position Methods
        updateNodePortPositions,
        triggerPortPositionUpdate,

        // Node Input Methods
        updateNodeInputValues,

        // Add flows to the return statement
        flows,

        // Add the new handlers
        handleFlowSelected,
        handleNodeSelected
    }
})
