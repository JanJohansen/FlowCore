import { CoreDB, CoreDBUser } from '../coreDB/CoreDB'

export class NodeEditorManager {
    private static instance: NodeEditorManager
    private db: CoreDB

    constructor() {
        this.db = CoreDB.getGlobalInstance()
        if (!NodeEditorManager.instance) {
            NodeEditorManager.instance = this
        }
        this.setup()
        return NodeEditorManager.instance
    }

    async setup() {
        // this.db.onCall("NodeEditorManager.Save", this.save.bind(this))
    }

    async save(args: any) {
        console.log("Saving node editor changes:", args)
    }
}
