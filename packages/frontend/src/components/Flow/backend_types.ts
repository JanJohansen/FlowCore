// Re-export types to be used in node backend
export type { IBackendBaseNodeContext, ISetupContext } from '@webapp/common'
export type { INodeBackendBaseV1 } from "@webapp/common"



import { INodeBackendBaseV1, IBackendBaseNodeContext } from "@webapp/common"

export abstract class NodeBackendBaseV1 implements INodeBackendBaseV1 {
    protected context: IBackendBaseNodeContext

    constructor(context: IBackendBaseNodeContext) {
        this.context = context
        delete this.context.db  // Prevent direct access to CoreDB interface
    }

    abstract setup?(): void
    abstract cleanup?(): void

    abstract on(propName: string, cb: (val: any) => void): void
    abstract ins: {
        on: (inputName: string, cb: (val: any) => void) => void
    }
    abstract outs: {
        set: (outputName: string, value: any) => void
    }
}
