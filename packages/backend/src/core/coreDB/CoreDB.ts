import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

// Types
type Callback<T> = (data: T) => void
type UnsubscribeFunction = () => void

interface StoredValue<T> {
    value: T
    patchCallbacks: Callback<any>[]
    setCallbacks: Callback<any>[]
}

interface ReverseIndex {
    [objectId: string]: object
}

interface IndexMap {
    [value: string]: ReverseIndex
}

interface PropertyIndices {
    [property: string]: IndexMap
}

// Value Storage class to handle the key-value store
class ValueStore {
    private store: Map<string, StoredValue<any>> = new Map();

    get(key: string): any {
        return this.store.get(key)?.value
    }

    set(key: string, value: any): void {
        const stored = this.store.get(key)
        if (stored) {
            stored.value = value
        } else {
            this.store.set(key, { value, patchCallbacks: [], setCallbacks: [] })
        }
    }

    addPatchCallback(key: string, callback: Callback<any>): void {
        const stored = this.store.get(key)
        if (!stored) {
            this.store.set(key, { value: undefined, patchCallbacks: [callback], setCallbacks: [] })
        } else if (!stored.patchCallbacks.includes(callback)) {
            stored.patchCallbacks.push(callback)
        }
    }

    addSetCallback(key: string, callback: Callback<any>): void {
        const stored = this.store.get(key)
        if (!stored) {
            this.store.set(key, { value: undefined, patchCallbacks: [], setCallbacks: [callback] })
        } else if (!stored.setCallbacks.includes(callback)) {
            stored.setCallbacks.push(callback)
        }
    }

    removePatchCallback(key: string, callback: Callback<any>): void {
        const stored = this.store.get(key)
        if (!stored) return

        // Create new array without the callback
        stored.patchCallbacks = stored.patchCallbacks.filter((cb: Callback<any>) => cb !== callback)

        if (stored.patchCallbacks.length === 0 && stored.setCallbacks.length === 0) {
            this.store.delete(key)
        } else {
            this.store.set(key, stored)
        }
    }

    removeSetCallback(key: string, callback: Callback<any>): void {
        const stored = this.store.get(key)
        if (!stored) return

        // Create new array without the callback
        stored.setCallbacks = stored.setCallbacks.filter((cb: Callback<any>) => cb !== callback)

        if (stored.patchCallbacks.length === 0 && stored.setCallbacks.length === 0) {
            this.store.delete(key)
        } else {
            this.store.set(key, stored)
        }
    }

    notifyPatch(key: string, data: any): void {
        const stored = this.store.get(key)
        if (!stored) return

        // Create a new array to avoid modification during iteration
        const callbacks = [...stored.patchCallbacks]
        for (const callback of callbacks) {
            try {
                callback(data)
            } catch (error) {
                console.error('Error in patch callback:', error)
            }
        }
    }

    notifySet(key: string, data: any): void {
        const stored = this.store.get(key)
        if (!stored) return

        // Create a new array to avoid modification during iteration
        const callbacks = [...stored.setCallbacks]
        for (const callback of callbacks) {
            try {
                callback(data)
            } catch (error) {
                console.error('Error in set callback:', error)
            }
        }
    }

    has(key: string): boolean {
        return this.store.has(key)
    }
}

// Index Manager to handle all indexing operations
class IndexManager {
    private valueStore: ValueStore
    private indices: { [property: string]: { [value: string]: ReverseIndex } } = {};
    private allValuesIndices: { [property: string]: { [value: string]: {} } } = {};
    private activeIndices: Set<string> = new Set();
    private coreDB: CoreDB

    constructor(valueStore: ValueStore, coreDB: CoreDB) {
        this.valueStore = valueStore
        this.coreDB = coreDB
    }

