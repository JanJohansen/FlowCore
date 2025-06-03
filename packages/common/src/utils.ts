/**
 * Shared utility functions used across frontend and backend
 */

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const result = { ...target }

    for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(result[key] || {} as any, source[key])
        } else {
            result[key] = source[key] as T[Extract<keyof T, string>]
        }
    }

    return result
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = ''): string {
    const timestamp = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2, 8)
    return prefix ? `${prefix}_${timestamp}_${randomPart}` : `${timestamp}_${randomPart}`
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | number

    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T = any>(str: string, fallback: T): T {
    try {
        return JSON.parse(str)
    } catch {
        return fallback
    }
}

/**
 * Format timestamp to readable string
 */
export function formatTimestamp(timestamp: number, includeTime = true): string {
    const date = new Date(timestamp)
    const dateStr = date.toLocaleDateString()

    if (includeTime) {
        const timeStr = date.toLocaleTimeString()
        return `${dateStr} ${timeStr}`
    }

    return dateStr
}
