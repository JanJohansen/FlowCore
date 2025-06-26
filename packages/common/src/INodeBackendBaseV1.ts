import { IBackendBaseNodeContext, ISetupContext } from './types'

/**
 * Abstract base class for backend flow nodes.
 * This provides the common interface and basic functionality that all backend nodes should have.
 */
export interface INodeBackendBaseV1 {
    /**
     * Subscribe to property changes on this node
     */
    on(propName: string, cb: (val: any) => void): void

    /**
     * Input handling interface
     */
    ins: {
        on: (inputName: string, cb: (val: any) => void) => void
    }

    /**
     * Output handling interface
     */
    outs: {
        set: (outputName: string, value: any) => void
    }

    // Optional lifecycle methods that can be overridden by subclasses
    setup?(): void
    cleanup?(): void
}
