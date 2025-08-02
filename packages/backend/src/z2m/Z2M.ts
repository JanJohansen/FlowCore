import * as mqtt from 'mqtt'
import { CoreDB } from '../core/coreDB/CoreDB'

interface Z2MConfig {
    mqttUrl: string
    username?: string
    password?: string
    baseTopic?: string
}

interface DeviceInfo {
    friendly_name?: string
    ieee_address?: string
    type?: string
    model?: string
    manufacturer?: string
}

export class Z2M {
    private mqtt: any
    private db: CoreDB
    private baseTopic: string
    private deviceStates: Map<string, Record<string, any>> = new Map(); // Track current states locally

    constructor(config: Z2MConfig) {
        this.db = CoreDB.getGlobalInstance()
        this.baseTopic = config.baseTopic || 'zigbee2mqtt'

        // Connect to MQTT broker 
        this.mqtt = mqtt.connect(config.mqttUrl, {
            username: config.username,
            password: config.password
        })

        this.setupMQTTHandlers()
    }

    private setupMQTTHandlers(): void {
        this.mqtt.on('connect', () => {
            console.log('Connected to MQTT broker')

            // Subscribe to all device updates and bridge info
            this.mqtt.subscribe(`${this.baseTopic}/bridge/devices`)
            this.mqtt.subscribe(`${this.baseTopic}/bridge/state`)
            this.mqtt.subscribe(`${this.baseTopic}/+`) // All device states
        })

        this.mqtt.on('message', (topic: string, payload: Buffer) => {
            // console.log('Received MQTT message:', topic, payload.toString());
            try {
                const message = JSON.parse(payload.toString())
                this.handleMessage(topic, message)
            } catch (error) {
                console.error('Error processing MQTT message:', error)
            }
        })

        this.mqtt.on('error', (error) => {
            // console.error('MQTT error:', error);
            this.db.patch('z2m/status', {
                state: 'error',
                error: error.message
            })
        })
    }

    private handleMessage(topic: string, message: any): void {
        // Handle bridge devices list
        if (topic === `${this.baseTopic}/bridge/devices`) {
            this.handleDevicesList(message)
            return
        }

        // Handle bridge state
        if (topic === `${this.baseTopic}/bridge/state`) {
            this.db.patch('z2m/bridge', {
                state: message.state,
                ...message
            })
            return
        }

        // Handle device state updates
        const deviceTopic = topic.substring(this.baseTopic.length + 1)
        if (deviceTopic && !deviceTopic.startsWith('bridge/')) {
            this.handleDeviceState(deviceTopic, message)
        }
    }

    private handleDevicesList(devices: any[]): void {
        // console.log('Received devices list:', devices);
        this.db.patch('z2m/devices', {
            type: ["z2m", "deviceList"],
            list: devices,
            timestamp: Date.now()
        })

        devices.forEach(device => {
            if (device.friendly_name && device.definition?.exposes) {
                const ins: Record<string, any> = {}
                const outs: Record<string, any> = {}

                const processExposed = (exposed: any) => {
                    if (exposed.access) {
                        const property = exposed.property
                        // Extract relevant metadata from exposed
                        const propertyMeta = {
                            description: exposed.description,
                            unit: exposed.unit,
                            type: exposed.type,
                            name: exposed.name,
                            values: exposed.values, // For enums
                            value_max: exposed.value_max,
                            value_min: exposed.value_min,
                            value_step: exposed.value_step,
                            presets: exposed.presets
                        }

                        // Remove undefined properties
                        Object.keys(propertyMeta).forEach(key =>
                            propertyMeta[key] === undefined && delete propertyMeta[key]
                        )

                        if (exposed.access & 2) {
                            ins[property] = propertyMeta
                        }
                        if (exposed.access & 1) {
                            outs[property] = propertyMeta
                        }
                    }

                    if (exposed.features) {
                        exposed.features.forEach(processExposed)
                    }
                }

                device.definition.exposes.forEach(processExposed)

                // Set device info
                this.db.patch(`z2m/device/${device.friendly_name}`, {
                    type: ["z2m", "deviceInfo"],
                    info: device,
                    ins: ins,
                    outs: outs
                })

                // Initialize device state with metadata and current values
                const initialState: Record<string, any> = {
                    type: ["z2m", "deviceState"],
                    lastUpdate: Date.now()
                }

                if (Object.keys(ins).length > 0) {
                    initialState.ins = {}
                    for (const [key, meta] of Object.entries(ins)) {
                        initialState.ins[key] = {
                            ...meta,
                            value: device[key] ?? null  // Use current value directly from device object
                        }
                    }
                }

                if (Object.keys(outs).length > 0) {
                    initialState.outs = {}
                    for (const [key, meta] of Object.entries(outs)) {
                        initialState.outs[key] = {
                            ...meta,
                            value: device[key] ?? null  // Use current value directly from device object
                        }
                    }
                }

                // Set initial device state
                this.db.patch(`z2m/deviceState/${device.friendly_name}`, initialState)
            }
        })
    }

    private handleDeviceState(deviceTopic: string, newState: any): void {
        console.log('Device state update:', deviceTopic, newState)

        // Get current state or initialize if not exists
        const currentState = this.deviceStates.get(deviceTopic) || {
            // type: ["z2m", "deviceState"],
            ins: {},
            outs: {},
            lastUpdate: 0
        }

        const patch: Record<string, any> = {
            // type: ["z2m", "deviceState"],
            lastUpdate: Date.now()
        }

        let hasChanges = false

        // Process all state properties
        for (const [key, value] of Object.entries(newState)) {
            const currentValue = currentState.ins?.[key]?.value

            // Only include in patch if value has changed
            if (JSON.stringify(currentValue) !== JSON.stringify(value)) {
                hasChanges = true

                // Create ins/outs structure if needed
                if (!patch.ins) patch.ins = {}
                if (!patch.outs) patch.outs = {}

                // Update patch with changed value
                patch.ins[key] = { value }
                patch.outs[key] = { value }

                // Update local state
                if (!currentState.ins) currentState.ins = {}
                if (!currentState.outs) currentState.outs = {}
                currentState.ins[key] = { value }
                currentState.outs[key] = { value }
            }
        }

        // Only send update if there are actual changes
        if (hasChanges) {
            currentState.lastUpdate = patch.lastUpdate
            this.deviceStates.set(deviceTopic, currentState)
            this.db.patch(`z2m/deviceState/${deviceTopic}`, patch)
            console.log(`Updated state for ${deviceTopic}:`, patch)
        }
    }

    public async sendCommand(deviceTopic: string, command: any): Promise<void> {
        return new Promise((resolve, reject) => {
            this.mqtt.publish(
                `${this.baseTopic}/${deviceTopic}/set`,
                JSON.stringify(command),
                { qos: 1 },
                (error) => {
                    if (error) reject(error)
                    else resolve()
                }
            )
        })
    }

    public close(): void {
        this.mqtt.end()
    }
}
