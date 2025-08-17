export const GRID_SIZE = 20
export const PORT_SIZE = GRID_SIZE        // 20px
export const NODE_HEADER_HEIGHT = GRID_SIZE * 2  // 40px
export const NODE_PORT_MARGIN = GRID_SIZE // Space between ports
export const DEFAULT_ZOOM = 1
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 3
export const ZOOM_SPEED = 0.1

export const CONNECTION_TYPES = {
    INPUT: 'input',
    OUTPUT: 'output'
} as const

export const LOCAL_STORAGE_KEYS = {
    FLOW_STATE: 'flowState'
} as const
