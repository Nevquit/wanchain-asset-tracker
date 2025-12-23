// utils/logger.js

const LOG_LEVELS = {
    info: "INFO",
    warn: "WARN",
    error: "ERROR",
};

/**
 * Creates a structured log message.
 * @param {string} level - The log level (e.g., 'info', 'warn', 'error').
 * @param {string} message - The main log message.
 * @param {object} [context={}] - Additional context to include in the log.
 */
function log(level, message, context = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS[level] || "INFO",
        message,
        ...context,
    };
    console.log(JSON.stringify(logEntry, null, 2));
}

export const logger = {
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
};
