// EditorModel ----------------------------------------------------------------
export interface IEditorModel {
    selectedFlowId: string | null
}

// FlowTree -------------------------------------------------------------------
export interface IFlowTreeFolder {
    type: "folder"
    folderName: string
    folder: IFlowTreeFolder[] | IFlowTreeModel[]
}

export interface IFlowTreeModel {
    type: "flow"
    flowId: string
    flow: IFlowModel[]
}

// ---------------------------------------------------------------------------
export interface INodeDefinitions {
    [typeUID: string]: INodeDefinition
}

export interface INodeDefinition {
    typeUID: string
    version: string
    typeName: string
    category: string
    description: string
    author?: string
    company?: string
    license?: string
    ins?: { [inputName: string]: NodePort }
    outs?: { [outputName: string]: NodePort }
}

export interface NodePort {
    valueType: string
    description?: string
    value?: any
    default?: any
}


// Flows
export interface IFlows {
    [flowId: string]: IFlowModel
}

// Flow -----------------------------------------------------------------------
export interface IFlowModel {
    nodes: IFlowNodeModel[]
    connections: IFlowConnection[]
    zoom: number
    pan: { x: number, y: number }
    id: string
    path: string
    notes: string
    isFolder?: boolean
    persist?: boolean
    type?: string
}

export interface IFlowNodeModel {
    id: string
    typeUID: string
    position: {
        x: number
        y: number
    }
    size: {
        width: number
        height: number
    }
    config: {
        ins: { [inputName: string]: { value: any } }
        outs?: { [outputName: string]: { value: any } }
    }
}

export interface IFlowConnection {
    id: string
    sourceNodeId: string
    sourcePortId: string
    targetNodeId: string
    targetPortId: string
}

export interface ConnectionPoint {
    nodeId: string
    portId: string
    portType: string
    x: number
    y: number
    event?: PointerEvent
}

// NodeModel ------------------------------------------------------------------
export interface INodeFrontInstance {
    id: string
    typeUID: string
    ins?: { [inputName: string]: IIOValueFrontInstance }
    outs?: { [outputName: string]: IIOValueFrontInstance }
}

export interface IIOValueFrontInstance {
    valueType: string
    description?: string
}

