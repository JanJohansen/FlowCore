import path from "path"

export const extensionInfo = {
    name: "Test Node UI Extension",
    description: "A simple extension to test node UI components.",
    version: "1.0.0",
    nodeComponents: {
        testNodeUI: {
            path: path.resolve(__dirname, "./src/components/testNodeUI.vue"),
        }
    },
    dashComponent: {
        testDashUI: {
            path: path.resolve(__dirname, "./src/components/testDashUI.vue"),
        }
    },
    pages: {
        testPage: {
            path: path.resolve(__dirname, "./src/pages/testPage.vue"),
            title: "Test Page",
            description: "A simple test page for the extension.",
            icon: "mdi:home",
        }
    }
}

