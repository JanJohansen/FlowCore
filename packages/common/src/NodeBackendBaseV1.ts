import { IBackendBaseNodeContext, ISetupContext } from './types'

// This is a simplified version for the common package
// The actual implementation should be in the backend package
export class NodeBackendBaseV1 {
    private db: any
    private dbUser: any
    public context: ISetupContext

    constructor(context: IBackendBaseNodeContext) {
        this.db = context.db
        this.context = context as ISetupContext
        delete this.context.db   // Don't expose db directly.
        
        // Create a simplified dbUser interface
        this.dbUser = {
            on: (key: string, callback: (val: any) => void) => {
                if (this.db && this.db.on) {
                    return this.db.on(key, callback)
                }
            },
            patch: (key: string, value: any) => {
                if (this.db && this.db.patch) {
                    return this.db.patch(key, value)
                }
            },
            unsubscribeAll: () => {
                // Placeholder for unsubscribe functionality
            }
        }
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

    // Base lifecycle methods
    _baseSetup() {
        console.log("Setting up NodeBackendBaseV1:", this.context)
        if (this.setup) {
            this.setup()
        }
    }

    _baseCleanup() {
        console.log("Tearing down NodeBackendBaseV1:", this.context)
        if (this.cleanup) {
            this.cleanup()
        }
        this.dbUser.unsubscribeAll()
    }

    // Optional lifecycle methods that can be overridden by subclasses
    setup?(): void
    cleanup?(): void
}
