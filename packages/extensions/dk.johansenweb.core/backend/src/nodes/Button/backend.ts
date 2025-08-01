import { NodeBackendBaseV1 } from "../../backend_types"

export default class ButtonNode extends NodeBackendBaseV1 {
    nodeType = "Button"
    CLICK_THRESHOLD_MS = 3000
    LONG_PRESS_THRESHOLD_MS = 10000

    // Constants for timeout durations
    private pressStartTime: number | null = null
    private threeSecTimer: NodeJS.Timeout | null = null
    private tenSecTimer: NodeJS.Timeout | null = null

    setup() {
        console.log("Setting up ButtonNode:", this.context)

        this.ins.on("pressed", (val: boolean) => {
            console.log("Button pressed:", val)
            if (val === true) {
                this.handlePointerDown()
            } else {
                this.handlePointerUp()
            }
        })
    }

    handlePointerDown() {
        console.log("Pointer down on button")
        this.pressStartTime = Date.now()

        this.outs.set("down", true)
        console.log("ButtonNode: down", this.context.node.id)

        // Set timers for long presses
        // Use public methods from base class
        this.threeSecTimer = setTimeout(() => {
            this.outs.set("3sPress", true)
            console.log("ButtonNode: 3sPress", this.context.node.id)
        }, this.CLICK_THRESHOLD_MS)

        this.tenSecTimer = setTimeout(() => {
            this.outs.set("10sPress", true)
        }, this.LONG_PRESS_THRESHOLD_MS)
    }

    handlePointerUp() {
        console.log("Pointer up on button")

        // Use public methods from base class
        this.outs.set("up", true)

        // Check if it was a click (less than threshold)
        if (this.pressStartTime && Date.now() - this.pressStartTime < this.CLICK_THRESHOLD_MS) {
            this.outs.set("click", true)
        }

        // Clean up - clear timers
        if (this.threeSecTimer) {
            clearTimeout(this.threeSecTimer)
            this.threeSecTimer = null
        }

        if (this.tenSecTimer) {
            clearTimeout(this.tenSecTimer)
            this.tenSecTimer = null
        }

        this.pressStartTime = null
    }

    cleanup() {
        console.log("Cleaning up ButtonNode:", this.context)
    }
}
