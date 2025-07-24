import { IBackendBaseNodeContext } from '../../types'
import { CoreDB, CoreDBUser } from '../coreDB/CoreDB'

export class NodeBackendBaseV1 {
    private db: any
    private dbUser: CoreDBUser
    protected context: IBackendBaseNodeContext

    constructor(context: IBackendBaseNodeContext) {
        this.db = context.db
        this.dbUser = new CoreDBUser(this.db)
        this.context = context
        delete this.context.db  // Prevent direct access to CoreDB interface
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

    // Internal cleanup method called by the system
    _baseCleanup(): void {
        if (this.cleanup) {
            this.cleanup()
        }
    }
}
