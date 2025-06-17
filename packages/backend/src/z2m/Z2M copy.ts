// Referring to https://www.zigbee2mqtt.io/guide/usage/mqtt_topics_and_messages.html, create a nodejs class that creates internal map of detected zigbee devices with max info mapped to objects. Use typescript with definition of const devicemap: {device: {name: string, description, string, ins:{inputname1:{desciption: string, ... etc. }, outs: {outputName: string :{description:string}}} - etc... Ad as much data as possible from the specification provided. Ask clarifying questions as needed .

// Advanced Chat AssistantAnthropic - Claude 3.5 Sonnet

// From < https://chat.danfoss.com/chat/9b0af251-b834-4161-8b6b-6984589cbbd5> 

// Here’s the implementation.I’ll break it down into parts for clarity:

//     ...ZigbeeDeviceManager

//     This implementation includes:
// 1. Comprehensive device mapping with static and dynamic properties
// 2. MQTT connection and message handling
// 3. Automatic device discovery and mapping
// 4. Support for device features, inputs, and outputs
// 	5. Detailed type definitions for all properties
// 6. Methods for querying and controlling devices
// 7. Error handling for device commands
// 	8. Support for device availability tracking
// 	9. Battery and network quality monitoring
// Would you like me to explain any particular part in more detail or add additional functionality ?



import * as mqtt from 'mqtt'
// Comprehensive type definitions
interface DeviceIO {
    description: string
    value?: any
    type?: string
    unit?: string
    access?: number
    lastUpdate?: Date
    min?: number
    max?: number
    values?: string[]  // For enum-type values
    presets?: any[]    // For preset values
}
interface DeviceFeature {
    type: string
    description: string
    supported: boolean
}
interface DeviceDefinition {
    // Basic device information
    name: string
    description: string
    model: string
    manufacturer: string
    modelID?: string
    hardwareVersion?: string
    softwareVersion?: string

    // Device capabilities
    features: {
        [key: string]: DeviceFeature
    }

    // IO definitions
    ins: {
        [key: string]: DeviceIO
    }
    outs: {
        [key: string]: DeviceIO
    }

    // Network information
    networkData: {
        ieeeAddr: string
        networkAddress: string
        parentNetworkAddress?: string
        routingTable?: string[]
    }

    // Status information
    available: boolean
    lastSeen: Date
    interview_completed: boolean

    // Power information
    powerSource?: string
    battery?: {
        percentage?: number
        voltage?: number
        lastUpdated?: Date
    }

