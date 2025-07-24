import path from "path"

export const extensionInfo = {
    name: "Test Node UI Extension",
    description: "A simple extension to test node UI components.",
    version: "1.0.0",
    nodeComponents: {
        testNodeUI: {
            componentPath: path.resolve(__dirname, "./src/components/testNodeUI.vue"),
        },
        ticker: {
            typeName: "Ticker",
            typeUID: "com.flow.ticker",
            icon: "mdi:timer",
            category: "Timing",
            version: "1.0.0",
            author: "Jan Johansen",
            description: "A node that generates ticks at a specified interval.",
            company: "JJ inc.",
            license: "MIT",
            ins: {
                "interval": {
                    "valueType": "number",
                    "description": "Interval in milliseconds between ticks."
                }
            },
            outs: {
                "tick": {
                    "valueType": "number",
                    "description": "Tick output = increasing numerical counter."
                }
            },
            componentPath: path.resolve(__dirname, "./src/components/TickerNodeUI.vue"),
        }
    },
    dashComponent: {
        testDashUI: {
            componentPath: path.resolve(__dirname, "./src/components/testDashUI.vue"),
        }
    },
    pages: {
        testPage: {
            componentPath: path.resolve(__dirname, "./src/pages/testPage.vue"),
            title: "Test Page",
            description: "A simple test page for the extension.",
            icon: "mdi:home",
        }
    }
}