    activateIndex(property: string): void {
        if (this.activeIndices.has(property)) return

        this.activeIndices.add(property)
        this.indices[property] = {}
        this.allValuesIndices[property] = {}

        // Build initial index state
        const indexPatch: { [value: string]: { [objectId: string]: {} } } = {}
        const allValuesPatch: { [value: string]: {} } = {}

        for (const [objectId, value] of this.coreDB.getAllData()) {
            if (value && typeof value === 'object') {
                const val = value[property]
                if (val != null) {
                    if (Array.isArray(val)) {
                        val.forEach(v => this.addToPatches(property, v, objectId, indexPatch, allValuesPatch))
                    } else if (typeof val !== 'object') {
                        this.addToPatches(property, val, objectId, indexPatch, allValuesPatch)
                    }
                }
            }
        }

        // Apply patches to internal state
        this.indices[property] = indexPatch
        this.allValuesIndices[property] = allValuesPatch

        // Notify subscribers with full initial state
        this.valueStore.notifyPatch(`idx:${property}=?`, allValuesPatch)
        this.valueStore.notifySet(`idx:${property}=?`, allValuesPatch)
    }

    private addToPatches(
        property: string,
        value: any,
        objectId: string,
        indexPatch: { [value: string]: { [objectId: string]: {} } },
        allValuesPatch: { [value: string]: {} }
    ): void {
        if (value == null || typeof value === 'object') return

        // Update index patch
        if (!indexPatch[value]) {
            indexPatch[value] = {}
        }
        indexPatch[value][objectId] = {}

        // Update all-values patch
        allValuesPatch[value] = {}
    }

    updateIndices(objectId: string, oldValue: any, newValue: any): void {
        if (this.activeIndices.size === 0) return

        // Skip index updates if neither old nor new values contain indexed properties
        const hasOldIndexedProps = oldValue && typeof oldValue === 'object' && this.hasIndexedProperties(oldValue)
        const hasNewIndexedProps = newValue && typeof newValue === 'object' && this.hasIndexedProperties(newValue)

        if (!hasOldIndexedProps && !hasNewIndexedProps) {
            return
        }

        for (const property of this.activeIndices) {
            const indexPatch: { [value: string]: { [objectId: string]: {} | null } } = {}
            const allValuesPatch: { [value: string]: {} | null } = {}

            // Remove old indices
            if (oldValue && typeof oldValue === 'object') {
                const oldVal = oldValue[property]
                if (oldVal != null) {
                    if (Array.isArray(oldVal)) {
                        oldVal.forEach(v => this.createRemovePatch(property, v, objectId, indexPatch))
                    } else if (typeof oldVal !== 'object') {
                        this.createRemovePatch(property, oldVal, objectId, indexPatch)
                    }
                }
            }

            // Add new indices
            if (newValue && typeof newValue === 'object') {
                const newVal = newValue[property]
                if (newVal != null) {
                    if (Array.isArray(newVal)) {
                        newVal.forEach(v => this.createAddPatch(property, v, objectId, indexPatch))
                    } else if (typeof newVal !== 'object') {
                        this.createAddPatch(property, newVal, objectId, indexPatch)
                    }
                }
            }

            // Apply patches to internal state and notify subscribers
            this.applyIndexPatches(property, indexPatch, allValuesPatch)
        }
    }

    private createRemovePatch(
        property: string,
        value: any,
        objectId: string,
        indexPatch: { [value: string]: { [objectId: string]: {} | null } }
    ): void {
        if (value == null || typeof value === 'object') return

        if (!indexPatch[value]) {
            indexPatch[value] = {}
        }
        indexPatch[value][objectId] = null
    }

    private createAddPatch(
        property: string,
        value: any,
        objectId: string,
        indexPatch: { [value: string]: { [objectId: string]: {} | null } }
    ): void {
        if (value == null || typeof value === 'object') return

        if (!indexPatch[value]) {
            indexPatch[value] = {}
        }
        indexPatch[value][objectId] = {}
    }

