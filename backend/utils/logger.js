/**
 * Logger Utility
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, 'app.log');
const errorLogFile = path.join(logsDir, 'error.log');

/**
 * Format timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Write log to file
 */
function writeLog(message, level = 'INFO', file = logFile) {
  const timestamp = getTimestamp();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;

  fs.appendFileSync(file, logMessage);

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    const colors = {
      'INFO': '\x1b[36m',
      'ERROR': '\x1b[31m',
      'WARN': '\x1b[33m',
      'DEBUG': '\x1b[35m',
      'SUCCESS': '\x1b[32m',
      'RESET': '\x1b[0m'
    };

    console.log(`${colors[level] || ''}[${level}]${colors.RESET} ${message}`);
  }
}

const logger = {
  /**
   * Log info messages
   */
  info(message, data = null) {
    const fullMessage = data ? `${message} | ${JSON.stringify(data)}` : message;
    writeLog(fullMessage, 'INFO');
  },

  /**
   * Log error messages
   */
  error(message, error = null) {
    let fullMessage = message;

    if (error) {
      if (error instanceof Error) {
        fullMessage = `${message} | Error: ${error.message}`;
        if (error.stack && process.env.NODE_ENV !== 'production') {
          fullMessage += `\nStack: ${error.stack}`;
        }
      } else {
        fullMessage = `${message} | ${JSON.stringify(error)}`;
      }
    }

    writeLog(fullMessage, 'ERROR', errorLogFile);
    writeLog(fullMessage, 'ERROR', logFile);
  },

  /**
   * Log warning messages
   */
  warn(message, data = null) {
    const fullMessage = data ? `${message} | ${JSON.stringify(data)}` : message;
    writeLog(fullMessage, 'WARN');
  },

  /**
   * Log debug messages (only in development)
   */
  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const fullMessage = data ? `${message} | ${JSON.stringify(data)}` : message;
      writeLog(fullMessage, 'DEBUG');
    }
  },

  /**
   * Log success messages
   */
  success(message, data = null) {
    const fullMessage = data ? `${message} | ${JSON.stringify(data)}` : message;
    writeLog(fullMessage, 'SUCCESS');
  },

  /**
   * Log API requests
   */
  request(method, path, statusCode, duration = null) {
    const durationStr = duration ? ` (${duration}ms)` : '';
    const message = `${method} ${path} - ${statusCode}${durationStr}`;
    writeLog(message, 'INFO');
  },

  /**
   * Clear logs
   */
  clear() {
    fs.writeFileSync(logFile, '');
    fs.writeFileSync(errorLogFile, '');
  },

  /**
   * Get logs
   */
  getLogs(type = 'all', lines = 100) {
    try {
      let content = '';

      if (type === 'all' || type === 'info') {
        content += fs.readFileSync(logFile, 'utf8');
      }

      if (type === 'all' || type === 'error') {
        content += fs.readFileSync(errorLogFile, 'utf8');
      }

      // Get last N lines
      return content.split('\n').slice(-lines).join('\n');
    } catch (error) {
      return 'No logs available';
    }
  }
};

module.exports = logger;
