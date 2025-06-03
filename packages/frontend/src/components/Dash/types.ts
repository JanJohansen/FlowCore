// Dashboard Types
export interface IDashPosition {
    x: number
    y: number
}

export interface IDashSize {
    width: number
    height: number
}

export interface IDashComponent {
    id: string
    type: string
    position: IDashPosition
    size: IDashSize
    props: Record<string, any>
    vueCode?: string
    inputs: Record<string, any>
    outputs: Record<string, any>
    zIndex: number
}

export interface IDashboard {
    id: string
    name: string
    format: IDashFormat
    components: IDashComponent[]
    gridSize: number
    snapToGrid: boolean
    backgroundColor: string
    notes: string
}

export interface IDashFormat {
    name: string
    width: number
    height: number
    aspectRatio: string
}

export interface IDashComponentDefinition {
    type: string
    name: string
    icon: string
    category: string
    defaultSize: IDashSize
    defaultProps: Record<string, any>
    inputs: IDashPortDefinition[]
    outputs: IDashPortDefinition[]
    vueTemplate?: string
}

export interface IDashPortDefinition {
    name: string
    type: string
    required: boolean
    defaultValue?: any
    description?: string
}

export interface IDashStore {
    currentDashboard: IDashboard | null
    dashboards: Record<string, IDashboard>
    selectedComponentId: string | null
    componentDefinitions: Record<string, IDashComponentDefinition>
    availableFormats: IDashFormat[]
    isDesignMode: boolean
    showGrid: boolean
    showProperties: boolean
    fullscreen: boolean
}

export interface IDashDragState {
    isDragging: boolean
    dragType: 'component' | 'resize' | 'move'
    startPosition: IDashPosition
    currentPosition: IDashPosition
    componentId?: string
    resizeHandle?: string
}

export interface IDashConnection {
    id: string
    sourceComponentId: string
    sourcePort: string
    targetComponentId: string
    targetPort: string
}

// Component categories
export const DASH_COMPONENT_CATEGORIES = {
    BASIC: 'Basic',
    INPUT: 'Input',
    DISPLAY: 'Display',
    LAYOUT: 'Layout',
    CHART: 'Chart',
    CUSTOM: 'Custom'
} as const

// Built-in formats
export const DASH_FORMATS: IDashFormat[] = [
    { name: 'Desktop 16:9', width: 1920, height: 1080, aspectRatio: '16:9' },
    { name: 'Desktop 4:3', width: 1024, height: 768, aspectRatio: '4:3' },
    { name: 'Tablet Landscape', width: 1024, height: 768, aspectRatio: '4:3' },
    { name: 'Tablet Portrait', width: 768, height: 1024, aspectRatio: '3:4' },
    { name: 'Phone Landscape', width: 812, height: 375, aspectRatio: '21.6:9' },
    { name: 'Phone Portrait', width: 375, height: 812, aspectRatio: '9:19.5' },
    { name: 'Square', width: 800, height: 800, aspectRatio: '1:1' },
    { name: 'Custom', width: 1200, height: 800, aspectRatio: 'Custom' }
]

// Resize handles
export const RESIZE_HANDLES = [
    'nw', 'n', 'ne',
    'w',       'e',
    'sw', 's', 'se'
] as const

export type ResizeHandle = typeof RESIZE_HANDLES[number]
