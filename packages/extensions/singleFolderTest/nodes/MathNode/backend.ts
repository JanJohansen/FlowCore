import { NodeBackendBaseV1 } from "../../../backend-types"

export default class MathNode extends NodeBackendBaseV1 {
    setup() {
        // Implementation for setup
        console.log("Setting up Math node:", this.context)
    }
}
