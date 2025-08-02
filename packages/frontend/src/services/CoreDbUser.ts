// Singleton class for CoreDB user management
// This class initializes the CoreDB client and manages connection status

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
        return new CoreDBClientUser(CoreDbUser.client!)
    }
}