    private applyIndexPatches(
        property: string,
        indexPatch: { [value: string]: { [objectId: string]: {} | null } },
        allValuesPatch: { [value: string]: {} | null }
    ): void {
        // Apply index patches and build all-values patch
        for (const [value, objectPatch] of Object.entries(indexPatch)) {
            if (!this.indices[property][value]) {
                this.indices[property][value] = {}
            }

            let hasObjects = false
            for (const [objectId, action] of Object.entries(objectPatch)) {
                if (action === null) {
                    delete this.indices[property][value][objectId]
                } else {
                    this.indices[property][value][objectId] = {}
                    hasObjects = true
                }
            }

            // Update all-values patch based on whether any objects remain
            if (Object.keys(this.indices[property][value]).length === 0) {
                delete this.indices[property][value]
                allValuesPatch[value] = null
            } else if (hasObjects) {
                allValuesPatch[value] = {}
            }
        }

        // Create complete all-values patch including existing values
        const completeAllValuesPatch: { [value: string]: {} | null } = {}

        // Add existing values that aren't being modified
        for (const [value, objects] of Object.entries(this.allValuesIndices[property])) {
            if (!(value in allValuesPatch)) {
                completeAllValuesPatch[value] = {}
            }
        }

        // Add new patches
        Object.assign(completeAllValuesPatch, allValuesPatch)

        // Apply all-values patches
        for (const [value, action] of Object.entries(allValuesPatch)) {
            if (action === null) {
                delete this.allValuesIndices[property][value]
            } else {
                this.allValuesIndices[property][value] = {}
            }
        }

        // Notify subscribers with patches
        for (const [value, objectPatch] of Object.entries(indexPatch)) {
            this.valueStore.notifyPatch(
                `idx:${property}=${value}`,
                objectPatch
            )
            // For set callbacks, send the complete current index state
            this.valueStore.notifySet(
                `idx:${property}=${value}`,
                this.indices[property][value] || {}
            )
        }

        if (Object.keys(completeAllValuesPatch).length > 0) {
            this.valueStore.notifyPatch(
                `idx:${property}=?`,
                completeAllValuesPatch
            )
            // For set callbacks, send the complete all-values state
            this.valueStore.notifySet(
                `idx:${property}=?`,
                this.allValuesIndices[property] || {}
            )
        }
    }

    getIndex(property: string, value: string): ReverseIndex {
        return this.indices[property]?.[value] || {}
    }

    getAllValues(property: string): { [value: string]: {} } {
        return this.allValuesIndices[property] || {}
    }

    hasActiveIndex(property: string): boolean {
        return this.activeIndices.has(property)
    }

    public hasIndexedProperties(value: any): boolean {
        if (!value || typeof value !== 'object') return false
        return Array.from(this.activeIndices).some(property => property in value)
    }
}

// Object Merger for handling deep merges and patches
class ObjectMerger {
    static merge(target: any, patch: any): any {
        // Fast path: if patch is null/undefined or not an object, return directly
        if (!patch || typeof patch !== 'object') {
            return patch
        }

        // Fast path: if target doesn't exist or isn't an object, return patch
        if (!target || typeof target !== 'object') {
            return patch
        }

        // Fast path: handle arrays
        if (Array.isArray(patch)) {
            return [...patch]
        }

        // Create new object for immutability
        const result = { ...target }

        // Direct property assignment for better performance
        for (const key in patch) {
            const patchValue = patch[key]

            // Fast path: direct assignment for null/undefined/primitive values
            if (!patchValue || typeof patchValue !== 'object') {
                result[key] = patchValue
                continue
            }

            // Fast path: arrays are copied, not merged
            if (Array.isArray(patchValue)) {
                result[key] = [...patchValue]
                continue
            }

            // Only perform deep merge if both values are objects
            result[key] = target[key] && typeof target[key] === 'object' ?
                this.merge(target[key], patchValue) :
                { ...patchValue }
        }

        return result
    }

