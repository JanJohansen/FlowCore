# CoreDB Requirements Specification

## 1. Core Functionality

### 1.1 Data Storage and Retrieval
- REQ-1.1.1: Must provide key-value storage with string keys and any JSON-serializable values
- REQ-1.1.2: Must support deep object merging for partial updates
- REQ-1.1.3: Must handle null values as property deletions
- REQ-1.1.4: Must support array properties

### 1.2 Reactivity
- REQ-1.2.1: Must provide a subscription mechanism for value changes
- REQ-1.2.2: Must notify subscribers immediately with current value upon subscription
- REQ-1.2.3: Must support multiple subscribers per key
- REQ-1.2.4: Must provide unsubscribe functionality
- REQ-1.2.5: Must deliver patches instead of full objects when possible

## 2. Indexing System

### 2.1 Property Indexing
- REQ-2.1.1: Must support indexing by any property path
- REQ-2.1.2: Must maintain reverse indices for O(1) lookups
- REQ-2.1.3: Must support array property indexing
- REQ-2.1.4: Must automatically update indices on value changes
- REQ-2.1.5: Must support lazy index creation

### 2.2 All-Values Index
- REQ-2.2.1: Must track all unique values for indexed properties
- REQ-2.2.2: Must provide subscription mechanism for all-values changes
- REQ-2.2.3: Must update all-values index atomically with regular indices
- REQ-2.2.4: Must send correct patches when values are added or removed

## 3. Performance Requirements

### 3.1 Time Complexity
- REQ-3.1.1: O(1) for basic get/set operations
- REQ-3.1.2: O(n) for deep object merges where n is object depth
- REQ-3.1.3: O(1) for index lookups
- REQ-3.1.4: O(1) for subscription notifications

### 3.2 Memory Usage
- REQ-3.2.1: Linear memory growth with number of stored objects
- REQ-3.2.2: Linear memory growth with number of indexed properties
- REQ-3.2.3: Linear memory growth with number of subscribers

## 4. Persistence

### 4.1 File Storage
- REQ-4.1.1: Must support saving state to JSON file
- REQ-4.1.2: Must support loading state from JSON file
- REQ-4.1.3: Must handle missing or corrupted files gracefully
- REQ-4.1.4: Must support selective persistence via 'persist' flag

## 5. Network Support

### 5.1 WebSocket Integration
- REQ-5.1.1: Must provide WebSocket server implementation
- REQ-5.1.2: Must support multiple concurrent clients
- REQ-5.1.3: Must handle client disconnections gracefully
- REQ-5.1.4: Must maintain per-client subscription state

## 6. Error Handling

### 6.1 Robustness
- REQ-6.1.1: Must handle invalid inputs gracefully
- REQ-6.1.2: Must prevent memory leaks from unsubscribed listeners
- REQ-6.1.3: Must maintain data consistency during concurrent operations
- REQ-6.1.4: Must validate all incoming patches

## 7. API Requirements

### 7.1 Core API
- REQ-7.1.1: Must provide `set(key: string, patch: any): void`
- REQ-7.1.2: Must provide `get(key: string): any`
- REQ-7.1.3: Must provide `on(key: string, callback: Function): () => void`
- REQ-7.1.4: Must provide singleton access via `getGlobalInstance()`

### 7.2 User API
- REQ-7.2.1: Must provide `CoreDBUser` wrapper class
- REQ-7.2.2: Must handle automatic subscription cleanup
- REQ-7.2.3: Must provide batch operations support
- REQ-7.2.4: Must maintain isolated subscription state per user

## 8. Testing Requirements

### 8.1 Test Coverage
- REQ-8.1.1: Must have unit tests for all core functionality
- REQ-8.1.2: Must have performance benchmarks
- REQ-8.1.3: Must have integration tests for WebSocket functionality
- REQ-8.1.4: Must have stress tests for concurrent operations

## 9. Documentation Requirements

### 9.1 Documentation
- REQ-9.1.1: Must provide API documentation
- REQ-9.1.2: Must document performance characteristics
- REQ-9.1.3: Must provide usage examples
- REQ-9.1.4: Must document limitations and best practices

## 10. Limitations

### 10.1 Known Limitations
- REQ-10.1.1: No support for compound indices
- REQ-10.1.2: No built-in query language
- REQ-10.1.3: No transaction support
- REQ-10.1.4: No automatic conflict resolution