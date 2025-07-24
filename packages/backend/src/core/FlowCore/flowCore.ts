import { CoreDB, CoreDBUser } from '../coreDB/CoreDB'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'url'
import { IFlowModel, IFlowNodeModel, IBackendBaseNodeContext } from '../../types'
import { NodeBackendBaseV1 } from "./NodeBackendBaseV1"


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const CUSTOM_NODES_FOLDER = path.resolve(__dirname, "../../../../frontend/src/components/Flow/CustomNodes")

let nodeDefinitions: { [typeUID: string]: any } = {}
let nodeClasses: { [typeUID: string]: any } = {}

export class FlowCore {
    private db: CoreDB

    constructor(db?: CoreDB) {
        this.db = db || CoreDB.getGlobalInstance()
        this.setup()
    }

    async setup() {
        // Load custom nodes from the specified folder
        await this.loadCustomNodes()
        fs.watch(CUSTOM_NODES_FOLDER, { recursive: true }, async (event, filename) => {
            console.log('Custom node file changed:', filename)
            await this.loadCustomNodes()
        })

        this.db.onCall("flowCore:saveCustomNodeFile", async (path: string, content: string) => {
            const targetPath = CUSTOM_NODES_FOLDER + "." + path
            console.log("Saving to:", targetPath)
            await fs.promises.mkdir(targetPath, { recursive: true })
            await fs.promises.writeFile(targetPath, content)
        })

        this.db.onCall("flowCore:loadCustomNodeFile", async (path: string) => {
            const targetPath = CUSTOM_NODES_FOLDER + "." + path
            fs.readFile(targetPath, (err, data) => {
                if (err) return null
                return data.toString()
            })
        })

        this.db.onCall("flowCore:deleteCustomNodeFile", (path: string) => {
            const targetPath = CUSTOM_NODES_FOLDER + "." + path
            fs.rm(targetPath, (err) => {
                if (err) throw err
            })
        })

        this.monitorFlows()
    }

