import { NodeBackendBaseV1 } from "../../backend_types"

export default class ButtonNode extends NodeBackendBaseV1 {
    timer: NodeJS.Timeout | null = null

    setup() {
        console.log("Setting up TickerNode:", this.context)

        let count = 0

        this.ins.on("interval", (interval: number) => {
            console.log("Interval changed:", interval)
            if (interval) {
                if (this.timer) {
                    clearInterval(this.timer)
                }
                this.timer = setInterval(() => {
                    console.log("Ticking:", count)
                    this.outs.set("tick", count++)
                }, interval)
            }
        })
    }

    cleanup() {
        console.log("Tearing down TickerNode:", this.context)
        if (this.timer) {
            clearInterval(this.timer)
        }
    }
}