import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import FlowView from '../views/Flow.vue'
import CoreDBBrowser from '../views/CoreDBBrowser.vue'
import DashDesigner from '../views/DashDesigner.vue'
import DashViewer from '../views/DashViewer.vue'
import ComponentEditor from '../views/ComponentEditor.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/flow',
            name: 'flow',
            component: FlowView
        },
        {
            path: '/coredb',
            name: 'coredb',
            component: CoreDBBrowser
        },
        {
            path: '/dash-designer',
            name: 'dash-designer',
            component: DashDesigner
        },
        {
            path: '/dash-viewer',
            name: 'dash-viewer',
            component: DashViewer
        },
        {
            path: '/component-editor',
            name: 'component-editor',
            component: ComponentEditor
        }
    ]
})

export default router
