/**
 * Shared constants used across frontend and backend
 */
// API Configuration
export const API_CONFIG = {
    DEFAULT_PORT: 3000,
    DEFAULT_WS_PORT: 3000,
    DEFAULT_HOST: 'localhost',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
};
// WebSocket Events
export const WS_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    MESSAGE: 'message',
    RECONNECT: 'reconnect',
    RECONNECT_ATTEMPT: 'reconnect_attempt',
    RECONNECT_ERROR: 'reconnect_error',
    RECONNECT_FAILED: 'reconnect_failed',
};
// CoreDB Commands
export const COREDB_COMMANDS = {
    GET: 'get',
    SET: 'set',
    PATCH: 'patch',
    ON: 'on',
    OFF: 'off',
    CALL: 'call',
    ON_CALL: 'onCall',
    UNSUBSCRIBE: 'unsubscribe',
};
// Flow Node Types
export const FLOW_NODE_TYPES = {
    INPUT: 'InputNode',
    OUTPUT: 'OutputNode',
    FUNCTION: 'FunctionNode',
    MATH: 'MathNode',
    OBJECT: 'ObjectNode',
    CONDITION: 'ConditionNode',
    TIMER: 'TimerNode',
};
// Application States
export const APP_STATES = {
    INITIALIZING: 'initializing',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
};
// Log Levels
export const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    TRACE: 'trace',
};
// Environment Types
export const ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test',
};
// Default Configuration
export const DEFAULT_CONFIG = {
    API_URL: `http://${API_CONFIG.DEFAULT_HOST}:${API_CONFIG.DEFAULT_PORT}`,
    WS_URL: `ws://${API_CONFIG.DEFAULT_HOST}:${API_CONFIG.DEFAULT_WS_PORT}`,
    ENVIRONMENT: ENVIRONMENTS.DEVELOPMENT,
    LOG_LEVEL: LOG_LEVELS.INFO,
};
