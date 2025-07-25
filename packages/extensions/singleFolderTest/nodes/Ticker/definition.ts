import { INodeDefinition } from "../../types"

export const nodeDefinition: INodeDefinition = {
    "typeName": "Ticker",
    "typeUID": "com.flow.ticker",
    "category": "Timing",
    "version": "1.0.0",
    "author": "Jan Johansen",
    "description": "Interval generation nodfe.",
    "company": "JJ inc.",
    "license": "MIT",
    "ins": {
        "interval": {
            "valueType": "number",
            "description": "Interval in milliseconds between ticks."
        }
    },
    "outs": {
        "tick": {
            "valueType": "number",
            "description": "Tick output = increasing numerical counter."
        }
    }
}
