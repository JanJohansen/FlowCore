<template>
  <div class="common-package-example">
    <h2>Common Package Example</h2>
    
    <div class="section">
      <h3>Shared Utilities</h3>
      <p>Generated ID: {{ generatedId }}</p>
      <p>Formatted timestamp: {{ formattedTime }}</p>
      
      <h4>Deep Merge Example</h4>
      <pre>{{ JSON.stringify(mergedObject, null, 2) }}</pre>
    </div>
    
    <div class="section">
      <h3>Shared Constants</h3>
      <p>Default API URL: {{ DEFAULT_CONFIG.API_URL }}</p>
      <p>Default WS URL: {{ DEFAULT_CONFIG.WS_URL }}</p>
      <p>Environment: {{ DEFAULT_CONFIG.ENVIRONMENT }}</p>
    </div>
    
    <div class="section">
      <h3>Example Flow</h3>
      <pre>{{ JSON.stringify(exampleFlow, null, 2) }}</pre>
    </div>
    
    <div class="section">
      <h3>CoreDB Connection</h3>
      <p>Status: {{ connectionStatus }}</p>
      <button @click="connectToCoreDB" :disabled="isConnecting">
        {{ isConnecting ? 'Connecting...' : 'Connect to CoreDB' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  generateId, 
  formatTimestamp, 
  deepMerge, 
  DEFAULT_CONFIG,
  createExampleFlow,
  createCoreDBExample,
  type IFlowModel
} from '@webapp/common'

// Reactive data
const generatedId = ref('')
const formattedTime = ref('')
const mergedObject = ref({})
const exampleFlow = ref<IFlowModel | null>(null)
const connectionStatus = ref('disconnected')
const isConnecting = ref(false)

// Initialize examples
onMounted(() => {
  // Generate ID example
  generatedId.value = generateId('example')
  
  // Format timestamp example
  formattedTime.value = formatTimestamp(Date.now())
  
  // Deep merge example
  const baseConfig = {
    api: { timeout: 5000, retries: 3 },
    ui: { theme: 'light' }
  }
  const overrideConfig = {
    api: { timeout: 10000 },
    ui: { language: 'en' }
  }
  mergedObject.value = deepMerge(baseConfig, overrideConfig)
  
  // Create example flow
  exampleFlow.value = createExampleFlow()
})

// CoreDB connection example
const connectToCoreDB = async () => {
  isConnecting.value = true
  connectionStatus.value = 'connecting'
  
  try {
    const client = await createCoreDBExample()
    connectionStatus.value = 'connected'
    console.log('CoreDB client created:', client)
  } catch (error) {
    connectionStatus.value = 'error'
    console.error('Failed to connect to CoreDB:', error)
  } finally {
    isConnecting.value = false
  }
}
</script>

<style scoped>
.common-package-example {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.section h3 {
  margin-top: 0;
  color: #333;
}

.section h4 {
  margin-bottom: 10px;
  color: #666;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 3px;
  overflow-x: auto;
  font-size: 12px;
}

button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #0056b3;
}
</style>
