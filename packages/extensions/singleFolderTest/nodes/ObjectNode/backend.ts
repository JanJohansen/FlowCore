import { NodeBackendBaseV1 } from "../../../backend-types"

export default class ObjectNode extends NodeBackendBaseV1 {
    setup() {
        // Implementation for setup
        console.log("Setting up Object node:", this.context)
    }
}