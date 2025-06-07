import { CoreDB, CoreDBUser } from "./CoreDB"

describe('CoreDB RPC System', () => {
    let db: CoreDB
    let user1: CoreDBUser
    let user2: CoreDBUser

    beforeEach(() => {
        db = new CoreDB()
        user1 = new CoreDBUser(db)
        user2 = new CoreDBUser(db)
    })

    describe('Basic RPC functionality', () => {
        test('should register and call a simple function', async () => {
            // Register a function
            db.onCall('add', (a: number, b: number) => a + b)

            // Call the function
            const result = await db.call('add', 5, 3)
            expect(result).toBe(8)
        })

        test('should register and call an async function', async () => {
            // Register an async function
            db.onCall('asyncAdd', async (a: number, b: number) => {
                await new Promise(resolve => setTimeout(resolve, 10))
                return a + b
            })

            // Call the async function
            const result = await db.call('asyncAdd', 10, 20)
            expect(result).toBe(30)
        })

        test('should handle function with no arguments', async () => {
            db.onCall('getTimestamp', () => Date.now())

            const result = await db.call('getTimestamp')
            expect(typeof result).toBe('number')
        })

        test('should handle function with multiple arguments', async () => {
            db.onCall('concat', (a: string, b: string, c: string) => a + b + c)

            const result = await db.call('concat', 'Hello', ' ', 'World')
            expect(result).toBe('Hello World')
        })

        test('should handle function returning objects', async () => {
            db.onCall('createUser', (name: string, age: number) => ({ name, age, id: Math.random() }))

            const result = await db.call('createUser', 'John', 30)
            expect(result).toEqual(expect.objectContaining({
                name: 'John',
                age: 30,
                id: expect.any(Number)
            }))
        })
    })

    describe('Error handling', () => {
        test('should throw error when calling non-existent function', async () => {
            await expect(db.call('nonExistent')).rejects.toThrow("RPC handler 'nonExistent' not found")
        })

        test('should handle function that throws an error', async () => {
            db.onCall('throwError', () => {
                throw new Error('Test error')
            })

            await expect(db.call('throwError')).rejects.toThrow("RPC call 'throwError' failed: Test error")
        })

        test('should handle async function that rejects', async () => {
            db.onCall('asyncThrow', async () => {
                throw new Error('Async test error')
            })

            await expect(db.call('asyncThrow')).rejects.toThrow("RPC call 'asyncThrow' failed: Async test error")
        })
    })

    describe('CoreDBUser RPC functionality', () => {
        test('should work with CoreDBUser instances', async () => {
            // Register function via user1
            user1.onCall('multiply', (a: number, b: number) => a * b)

            // Call function via user2
            const result = await user2.call('multiply', 6, 7)
            expect(result).toBe(42)
        })

        test('should allow multiple users to register different functions', async () => {
            user1.onCall('add', (a: number, b: number) => a + b)
            user2.onCall('subtract', (a: number, b: number) => a - b)

            const addResult = await user1.call('add', 10, 5)
            const subtractResult = await user2.call('subtract', 10, 5)

            expect(addResult).toBe(15)
            expect(subtractResult).toBe(5)
        })

        test('should allow function overriding', async () => {
            // First registration
            user1.onCall('getValue', () => 'first')
            let result = await user1.call('getValue')
            expect(result).toBe('first')

            // Override with new function
            user1.onCall('getValue', () => 'second')
            result = await user1.call('getValue')
            expect(result).toBe('second')
        })
    })

    describe('Complex RPC scenarios', () => {
        test('should handle functions that interact with CoreDB', async () => {
            // Register a function that reads/writes to CoreDB
            db.onCall('incrementCounter', (key: string) => {
                const current = db.get(key) || 0
                const newValue = current + 1
                db.set(key, newValue)
                return newValue
            })

            // Call the function multiple times
            const result1 = await db.call('incrementCounter', 'counter')
            const result2 = await db.call('incrementCounter', 'counter')
            const result3 = await db.call('incrementCounter', 'counter')

            expect(result1).toBe(1)
            expect(result2).toBe(2)
            expect(result3).toBe(3)
            expect(db.get('counter')).toBe(3)
        })

        test('should handle functions that call other RPC functions', async () => {
            db.onCall('add', (a: number, b: number) => a + b)
            db.onCall('addAndDouble', async (a: number, b: number) => {
                const sum = await db.call('add', a, b)
                return sum * 2
            })

            const result = await db.call('addAndDouble', 3, 4)
            expect(result).toBe(14) // (3 + 4) * 2
        })

        test('should handle concurrent RPC calls', async () => {
            db.onCall('delay', async (ms: number, value: any) => {
                await new Promise(resolve => setTimeout(resolve, ms))
                return value
            })

            const promises = [
                db.call('delay', 50, 'first'),
                db.call('delay', 30, 'second'),
                db.call('delay', 10, 'third')
            ]

            const results = await Promise.all(promises)
            expect(results).toEqual(['first', 'second', 'third'])
        })
    })

    describe('Function registration edge cases', () => {
        test('should handle function that returns null', async () => {
            db.onCall('returnNull', () => null)
            const result = await db.call('returnNull')
            expect(result).toBeNull()
        })

        test('should handle function that returns undefined', async () => {
            db.onCall('returnUndefined', () => undefined)
            const result = await db.call('returnUndefined')
            expect(result).toBeUndefined()
        })

        test('should handle function that returns Promise<void>', async () => {
            db.onCall('voidAsync', async () => {
                await new Promise(resolve => setTimeout(resolve, 10))
                // No return statement
            })
            const result = await db.call('voidAsync')
            expect(result).toBeUndefined()
        })
    })
})
