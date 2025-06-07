#!/usr/bin/env ts-node

/**
 * CoreDB RPC System Demo
 * 
 * This demo shows how to use the RPC system in CoreDB to enable
 * distributed function calling between different parts of your application.
 */

import { CoreDB, CoreDBUser } from './CoreDB'

async function runRPCDemo() {
    console.log('🚀 CoreDB RPC System Demo\n')

    // Create a CoreDB instance
    const db = new CoreDB()
    
    // Create two users to simulate different clients
    const serviceA = new CoreDBUser(db)
    const serviceB = new CoreDBUser(db)

    console.log('📝 Setting up RPC functions...\n')

    // Service A registers some utility functions
    serviceA.onCall('math:add', (a: number, b: number) => {
        console.log(`  🔢 Service A: Adding ${a} + ${b}`)
        return a + b
    })

    serviceA.onCall('math:multiply', (a: number, b: number) => {
        console.log(`  🔢 Service A: Multiplying ${a} * ${b}`)
        return a * b
    })

    // Service B registers a more complex function
    serviceB.onCall('user:validate', async (userData: any) => {
        console.log(`  👤 Service B: Validating user data for ${userData.name}`)
        
        // Simulate async validation
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!userData.name || !userData.email) {
            throw new Error('Name and email are required')
        }
        
        return {
            valid: true,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString()
        }
    })

    // Service B registers a function that calls other RPC functions
    serviceB.onCall('calculator:complex', async (x: number, y: number, z: number) => {
        console.log(`  🧮 Service B: Complex calculation with ${x}, ${y}, ${z}`)
        
        // Call Service A's functions
        const sum = await db.call('math:add', x, y)
        const result = await db.call('math:multiply', sum, z)
        
        return {
            operation: `(${x} + ${y}) * ${z}`,
            result: result
        }
    })

    console.log('✅ RPC functions registered!\n')

    console.log('🔄 Testing RPC calls...\n')

    try {
        // Test simple function calls
        console.log('1. Simple math operations:')
        const sum = await serviceB.call('math:add', 5, 3)
        console.log(`   Result: 5 + 3 = ${sum}`)
        
        const product = await serviceA.call('math:multiply', 4, 7)
        console.log(`   Result: 4 * 7 = ${product}`)

        console.log('\n2. Async function with validation:')
        const validUser = await serviceA.call('user:validate', {
            name: 'John Doe',
            email: 'john@example.com'
        })
        console.log(`   Valid user created:`, validUser)

        console.log('\n3. Complex function calling other RPC functions:')
        const complexResult = await serviceA.call('calculator:complex', 10, 5, 2)
        console.log(`   Complex calculation:`, complexResult)

        console.log('\n4. Error handling:')
        try {
            await serviceA.call('user:validate', { name: 'Invalid User' })
        } catch (error) {
            console.log(`   ❌ Expected error caught: ${error.message}`)
        }

        console.log('\n5. Non-existent function:')
        try {
            await serviceA.call('nonexistent:function', 'test')
        } catch (error) {
            console.log(`   ❌ Expected error caught: ${error.message}`)
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error)
    }

    console.log('\n🎉 RPC Demo completed successfully!')
    console.log('\nKey features demonstrated:')
    console.log('  ✓ Function registration with onCall()')
    console.log('  ✓ Remote function invocation with call()')
    console.log('  ✓ Async function support')
    console.log('  ✓ Error handling')
    console.log('  ✓ Functions calling other RPC functions')
    console.log('  ✓ Multiple arguments support')
    console.log('  ✓ Return value handling')
}

// Run the demo if this file is executed directly
if (require.main === module) {
    runRPCDemo().catch(console.error)
}

export { runRPCDemo }
