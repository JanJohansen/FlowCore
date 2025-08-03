// This class initializes the CoreDB client + transport and manages connection status

import { ref } from 'vue'
import { CoreDBClient, CoreDBClientUser } from "@webapp/backend/core/coreDB/client/CoreDBClient"
import { CoreDBWSTransport } from "@webapp/backend/core/coreDB/client/CoreDBWSTransport"

export class CoreDbUser extends CoreDBClientUser {
    static isConnected = ref(false)

    private static initialized = false
    private static transport = new CoreDBWSTransport('ws://localhost:3000')
    private static client = new CoreDBClient(this.transport)

    constructor() {
        super(CoreDbUser.client)
        if (!CoreDbUser.initialized) {
            console.log('Initializing CoreDB client')

            // Set up transport event handlers
            CoreDbUser.transport.onConnect(() => {
                console.log('CoreDB store: Transport connected')
                CoreDbUser.isConnected.value = true
            })

            CoreDbUser.transport.onDisconnect(() => {
                console.log('CoreDB store: Transport disconnected')
                CoreDbUser.isConnected.value = false
            })

            CoreDbUser.transport.connect()

            CoreDbUser.initialized = true
        }
    }

    /**
     * Get all keys and values from the database
     * @returns Promise that resolves with all key-value pairs
     */
    async getAllKeysAndValues(): Promise<Record<string, any>> {
        return await this.call('coredb:getAllKeysAndValues')
    }
}