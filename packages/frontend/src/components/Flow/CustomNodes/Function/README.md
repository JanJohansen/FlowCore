# Function Node Documentation

## Overview

The Function node is a highly configurable node in the Flow system that allows users to define custom backend logic and frontend UI through code configuration. It provides a flexible foundation for creating custom functionality while maintaining simplicity for basic use cases.

## Configuration Structure

The node's configuration is stored in `nodeModel.config.ins` with the following properties:

### Configuration Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `displayName` | string | User-friendly name displayed in the node header | "Function" |
| `backendCode` | string | JavaScript code to execute on the backend | "" |
| `nodeUICode` | string | Vue.js component code for the node's frontend UI | "" |
| `inputDefinitions` | object | Defines the node's input ports and their types | `{"input1": {"valueType": "any", "description": "Input 1"}}` |
| `outputDefinitions` | object | Defines the node's output ports and their types | `{"output1": {"valueType": "any", "description": "Output 1"}}` |

### Input/Output Definition Format

```javascript
{
  "inputName": {
    "valueType": "string|number|boolean|object|any",
    "description": "Description of the input"
  }
}
```

## Context Object

Both backend and frontend code receive a comprehensive `context` object providing access to:

### Context Structure

```javascript
context = {
  node: {
    id: "unique-node-id",           // Node's unique identifier
    type: "Function",               // Node type
    name: "node-name",              // Node name
    inputs: {},                     // Current input values
    outputs: {},                    // Current output values  
    config: {},                     // Node configuration
    state: {}                       // Node-specific state storage
  },
  flow: {},                         // Flow-level state storage
  global: {},                       // Global state storage
  nodeType: {}                      // Type-specific state storage
}
```

### Storage Scopes

- **`context.node`**: Node-specific state storage and access to node definition
- **`context.flow`**: Flow-level state storage for communication between nodes in the same flow
- **`context.global`**: Global state storage for communication across different flows
- **`context.nodeType`**: Type-specific state storage for communication between nodes of the same type

## Helper Functions API

The backend code receives a `helpers` object with utility functions:

### Input/Output Operations

```javascript
// Get current input value
const value = helpers.getInput('inputName');

// Set output value
helpers.setOutput('outputName', value);
```

### Logging

```javascript
// Log messages (appears in node's log output)
helpers.log('Message', variable, 'more text');
```

### State Management

```javascript
// Get node state
const state = helpers.getNodeState(); // Get all state
const value = helpers.getNodeState('key'); // Get specific key

// Set node state
helpers.setNodeState('key', value);
```

### Event Handling

```javascript
// Listen to node property changes
helpers.onNodeProperty('propertyName', (value) => {
  console.log('Property changed:', value);
});

// Listen to input changes (reactive programming)
helpers.onInput('inputName', (value) => {
  console.log('Input changed:', value);
});
```

## Backend Code Examples

### Basic Input Processing

```javascript
// Get input value and process it
const input1Value = helpers.getInput('input1');
if (input1Value !== undefined) {
    const result = input1Value * 2;
    helpers.setOutput('output1', result);
    helpers.log('Processed input:', input1Value, '-> output:', result);
}
```

### State Management

```javascript
// Use node state to count executions
let count = helpers.getNodeState('executionCount') || 0;
count++;
helpers.setNodeState('executionCount', count);
helpers.log('Execution count:', count);
```

### Flow Communication

```javascript
// Share data across the flow
context.flow.sharedData = { timestamp: Date.now(), value: input1Value };

// Access shared data from other nodes
if (context.flow.sharedData) {
    helpers.log('Shared data:', context.flow.sharedData);
}
```

### Global Communication

```javascript
// Store data globally (accessible across all flows)
context.global.systemStatus = 'running';

// Access global data
if (context.global.systemStatus) {
    helpers.log('System status:', context.global.systemStatus);
}
```

## Frontend UI Code Examples

### Basic Vue Component

```javascript
export default {
  setup(props) {
    const { ref, computed } = Vue;
    
    // Access node context
    const { context, node } = props;
    
    // Reactive state
    const localValue = ref('');
    
    // Computed properties
    const nodeId = computed(() => node.id);
    
    // Methods
    const handleClick = () => {
      console.log('Button clicked in node:', nodeId.value);
    };
    
    // Template
    const template = `
      <div class="custom-function-ui">
        <h4>Custom Function Node</h4>
        <input v-model="localValue" placeholder="Enter value" />
        <button @click="handleClick">Process</button>
        <p>Node ID: {{ nodeId }}</p>
      </div>
    `;
    
    return {
      localValue,
      nodeId,
      handleClick,
      template
    };
  }
};
```

## Best Practices

### Backend Code

1. **Error Handling**: Always check if input values exist before processing
2. **State Management**: Use node state for persistent data, flow state for communication
3. **Logging**: Use `helpers.log()` for debugging and user feedback
4. **Performance**: Avoid heavy computations in the main execution path

### Frontend Code

1. **Reactivity**: Use Vue's reactive system properly with `ref()` and `computed()`
2. **Props Access**: Always destructure props to access context and node data
3. **Template**: Return template as a string for dynamic rendering
4. **Styling**: Use scoped CSS classes to avoid conflicts

### Configuration

1. **Naming**: Use descriptive names for inputs, outputs, and display name
2. **Types**: Specify appropriate value types for better validation
3. **Descriptions**: Provide clear descriptions for all inputs and outputs
4. **Defaults**: Set sensible default values for optional configurations

## Common Use Cases

### Data Transformation

```javascript
// Transform input data format
const rawData = helpers.getInput('rawData');
if (rawData) {
    const transformed = {
        id: rawData.identifier,
        name: rawData.displayName,
        timestamp: Date.now()
    };
    helpers.setOutput('transformedData', transformed);
}
```

### Conditional Logic

```javascript
// Conditional output based on input
const condition = helpers.getInput('condition');
const value = helpers.getInput('value');

if (condition === 'positive' && value > 0) {
    helpers.setOutput('result', value);
} else if (condition === 'negative' && value < 0) {
    helpers.setOutput('result', Math.abs(value));
} else {
    helpers.setOutput('result', 0);
}
```

### Timer/Counter

```javascript
// Implement a counter with timer
let count = helpers.getNodeState('count') || 0;
const interval = helpers.getInput('interval') || 1000;

// Increment counter
count++;
helpers.setNodeState('count', count);
helpers.setOutput('currentCount', count);

// Reset counter periodically
if (count % 10 === 0) {
    helpers.log('Counter reset at:', count);
    helpers.setNodeState('count', 0);
}
```

## Troubleshooting

### Common Issues

1. **Undefined Input Values**: Always check if input exists before using
2. **State Not Persisting**: Ensure you're using the correct state scope
3. **UI Not Updating**: Check Vue reactivity and template syntax
4. **Logging Not Appearing**: Use `helpers.log()` instead of `console.log()`

### Debugging Tips

1. Use `helpers.log()` to output debug information
2. Check the browser console for JavaScript errors
3. Verify input/output definitions match your code
4. Test with simple examples before adding complexity
