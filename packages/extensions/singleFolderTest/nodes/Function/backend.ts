import { NodeBackendBaseV1 } from "../../../backend-types"


class func {
    setup() {
        console.log("Setting up function...")
    }
    cleanup() {
        console.log("Cleaning up function...")
    }
}

console.log("******************************")
let f = new Function('context', 'helpers',
    'console.log("Hello from the function!");' +
    "return class xyz{constructor(){console.log('Hello from xyz!');}}"
)
let classF = f({}, {})
let objectF = new classF()
console.log("******************************")


export default class FunctionNode extends NodeBackendBaseV1 {
    nodeType = "Function"
    private customFunction: Function | null = null
    private enhancedContext: any = null

    private customSetup: () => void = () => { console.log("Custom setup for FunctionNode missing!") }
    private customCleanup: () => void = () => { console.log("Custom cleanup for FunctionNode missing!") }

    setup() {
        console.log("Setting up FunctionNode:", this.context)

        // // Initialize enhanced context
        // this.enhancedContext = {
        //     node: {
        //         id: this.context.node.id,
        //         name: this.context.node.config?.displayName || "Function",
        //         inputs: this.context.node.config?.inputDefinitions || {},
        //         outputs: this.context.node.config?.outputDefinitions || {},
        //         state: {}
        //     },
        //     flow: this.context.flow,
        //     global: this.context.global
        // }

        // Code that goes before user provided code
        const preCode = ""
        // Code that goes after user provided code
        const postCode = "; return { setup, cleanup } "

        // Initialize with current config values
        const config = this.context.node.config
        if (config?.backendCode) {
            try {
                // this.customFunction = new Function('context', config.backendCode)
                // IDEA: Inject console.log
                // IDEA: provide node helper parameter? - Or rely on "this"...?

                const customFunction = new Function(preCode + config.backendCode + postCode).bind(this)
                const { customSetup, customCleanup } = customFunction(this.enhancedContext)
                this.customSetup = customSetup
                this.customCleanup = customCleanup

                if (this.customSetup) this.customSetup()
                // this.outs.set("_log", "Compilation OK.")

            } catch (error: any) {
                console.error("Error compiling initial backend code:", error)
                this.outs.set("_log", `Error: ${error?.message || 'Unknown compilation error'}`)
            }
        }
    }

    cleanup() {
        console.log("Cleaning up FunctionNode:", this.context)
        if (this.customCleanup) this.customCleanup()
    }
}