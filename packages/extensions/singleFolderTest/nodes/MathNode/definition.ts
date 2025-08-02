import { INodeDefinition } from "../../../frontend-types"

export const nodeDefinition: INodeDefinition = {
    "typeName": "Math Operation",
    "typeUID": "com.flow.math",
    "category": "Math",
    "version": "1.0.0",
    "author": "System",
    "description": "Performs mathematical operations",
    "company": "Flow System",
    "license": "MIT",
    "ins": {
        "a": {
            "valueType": "number",
            "description": "Input value A"
        },
        "b": {
            "valueType": "number",
            "description": "Input value B"
        }
    },
    "outs": {
        "result": {
            "valueType": "number",
            "description": "Result of the operation"
        }
    }
}