    /**
     * Calculate the difference between two objects
     * Returns a patch object that represents the changes from oldValue to newValue
     * Uses null values to indicate removed properties
     */
    static diff(oldValue: any, newValue: any): any {
        // If either value is not an object, return the new value
        if (!oldValue || typeof oldValue !== 'object' ||
            !newValue || typeof newValue !== 'object') {
            return newValue
        }

        // Handle arrays - return full array if different
        if (Array.isArray(oldValue) || Array.isArray(newValue)) {
            return JSON.stringify(oldValue) !== JSON.stringify(newValue) ? newValue : {}
        }

        const patch: any = {}
        const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)])

        for (const key of allKeys) {
            const oldVal = oldValue[key]
            const newVal = newValue[key]

            if (!(key in newValue)) {
                // Property was removed
                patch[key] = null
            } else if (!(key in oldValue)) {
                // Property was added
                patch[key] = newVal
            } else if (oldVal !== newVal) {
                // Property was changed
                if (oldVal && typeof oldVal === 'object' &&
                    newVal && typeof newVal === 'object' &&
                    !Array.isArray(oldVal) && !Array.isArray(newVal)) {
                    // Recursively diff nested objects
                    const nestedDiff = this.diff(oldVal, newVal)
                    if (Object.keys(nestedDiff).length > 0) {
                        patch[key] = nestedDiff
                    }
                } else {
                    // Different primitive values or arrays
                    patch[key] = newVal
                }
            }
        }

        return patch
    }
}

// Main CoreDB class
export class CoreDB {
    private valueStore: ValueStore
    private indexManager: IndexManager
    private static instance: CoreDB
    private data: Map<string, any> = new Map();
    private filePath: string = "";

    constructor() {
        this.valueStore = new ValueStore()
        this.indexManager = new IndexManager(this.valueStore, this)
    }

    /**
     * Creates a new CoreDB instance and loads state from a JSON file
     * @param filePath Path to the JSON file
     * @returns A new CoreDB instance with the loaded state
     * @throws Error if file cannot be read or parsed
     */
    public static loadFromFile(filePath: string): CoreDB {
        console.log("Loading CoreDB from file:", filePath)
        if (!this.instance) this.instance = new CoreDB()
        const db = this.instance
        db.filePath = filePath
        try {
            if (!existsSync(filePath)) {
                console.log('File not found:', filePath)
                console.log('Starting with empty CoreDB...')
                return db
            }

            const fileContent = readFileSync(filePath, 'utf8')
            const loadedData = JSON.parse(fileContent)

            // Load data
            for (let key in loadedData) {
                db.patch(key, loadedData[key])
            }

            return db
        } catch (error) {
            console.error('Error loading CoreDB from file:', error)
            return db
        }
    }

