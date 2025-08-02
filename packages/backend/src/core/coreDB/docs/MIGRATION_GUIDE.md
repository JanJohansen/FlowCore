# CoreDB API Migration Guide

## Overview

CoreDB has been updated with a new, more explicit API that separates partial updates from complete overwrites and
provides different subscription types for different use cases.

## Key Changes

### 1. Method Renaming and New Methods

#### Update Methods

-   **OLD**: `set(key, patch)` - Actually performed partial updates (confusing name)
-   **NEW**:
    -   `patch(key, patchObject)` - Performs partial updates (same behavior as old `set`)
    -   `set(key, value)` - Completely overwrites values (new behavior)

#### Subscription Methods

-   **OLD**: `on(key, callback)` - Received patch objects
-   **NEW**:
    -   `onPatch(key, callback)` - Receives patch objects (same as old `on`)
    -   `onSet(key, callback)` - Receives complete current values (new)

### 2. Behavioral Changes

#### Patch vs Set Operations

```typescript
// OLD API (confusing)
db.set("user:1", { name: "John", age: 30 }) // Actually did partial update
db.set("user:1", { age: 31 }) // Merged with existing data

// NEW API (clear)
db.set("user:1", { name: "John", age: 30 }) // Complete overwrite
db.patch("user:1", { age: 31 }) // Partial update (merges)
db.set("user:1", { name: "Jane" }) // Complete overwrite (age is gone)
```

#### Subscription Types

```typescript
// OLD API
db.on("user:1", (patch) => {
	// Always received patch objects
})

// NEW API
db.onPatch("user:1", (patch) => {
	// Receives patch objects (what changed)
})

db.onSet("user:1", (value) => {
	// Receives complete current value
})
```

## Migration Steps

### Step 1: Update Method Calls

#### Backend Code

```typescript
// OLD
const dbUser = new CoreDBUser()
dbUser.on("user:123", (patch) => {
	/* handle patch */
})
dbUser.patch("user:123", { name: "John" }) // This was actually partial update

// NEW
const dbUser = new CoreDBUser()
dbUser.onPatch("user:123", (patch) => {
	/* handle patch */
}) // Same behavior
dbUser.onSet("user:123", (value) => {
	/* handle complete value */
}) // New option
dbUser.patch("user:123", { name: "John" }) // Partial update (same as before)
dbUser.set("user:123", { name: "John" }) // Complete overwrite (new)
```

#### Frontend Code

```typescript
// OLD
wrapper.on("user:123", (patch) => {
	/* handle patch */
})
await wrapper.set("user:123", { name: "John" })

// NEW
wrapper.onPatch("user:123", (patch) => {
	/* handle patch */
})
wrapper.onSet("user:123", (value) => {
	/* handle complete value */
})
await wrapper.patch("user:123", { name: "John" }) // Partial update
await wrapper.set("user:123", { name: "John" }) // Complete overwrite
```

### Step 2: Update WebSocket Message Types

#### Frontend Message Types

```typescript
// OLD
interface CoreDBMessage {
	cmd?: "set" | "on" | "unsubscribe" | "onCall"
	// ...
}

// NEW
interface CoreDBMessage {
	cmd?: "set" | "patch" | "on" | "onPatch" | "onSet" | "unsubscribe" | "onCall"
	// ...
}
```

### Step 3: Update Utility Methods

#### Frontend Patch Application

```typescript
// OLD
wrapper.patch(target, source) // Utility method

// NEW
wrapper.applyPatch(target, source) // Renamed for clarity
```

## Compatibility

### Backward Compatibility

-   The old `on()` method still works but shows deprecation warnings
-   Existing `patch()` calls continue to work as before
-   The old `set()` behavior is now available as `patch()`

### Breaking Changes

-   `set()` now performs complete overwrites instead of partial updates
-   WebSocket protocol requires new message types for full functionality
-   Frontend utility method `patch()` renamed to `applyPatch()`

## Examples

### User Management Migration

#### Before

```typescript
// Backend
db.on("idx:type=user", (patch) => {
	console.log("User changes:", patch)
})
db.set("user:1", { type: "user", name: "Alice" })
db.set("user:1", { lastLogin: new Date() }) // Merged with existing

// Frontend
wrapper.on("idx:type=user", (patch) => {
	wrapper.patch(userList, patch)
})
```

#### After

```typescript
// Backend - Choose appropriate subscription type
db.onPatch("idx:type=user", (patch) => {
	console.log("User changes:", patch)
})
db.onSet("idx:type=user", (users) => {
	console.log("All users:", users)
})

db.set("user:1", { type: "user", name: "Alice" }) // Complete object
db.patch("user:1", { lastLogin: new Date() }) // Partial update

// Frontend
wrapper.onPatch("idx:type=user", (patch) => {
	wrapper.applyPatch(userList, patch)
})
wrapper.onSet("idx:type=user", (users) => {
	userList.value = users // Complete replacement
})
```

### Real-time Chat Migration

#### Before

```typescript
db.on("idx:channel=general", (patch) => {
	Object.keys(patch).forEach((messageId) => {
		if (patch[messageId] !== null) {
			displayMessage(db.get(messageId))
		}
	})
})

db.set("msg:123", {
	channel: "general",
	text: "Hello!",
	user: "Alice"
})
```

#### After

```typescript
// For new messages (patches)
db.onPatch("idx:channel=general", (patch) => {
	Object.keys(patch).forEach((messageId) => {
		if (patch[messageId] !== null) {
			displayMessage(db.get(messageId))
		}
	})
})

// For initial load (complete state)
db.onSet("idx:channel=general", (messages) => {
	displayAllMessages(messages)
})

// Create message (complete object)
db.set("msg:123", {
	channel: "general",
	text: "Hello!",
	user: "Alice"
})

// Update message (partial)
db.patch("msg:123", { edited: true })
```

## Testing

All existing tests have been updated to use the new API. The test suite includes:

-   **CoreDB.test.ts**: Updated to use `onPatch()` instead of deprecated `on()`
-   **CoreDB.newAPI.test.ts**: Comprehensive tests for new functionality
-   **CoreDB.performance.test.ts**: Performance tests with new API

Run tests with:

```bash
npm test -- --testPathPattern=CoreDB
```

## Deprecation Timeline

-   **Current**: Old `on()` method shows warnings but continues to work
-   **Next Version**: Old `on()` method will be removed
-   **Frontend**: Old `patch()` utility method shows warnings, use `applyPatch()`

## Benefits of New API

1. **Clarity**: Method names clearly indicate their behavior
2. **Flexibility**: Choose between patch-based and value-based subscriptions
3. **Performance**: Value-based subscriptions avoid patch application overhead
4. **Correctness**: Separate methods for partial vs complete updates prevent confusion
5. **Debugging**: Easier to understand what operations are being performed
