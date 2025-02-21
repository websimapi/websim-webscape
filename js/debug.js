/**
 * Debug utilities for Webscape features
 */

// Store enabled debug features
const enabledDebugFeatures = new Set();

// Debug levels
const DEBUG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  TRACE: 'TRACE'
};

// Color schemes for different debug levels
const LEVEL_COLORS = {
  INFO: '#00ff00',
  WARN: '#ffff00', 
  ERROR: '#ff0000',
  TRACE: '#00ffff'
};

/**
 * Enable debugging for a specific feature
 * @param {string} featureName - Name of feature to debug
 */
function enableDebug(featureName) {
  enabledDebugFeatures.add(featureName);
  console.log(`🐛 Debug enabled for: ${featureName}`);
}

/**
 * Disable debugging for a specific feature
 * @param {string} featureName - Name of feature to disable debugging for
 */
function disableDebug(featureName) {
  enabledDebugFeatures.delete(featureName);
  console.log(`Debug disabled for: ${featureName}`);
}

/**
 * Check if debugging is enabled for a feature
 * @param {string} featureName - Name of feature to check
 * @returns {boolean} Whether debugging is enabled
 */
function isDebugEnabled(featureName) {
  return enabledDebugFeatures.has(featureName);
}

/**
 * Create a debug logger for a specific feature
 * @param {string} featureName - Name of the feature
 * @returns {Object} Logger methods
 */
function createDebugger(featureName) {
  const timestamp = () => new Date().toISOString();
  
  const log = (level, message, ...args) => {
    if (!isDebugEnabled(featureName)) return;

    const style = `color: ${LEVEL_COLORS[level]}; font-weight: bold;`;
    console.log(
      `%c[${timestamp()}][${level}][${featureName}] ${message}`, 
      style,
      ...args
    );
  };

  return {
    /**
     * Log entry to a function
     * @param {string} functionName - Name of function being entered
     * @param {Object} args - Arguments passed to function
     */
    enter(functionName, args = {}) {
      log(DEBUG_LEVELS.TRACE, `→ ${functionName}()`, args);
    },

    /**
     * Log exit from a function
     * @param {string} functionName - Name of function being exited
     * @param {*} result - Return value from function
     */
    exit(functionName, result) {
      log(DEBUG_LEVELS.TRACE, `← ${functionName}()`, result);
    },

    /**
     * Log info level message
     * @param {string} message - Message to log
     * @param {...*} args - Additional arguments to log
     */
    info(message, ...args) {
      log(DEBUG_LEVELS.INFO, message, ...args);
    },

    /**
     * Log warning level message
     * @param {string} message - Message to log
     * @param {...*} args - Additional arguments to log
     */
    warn(message, ...args) {
      log(DEBUG_LEVELS.WARN, message, ...args);
    },

    /**
     * Log error level message
     * @param {string} message - Message to log
     * @param {...*} args - Additional arguments to log 
     */
    error(message, ...args) {
      log(DEBUG_LEVELS.ERROR, message, ...args);
    },

    /**
     * Time a function execution
     * @param {string} label - Label for the timer
     * @param {Function} fn - Function to time
     * @returns {*} Result of function execution
     */
    time(label, fn) {
      if (!isDebugEnabled(featureName)) return fn();
      
      console.time(`[${featureName}] ${label}`);
      const result = fn();
      console.timeEnd(`[${featureName}] ${label}`);
      return result;
    },

    /**
     * Track an event occurrence
     * @param {string} eventName - Name of event
     * @param {Object} data - Event data
     */
    event(eventName, data = {}) {
      log(DEBUG_LEVELS.INFO, `Event: ${eventName}`, data);
    },

    /**
     * Log state changes
     * @param {string} key - State key that changed
     * @param {*} oldValue - Previous value
     * @param {*} newValue - New value
     */
    state(key, oldValue, newValue) {
      log(DEBUG_LEVELS.INFO, `State change: ${key}`, {
        from: oldValue,
        to: newValue
      });
    }
  };
}

/**
 * Wrap a function with debug logging
 * @param {string} featureName - Name of feature
 * @param {string} functionName - Name of function
 * @param {Function} fn - Function to wrap
 * @returns {Function} Wrapped function
 */
function debugWrap(featureName, functionName, fn) {
  return function(...args) {
    const debug = createDebugger(featureName);
    
    if (!isDebugEnabled(featureName)) {
      return fn.apply(this, args);
    }

    debug.enter(functionName, args);
    try {
      const result = fn.apply(this, args);
      debug.exit(functionName, result);
      return result;
    } catch (error) {
      debug.error(`Error in ${functionName}:`, error);
      throw error;
    }
  };
}

export {
  enableDebug,
  disableDebug,
  isDebugEnabled,
  createDebugger,
  debugWrap,
  DEBUG_LEVELS
};