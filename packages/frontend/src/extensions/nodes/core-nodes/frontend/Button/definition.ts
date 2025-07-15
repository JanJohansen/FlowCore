import { INodeDefinition } from "../../types"

export const nodeDefinition: INodeDefinition = {
    typeName: "Button",
    typeUID: "com.flow.button",
    category: "Basic",
    version: "1.0.0",
    author: "Jan Johansen",
    description: "Visual button node.",
    company: "JJ inc.",
    license: "MIT",
    ins: {
        pressed: {
            valueType: "boolean",
            description: "Button pressed"
        }
    },
    outs: {
        down: {
            valueType: "boolean",
            description: "Triggered when button is pressed down"
        },
        up: {
            valueType: "boolean",
            description: "Triggered when button is released"
        },
        click: {
            valueType: "boolean",
            description: "Triggered for clicks shorter than 3 seconds"
        },
        "3sPress": {
            valueType: "boolean",
            description: "Triggered after button is held for 3 seconds"
        },
        "10sPress": {
            valueType: "boolean",
            description: "Triggered after button is held for 10 seconds"
        }
    }
}
