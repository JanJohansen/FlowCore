Intention of this node is to be used as a configurable function node. The configuration parts of the node should be in
the node models config.ins part for the node:

-   nodeModel.config.ins.backendCode Defines the code to run on the backend
-   nodeModel.config.ins.nodeUICode Defines the code to define the UI to show in the node front end. (Its a VUE
    component)
-   nodeModel.config.ins.inputDefinitions Defines the inputs to the node.
-   nodeModel.config.ins.outputDefinitions Defines the outputs from the node.
-   There should also be a nodeModel.config.ins.displayName (to be shown in the node header) for the component.

Goal is to make programming the node as simple as possible, but still be able to do complex things.

In both backend and frontend a context object is passed to the code to allow access to:

-   the node definition including node ID, node type, node name, node inputs, node outputs, node config, node state
-   a context.node object that can be used to store state for the node.
-   a context.flow object that can be used to store state and communicate between nodes in the same flow.
-   a context.global object that can be used to store state and communicate between nodes in different flows.
-   a context.nodeType object that can be used to store state and communicate between nodes of the same type.

Support methods for accessing inputs and outputs shall be provided. These functions should be using the coreDB (in
src/core/coreDB) methods (such as get, set, on, call, onCall) to access the data.

Please update the code in the function node accordingly and then create a new README.md file in the
src/components/Flow/CustomNodes/Function directory with the details of the node.

Enhanced: ed:Create a configurable Function node for the Flow system that allows users to define custom backend logic
and frontend UI through code configuration. The node should be highly flexible while maintaining simplicity for basic
use cases.

**Configuration Structure:** The node's configuration should be stored in `nodeModel.config.ins` with the following
properties:

-   `backendCode`: String containing JavaScript code to execute on the backend
-   `nodeUICode`: String containing Vue.js component code for the node's frontend UI
-   `inputDefinitions`: Array/object defining the node's input ports and their types
-   `outputDefinitions`: Array/object defining the node's output ports and their types
-   `displayName`: String to display in the node header (user-friendly name)

**Context Object:** Both backend and frontend code should receive a `context` object providing access to:

-   `context.node`: Node-specific state storage and access to node definition (ID, type, name, inputs, outputs, config,
    state)
-   `context.flow`: Flow-level state storage for communication between nodes in the same flow
-   `context.global`: Global state storage for communication across different flows
-   `context.nodeType`: Type-specific state storage for communication between nodes of the same type

**Data Access Methods:** Implement helper functions for input/output operations that utilize the coreDB methods (get,
set, on, call, onCall) from `src/core/coreDB`. These should provide a clean API for:

-   Reading input values
-   Setting output values
-   Listening for input changes
-   Triggering output updates

**Implementation Requirements:**

1. Update the existing Function node code in `src/components/Flow/CustomNodes/Function/backend.ts`
2. Ensure the node follows the established flow component patterns (avoid event drilling, use flowstore methods
   directly)
3. Create comprehensive documentation in a new `README.md` file in the `src/components/Flow/CustomNodes/Function/`
   directory

**Documentation Requirements:** The README should include:

-   Overview of the Function node's purpose and capabilities
-   Detailed configuration schema with examples
-   Context object API reference
-   Helper function documentation
-   Code examples for common use cases
-   Best practices for backend and frontend codec
