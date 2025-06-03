import { defineAsyncComponent } from 'vue'

/**
 * Shared utility for loading dashboard components dynamically
 * Consolidates duplicate component loading logic from DashComponentBase and DashViewerCanvas
 */

export interface ComponentLoadingOptions {
    component: {
        type: string
        vueCode?: string
    }
    componentDefinitions: Record<string, any>
    isRuntime?: boolean
}

/**
 * Load a dashboard component based on type and configuration
 */
export function loadDashComponent({ component, componentDefinitions, isRuntime = false }: ComponentLoadingOptions) {
    // Use built-in components first
    switch (component.type) {
        case "text":
            return defineAsyncComponent(() => import("./Components/DashText.vue"))
        case "button":
            return defineAsyncComponent(() => import("./Components/DashButton.vue"))
        default:
            return loadCustomComponent(component, componentDefinitions, isRuntime)
    }
}

/**
 * Load custom component with Vue template or code
 */
function loadCustomComponent(
    component: { type: string; vueCode?: string },
    componentDefinitions: Record<string, any>,
    isRuntime: boolean
) {
    // Check for runtime Vue code (viewer only)
    if (isRuntime && component.vueCode) {
        return defineAsyncComponent(() =>
            Promise.resolve({
                template: component.vueCode,
                props: ["component"],
                emits: ["output"],
                setup(componentProps: any, { emit }: any) {
                    return {
                        component,
                        $emit: emit,
                        ...componentProps
                    }
                }
            } as any)
        )
    }

    // Check for definition template
    const definition = componentDefinitions[component.type]
    if (definition?.vueTemplate) {
        return defineAsyncComponent(() =>
            Promise.resolve({
                template: definition.vueTemplate,
                props: ["component"],
                emits: ["output"],
                setup(componentProps: any, { emit }: any) {
                    return {
                        component: isRuntime ? component : componentProps.component,
                        $emit: emit,
                        ...componentProps
                    }
                }
            } as any)
        )
    }

    // Fallback component
    return defineAsyncComponent(() =>
        Promise.resolve({
            template: '<div class="fallback-component">{{ component.type }}</div>',
            props: ["component"]
        })
    )
}

/**
 * Utility for generating unique IDs consistently across the application
 */
export function generateId(prefix = 'id'): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Utility for consistent error handling across components
 */
export function handleComponentError(error: Error, context: string): void {
    console.error(`Component error in ${context}:`, error)
    // Could be extended to send to error reporting service
}
