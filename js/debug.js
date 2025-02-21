// Debug levels
const DEBUG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  TRACE: 'TRACE'
};

// Store enabled debug features
const enabledDebugFeatures = new Set();

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
export function enableDebug(featureName) {
  enabledDebugFeatures.add(featureName);
  console.log(`🐛 Debug enabled for: ${featureName}`);
}

/**
 * Disable debugging for a specific feature
 * @param {string} featureName - Name of feature to disable debugging for
 */
export function disableDebug(featureName) {
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
export function createDebugger(featureName) {
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
    enter(functionName, args = {}) {
      log(DEBUG_LEVELS.TRACE, `→ ${functionName}()`, args);
    },

    exit(functionName, result) {
      log(DEBUG_LEVELS.TRACE, `← ${functionName}()`, result);
    },

    info(message, ...args) {
      log(DEBUG_LEVELS.INFO, message, ...args);
    },

    warn(message, ...args) {
      log(DEBUG_LEVELS.WARN, message, ...args);
    },

    error(message, ...args) {
      log(DEBUG_LEVELS.ERROR, message, ...args);
    },

    time(label, fn) {
      if (!isDebugEnabled(featureName)) return fn();
      
      console.time(`[${featureName}] ${label}`);
      const result = fn();
      console.timeEnd(`[${featureName}] ${label}`);
      return result;
    },

    event(eventName, data = {}) {
      log(DEBUG_LEVELS.INFO, `Event: ${eventName}`, data);
    },

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
export function debugWrap(featureName, functionName, fn) {
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

export { DEBUG_LEVELS };