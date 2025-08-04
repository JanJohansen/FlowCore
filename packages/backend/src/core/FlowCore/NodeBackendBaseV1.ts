import { IBackendBaseNodeContext } from '../../types'
import { CoreDBUser } from '../coreDB/CoreDB'

export class NodeBackendBaseV1 {
    protected dbUser: CoreDBUser
    protected context: IBackendBaseNodeContext

    constructor(context: IBackendBaseNodeContext) {
        this.dbUser = context.dbUser
        this.context = context
    }

    onSet = (propName: string, cb: (val: any) => void) => {
        this.dbUser.onSet(this.context.node.id + "." + propName, cb)
    }

    set = (propName: string, value: any) => {
        this.dbUser.set(this.context.node.id + "." + propName, value)
    }

    ins = {
        onSet: (inputName: string, cb: (val: any) => void) => {
            this.dbUser.onSet(this.context.node.id + ".ins." + inputName, cb)
        }
    }

    outs = {
        set: (outputName: string, value: any) => {
            this.dbUser.patch(this.context.node.id + ".outs." + outputName, value)
        }
    }

    log = {
        browser: (...args: any[]) => {
            console.log(`[Node ${this.context.node.id}]`, ...args)
        }
    }

    notifyFrontendNode = (message: string, data?: any) => {
        this.dbUser.set(`${this.context.node.id}.__notifyFrontendNode`, {
            message,
            data
        })
    }

    // Optional lifecycle methods that can be overridden by subclasses
    setup?(): void
    cleanup?(): void

    // Internal cleanup method called by FlowCore
    _baseCleanup(): void {
        if (this.cleanup) {
            this.cleanup()
        }
        // Note: dbUser.unsubscribeAll() is now handled by FlowCore
    }
}