    /**
     * Saves persistable objects (with persist: true) to a JSON file
     * @param filePath Path where to save the JSON file
     * @throws Error if file cannot be written
     */
    public saveToFile(filePath?: string): void {
        if (!filePath) filePath = this.filePath
        console.log("Saving CoreDB to file:", filePath)
        try {
            // Filter and collect only persistable objects
            const persistableData: { [key: string]: any } = {}
            for (const [key, value] of this.data.entries()) {
                if (value && typeof value === 'object' && value.persist === true) {
                    persistableData[key] = value
                }
            }

            // Create directory if it doesn't exist
            const dir = dirname(filePath)
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true })
            }

            // Write to file with pretty formatting
            writeFileSync(
                filePath,
                JSON.stringify(persistableData, null, 2),
                'utf8'
            )
        } catch (error) {
            console.error('Error saving CoreDB to file:', error)
            // throw new Error(`Failed to save CoreDB to ${filePath}: ${error.message}`);
        }
    }

    static getGlobalInstance(): CoreDB {
        if (!CoreDB.instance) {
            CoreDB.instance = new CoreDB()
        }
        return CoreDB.instance
    }

    /**
     * Performs partial updates to a key's value using the provided patch object
     * @param key The key to update
     * @param patch The patch object containing the changes to apply
     */
    patch(key: string, patch: any): void {
        const oldValue = this.data.get(key)
        let newValue: any

        // Handle both null and undefined as deletion
        if (patch === null || patch === undefined) {
            newValue = null
            this.data.delete(key)
            // Always update indices on complete object deletion
            this.indexManager.updateIndices(key, oldValue, newValue)
        } else {
            // Check if patch contains any indexed properties before merging
            const hasPatchIndexedProps = patch && typeof patch === 'object' &&
                this.indexManager.hasIndexedProperties(patch)

            newValue = ObjectMerger.merge(oldValue, patch)
            if (newValue !== null) {
                this.data.set(key, newValue)
            } else {
                this.data.delete(key)
            }

            // Only update indices if patch contains indexed properties
            if (hasPatchIndexedProps) {
                this.indexManager.updateIndices(key, oldValue, newValue)
            }
        }

        // Notify patch subscribers with the patch
        this.valueStore.notifyPatch(key, patch)

        // Notify set subscribers with the complete new value
        this.valueStore.notifySet(key, newValue)
    }

    /**
     * Completely overwrites/replaces the value of a key
     * @param key The key to set
     * @param value The new value to set (completely replaces existing value)
     */
    set(key: string, value: any): void {
        const oldValue = this.data.get(key)

        // Handle null/undefined as deletion
        if (value === null || value === undefined) {
            this.data.delete(key)
            this.indexManager.updateIndices(key, oldValue, null)

            // Notify patch subscribers with diff (everything removed)
            if (oldValue !== null && oldValue !== undefined) {
                const diff = ObjectMerger.diff(oldValue, null)
                this.valueStore.notifyPatch(key, diff)
            }

            // Notify set subscribers with null
            this.valueStore.notifySet(key, null)
        } else {
            // Set the new value
            this.data.set(key, value)
            this.indexManager.updateIndices(key, oldValue, value)

            // Calculate diff for patch subscribers
            const diff = ObjectMerger.diff(oldValue, value)
            this.valueStore.notifyPatch(key, diff)

            // Notify set subscribers with complete value
            this.valueStore.notifySet(key, value)
        }
    }

    get(key: string): any {
        const value = this.data.get(key)
        return value === undefined ? null : value
    }

    /**
     * Subscribe to patch changes on a key (receives patch objects)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives patch)
     * @returns Unsubscribe function
     */
    onPatch(key: string, callback: Callback<any>): UnsubscribeFunction {
        // Handle index subscriptions
        if (key.startsWith('idx:')) {
            const property = key.substring(4, key.indexOf('='))
            const value = key.substring(key.indexOf('=') + 1)

            // Only activate index if it's not an all-values query or if we don't have it yet
            if (value !== '?' || !this.indexManager.hasActiveIndex(property)) {
                this.indexManager.activateIndex(property)
            }
        }

        // Create unsubscribe function before adding callback
        const unsubscribe = () => {
            console.log('Unsubscribing from patch:', key)
            this.valueStore.removePatchCallback(key, callback)
        }

        // Add the callback
        this.valueStore.addPatchCallback(key, callback)

        // Handle initial value
        if (key.startsWith('idx:')) {
            const property = key.substring(4, key.indexOf('='))
            const value = key.substring(key.indexOf('=') + 1)
            if (value === '?') {
                callback(this.indexManager.getAllValues(property))
            } else {
                callback(this.indexManager.getIndex(property, value))
            }
        } else {
            callback(this.get(key))
        }

        return unsubscribe
    }

    /**
     * Subscribe to complete value changes on a key (receives full values)
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives complete value)
     * @returns Unsubscribe function
     */
    onSet(key: string, callback: Callback<any>): UnsubscribeFunction {
        // Handle index subscriptions
        if (key.startsWith('idx:')) {
            const property = key.substring(4, key.indexOf('='))
            const value = key.substring(key.indexOf('=') + 1)

            // Only activate index if it's not an all-values query or if we don't have it yet
            if (value !== '?' || !this.indexManager.hasActiveIndex(property)) {
                this.indexManager.activateIndex(property)
            }
        }

        // Create unsubscribe function before adding callback
        const unsubscribe = () => {
            console.log('Unsubscribing from set:', key)
            this.valueStore.removeSetCallback(key, callback)
        }

        // Add the callback
        this.valueStore.addSetCallback(key, callback)

        // Handle initial value
        if (key.startsWith('idx:')) {
            const property = key.substring(4, key.indexOf('='))
            const value = key.substring(key.indexOf('=') + 1)
            if (value === '?') {
                callback(this.indexManager.getAllValues(property))
            } else {
                callback(this.indexManager.getIndex(property, value))
            }
        } else {
            callback(this.get(key))
        }

        return unsubscribe
    }

    /**
     * @deprecated Use onPatch() instead. This method will be removed in a future version.
     * Subscribe to changes on a key (receives patch objects)
     */
    on(key: string, callback: Callback<any>): UnsubscribeFunction {
        console.warn('CoreDB.on() is deprecated. Use onPatch() instead.')
        return this.onPatch(key, callback)
    }

    // Add method to access all data (for IndexManager use)
    getAllData(): IterableIterator<[string, any]> {
        return this.data.entries()
    }
}

