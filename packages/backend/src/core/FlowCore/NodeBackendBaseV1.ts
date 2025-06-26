import { IBackendBaseNodeContext, NodeBackendBase } from '@webapp/common'
import { CoreDB, CoreDBUser } from '../coreDB/CoreDB'

export class NodeBackendBaseV1 extends NodeBackendBase {
    private db: any
    private dbUser: CoreDBUser

    constructor(context: IBackendBaseNodeContext) {
        super(context)
        this.db = context.db
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
}
