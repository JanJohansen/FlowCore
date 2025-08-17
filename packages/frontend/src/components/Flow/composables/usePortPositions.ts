/**
 * Composable for calculating port positions elegantly without DOM queries
 * Uses standardized port layout based on node definitions
 */

import { computed, ref, watchEffect, type Ref } from 'vue'
import type { INodeDefinition, IFlowNodeModel } from '../types'
import { GRID_SIZE } from '../constants'

export interface PortPosition {
    x: number
    y: number
    index: number
}

export interface NodePortPositions {
    inputs: PortPosition[]
    outputs: PortPosition[]
}

/**
 * Configuration for port layout
 */
const PORT_CONFIG = {
    // Port connector size (matching CSS)
    CONNECTOR_SIZE: 12,
    // Distance from node edge to port center (matching CSS positioning)
    PORT_EDGE_OFFSET: 4,
    // Height of each port row
    PORT_ROW_HEIGHT: GRID_SIZE,
    // Minimum node width
    MIN_NODE_WIDTH: 100,
    // Padding for port labels
    LABEL_PADDING: 16
} as const

/**
 * Calculate port positions based on node definition and actual DOM dimensions
 * Uses ResizeObserver to watch for content changes and update positions dynamically
 */
export function usePortPositions(
    node: Ref<IFlowNodeModel>,
    nodeDefinition: Ref<INodeDefinition | null>,
    nodeElement?: Ref<HTMLElement | undefined>
) {
    // Reactive dimensions based on actual DOM measurements
    const actualWidth = ref(PORT_CONFIG.MIN_NODE_WIDTH)
    const actualHeaderHeight = ref(30) // Default fallback

    // ResizeObserver to watch for content changes
    let resizeObserver: ResizeObserver | null = null
    let headerResizeObserver: ResizeObserver | null = null

    // Setup resize observers when node element is available
    watchEffect((onInvalidate) => {
        if (!nodeElement?.value) return

        // Observe the main node for width changes
        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Get the content-box dimensions
                const { inlineSize: width } = entry.contentBoxSize?.[0] || {
                    inlineSize: entry.contentRect.width,
                    blockSize: entry.contentRect.height
                }

                actualWidth.value = Math.max(width, PORT_CONFIG.MIN_NODE_WIDTH)
            }
        })

        resizeObserver.observe(nodeElement.value)

        // Observe the header specifically for height changes
        const headerElement = nodeElement.value.querySelector('.pre-ports') as HTMLElement
        if (headerElement) {
            headerResizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const { blockSize: height } = entry.contentBoxSize?.[0] || {
                        inlineSize: entry.contentRect.width,
                        blockSize: entry.contentRect.height
                    }

                    actualHeaderHeight.value = height
                }
            })

            headerResizeObserver.observe(headerElement)
        }

        onInvalidate(() => {
            if (resizeObserver) {
                resizeObserver.disconnect()
                resizeObserver = null
            }
            if (headerResizeObserver) {
                headerResizeObserver.disconnect()
                headerResizeObserver = null
            }
        })
    })

    /**
     * Calculate input port positions based on actual dimensions  
     * Input connectors are at left: 4px with transform: translate(-50%, -50%)
     * This means they're centered on a point 4px from the left edge
     */
    const inputPositions = computed((): PortPosition[] => {
        if (!nodeDefinition.value) return []

        const inputKeys = Object.keys(nodeDefinition.value.ins || {})
        const nodePos = node.value.position

        return inputKeys.map((_, index) => ({
            index,
            x: nodePos.x + PORT_CONFIG.PORT_EDGE_OFFSET, // 4px from left edge (matching CSS left: 4px)
            y: nodePos.y + actualHeaderHeight.value + (index * PORT_CONFIG.PORT_ROW_HEIGHT) + (PORT_CONFIG.PORT_ROW_HEIGHT / 2)
        }))
    })

    /**
     * Calculate output port positions based on actual dimensions
     * Output connectors are at right: 4px with transform: translate(50%, -50%)
     * This means they're centered on a point 4px from the right edge
     */
    const outputPositions = computed((): PortPosition[] => {
        if (!nodeDefinition.value) return []

        const outputKeys = Object.keys(nodeDefinition.value.outs || {})
        const nodePos = node.value.position

        return outputKeys.map((_, index) => ({
            index,
            x: nodePos.x + actualWidth.value - PORT_CONFIG.PORT_EDGE_OFFSET, // 4px from right edge (matching CSS right: 4px)
            y: nodePos.y + actualHeaderHeight.value + (index * PORT_CONFIG.PORT_ROW_HEIGHT) + (PORT_CONFIG.PORT_ROW_HEIGHT / 2)
        }))
    })

    /**
     * Combined port positions
     */
    const portPositions = computed((): NodePortPositions => ({
        inputs: inputPositions.value,
        outputs: outputPositions.value
    }))

    /**
     * Get port position by type and key
     */
    const getPortPosition = (portType: 'input' | 'output', portKey: string): PortPosition | null => {
        if (!nodeDefinition.value) return null

        const portKeys = portType === 'input'
            ? Object.keys(nodeDefinition.value.ins || {})
            : Object.keys(nodeDefinition.value.outs || {})

        const index = portKeys.indexOf(portKey)
        if (index === -1) return null

        const positions = portType === 'input' ? inputPositions.value : outputPositions.value
        return positions[index] || null
    }

    return {
        portPositions,
        inputPositions,
        outputPositions,
        getPortPosition,
        nodeWidth: actualWidth,
        nodeHeaderHeight: actualHeaderHeight
    }
}

/**
 * Helper function to calculate connection path between two ports
 */
export function calculateConnectionPath(
    startPos: PortPosition,
    endPos: PortPosition
): string {
    const dx = endPos.x - startPos.x

    // Control point distance based on horizontal distance
    const controlDistance = Math.min(Math.abs(dx) * 0.5, 100)

    // Bezier curve control points
    const cp1x = startPos.x + controlDistance
    const cp1y = startPos.y
    const cp2x = endPos.x - controlDistance
    const cp2y = endPos.y

    return `M ${startPos.x} ${startPos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPos.x} ${endPos.y}`
}
