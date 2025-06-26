# CoreDB

A lightweight, reactive key-value store with indexing capabilities for TypeScript/JavaScript applications.

## Features

-   🔄 Reactive data storage with subscription-based updates
-   📑 Advanced indexing system with property and value tracking
-   🔍 Support for array-based property indexing
-   🔗 Dual update methods: partial patches and complete overwrites
-   🎯 Dual subscription types: patch-based and value-based
-   🎯 Singleton pattern for global state management
-   📞 Remote Procedure Call (RPC) system for distributed function execution

## Core API

### Update Methods

#### patch(key: string, patchObject: any): void

Performs partial updates by merging changes into existing values. Supports:

-   Deep object merging
-   Property deletion using null values
-   Array updates
-   Preserves existing properties not mentioned in patch

```typescript
const db = new CoreDB()

// Initial value
db.set("user1", { name: "John", age: 30, city: "NYC" })

// Partial update - only changes age, preserves name and city
db.patch("user1", { age: 31 })
// Result: { name: 'John', age: 31, city: 'NYC' }

// Delete property with null
db.patch("user1", { city: null })
// Result: { name: 'John', age: 31 }
```

#### set(key: string, value: any): void

Completely overwrites the value at a key. Supports:

-   Full object replacement
-   Complete value reset
-   Removes properties not in new value

```typescript
const db = new CoreDB()

// Initial value
db.patch("user1", { name: "John", age: 30, city: "NYC" })

// Complete overwrite - replaces entire object
db.set("user1", { name: "Jane", age: 25 })
// Result: { name: 'Jane', age: 25 } (city is gone)
```

### Subscription Methods

#### onPatch(key: string, callback: (patch: any) => void): () => void

Subscribes to patch changes on a key. Receives only the changes that were made. Supports:

-   Regular key subscriptions
-   Index-based subscriptions
-   All-values index subscriptions
-   Immediate callback with current value

```typescript
const db = new CoreDB()

// Subscribe to patch changes
const unsubscribe = db.onPatch("user1", (patch) => {
	console.log("Changes:", patch)
})

// When you update:
db.patch("user1", { age: 31 })
// Callback receives: { age: 31 }

db.set("user1", { name: "Jane" })
// Callback receives: { name: 'Jane', age: null } (null = removed)

// Index subscription for patches
db.onPatch("idx:role=admin", (patch) => {
	console.log("Admin users changed:", patch)
	// Output: { user1: {}, user3: {} } (when users are added/removed)
})

// Cleanup
unsubscribe()
```

#### onSet(key: string, callback: (value: any) => void): () => void

Subscribes to complete value changes on a key. Always receives the full current value. Supports:

-   Regular key subscriptions
-   Index-based subscriptions
-   All-values index subscriptions
-   Immediate callback with current value

```typescript
const db = new CoreDB()

// Subscribe to complete values
const unsubscribe = db.onSet("user1", (value) => {
	console.log("Current value:", value)
})

// When you update:
db.patch("user1", { age: 31 })
// Callback receives: { name: 'John', age: 31, city: 'NYC' }

db.set("user1", { name: "Jane" })
// Callback receives: { name: 'Jane' }

// Index subscription for complete values
db.onSet("idx:role=admin", (adminUsers) => {
	console.log("All admin users:", adminUsers)
	// Output: { user1: {}, user3: {} } (complete current state)
})

// Cleanup
unsubscribe()
```

#### on(key: string, callback: (patch: any) => void): () => void

**⚠️ DEPRECATED** - Use `onPatch()` instead. This method will be removed in a future version.

```typescript
// Deprecated - shows warning
const unsubscribe = db.on("user1", (patch) => {
	console.log("User updated:", patch)
})
```

### onCall(key: string, callback: (args: any) => any): () => void

Registers a function that can be called by other clients. Returns an unsubscribe function.

-   Register functions with unique keys
-   Support for async functions
-   Automatic cleanup on disconnect
-   Error handling for failed calls

