import { INodeDefinition } from "../../types"

export const nodeDefinition: INodeDefinition = {
    "typeName": "MqttTopics",
    "typeUID": "com.flow.MqttTopics",
    "category": "MQTT",
    "version": "1.0.0",
    "author": "System",
    "description": "Displays object data in a structured format",
    "company": "Flow System",
    "license": "MIT",
    "ins": {
        "URL:Port": {
            "valueType": "string",
            "description": "MQTT broker URL and port",
            "defaultValue": "mqtt://localhost:1883"
        },
        "Username": {
            "valueType": "string",
            "description": "MQTT broker username"
        },
        "Password": {
            "valueType": "string",
            "description": "MQTT broker password"
        },
    },
    "outs": {}
}