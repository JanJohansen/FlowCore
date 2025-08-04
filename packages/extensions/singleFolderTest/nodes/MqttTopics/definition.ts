import { INodeDefinition } from "../../../frontend-types"

export const nodeDefinition: INodeDefinition = {
    typeName: "MqttTopics",
    typeUID: "com.flow.MqttTopics",
    category: "MQTT",
    version: "1.0.0",
    author: "System",
    description: "Displays object data in a structured format",
    company: "Flow System",
    license: "MIT",
    ins: {
        URL: {
            type: "string",
            description: "MQTT broker URL and port",
            default: "mqtt://localhost:1883"
        },
        Username: {
            type: "string",
            description: "MQTT broker username"
        },
        Password: {
            type: "string",
            description: "MQTT broker password"
        },
        RootTopic: {
            type: "string",
            description: "Root topic for MQTT subscriptions",
            default: "#"
        }
    },
    outs: {}
}