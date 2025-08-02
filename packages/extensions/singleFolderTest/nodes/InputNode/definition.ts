import { INodeDefinition } from "../../../frontend-types"

export const nodeDefinition: INodeDefinition = {
    "typeName": "Input",
    "typeUID": "com.flow.input",
    "category": "Basic",
    "version": "1.0.0",
    "author": "System",
    "description": "Input node for receiving data",
    "company": "Flow System",
    "license": "MIT",
    "ins": {},
    "outs": {
        "out": {
            "valueType": "any",
            "description": "Output value"
        }
    }
}
