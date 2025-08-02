import { NodeBackendBaseV1 } from "../../../backend-types"
import mqtt from "mqtt"

export default class ObjectNode extends NodeBackendBaseV1 {
    urlPort = "";
    username = "";
    password = "";
    mqtt: mqtt.MqttClient | null = null;
    topics: { [topic: string]: string } = {};

    setup() {
        // Implementation for setup
        console.log("Setting up Object node:", this.context)

        this.ins.on("URL", (value) => {
            console.log("MQTT broker URL and port set to:", value)
            this.urlPort = value
        })
        this.ins.on("Username", (value) => {
            console.log("MQTT broker username set to:", value)
            this.username = value
        })
        this.ins.on("Password", (value) => {
            console.log("MQTT broker password set to:", value)
            this.password = value
        })
    }
    connectToMqttServer() {
        console.log("Connecting to MQTT server at:", this.urlPort)
        console.log("Using username:", this.username)
        console.log("Using password:", this.password)

        if (this.mqtt) {
            this.mqtt.end() // Disconnect previous connection if exists
        }

        this.mqtt = mqtt.connect(this.urlPort, { username: this.username, password: this.password })
        this.mqtt.on("connect", () => {
            console.log("Connected to MQTT server")
        })
        this.mqtt.on("error", (err) => {
            console.error("MQTT connection error:", err)
        })
        this.mqtt.on("message", (topic, message) => {
            console.log(`Received message on topic ${topic}:`, message.toString())
            // Handle incoming messages here
            if (!this.topics[topic]) {
                this.outs.set(this.context.node.id + ".serverTopics", topic)
            }
            this.topics[topic] = message.toString()
        })
    }
}