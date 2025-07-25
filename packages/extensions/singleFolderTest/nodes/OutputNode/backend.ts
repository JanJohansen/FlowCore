import { NodeBackendBaseV1 } from "../../backend_types"

export default class OutputNode extends NodeBackendBaseV1 {
    setup() {
        // Implementation for setup
        console.log("Setting up Output node:", this.context)
    }
}