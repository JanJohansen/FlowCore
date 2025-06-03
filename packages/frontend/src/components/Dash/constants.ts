// Dashboard Constants
export const DASH_GRID_SIZE = 10
export const DASH_MIN_COMPONENT_SIZE = { width: 50, height: 30 }
export const DASH_DEFAULT_COMPONENT_SIZE = { width: 200, height: 100 }
export const DASH_RESIZE_HANDLE_SIZE = 8
export const RESIZE_HANDLES = [
    'nw', 'n', 'ne',
    'w', 'e',
    'sw', 's', 'se'
]
export const DASH_SNAP_THRESHOLD = 5

// Z-index layers
export const Z_INDEX = {
    GRID: 1,
    COMPONENTS: 10,
    SELECTED_COMPONENT: 20,
    RESIZE_HANDLES: 30,
    DRAG_PREVIEW: 40,
    MODALS: 1000
} as const

// Colors
export const DASH_COLORS = {
    GRID: '#333333',
    SELECTION: '#007acc',
    RESIZE_HANDLE: '#007acc',
    COMPONENT_BORDER: '#555555',
    BACKGROUND: '#1a1a1a'
} as const

// Component defaults
export const DEFAULT_COMPONENT_PROPS = {
    backgroundColor: 'transparent',
    borderColor: '#555555',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8
} as const

// Local storage keys
export const DASH_STORAGE_KEYS = {
    DASHBOARDS: 'dashboards',
    CURRENT_DASHBOARD: 'currentDashboard',
    DESIGNER_SETTINGS: 'dashDesignerSettings'
} as const

// Animation durations
export const ANIMATION_DURATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
    DELETE: 'Delete',
    COPY: 'Ctrl+C',
    PASTE: 'Ctrl+V',
    UNDO: 'Ctrl+Z',
    REDO: 'Ctrl+Y',
    SELECT_ALL: 'Ctrl+A',
    SAVE: 'Ctrl+S',
    FULLSCREEN: 'F11',
    GRID_TOGGLE: 'Ctrl+G'
} as const

// Component types
export const COMPONENT_TYPES = {
    TEXT: 'text',
    BUTTON: 'button',
    INPUT: 'input',
    IMAGE: 'image',
    CHART: 'chart',
    CONTAINER: 'container',
    CUSTOM: 'custom'
} as const
