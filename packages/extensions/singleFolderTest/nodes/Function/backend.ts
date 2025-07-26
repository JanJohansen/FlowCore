import { NodeBackendBaseV1 } from "../../../backend-types"

export default class FunctionNode extends NodeBackendBaseV1 {
    nodeType = "Function"
    // private customFunction: Function | null = null
    // private enhancedContext: any = null

    setup() {
        console.log("Setting up FunctionNode:", this.context)

        // // Initialize enhanced context with storage capabilities
        // this.initializeEnhancedContext()

        // // Listen for changes to the backend code
        // this.ins.on("backendCode", (code: string) => {
        //     if (code) {
        //         try {
        //             // Create a function from the provided code with enhanced context
        //             this.customFunction = new Function('context', 'helpers', code)

        //             // Execute the function with the enhanced context
        //             this.executeCustomFunction()

        //             // Log success
        //             this.outs.set("_log", "Backend code compiled successfully")
        //         } catch (error: any) {
        //             console.error("Error compiling backend code:", error)
        //             this.outs.set("_log", `Error: ${error?.message || 'Unknown compilation error'}`)
        //             this.customFunction = null
        //         }
        //     }
        // })

        // // Listen for changes to input definitions
        // this.ins.on("inputDefinitions", (definitions: object) => {
        //     console.log("Input definitions updated:", definitions)
        //     this.setupInputListeners(definitions)
        // })

        // // Listen for changes to output definitions
        // this.ins.on("outputDefinitions", (definitions: object) => {
        //     console.log("Output definitions updated:", definitions)
        //     // Update the enhanced context with new output definitions
        //     if (this.enhancedContext) {
        //         this.enhancedContext.node.outputs = definitions || {}
        //     }
        // })

        // // Listen for changes to display name
        // this.ins.on("displayName", (name: string) => {
        //     console.log("Display name updated:", name)
        //     // Update the enhanced context with new display name
        //     if (this.enhancedContext) {
        //         this.enhancedContext.node.name = name || this.context.node.id
        //     }
        // })
    }

    // /**
    //  * Initialize enhanced context object with storage capabilities
    //  */
    // private initializeEnhancedContext() {
    //     this.enhancedContext = {
    //         node: {
    //             id: this.context.node.id,
    //             type: this.nodeType,
    //             name: this.context.node.name || this.context.node.id,
    //             inputs: {},
    //             outputs: {},
    //             config: this.context.node.config || {},
    //             state: this.context.node.state || {}
    //         },
    //         flow: this.context.flow || {},
    //         global: this.context.global || {},
    //         nodeType: this.context.type || {}
    //     }
    // }

    // /**
    //  * Set up listeners for input changes based on input definitions
    //  */
    // private setupInputListeners(definitions: any) {
    //     // Note: ins.on doesn't return unsubscribe functions in the current implementation
    //     // The cleanup is handled by the base class's dbUser.unsubscribeAll()

    //     if (definitions && typeof definitions === 'object') {
    //         Object.keys(definitions).forEach(inputName => {
    //             this.ins.on(inputName, (value: any) => {
    //                 // Update enhanced context with new input value
    //                 if (this.enhancedContext) {
    //                     this.enhancedContext.node.inputs[inputName] = value
    //                 }
    //                 // Re-execute the custom function when input changes
    //                 this.executeCustomFunction()
    //             })
    //         })

    //         // Update enhanced context with input definitions
    //         if (this.enhancedContext) {
    //             this.enhancedContext.node.inputs = definitions
    //         }
    //     }
    // }

    // /**
    //  * Create helper functions for the custom code
    //  */
    // private createHelpers() {
    //     return {
    //         // Input operations
    //         getInput: (inputName: string) => {
    //             return this.enhancedContext?.node?.inputs?.[inputName]
    //         },

    //         // Output operations
    //         setOutput: (outputName: string, value: any) => {
    //             this.outs.set(outputName, value)
    //             if (this.enhancedContext?.node?.outputs) {
    //                 this.enhancedContext.node.outputs[outputName] = value
    //             }
    //         },

    //         // Logging
    //         log: (...args: any[]) => {
    //             console.log("FunctionNode:", ...args)
    //             this.outs.set("_log", args.join(" "))
    //         },

    //         // State management
    //         getNodeState: (key?: string) => {
    //             if (key) {
    //                 return this.enhancedContext?.node?.state?.[key]
    //             }
    //             return this.enhancedContext?.node?.state || {}
    //         },

    //         setNodeState: (key: string, value: any) => {
    //             if (!this.enhancedContext.node.state) {
    //                 this.enhancedContext.node.state = {}
    //             }
    //             this.enhancedContext.node.state[key] = value
    //         },

    //         // CoreDB access methods (using available base class methods)
    //         // Note: Direct CoreDB access is limited by the base class design
    //         // Users can access context.node, context.flow, context.global, context.nodeType for state storage

    //         // Subscribe to property changes on this node
    //         onNodeProperty: (propName: string, callback: (value: any) => void) => {
    //             this.on(propName, callback)
    //         },

    //         // Subscribe to input changes (alternative to getInput for reactive programming)
    //         onInput: (inputName: string, callback: (value: any) => void) => {
    //             this.ins.on(inputName, callback)
    //         }
    //     }
    // }

    // executeCustomFunction() {
    //     if (!this.customFunction) return

    //     try {
    //         // Execute the custom function with enhanced context and helpers
    //         this.customFunction(this.enhancedContext, this.createHelpers())
    //     } catch (error: any) {
    //         console.error("Error executing custom function:", error)
    //         this.outs.set("_log", `Runtime Error: ${error?.message || 'Unknown error'}`)
    //     }
    // }

    cleanup() {
        console.log("Cleaning up FunctionNode:", this.context)

        // // Note: Input listeners are cleaned up by the base class's dbUser.unsubscribeAll()

        // // Clear custom function
        // this.customFunction = null

        // // Clear enhanced context
        // this.enhancedContext = null
    }
}