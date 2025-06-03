import { CoreDB } from "./CoreDB"

describe('CoreDB', () => {
    let db: CoreDB

    beforeEach(() => {
        db = new CoreDB()
    })

    describe('Basic Operations', () => {
        test('should set and get values', () => {
            const callback = jest.fn()
            db.onPatch('testKey', callback)

            db.patch('testKey', 'testValue')

            expect(callback).toHaveBeenCalledWith('testValue')
        })

        test('should handle multiple subscribers', () => {
            const callback1 = jest.fn()
            const callback2 = jest.fn()

            db.onPatch('testKey', callback1)
            db.onPatch('testKey', callback2)

            db.patch('testKey', 'testValue')

            expect(callback1).toHaveBeenCalledWith('testValue')
            expect(callback2).toHaveBeenCalledWith('testValue')
        })

        test('should unsubscribe correctly', () => {
            const callback = jest.fn()

            // Set initial value before subscribing
            db.patch('testKey', 'initial')

            const unsubscribe = db.onPatch('testKey', callback)
            expect(callback).toHaveBeenCalledWith('initial')  // First call with current value

            callback.mockClear()  // Clear the initial call

            db.patch('testKey', 'value1')
            expect(callback).toHaveBeenCalledWith('value1')  // Called with patch

            unsubscribe()
            db.patch('testKey', 'value2')
            expect(callback).not.toHaveBeenCalledWith('value2')  // Should not be called after unsubscribe
        })
    })

    describe('Indexing', () => {
        test('should create simple property index', () => {
            const indexCallback = jest.fn()

            // Set up some objects
            db.patch('obj1', { type: 'typeA' })
            db.patch('obj2', { type: 'typeB' })
            db.patch('obj3', { type: 'typeA' })

            // Subscribe to index
            db.onPatch('idx:type=typeA', indexCallback)

            // Check if callback received correct object IDs
            expect(indexCallback).toHaveBeenCalledWith({
                obj1: {},
                obj3: {}
            })
        })

        test('should handle array property indexing', () => {
            const typeACallback = jest.fn()
            const typeBCallback = jest.fn()

            // Set up objects with array properties
            db.patch('obj1', { type: ['typeA', 'typeB'] })
            db.patch('obj2', { type: ['typeB'] })

            // Subscribe to indices
            db.onPatch('idx:type=typeA', typeACallback)
            db.onPatch('idx:type=typeB', typeBCallback)

            expect(typeACallback).toHaveBeenCalledWith({ obj1: {} })
            expect(typeBCallback).toHaveBeenCalledWith({
                obj1: {},
                obj2: {}
            })
        })

        test('should update indices when objects change', () => {
            const callback = jest.fn()

            // Initial setup
            db.patch('obj1', { type: 'typeA' })
            db.onPatch('idx:type=typeA', callback)

            expect(callback).toHaveBeenCalledWith({ obj1: {} })

            // Update object
            db.patch('obj1', { type: 'typeB' })

            expect(callback).toHaveBeenCalledWith({})
        })

        test('should handle nested properties correctly', () => {
            const callback = jest.fn()

            // Set up object with nested property
            db.patch('obj1', { nested: { type: 'typeA' } })
            db.patch('obj1.nested.type', 'typeB')

            // Subscribe to index
            db.onPatch('idx:type=typeA', callback)

            // Nested properties should not be indexed
            expect(callback).toHaveBeenCalledWith({})
        })
    })

    describe('Edge Cases', () => {
        test('should handle undefined and null values', () => {
            const callback = jest.fn()
            db.onPatch('testKey', callback)

            db.patch('testKey', undefined)
            expect(callback).toHaveBeenCalledWith(undefined)

            db.patch('testKey', null)
            expect(callback).toHaveBeenCalledWith(null)
        })

        test('should handle object deletion from indices', () => {
            const callback = jest.fn()

            // Create indexed object
            db.patch('obj1', { type: 'typeA' })
            db.onPatch('idx:type=typeA', callback)

            expect(callback).toHaveBeenCalledWith({ obj1: {} })

            // Delete object
            db.patch('obj1', undefined)

            expect(callback).toHaveBeenCalledWith({})
        })
    })

    describe('Singleton Pattern', () => {
        test('should maintain single instance', () => {
            const instance1 = CoreDB.getGlobalInstance()
            const instance2 = CoreDB.getGlobalInstance()

            expect(instance1).toBe(instance2)
        })

        test('should share state between references', () => {
            const instance1 = CoreDB.getGlobalInstance()
            const instance2 = CoreDB.getGlobalInstance()

            const callback = jest.fn()
            instance1.onPatch('testKey', callback)

            instance2.patch('testKey', 'testValue')

            expect(callback).toHaveBeenCalledWith('testValue')
        })
    })

    describe('Patch Operations', () => {
        test('should handle shallow patches correctly', () => {
            const callback = jest.fn()
            db.onPatch('testObj', callback)

            // Initial full object
            db.patch('testObj', { name: 'John', age: 30 })
            expect(callback).toHaveBeenCalledWith({ name: 'John', age: 30 })

            // Patch update
            callback.mockClear()
            db.patch('testObj', { age: 31 })
            expect(callback).toHaveBeenCalledWith({ age: 31 })
        })

        test('should handle nested patches correctly', () => {
            const callback = jest.fn()
            db.onPatch('testObj', callback)

            // Initial full object
            db.patch('testObj', {
                name: 'John',
                address: {
                    city: 'New York',
                    zip: '10001'
                }
            })

            callback.mockClear()
            // Patch nested property
            db.patch('testObj', {
                address: {
                    zip: '10002'
                }
            })

            expect(callback).toHaveBeenCalledWith({
                address: {
                    zip: '10002'
                }
            })
        })

        test('should handle array patches correctly', () => {
            const callback = jest.fn()
            db.onPatch('testObj', callback)

            // Initial full object
            db.patch('testObj', {
                name: 'John',
                roles: ['user']
            })

            callback.mockClear()
            // Patch array
            db.patch('testObj', {
                roles: ['user', 'admin']
            })

            expect(callback).toHaveBeenCalledWith({
                roles: ['user', 'admin']
            })
        })

        test('should handle property deletion with null values', () => {
            const callback = jest.fn()
            db.onPatch('testObj', callback)

            // Initial full object
            db.patch('testObj', {
                name: 'John',
                age: 30,
                optional: 'value'
            })

            callback.mockClear()
            // Delete property using null
            db.patch('testObj', {
                optional: null
            })

            expect(callback).toHaveBeenCalledWith({
                optional: null
            })
        })

        test('should maintain correct internal state after patches', () => {
            const callback = jest.fn()
            db.onPatch('testObj', callback)

            // Initial state
            db.patch('testObj', {
                name: 'John',
                age: 30,
                address: {
                    city: 'New York',
                    zip: '10001'
                }
            })

            // Apply multiple patches
            db.patch('testObj', { age: 31 })
            db.patch('testObj', {
                address: {
                    zip: '10002'
                }
            })

            // Subscribe new callback to verify full state
            const verifyCallback = jest.fn()
            db.onPatch('testObj', verifyCallback)

            // Verify full object state
            expect(verifyCallback).toHaveBeenCalledWith({
                name: 'John',
                age: 31,
                address: {
                    city: 'New York',
                    zip: '10002'
                }
            })
        })

        test('should handle object replacement after null', () => {
            const callback = jest.fn()

            // Initial state
            db.patch('testObj', {
                name: 'John',
                age: 30
            })

            // Subscribe and clear initial callback
            db.onPatch('testObj', callback)
            callback.mockClear()

            // Set to null first
            db.patch('testObj', null)

            // Set new value
            db.patch('testObj', {
                name: 'Jane',
                role: 'admin'
            })

            // Should have been called with null first, then the new object
            expect(callback).toHaveBeenNthCalledWith(1, null)
            expect(callback).toHaveBeenNthCalledWith(2, {
                name: 'Jane',
                role: 'admin'
            })
        })

        test('should handle patches with index updates', () => {
            const indexCallback = jest.fn()

            // Initial object with indexed property
            db.patch('user1', { role: 'user' })
            db.onPatch('idx:role=admin', indexCallback)

            expect(indexCallback).toHaveBeenCalledWith({})

            // Update with patch that affects index
            db.patch('user1', { role: 'admin' })

            expect(indexCallback).toHaveBeenCalledWith({
                user1: {}
            })
        })
    })

    describe('All Values Index', () => {
        test('should track all possible values for a property', () => {
            const callback = jest.fn()

            // Subscribe to all values index before adding any data
            db.onPatch('idx:type=?', callback)
            expect(callback).toHaveBeenCalledWith({})

            // Add objects with different types
            db.patch('obj1', { type: 'typeA' })
            expect(callback).toHaveBeenCalledWith({ typeA: {} })

            db.patch('obj2', { type: 'typeB' })
            expect(callback).toHaveBeenCalledWith({ typeA: {}, typeB: {} })
        })

        test('should remove values when no objects have that value', () => {
            const callback = jest.fn()

            // Set up initial objects
            db.patch('obj1', { type: 'typeA' })
            db.patch('obj2', { type: 'typeB' })

            // Create the index first
            db.onPatch('idx:type=typeA', () => { })
            db.onPatch('idx:type=typeB', () => { })

            // Subscribe to all-values index after data exists
            db.onPatch('idx:type=?', callback)
            expect(callback).toHaveBeenCalledWith({ typeA: {}, typeB: {} })

            callback.mockClear()

            // Remove last object with typeA
            db.patch('obj1', { type: 'typeB' })
            expect(callback).toHaveBeenCalledWith({ typeA: null, typeB: {} })
        })

        test('should handle array properties', () => {
            const callback = jest.fn()

            db.onPatch('idx:tags=?', callback)
            expect(callback).toHaveBeenCalledWith({})

            // Add object with array values
            db.patch('obj1', { tags: ['tag1', 'tag2'] })
            expect(callback).toHaveBeenCalledWith({ tag1: {}, tag2: {} })

            // Add another object with overlapping tags
            db.patch('obj2', { tags: ['tag2', 'tag3'] })
            expect(callback).toHaveBeenCalledWith({ tag1: {}, tag2: {}, tag3: {} })

            // Remove object, but tag2 should remain due to obj2
            db.patch('obj1', undefined)
            expect(callback).toHaveBeenCalledWith({ tag2: {}, tag3: {} })
        })

        test('should handle value updates', () => {
            const callback = jest.fn()

            // Initial setup
            db.patch('obj1', { status: 'active' })
            db.patch('obj2', { status: 'pending' })

            db.onPatch('idx:status=?', callback)
            expect(callback).toHaveBeenCalledWith({ active: {}, pending: {} })

            // Update value
            db.patch('obj1', { status: 'completed' })
            expect(callback).toHaveBeenCalledWith({ completed: {}, pending: {} })
        })

        test('should handle multiple subscribers to all-values index', () => {
            const callback1 = jest.fn()
            const callback2 = jest.fn()

            db.onPatch('idx:type=?', callback1)
            db.onPatch('idx:type=?', callback2)

            db.patch('obj1', { type: 'typeA' })

            expect(callback1).toHaveBeenCalledWith({ typeA: {} })
            expect(callback2).toHaveBeenCalledWith({ typeA: {} })
        })

        test('should maintain all-values index alongside regular indices', () => {
            const allValuesCallback = jest.fn()
            const specificValueCallback = jest.fn()

            db.onPatch('idx:category=?', allValuesCallback)
            db.onPatch('idx:category=electronics', specificValueCallback)

            // Add objects
            db.patch('obj1', { category: 'electronics' })
            db.patch('obj2', { category: 'books' })

            expect(allValuesCallback).toHaveBeenCalledWith({
                electronics: {},
                books: {}
            })
            expect(specificValueCallback).toHaveBeenCalledWith({
                obj1: {}
            })
        })

        test('should handle null and undefined values', () => {
            const callback = jest.fn()

            db.onPatch('idx:status=?', callback)

            // Set initial value
            db.patch('obj1', { status: 'active' })
            expect(callback).toHaveBeenCalledWith({ active: {} })

            // Set null value (should not be indexed)
            db.patch('obj1', { status: null })
            expect(callback).toHaveBeenCalledWith({})

            // Set undefined value (should not be indexed)
            db.patch('obj2', { status: undefined })
            expect(callback).toHaveBeenCalledWith({})
        })

        test('should update all-values index when property value changes with correct patches', () => {
            const allValuesCallback = jest.fn()
            const typeACallback = jest.fn()
            const typeBCallback = jest.fn()
            const typeCCallback = jest.fn()

            // Initial setup
            db.patch('obj1', { type: 'typeA' })
            db.patch('obj2', { type: 'typeB' })

            // Subscribe to specific indices first to ensure they're created
            db.onPatch('idx:type=typeA', typeACallback)
            db.onPatch('idx:type=typeB', typeBCallback)
            db.onPatch('idx:type=typeC', typeCCallback)

            // Clear initial callbacks
            typeACallback.mockClear()
            typeBCallback.mockClear()
            typeCCallback.mockClear()

            // Subscribe to all-values index
            db.onPatch('idx:type=?', allValuesCallback)
            expect(allValuesCallback).toHaveBeenCalledWith({
                typeA: {},
                typeB: {}
            })

            allValuesCallback.mockClear()

            // Change obj1's type from typeA to typeC
            db.patch('obj1', { type: 'typeC' })

            // Verify specific index callbacks
            expect(typeACallback).toHaveBeenCalledWith({ obj1: null })
            expect(typeCCallback).toHaveBeenCalledWith({ obj1: {} })

            // Verify all-values index update
            expect(allValuesCallback).toHaveBeenCalledWith({
                typeA: null,
                typeB: {},
                typeC: {}
            })

            allValuesCallback.mockClear()
            typeACallback.mockClear()
            typeBCallback.mockClear()
            typeCCallback.mockClear()

            // Change obj2's type from typeB to typeC
            db.patch('obj2', { type: 'typeC' })

            // Verify specific index callbacks
            expect(typeBCallback).toHaveBeenCalledWith({ obj2: null })
            expect(typeCCallback).toHaveBeenCalledWith({ obj2: {} })

            // Verify all-values index shows only typeC
            expect(allValuesCallback).toHaveBeenCalledWith({
                typeB: null,
                typeC: {}
            })
        })

        test('should update type index and all-values index when changing type property', () => {
            const allValuesCallback = jest.fn()
            const typeACallback = jest.fn()
            const typeBCallback = jest.fn()

            // Initial setup 
            db.patch('obj1', { type: 'typeA' })

            // Subscribe to indices
            db.onPatch('idx:type=typeA', typeACallback)
            db.onPatch('idx:type=typeB', typeBCallback)
            db.onPatch('idx:type=?', allValuesCallback)

            // Clear initial callbacks
            typeACallback.mockClear()
            allValuesCallback.mockClear()

            // Verify initial state
            expect(db.get('obj1')).toEqual({ type: 'typeA' })

            // Change type using patch
            db.patch('obj1', { type: 'typeB' })

            // Verify type index callbacks
            expect(typeACallback).toHaveBeenCalledWith({ obj1: null })
            expect(typeBCallback).toHaveBeenCalledWith({ obj1: {} })

            // Verify all-values index update
            expect(allValuesCallback).toHaveBeenCalledWith({
                typeA: null,
                typeB: {}
            })

            // Verify final state
            expect(db.get('obj1')).toEqual({ type: 'typeB' })
        })

        test('should update all-values index when changing existing type property', () => {
            const allValuesCallback = jest.fn()

            // Initial setup with multiple objects
            db.patch('obj1', { type: 'typeA' })
            db.patch('obj2', { type: 'typeA' })
            db.patch('obj3', { type: 'typeB' })

            // Subscribe to all-values index
            db.onPatch('idx:type=?', allValuesCallback)

            // Verify initial state
            expect(allValuesCallback).toHaveBeenCalledWith({
                typeA: {},
                typeB: {}
            })

            allValuesCallback.mockClear()

            // Change type of obj1 from typeA to typeB
            db.patch('obj1', { type: 'typeB' })

            // Should still show both types since obj2 still has typeA
            expect(allValuesCallback).toHaveBeenCalledWith({
                typeA: {},
                typeB: {}
            })

            allValuesCallback.mockClear()

            // Change last object with typeA to typeB
            db.patch('obj2', { type: 'typeB' })

            // Now typeA should be removed since no objects have it
            expect(allValuesCallback).toHaveBeenCalledWith({
                typeA: null,
                typeB: {}
            })
        })
    })

    describe('Key Removal', () => {
        test('should properly remove key-value pair using null', () => {
            const callback = jest.fn()
            const indexCallback = jest.fn()

            // Initial setup
            db.patch('user1', {
                name: 'John',
                role: 'admin',
                settings: {
                    theme: 'dark',
                    notifications: true
                }
            })

            // Set up subscribers
            db.onPatch('user1', callback)
            db.onPatch('idx:role=admin', indexCallback)

            // Clear mocks after initial setup
            callback.mockClear()
            indexCallback.mockClear()

            // Remove the key using null
            db.patch('user1', null)

            // Verify callbacks
            expect(callback).toHaveBeenCalledWith(null)
            expect(indexCallback).toHaveBeenCalledWith({ user1: null })

            // Verify the key is completely removed
            expect(db.get('user1')).toBeNull()

            // Set new value to verify clean slate
            db.patch('user1', { name: 'Jane', role: 'user' })
            expect(callback).toHaveBeenLastCalledWith({
                name: 'Jane',
                role: 'user'
            })

            // Verify no remnants of old indices exist
            const adminIndexCallback = jest.fn()
            db.onPatch('idx:role=admin', adminIndexCallback)
            expect(adminIndexCallback).toHaveBeenCalledWith({})
        })

        test('should handle null value in nested updates', () => {
            const callback = jest.fn()

            // Initial setup
            db.patch('user1', {
                name: 'John',
                metadata: {
                    role: 'admin',
                    preferences: {
                        theme: 'dark'
                    }
                }
            })

            db.onPatch('user1', callback)
            callback.mockClear()

            // Remove nested object using null
            db.patch('user1', {
                metadata: {
                    preferences: null
                }
            })

            // Verify the patch is correctly propagated
            expect(callback).toHaveBeenCalledWith({
                metadata: {
                    preferences: null
                }
            })

            // Verify the final state
            expect(db.get('user1')).toEqual({
                name: 'John',
                metadata: {
                    role: 'admin',
                    preferences: null
                }
            })
        })
    })

    test('should not trigger index updates for non-indexed property patches', () => {
        const typeIndexCallback = jest.fn()
        const allValuesCallback = jest.fn()

        // Initial setup with indexed property
        db.patch('obj1', {
            type: 'typeA',      // indexed property
            name: 'test',       // non-indexed property
            metadata: {         // nested non-indexed properties
                created: Date.now(),
                modified: Date.now()
            }
        })

        // Subscribe to specific type index and all-values index
        db.onPatch('idx:type=typeA', typeIndexCallback)
        db.onPatch('idx:type=?', allValuesCallback)

        // Clear initial callbacks
        typeIndexCallback.mockClear()
        allValuesCallback.mockClear()

        // Update non-indexed properties
        db.patch('obj1', {
            name: 'updated name',
            metadata: {
                modified: Date.now()
            }
        })

        // Verify no index callbacks were triggered
        expect(typeIndexCallback).not.toHaveBeenCalled()
        expect(allValuesCallback).not.toHaveBeenCalled()

        // Verify the object was actually updated
        expect(db.get('obj1').name).toBe('updated name')
    })
})
