import { IBackendBaseNodeContext } from '../../types'
import { CoreDBUser } from '../coreDB/CoreDB'

export class NodeBackendBaseV1 {
    protected dbUser: CoreDBUser
    protected context: IBackendBaseNodeContext

    constructor(context: IBackendBaseNodeContext) {
        this.dbUser = context.dbUser
        this.context = context
    }

    on = (propName: string, cb: (val: any) => void) => {
        this.dbUser.onSet(this.context.node.id + "." + propName, cb)
    }

    ins = {
        on: (inputName: string, cb: (val: any) => void) => {
            this.dbUser.onSet(this.context.node.id + ".ins." + inputName, cb)
        }
    }

    outs = {
        set: (outputName: string, value: any) => {
            this.dbUser.patch(this.context.node.id + ".outs." + outputName, value)
        }
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