    async loadCustomNodes() {
        try {
            const customNodesPath = path.resolve(__dirname, CUSTOM_NODES_FOLDER)
            const folders = fs.readdirSync(customNodesPath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
            const folderArray = folders.map(dirent => dirent.name)

            // Publish the list of custom node folders to DB
            this.db.set('customNodes', folderArray)
            console.log('Custom nodes:', folders, customNodesPath)

            for (const folder of folders) {
                console.log('************************ Loading custom node:', folder.name)
                await this.loadCustomNode(folder.name)
            }

            return folders
        } catch (error) {
            console.error('************************ Error listing custom nodes:', error)
            this.db.patch('customNodes', {
                folders: [],
                error: error.message,
                timestamp: Date.now()
            })
            return []
        }
    }

    async loadCustomNode(folder: string) {
        try {
            // Use pathToFileURL to properly convert paths to file:// URLs
            const nodePath = path.resolve(__dirname, CUSTOM_NODES_FOLDER, folder, 'backend.ts')
            const nodePathUrl = pathToFileURL(nodePath).href
            const nodeModule = await import(nodePathUrl)
            const nodeClass = nodeModule.default

            const definitionPath = path.resolve(__dirname, CUSTOM_NODES_FOLDER, folder, 'definition.ts')
            const definitionPathUrl = pathToFileURL(definitionPath).href
            const definitionModule = await import(definitionPathUrl)
            const definition = definitionModule.nodeDefinition

            nodeDefinitions[definition.typeUID] = definition
            nodeClasses[definition.typeUID] = nodeClass

            console.log('************************ Loaded custom node:', definition.typeUID, nodeClass)
        } catch (error) {
            console.error('************************ Error loading custom node:', folder, error)
        }
    }


    private flows: { [flowId: string]: IFlowModel } = {}
    private flowConnections: { [flowId: string]: CoreDBUser } = {}
    private nodes: { [nodeId: string]: NodeBackendBaseV1 } = {}
    private flowContexts: { [flowId: string]: any } = {}
    private typeContexts: { [nodeTypeUID: string]: any } = {}
    private globalFlowContext = {}

    monitorFlows() {
        this.db.on("idx:type=RootFlow", (Patch: { [flowId: string]: {} }) => {
            console.log('RootFlow index update:', Patch)
            for (let flowId in Patch) {
                if (this.flows[flowId]) continue  // Skip if already subscribed/loaded
                if (Patch[flowId] == null) {
                    // Flow Deleted
                    this.unloadFlow(flowId)
                    console.log('RootFlow deleted:', this.flows)
                    continue
                }

                // Subscribe to new rootflow
                this.db.on(flowId, (patch: any) => {
                    if (patch != null) {
                        console.log('RootFlow updated:', flowId)
                        // First unload the existing flow using flowId
                        if (this.flows[flowId]) {
                            this.unloadFlow(flowId)
                        }
                        // Then load the updated flow
                        this.loadFlow(patch as IFlowModel)
                    } else {
                        // Flow deleted
                        this.unloadFlow(flowId)
                        console.log('RootFlow deleted:', this.flows)
                        return
                    }
                })
            }
        })
    }

    loadFlow(flow: IFlowModel) {
        console.log('Loading flow:', flow.id)

        // Create new flow context
        this.flowContexts[flow.id] = { id: flow.id }

        // Store the flow model 
        this.flows[flow.id] = flow

        // Create new CoreDBUser for flow connections
        this.flowConnections[flow.id] = new CoreDBUser()

        // Re-instantiate connections?
        for (let connection of flow.connections) {
            this.flowConnections[flow.id].on(connection.sourceNodeId + ".outs." + connection.sourcePortId, (patch: any) => {
                console.log('Connection triggered:', connection.sourceNodeId + "." + connection.sourcePortId + "/" + connection.targetNodeId + "." + connection.targetPortId, patch)
                this.db.patch(connection.targetNodeId + ".ins." + connection.targetPortId, patch)
            })
        }

        // (re-)Instantiate nodes
        flow.nodes.forEach(node => {
            this.loadNode(flow.id, node)
        })
    }

    unloadFlow(flowId: string) {
        console.log('Unloading flow:', flowId)
        const flow = this.flows[flowId]

        if (!flow) {
            console.warn(`Attempted to unload non-existent flow: ${flowId}`)
            return
        }

        // Unsubscribe from connections
        this.flowConnections[flowId].unsubscribeAll()
        delete this.flowConnections[flowId]

        // Unload all nodes in the flow
        flow.nodes.forEach(node => {
            this.unloadNode(flowId, node)
        })

        // Clean up flow data
        delete this.flows[flowId]
        delete this.flowContexts[flowId]
    }

    loadNode(flowId: string, node: IFlowNodeModel) {
        console.log('Instantiating node type:', node.typeUID)
        const NodeClass = nodeClasses[node.typeUID]
        console.log("NodeModule:", NodeClass)

        if (!NodeClass) {
            console.error(`No node class found for type: ${node.typeUID}`)
            return
        }

        // Create nodeTypeContext
        if (!this.typeContexts[node.typeUID]) {
            this.typeContexts[node.typeUID] = {}
        }

        // Set up config input values 
        try {
            if (node.config?.ins && Object.keys(node.config.ins).length > 0) {
                for (const [configKey, configValue] of Object.entries(node.config.ins)) {
                    // Set config values to node's input ports
                    // const setValue = JSON.parse("{value:" + configValue + "}")
                    // this .db.set(`${node.id}.ins.${configKey}`, setValue.value)
                    console.log('Setting config value:', `${node.id}.ins.${configKey}`, configValue.value)
                    this.db.patch(`${node.id}.ins.${configKey}`, configValue.value)
                }
            }
        } catch (error) {
            console.error(`Error setting config values for node ${node.id}:`, error)
        }

        try {
            const context: IBackendBaseNodeContext = {
                db: this.db,
                global: this.globalFlowContext,
                flow: this.flowContexts[flowId],
                type: this.typeContexts[node.typeUID],
                node: { id: node.id }
            }
            // Create node
            const instance = new NodeClass(context)
            if (instance.setup) instance.setup()

            // Store the node instance for later cleanup
            this.nodes[node.id] = instance
        } catch (error) {
            console.error(`Error instantiating node ${node.id} of type ${node.typeUID}:`, error)
        }
    }

    unloadNode(flowId: string, node: IFlowNodeModel) {
        // Unload a specific node
        console.log('Unloading node:', node.id)
        const nodeInstance = this.nodes[node.id]

        if (nodeInstance) {
            const context = {
                global: this.globalFlowContext,
                flow: this.flowContexts[flowId],
                type: this.typeContexts[node.typeUID],
                node: { id: node.id }
            }

            try {
                nodeInstance._baseCleanup()
            } catch (error) {
                console.error(`Error cleaning up node ${node.id}:`, error)
            }

            // Remove the node instance from tracking
            delete this.nodes[node.id]
        } else {
            console.warn(`Attempted to unload non-existent node: ${node.id}`)
        }
    }
}
