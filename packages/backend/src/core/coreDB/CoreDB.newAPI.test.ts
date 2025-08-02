import { CoreDB } from "./CoreDB"

describe('CoreDB New API', () => {
    let db: CoreDB

    beforeEach(() => {
        db = new CoreDB()
    })

    describe('patch() vs set() behavior', () => {
        test('patch() should perform partial updates', () => {
            // Initial object
            db.set('user1', { name: 'John', age: 30, city: 'NYC' })

            // Patch should only update specified properties
            db.patch('user1', { age: 31 })

            const result = db.get('user1')
            expect(result).toEqual({ name: 'John', age: 31, city: 'NYC' })
        })

        test('set() should completely overwrite values', () => {
            // Initial object
            db.set('user1', { name: 'John', age: 30, city: 'NYC' })

            // Set should completely replace the object
            db.set('user1', { name: 'Jane', age: 25 })

            const result = db.get('user1')
            expect(result).toEqual({ name: 'Jane', age: 25 })
            // city should be gone
            expect(result.city).toBeUndefined()
        })
    })

    describe('onPatch() vs onSet() callbacks', () => {
        test('onPatch() should receive patch objects', () => {
            const patchCallback = jest.fn()

            db.onPatch('user1', patchCallback)

            // Initial value should be sent
            expect(patchCallback).toHaveBeenCalledWith(null)

            // Set initial value
            db.set('user1', { name: 'John', age: 30 })
            expect(patchCallback).toHaveBeenCalledWith({ name: 'John', age: 30 })

            // Patch should send only the patch
            db.patch('user1', { age: 31 })
            expect(patchCallback).toHaveBeenCalledWith({ age: 31 })
        })

        test('onSet() should receive complete values', () => {
            const setCallback = jest.fn()

            db.onSet('user1', setCallback)

            // Initial value should be sent
            expect(setCallback).toHaveBeenCalledWith(null)

            // Set initial value
            db.set('user1', { name: 'John', age: 30 })
            expect(setCallback).toHaveBeenCalledWith({ name: 'John', age: 30 })

            // Patch should send complete updated value
            db.patch('user1', { age: 31 })
            expect(setCallback).toHaveBeenCalledWith({ name: 'John', age: 31 })
        })

        test('set() should trigger onPatch() with diff', () => {
            const patchCallback = jest.fn()

            // Set initial value
            db.set('user1', { name: 'John', age: 30, city: 'NYC' })

            db.onPatch('user1', patchCallback)

            // Clear initial call
            patchCallback.mockClear()

            // Set new value should trigger patch with diff
            db.set('user1', { name: 'Jane', age: 25 })

            // Should receive diff showing changes
            expect(patchCallback).toHaveBeenCalledWith({
                name: 'Jane',
                age: 25,
                city: null  // removed property
            })
        })

        test('both callbacks should work together', () => {
            const patchCallback = jest.fn()
            const setCallback = jest.fn()

            db.onPatch('user1', patchCallback)
            db.onSet('user1', setCallback)

            // Clear initial calls
            patchCallback.mockClear()
            setCallback.mockClear()

            // Patch operation
            db.patch('user1', { name: 'John' })

            expect(patchCallback).toHaveBeenCalledWith({ name: 'John' })
            expect(setCallback).toHaveBeenCalledWith({ name: 'John' })

            // Set operation
            patchCallback.mockClear()
            setCallback.mockClear()

            db.set('user1', { name: 'Jane', age: 25 })

            // Patch callback gets diff, set callback gets complete value
            expect(patchCallback).toHaveBeenCalledWith({ name: 'Jane', age: 25 })
            expect(setCallback).toHaveBeenCalledWith({ name: 'Jane', age: 25 })
        })
    })

    describe('index subscriptions with new API', () => {
        test('onPatch() should work with indices', () => {
            const callback = jest.fn()

            db.onPatch('idx:type=?', callback)

            // Should receive initial empty state
            expect(callback).toHaveBeenCalledWith({})

            callback.mockClear()

            // Add object
            db.set('obj1', { type: 'typeA' })

            // Should receive patch for index
            expect(callback).toHaveBeenCalledWith({ typeA: {} })
        })

        test('onSet() should work with indices', () => {
            const callback = jest.fn()

            db.onSet('idx:type=?', callback)

            // Should receive initial empty state
            expect(callback).toHaveBeenCalledWith({})

            callback.mockClear()

            // Add object
            db.set('obj1', { type: 'typeA' })

            // Should receive complete index state
            expect(callback).toHaveBeenCalledWith({ typeA: {} })
        })
    })

    describe('diff calculation', () => {
        test('should calculate correct diffs for nested objects', () => {
            db.set('obj1', {
                user: { name: 'John', age: 30 },
                settings: { theme: 'dark', lang: 'en' }
            })

            const patchCallback = jest.fn()
            db.onPatch('obj1', patchCallback)
            patchCallback.mockClear()

            // Update with new structure
            db.set('obj1', {
                user: { name: 'Jane', age: 30 },
                settings: { theme: 'light' }
            })

            expect(patchCallback).toHaveBeenCalledWith({
                user: { name: 'Jane' },
                settings: { theme: 'light', lang: null }
            })
        })

        test('should handle array changes', () => {
            db.set('obj1', { tags: ['a', 'b', 'c'] })

            const patchCallback = jest.fn()
            db.onPatch('obj1', patchCallback)
            patchCallback.mockClear()

            db.set('obj1', { tags: ['x', 'y'] })

            expect(patchCallback).toHaveBeenCalledWith({
                tags: ['x', 'y']
            })
        })
    })

    describe('CoreDBUser with new API', () => {
        test('should support both onPatch and onSet', () => {
            const user = new (require('./CoreDB').CoreDBUser)(db)

            const patchCallback = jest.fn()
            const setCallback = jest.fn()

            user.onPatch('user1', patchCallback)
            user.onSet('user1', setCallback)

            user.patch('user1', { name: 'John' })

            expect(patchCallback).toHaveBeenCalledWith({ name: 'John' })
            expect(setCallback).toHaveBeenCalledWith({ name: 'John' })
        })

        test('should support both patch() and set() methods', () => {
            const user = new (require('./CoreDB').CoreDBUser)(db)

            user.set('user1', { name: 'John', age: 30 })
            expect(user.get('user1')).toEqual({ name: 'John', age: 30 })

            user.patch('user1', { age: 31 })
            expect(user.get('user1')).toEqual({ name: 'John', age: 31 })

            user.set('user1', { name: 'Jane' })
            expect(user.get('user1')).toEqual({ name: 'Jane' })
        })
    })
})
