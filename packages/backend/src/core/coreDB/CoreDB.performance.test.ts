import { CoreDB } from "./CoreDB"

describe('CoreDB Performance', () => {
    let db: CoreDB

    beforeEach(() => {
        db = new CoreDB()
    })

    test('performance benchmarks', () => {
        const iterations = 100000
        const results: Record<string, number> = {}

        // Test 1: Simple values
        const simpleStart = performance.now()
        for (let i = 0; i < iterations; i++) {
            db.patch(`simple${i}`, i)
        }
        results.simple = performance.now() - simpleStart

        // Test 2: Nested objects
        const complexStart = performance.now()
        for (let i = 0; i < iterations; i++) {
            db.patch(`complex${i}`, {
                id: i,
                metadata: {
                    created: "Date.now()" + i,
                    status: 'active',
                    tags: ['tag1', 'tag2']
                },
                nested: {
                    level1: {
                        level2: {
                            value: i
                        }
                    }
                }
            })
        }
        results.complex = performance.now() - complexStart

        // Test 3: Index queries
        const indexStart = performance.now()
        let cbCount = 0
        for (let i = 0; i < iterations; i++) {
            db.onPatch(`idx:id=` + i, (patch: object | null) => { cbCount++ })
        }
        results.index = performance.now() - indexStart
        console.log("Callback called times: " + cbCount)

        console.log(`
Performance Results (${iterations} operations):
Simple sets: ${(results.simple / iterations).toFixed(3)}ms per op
Complex sets: ${(results.complex / iterations).toFixed(3)}ms per op
Index queries: ${(results.index / iterations).toFixed(3)}ms per op
        `)

        expect(results.simple / iterations).toBeLessThan(0.01)
        expect(results.complex / iterations).toBeLessThan(0.1)
        expect(results.index / iterations).toBeLessThan(0.1)
    })
})
