import { NodeBackendBaseV1 } from "../../backend_types"

export default class InputNode extends NodeBackendBaseV1 {
    // timer: NodeJS.Timeout | null = null

    setup() {
        // Implementation for setup
        console.log("Setting up InputNode:", this.context)

        // this.context.flow.count = 0
        // let nodeCounter = 0
        // this.timer = setInterval(() => {
        //     this.context.flow.count++
        //     nodeCounter++
        //     console.log("InputNode is alive:", this.context, nodeCounter)
        // }, 5000)
    }

    cleanup() {
        // Implementation for takeDown
        console.log("Tearing down InputNode:", this.context)
        // if (this.timer) {
        //     clearInterval(this.timer)
        // }
    }
}