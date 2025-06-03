# Flow Components

The flow components implement a flow based editor allowing the user to place nodes in a node graph and connect inputs to
outputs.

## Files

### FlowNodeTree.vue

A tree view of available nodes.

### FlowCanvas.vue

The main canvas component that renders the nodes and connections. The canvas supports zooming (using mouse wheel) and
panning (using left mouse button).

-   Connections are rendered as SVG paths on a dedicated layer.
-   Nodes are rendered on a "html" layer.

### FlowNodeBase.vue

The base component for a node, providing common functionality like customizable visual appearance, dragging and
dropping, connecting inputs and outputs. This node must be used for creating custom nodes.

Configurable visual elements (using vue slots) include:

-   Flow tool buttons (edit, delete, duplicate, etc.)
-   Header (Type and ID of node if not customized)
-   Inputs
-   Outputs
-   Body (to add html elements like a button or other visuals)
-   Footer (for information)

When mounted, the FlowNodeBase component is provided with the following propoerties:

-   nodeId: The unique identifier for the node.
-   context: The context of the node.
    -   context.global: The global context of the node. Shared across all nodes.
    -   context.flow: The flow context of the node. Shared across all nodes in the flow.
    -   context.type: The type context of the node. Shared across all nodes of the same type.
    -   context.node: The private context of the node.
        -   connection state of the input and output ports can be accessed using the following properties:
            -   context.node.inputs: The input ports of the node.
            -   context.node.outputs: The output ports of the node.

To dynamically add inputs and outputs, use the following methods: - context.node.addInput(portName, portType) -
context.node.addOutput(portName, portType)

### FlowNodeConnector.vue

The svg connector component that allows the user to connect inputs and outputs.

### FlowNodeDraggingConnection.vue

The svg connector component used during dragging, allowing the user to connect inputs and outputs.

## CustomNodes - Folder

Contains folders with files for individual custom nodes that can be used in the flow editor.

Files for each node can include:

-   visual.vue: The component file for the node's appearance used in the VUE front end.
-   backend.ts: The implementation file for the node's behavior. This will run on the nodejs back end.
-   definition.ts: The node definition file containing:
    -   typeName: The display name of the node.
    -   typeUID: The unique identifier for the node (e.g., "com.your_domain.nodetype")
    -   category: The category of the node (Timing, Math, Logic, Lighting, UIElements, etc.)
    -   version: The semantic version of the node
    -   author: The author of the node
    -   description: The description of the node
    -   company: The company creating the node
    -   license: The license type
    -   ins: Input port definitions
    -   outs: Output port definitions

### Custom node implementation guidelines:

-   Create a new component (.vue file) that extends `FlowNodeBase.vue`
-   Define the node's inputs and outputs in the data property
-   Define the node's behavior in the methods property
-   Define the node's appearance in the template property
-   Define the node's metadata in the metadata property
-   Implement back end functionality in a separate javascript or typescript file called `nodeImpl`
