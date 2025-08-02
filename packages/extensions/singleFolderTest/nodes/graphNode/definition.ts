import { INodeDefinition } from "../../../frontend-types"

export const nodeDefinition: INodeDefinition = {
    "typeName": "graphNode",
    "typeUID": "dk.johansenweb.core.graphNodeV1",
    "category": "UI",
    "version": "1.0.0",
    "author": "Jan Johansen",
    "description": "A node that presents a graph structure.",
    "company": "JJ inc.",
    "license": "MIT",
    "ins": {
        "data": {
            "valueType": "[number, number][]",
            "description": "Input data for the graph."
        }
    },
    "outs": {
    }
}
