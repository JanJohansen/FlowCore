declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

// Vite environment types
interface ImportMetaEnv {
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