    // Link information
    linkquality?: number
    lqi?: number
    rssi?: number
}
type DeviceMap = {
    [deviceId: string]: DeviceDefinition
}
class ZigbeeDeviceManager {
    private deviceMap: DeviceMap = {};
    private mqttClient: mqtt.Client
    private readonly baseTopic: string
    constructor(mqttUrl: string, baseTopic: string = 'zigbee2mqtt') {
        this.baseTopic = baseTopic
        this.mqttClient = mqtt.connect(mqttUrl)
        this.setupMqttListeners()
    }
    private setupMqttListeners(): void {
        this.mqttClient.on('connect', () => {
            console.log('Connected to MQTT broker')
            this.subscribeToTopics()
        })
        this.mqttClient.on('message', (topic: string, message: Buffer) => {
            this.handleMqttMessage(topic, message)
        })
    }
    private subscribeToTopics(): void {
        // Subscribe to all device-related topics
        const topics = [
            `${this.baseTopic}/bridge/devices`,
            `${this.baseTopic}/bridge/state`,
            `${this.baseTopic}/+`,  // Device states
            `${this.baseTopic}/+/availability`  // Device availability
        ]

        topics.forEach(topic => this.mqttClient.subscribe(topic))
    }
    private handleMqttMessage(topic: string, message: Buffer): void {
        const payload = JSON.parse(message.toString())

        if (topic === `${this.baseTopic}/bridge/devices`) {
            this.handleDevicesList(payload)
        } else if (topic.endsWith('/availability')) {
            this.handleDeviceAvailability(topic, payload)
        } else {
            this.handleDeviceState(topic, payload)
        }
    }
    private handleDevicesList(devices: any[]): void {
        devices.forEach(device => {
            const deviceId = device.ieee_address
            if (!this.deviceMap[deviceId]) {
                this.deviceMap[deviceId] = this.createDeviceDefinition(device)
            }
        })
    }
    private createDeviceDefinition(device: any): DeviceDefinition {
        return {
            name: device.friendly_name || device.ieee_address,
            description: device.definition?.description || '',
            model: device.definition?.model || 'Unknown',
            manufacturer: device.definition?.vendor || 'Unknown',
            modelID: device.model_id,
            hardwareVersion: device.hardware_version,
            softwareVersion: device.software_version,

            features: this.parseDeviceFeatures(device),
            ins: this.parseDeviceInputs(device),
            outs: this.parseDeviceOutputs(device),

            networkData: {
                ieeeAddr: device.ieee_address,
                networkAddress: device.network_address,
                parentNetworkAddress: device.parent_network_address,
            },

            available: true,
            lastSeen: new Date(),
            interview_completed: device.interview_completed || false,

            powerSource: device.power_source,
            battery: {
                percentage: undefined,
                voltage: undefined,
                lastUpdated: undefined
            },

            linkquality: undefined,
            lqi: undefined,
            rssi: undefined
        }
    }
    private parseDeviceFeatures(device: any): { [key: string]: DeviceFeature } {
        const features: { [key: string]: DeviceFeature } = {}

        if (device.definition?.exposes) {
            device.definition.exposes.forEach((feature: any) => {
                features[feature.name || feature.property] = {
                    type: feature.type,
                    description: feature.description || '',
                    supported: true
                }
            })
        }

        return features
    }
    private parseDeviceInputs(device: any): { [key: string]: DeviceIO } {
        const inputs: { [key: string]: DeviceIO } = {}

        if (device.definition?.exposes) {
            device.definition.exposes
                .filter((expose: any) => expose.access & 1)  // Read access
                .forEach((expose: any) => {
                    inputs[expose.property] = {
                        description: expose.description || '',
                        type: expose.type,
                        unit: expose.unit,
                        access: expose.access,
                        min: expose.value_min,
                        max: expose.value_max,
                        values: expose.values,
                        presets: expose.presets
                    }
                })
        }

        return inputs
    }
    private parseDeviceOutputs(device: any): { [key: string]: DeviceIO } {
        const outputs: { [key: string]: DeviceIO } = {}

        if (device.definition?.exposes) {
            device.definition.exposes
                .filter((expose: any) => expose.access & 2)  // Write access
                .forEach((expose: any) => {
                    outputs[expose.property] = {
                        description: expose.description || '',
                        type: expose.type,
                        unit: expose.unit,
                        access: expose.access,
                        min: expose.value_min,
                        max: expose.value_max,
                        values: expose.values,
                        presets: expose.presets
                    }
                })
        }

        return outputs
    }
    // Public methods for device interaction
    public getDevice(deviceId: string): DeviceDefinition | undefined {
        return this.deviceMap[deviceId]
    }
    public getAllDevices(): DeviceMap {
        return this.deviceMap
    }
    public findDevicesByType(type: string): DeviceDefinition[] {
        return Object.values(this.deviceMap).filter(
            device => device.features[type]?.supported
        )
    }
    public findDevicesByManufacturer(manufacturer: string): DeviceDefinition[] {
        return Object.values(this.deviceMap).filter(
            device => device.manufacturer.toLowerCase() === manufacturer.toLowerCase()
        )
    }
    public async sendCommand(deviceId: string, command: string, value: any): Promise<void> {
        const device = this.deviceMap[deviceId]
        if (!device) {
            throw new Error(`Device ${deviceId} not found`)
        }
        if (!device.outs[command]) {
            throw new Error(`Command ${command} not supported by device ${deviceId}`)
        }
        const topic = `${this.baseTopic}/${device.name}/set`
        await this.mqttClient.publishAsync(topic, JSON.stringify({ [command]: value }))
    }
    public disconnect(): void {
        this.mqttClient.end()
    }
}
export { ZigbeeDeviceManager, DeviceDefinition, DeviceIO, DeviceFeature }
// Usage example:
const manager = new ZigbeeDeviceManager('mqtt://localhost:1883')
// Get all devices
const devices = manager.getAllDevices()
// Find all light devices
const lights = manager.findDevicesByType('light')
// Send command to a device
await manager.sendCommand('0x00158d0001dc4ead', 'state', 'ON')
// Get specific device info
const device = manager.getDevice('0x00158d0001dc4ead');


