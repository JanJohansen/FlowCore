import { INodeDefinition } from "../../../frontend-types"

export const nodeDefinition: INodeDefinition = {
    "typeName": "Output",
    "typeUID": "com.flow.output",
    "category": "Basic",
    "version": "1.0.0",
    "author": "System",
    "description": "Output node for displaying results",
    "company": "Flow System",
    "license": "MIT",
    "ins": {
        "in1": {
            "valueType": "any",
            "description": "Input value"
        }
    },
    "outs": {}
}