```typescript
const db = new CoreDB()

// Register a function
const unsubscribe = db.onCall("calculateTotal", async (items) => {
	return items.reduce((sum, item) => sum + item.price, 0)
})

// Later: unregister the function
unsubscribe()
```

### call(key: string, args: any): Promise<any>

Calls a function registered by another client. Returns a promise with the result.

-   Async/await support
-   Error handling for missing functions
-   Timeout handling for long-running calls
-   Type-safe argument passing

```typescript
const db = new CoreDB()

try {
	// Call a remote function
	const total = await db.call("calculateTotal", [{ price: 10 }, { price: 20 }])
	console.log("Total:", total) // Output: 30
} catch (error) {
	console.error("Call failed:", error)
}
```

## Indexing System

CoreDB provides three types of indices:

### 1. Regular Property Index

```typescript
// Query objects where type equals 'typeA'
db.on("idx:type=typeA", (matches) => {
	console.log("TypeA objects:", Object.keys(matches))
})
```

### 2. Array Property Index

```typescript
// Store objects with array properties
db.set("user1", { roles: ["admin", "user"] })
db.set("user2", { roles: ["user"] })

// Query by array value
db.on("idx:roles=admin", (matches) => {
	// Matches objects containing 'admin' in their roles array
})
```

### 3. All-Values Index

```typescript
// Subscribe to all unique values for a property
db.on("idx:status=?", (allStatuses) => {
	// Returns an object with all unique status values as keys
	// Example: { 'active': {}, 'pending': {}, 'completed': {} }
})
```

## Technical Details

### Index Structure

-   **Reverse Index**: Maps property values to object IDs
    ```typescript
    reverseIndex: {
      [property: string]: {
        [value: string]: {
          [objectId: string]: boolean
        }
      }
    }
    ```
-   **All-Values Index**: Tracks unique values for each property
    ```typescript
    allValuesIndex: {
      [property: string]: {
        [value: string]: boolean
      }
    }
    ```

### Performance Characteristics

-   Set operations: O(1) for simple values, O(n) for deep objects
-   Index lookups: O(1)
-   All-values queries: O(1)
-   Memory usage: Linear with number of unique property values

### Remote Function Calling

-   **Registration**: O(1)
    ```typescript
    registeredFunctions: {
      [functionKey: string]: WebSocket
    }
    ```
-   **Call Routing**: O(1)
-   **Memory Usage**: Linear with number of registered functions

## Best Practices

1. **Use Specific Indices**

```typescript
// Prefer specific indices over full object subscriptions
db.on("idx:status=active", (matches) => {}) // Better
db.on("user1", (value) => {}) // More expensive for filtering
```

2. **All-Values Index Usage**

```typescript
// Use for building UI elements like dropdowns
db.on("idx:category=?", (categories) => {
	// Automatically updates when new categories are added/removed
})
```

3. **Memory Management**

```typescript
const unsubscribe = db.on("key", callback)
try {
	// Use subscription
} finally {
	unsubscribe() // Always clean up subscriptions
}
```

4. **Remote Function Calling**

```typescript
// Register functions with clear, namespaced keys
db.onCall("userService:validateEmail", async (email) => {
	// Implementation
})

// Handle errors in both caller and callee
try {
	const result = await db.call("userService:validateEmail", email)
} catch (error) {
	// Handle error
}

// Clean up registrations
const unsubscribe = db.onCall("myFunction", callback)
try {
	// Use function registration
} finally {
	unsubscribe() // Always clean up when done
}
```

## Limitations

-   No support for compound indices
-   No built-in persistence
-   No transaction support
-   No query language for complex filters
-   No built-in function timeout mechanism
-   No support for broadcast calls (one-to-many)
-   No automatic retry mechanism for failed calls
-   Function registration limited to one client per key

## Contributing

Issues and pull requests are welcome! Please ensure:

-   Tests are included
-   Documentation is updated
-   Performance impact is considered

## License

MIT
