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
    config: {
        url: {
            type: "string",
            description: "MQTT broker URL and port",
            default: "mqtt://localhost:1883"
        },
        username: {
            type: "string",
            description: "MQTT broker username"
        },
        password: {
            type: "string",
            description: "MQTT broker password"
        },
        rootTopic: {
            type: "string",
            description: "Root topic for MQTT subscriptions",
            default: "#"
        },
        inputs: {
            type: "enumArray",
            description: "MQTT topics the node will set if an input is set.",
            options: []
        },
        outputs: {
            type: "enumArray",
            description: "MQTT topics the node will provide as outputs.",
            options: []
        }
    },
    ins: {},
    outs: {}
}