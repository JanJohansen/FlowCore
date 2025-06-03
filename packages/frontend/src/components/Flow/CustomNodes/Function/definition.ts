import { INodeDefinition } from "../../types"

export const nodeDefinition: INodeDefinition = {
    typeName: "Function",
    typeUID: "com.flow.function",
    category: "Basic",
    version: "1.0.0",
    author: "Jan Johansen",
    description: "Function node, defined by backend script and front end VUE component script - both in typescript.",
    company: "JJ inc.",
    license: "MIT",
    ins: {
        displayName: {
            valueType: "string",
            description: "Display name for the node header (user-friendly name)",
            default: "Function"
        },
        backendCode: {
            valueType: "string",
            description: "JavaScript code to execute on the backend. Receives 'context' and 'helpers' parameters."
        },
        nodeUICode: {
            valueType: "string",
            description: "Vue.js component code for the node's frontend UI. Receives context as props."
        },
        inputDefinitions: {
            valueType: "object",
            description: "Object defining the node's input ports and their types.",
            default: {
                "input1": {
                    valueType: "any",
                    description: "Input 1"
                }
            }
        },
        outputDefinitions: {
            valueType: "object",
            description: "Object defining the node's output ports and their types.",
            default: {
                "output1": {
                    valueType: "any",
                    description: "Output 1"
                }
            }
        }
    },
    outs: {
        _log: {
            valueType: "string",
            description: "Log output from node backend."
        }
    }
}
