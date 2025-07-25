import { INodeDefinition } from "../../types"

export { default as nodeUI } from "./visual.vue"
export { default as backend } from "./backend.ts"
export const nodeDefinition: INodeDefinition = {
    "typeName": "Z2M Object",
    "typeUID": "com.flow.Z2MObject",
    "category": "MQTT",
    "version": "1.0.0",
    "author": "System",
    "description": "Displays object data in a structured format",
    "company": "Flow System",
    "license": "MIT",
    "ins": {
        "objectId": {
            "valueType": "string",
            "description": "Object ID"
        }
    },
    "outs": {
        "data": {
            "valueType": "object",
            "description": "Object data"
        }
    }
}