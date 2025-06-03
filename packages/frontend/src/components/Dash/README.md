# Dashboard System

The Dashboard System provides a comprehensive solution for creating and viewing interactive dashboards with drag-and-drop components, real-time data integration, and customizable layouts.

## Features

### Dashboard Designer (`/dash-designer`)
- **Drag & Drop Interface**: Drag components from the palette onto the canvas
- **Multiple Format Support**: Choose from predefined formats (16:9, 9:16, tablet, phone, etc.) or create custom dimensions
- **Snap to Grid**: Automatic grid alignment for precise component positioning
- **Component Resizing**: Resize components using drag handles
- **Properties Panel**: Edit component properties, position, size, and Vue code
- **Code Editor**: Built-in code editor for custom Vue component templates
- **CoreDB Integration**: Connect component inputs/outputs to CoreDB for real-time data
- **Save/Load**: Persist dashboards using CoreDB storage

### Dashboard Viewer (`/dash-viewer`)
- **Runtime Execution**: View and interact with designed dashboards
- **Fullscreen Mode**: Toggle fullscreen for immersive viewing
- **Real-time Updates**: Components update automatically when connected data changes
- **Responsive Design**: Dashboards scale appropriately for different screen sizes

## Built-in Components

### Text Component
- Displays text with customizable styling
- Properties: text, fontSize, color, fontWeight, textAlign
- Inputs: Dynamic text content via CoreDB

### Button Component
- Interactive button with click events
- Properties: text, variant (primary, secondary, success, danger, warning)
- Outputs: Click events to CoreDB

### Custom Components
- Create custom components using Vue templates
- Full Vue.js syntax support
- Props, computed properties, and methods
- Event handling and data binding

## CoreDB Integration

### Input Connections
Components can receive data from CoreDB by setting input values to `coredb:keyName`:
```
Input: text = "coredb:sensor.temperature"
```

### Output Connections
Components can send data to CoreDB through output events:
```
Button click → "dash:componentId:click" → CoreDB
```

### Real-time Updates
- Automatic listeners for CoreDB changes
- Components update immediately when connected data changes
- Bi-directional data flow between components and external systems

## Usage

### Creating a Dashboard
1. Navigate to `/dash-designer`
2. Click "New" to create a dashboard
3. Choose a format (16:9, tablet, phone, etc.)
4. Drag components from the palette to the canvas
5. Select components to edit properties in the properties panel
6. Connect inputs/outputs to CoreDB keys for data integration
7. Save the dashboard

### Viewing a Dashboard
1. Navigate to `/dash-viewer`
2. Select a dashboard from the dropdown
3. Interact with the live dashboard
4. Use fullscreen mode for presentations

### Custom Components
1. In the component tree, click "Add Custom Component"
2. Enter component name and type ID
3. Write Vue template code:
```vue
<template>
  <div class="my-component">
    <h3>{{ props.title }}</h3>
    <p>Value: {{ props.value }}</p>
    <button @click="$emit('output', 'buttonClick', Date.now())">
      Click Me
    </button>
  </div>
</template>
```

## Architecture

### Store (dashStore.ts)
- Pinia store managing dashboard state
- Component definitions and registry
- CRUD operations for dashboards and components
- CoreDB integration wrapper

### Components
- **DashCanvas**: Main design canvas with drag/drop
- **DashComponentBase**: Base component wrapper with selection/resize
- **DashComponentTree**: Component palette and custom component creator
- **DashPropertiesPanel**: Property editor with code editor
- **DashViewerCanvas**: Runtime dashboard renderer
- **DashGridOverlay**: Visual grid for snap-to-grid functionality

### Built-in Component Library
- Modular component system in `Components/` directory
- Each component is a standalone Vue component
- Consistent props interface for dashboard integration

## Keyboard Shortcuts

### Designer
- `Ctrl+S`: Save dashboard
- `Ctrl+G`: Toggle grid
- `Delete`: Delete selected component

### Viewer
- `F11`: Toggle fullscreen
- `Ctrl+R`: Refresh dashboard
- `Ctrl+H`: Toggle controls

## Data Flow

1. **Design Time**: Components are configured with static props and CoreDB connections
2. **Runtime**: Components establish CoreDB listeners and emit events
3. **Real-time**: Data flows bidirectionally between components and CoreDB
4. **Persistence**: Dashboard configurations are stored in CoreDB

## Extending the System

### Adding New Component Types
1. Create component in `Components/` directory
2. Add definition to `dashStore.ts`
3. Update component type mappings in `DashComponentBase.vue` and `DashViewerCanvas.vue`

### Custom Data Sources
- Extend CoreDB integration for external APIs
- Add custom input/output handlers
- Implement data transformation pipelines

## Best Practices

1. **Component Design**: Keep components focused and reusable
2. **Data Binding**: Use CoreDB keys for dynamic content
3. **Performance**: Minimize watchers and reactive dependencies
4. **Responsive**: Design for multiple screen sizes
5. **Testing**: Test components in both designer and viewer modes
