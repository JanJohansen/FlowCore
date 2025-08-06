import { NodeBackendBaseV1 } from "../../../backend-types"
import mqtt from "mqtt"

class Debounce {
    private timer: NodeJS.Timeout | null = null;

    call(callback: () => void, timeout: number) {
        if (this.timer) {
            clearTimeout(this.timer)
        }
        this.timer = setTimeout(() => {
            callback()
            this.timer = null
        }, timeout)
    }

    cancel() {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }
    }
}

export default class ObjectNode extends NodeBackendBaseV1 {
    url = "";
    username = "";
    password = "";
    rootTopic = "";

    mqtt: mqtt.MqttClient | null = null;
    topics: { [topic: string]: string } = {};
    private connectDebounce = new Debounce();

    setup() {
        // Implementation for setup 
        console.log("Setting up MQTT node:", this.context.node.id)

        this.url = this.context.node.config?.url || "mqtt://localhost:1883"
        this.username = this.context.node.config?.username || "guest"
        this.password = this.context.node.config?.password || "guest"
        this.rootTopic = this.context.node.config?.rootTopic || "#"

        this.connectToMqttServer()
    }
    connectToMqttServer() {
        if (this.mqtt) {
            this.mqtt.end(() => {
                console.log("Disconnected from MQTT server")
                this.mqtt = null
            }) // Disconnect previous connection if exists
        }

        this.connectDebounce.call(() => {
            this.connect()
        }, 1000)
    }

    private connect() {
        // Debounce - only connect if all parameters are stable for 1 sec.
        console.log("Connecting to MQTT server...", this.url, "-", this.username, this.password)

        this.mqtt = mqtt.connect(this.url, { username: this.username, password: this.password, reconnectPeriod: 10000 })

        this.mqtt.on("connect", () => {
            console.log("Connected to MQTT server")
            let topic
            if (this.rootTopic && this.rootTopic !== "") topic = this.rootTopic + "/#"
            else topic = "#"
            this.mqtt?.subscribe(topic, (err) => {
                if (err) {
                    console.error("Failed to subscribe to topics:", err)
                } else {
                    console.log("Subscribed to all topics")
                }
            })
        })

        this.mqtt.on("error", (err) => {
            console.error("MQTT connection error:", err)
        })

        this.mqtt.on("message", (topic, message) => {
            // Handle incoming messages here

            // Try to convert the value to javascript objects from the string
            let parsedMessage = ""
            try {
                parsedMessage = JSON.parse(message.toString())
            } catch (e) {
                parsedMessage = message.toString()
            }

            console.log(`MQTT: Received message on topic ${topic}:`, parsedMessage)

            if (!this.topics[topic]) {
                this.topics[topic] = parsedMessage

                this.set("topics", Object.keys(this.topics))

            } else this.topics[topic] = parsedMessage
        })
    }
    cleanup() {
        console.log("Cleaning up MQTT node:", this.context.node.id)
        this.connectDebounce.cancel()
        if (this.mqtt) {
            this.mqtt.end(() => {
                console.log("Disconnected from MQTT server")
                this.mqtt = null
            })
        }
    }
}

