# CoreDB Operation Complexity Analysis

## set(key: string, patch: any)

### Time Complexity

1. Basic Operation: O(1)
   - Direct key-value storage access
   - Initial value lookup

2. Deep Merge: O(n)
   - Where n is the number of properties in the object
   - Requires recursive traversal for nested objects

3. Index Updates: O(p * v)
   - p = number of indexed properties
   - v = number of values per property (for array properties)
   
4. Notification: O(s)
   - s = number of subscribers for the key

Total Worst Case: O(n + p*v + s)

### Space Complexity

1. Value Storage: O(n)
   - n = size of stored object

2. Index Storage: O(p * v * k)
   - p = number of indexed properties
   - v = values per property
   - k = number of keys with indexed properties

3. Temporary Memory (during merge): O(n)
   - For object cloning during deep merge

Total Space: O(n + p*v*k)

## on(key: string, callback: Function)

### Time Complexity

1. Regular Subscription: O(1)
   - Simple callback registration

2. Index Subscription (idx:prop=value): O(m)
   - m = number of matching objects
   - Requires scanning reverse index

3. All-Values Index (idx:prop=?): O(v)
   - v = number of unique values for property

4. Compound Index: O(m1 * m2)
   - m1, m2 = matches for each condition
   - Requires intersection of results

Total Worst Case: O(m1 * m2) for compound queries

### Space Complexity

1. Regular Subscription: O(1)
   - Single callback reference

2. Index Subscription: O(m)
   - m = number of matching objects
   - Stores reference to matching set

3. Reverse Index Entry: O(k)
   - k = number of keys with the indexed property

Total Space: O(m + k)

## Performance Implications

1. Deep Object Updates
   ```typescript
   // Expensive: Full object traversal
   db.set('user', { 
     deeply: { nested: { object: { value: 123 } } }
   });
   
   // Efficient: Direct path update
   db.set('user', { 
     'deeply.nested.object.value': 123 
   });
   ```

2. Index Usage
   ```typescript
   // Expensive: Full scan
   db.on('*', (value) => {
     if (value.type === 'active') {
       // Process
     }
   });
   
   // Efficient: Using index
   db.on('idx:type=active', (matches) => {
     // Process
   });
   ```

3. Compound Queries
   ```typescript
   // Less efficient: Multiple conditions
   db.on('idx:status=active&type=user&role=admin', callback);
   
   // More efficient: Single condition + filter
   db.on('idx:status=active', matches => {
     // Filter in callback
   });
   ```

## Optimization Recommendations

1. Use shallow objects when possible
2. Prefer direct path updates over deep object merges
3. Use indices for frequently queried properties
4. Avoid compound indices with low selectivity
5. Clean up subscriptions when no longer needed