/**
 * Wrapper for CoreDB that automatically manages subscriptions
 */
export class CoreDBUser {
    private db: CoreDB
    private subscriptions: Map<string, () => void> = new Map();

    constructor(db?: CoreDB) {
        this.db = db || CoreDB.getGlobalInstance()
    }

    /**
     * Subscribe to patch changes on a key with automatic subscription management
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives patch)
     */
    onPatch(key: string, callback: (data: any) => void): () => void {
        const unsubscribe = this.db.onPatch(key, callback)
        this.subscriptions.set(key + ':patch', unsubscribe)
        return unsubscribe
    }

    /**
     * Subscribe to complete value changes on a key with automatic subscription management
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes (receives complete value)
     */
    onSet(key: string, callback: (data: any) => void): () => void {
        const unsubscribe = this.db.onSet(key, callback)
        this.subscriptions.set(key + ':set', unsubscribe)
        return unsubscribe
    }

    /**
     * @deprecated Use onPatch() instead. This method will be removed in a future version.
     * Subscribe to changes on a key with automatic subscription management
     * @param key The key to subscribe to (can be a regular key or index key starting with 'idx:')
     * @param callback Function to be called when the value changes
     */
    on(key: string, callback: (data: any) => void): () => void {
        console.warn('CoreDBUser.on() is deprecated. Use onPatch() instead.')
        return this.onPatch(key, callback)
    }

    /**
     * Performs partial updates to a key's value
     * @param key The key to update
     * @param patch The patch object containing the changes to apply
     */
    patch(key: string, patch: any): void {
        this.db.patch(key, patch)
    }

    /**
     * Completely overwrites/replaces the value of a key
     * @param key The key to set
     * @param value The new value to set (completely replaces existing value)
     */
    set(key: string, value: any): void {
        this.db.set(key, value)
    }

    /**
     * Gets the current value for a key
     * @param key The key to get
     * @returns The current value or null if not found
     */
    get(key: string): any {
        return this.db.get(key)
    }

    /**
     * Unsubscribe from a specific key
     * @param key The key to unsubscribe from
     */
    unsubscribe(key: string): void {
        // Try both patch and set subscriptions
        const patchUnsubscribe = this.subscriptions.get(key + ':patch')
        const setUnsubscribe = this.subscriptions.get(key + ':set')

        if (patchUnsubscribe) {
            patchUnsubscribe()
            this.subscriptions.delete(key + ':patch')
        }

        if (setUnsubscribe) {
            setUnsubscribe()
            this.subscriptions.delete(key + ':set')
        }
    }

    /**
     * Unsubscribe from all subscriptions
     */
    unsubscribeAll(): void {
        this.subscriptions.forEach(unsub => unsub())
        this.subscriptions.clear()
    }
}
