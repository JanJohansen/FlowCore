import { defineStore } from 'pinia'
import { ref, reactive, computed } from 'vue'
import { useCoreDBStore } from '../services/CoreDB/CoreDBStore'
import type {
    IDashboard,
    IDashComponent,
    IDashComponentDefinition,
    IDashFormat,
    IDashPosition,
    IDashSize,
    IDashDragState
} from '../components/Dash/types'
import {
    DASH_FORMATS,
    DASH_COMPONENT_CATEGORIES
} from '../components/Dash/types'
import {
    DASH_GRID_SIZE,
    COMPONENT_TYPES
} from '../components/Dash/constants'

// Utility function to generate unique IDs
function createID(): string {
    return Math.random().toString(36).substring(2, 11)
}

export const useDashStore = defineStore('dashStore', () => {
    // ===== State =====
    const currentDashboard = ref<IDashboard | null>(null)
    const dashboards = reactive<Record<string, IDashboard>>({})
    const selectedComponentId = ref<string | null>(null)
    const isDesignMode = ref(true)
    const showGrid = ref(true)
    const showProperties = ref(true)
    const fullscreen = ref(false)

    // Drag state
    const dragState = reactive<IDashDragState>({
        isDragging: false,
        dragType: 'component',
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 }
    })

    // Component definitions
    const componentDefinitions = reactive<Record<string, IDashComponentDefinition>>({
        [COMPONENT_TYPES.TEXT]: {
            type: COMPONENT_TYPES.TEXT,
            name: 'Text',
            icon: 'fa-font',
            category: DASH_COMPONENT_CATEGORIES.BASIC,
            defaultSize: { width: 200, height: 50 },
            defaultProps: { text: 'Sample Text', fontSize: 16, color: '#ffffff' },
            inputs: [
                { name: 'text', type: 'string', required: false, defaultValue: 'Sample Text' },
                { name: 'fontSize', type: 'number', required: false, defaultValue: 16 },
                { name: 'color', type: 'string', required: false, defaultValue: '#ffffff' }
            ],
            outputs: []
        },
        [COMPONENT_TYPES.BUTTON]: {
            type: COMPONENT_TYPES.BUTTON,
            name: 'Button',
            icon: 'fa-square',
            category: DASH_COMPONENT_CATEGORIES.INPUT,
            defaultSize: { width: 120, height: 40 },
            defaultProps: { text: 'Button', variant: 'primary' },
            inputs: [
                { name: 'text', type: 'string', required: false, defaultValue: 'Button' },
                { name: 'variant', type: 'string', required: false, defaultValue: 'primary' }
            ],
            outputs: [
                { name: 'click', type: 'event', required: false, description: 'Triggered when button is clicked' }
            ]
        }
    })

    // Available formats
    const availableFormats = ref<IDashFormat[]>(DASH_FORMATS)

    // ===== Computed =====
    const selectedComponent = computed(() => {
        if (!currentDashboard.value || !selectedComponentId.value) return null
        return currentDashboard.value.components.find(c => c.id === selectedComponentId.value) || null
    })

    const currentFormat = computed(() => {
        return currentDashboard.value?.format || DASH_FORMATS[0]
    })

    // ===== CoreDB Integration =====
    const db = useCoreDBStore().getWrapper()

    // ===== Dashboard Management =====
    const createDashboard = (name: string, format: IDashFormat): IDashboard => {
        const dashboard: IDashboard = {
            id: createID(),
            name,
            format,
            components: [],
            gridSize: DASH_GRID_SIZE,
            snapToGrid: true,
            backgroundColor: '#1a1a1a',
            notes: ''
        }

        dashboards[dashboard.id] = dashboard
        saveDashboard(dashboard)
        return dashboard
    }

    const loadDashboard = (dashboardId: string) => {
        if (dashboards[dashboardId]) {
            currentDashboard.value = dashboards[dashboardId]
            selectedComponentId.value = null
        }
    }

    const saveDashboard = (dashboard: IDashboard) => {
        db.set(`dashboard:${dashboard.id}`, dashboard)
        dashboards[dashboard.id] = dashboard
    }

    const deleteDashboard = (dashboardId: string) => {
        if (dashboards[dashboardId]) {
            db.set(`dashboard:${dashboardId}`, null)
            delete dashboards[dashboardId]
            if (currentDashboard.value?.id === dashboardId) {
                currentDashboard.value = null
            }
        }
    }

    // ===== Component Management =====
    const addComponent = (type: string, position: IDashPosition): IDashComponent => {
        if (!currentDashboard.value) throw new Error('No dashboard selected')

        const definition = componentDefinitions[type]
        if (!definition) throw new Error(`Component type ${type} not found`)

        const component: IDashComponent = {
            id: createID(),
            type,
            position: snapToGrid(position),
            size: definition.defaultSize,
            props: { ...definition.defaultProps },
            inputs: {},
            outputs: {},
            zIndex: 10
        }

        currentDashboard.value.components.push(component)
        saveDashboard(currentDashboard.value)
        return component
    }

    const updateComponent = (componentId: string, updates: Partial<IDashComponent>) => {
        if (!currentDashboard.value) return

        const component = currentDashboard.value.components.find(c => c.id === componentId)
        if (component) {
            Object.assign(component, updates)
            saveDashboard(currentDashboard.value)
        }
    }

    const deleteComponent = (componentId: string) => {
        if (!currentDashboard.value) return

        const index = currentDashboard.value.components.findIndex(c => c.id === componentId)
        if (index !== -1) {
            currentDashboard.value.components.splice(index, 1)
            if (selectedComponentId.value === componentId) {
                selectedComponentId.value = null
            }
            saveDashboard(currentDashboard.value)
        }
    }

    // ===== Utility Functions =====
    const snapToGrid = (position: IDashPosition): IDashPosition => {
        if (!currentDashboard.value?.snapToGrid) return position

        const gridSize = currentDashboard.value.gridSize
        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize
        }
    }

    const snapSizeToGrid = (size: IDashSize): IDashSize => {
        if (!currentDashboard.value?.snapToGrid) return size

        const gridSize = currentDashboard.value.gridSize
        return {
            width: Math.round(size.width / gridSize) * gridSize,
            height: Math.round(size.height / gridSize) * gridSize
        }
    }

    // ===== Selection Management =====
    const selectComponent = (componentId: string | null) => {
        selectedComponentId.value = componentId
    }

    // ===== Mode Management =====
    const setDesignMode = (enabled: boolean) => {
        isDesignMode.value = enabled
        if (!enabled) {
            selectedComponentId.value = null
        }
    }

    const toggleFullscreen = () => {
        fullscreen.value = !fullscreen.value
    }

    // ===== Initialize =====
    // Load dashboards from CoreDB
    db.onPatch("dashboard:", (dashboardData) => {
        if (dashboardData) {
            dashboards[dashboardData.id] = dashboardData
        }
    })

    return {
        // State
        currentDashboard,
        dashboards,
        selectedComponentId,
        isDesignMode,
        showGrid,
        showProperties,
        fullscreen,
        dragState,
        componentDefinitions,
        availableFormats,

        // Computed
        selectedComponent,
        currentFormat,

        // Dashboard methods
        createDashboard,
        loadDashboard,
        saveDashboard,
        deleteDashboard,

        // Component methods
        addComponent,
        updateComponent,
        deleteComponent,

        // Utility methods
        snapToGrid,
        snapSizeToGrid,
        selectComponent,
        setDesignMode,
        toggleFullscreen,

        // CoreDB reference
        db
    }
})
