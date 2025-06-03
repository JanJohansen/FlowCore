import { IBackendBaseNodeContext, ISetupContext } from '@webapp/common'
import { CoreDB, CoreDBUser } from '../core/coreDB/CoreDB'

export class NodeBackendBaseV1 {
    private db: any
    private dbUser: CoreDBUser
    public context: ISetupContext

    constructor(context: IBackendBaseNodeContext) {
        this.db = context.db
        this.context = context as ISetupContext
        delete this.context.db   // Don't expose db directly.
        this.dbUser = new CoreDBUser(this.db)
    }

    on = (propName: string, cb: (val: any) => void) => {
        this.dbUser.on(this.context.node.id + "." + propName, cb)
    }

    ins = {
        on: (inputName: string, cb: (val: any) => void) => {
            this.dbUser.on(this.context.node.id + ".ins." + inputName, cb)
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

    // Internal cleanup method called by the framework
    _baseCleanup(): void {
        if (this.cleanup) {
            this.cleanup()
        }
    }
}
