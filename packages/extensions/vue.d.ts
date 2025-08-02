declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<any, any, any>
    export default component
}

// Add Vue 3 Composition API support
declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties { }
}
