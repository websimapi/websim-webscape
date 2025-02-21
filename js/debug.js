// Debug configuration 
const DEBUG_CONFIG = {
  ENABLED: true,
  CATEGORIES: {
    INIT: true,      // Initialization logs
    EVENTS: true,    // Event handling logs
    MENUS: true,     // Menu state logs
    NETWORK: true,   // WebSocket/network logs
    AUDIO: true,     // Audio/music player logs
    DOM: true        // DOM manipulation logs
  },
  LEVEL: {
    ERROR: true,
    WARN: true, 
    INFO: true,
    DEBUG: true
  }
};

// Utility to get stack trace
function getStack() {
  const stack = new Error().stack;
  if (!stack) return '';
  const lines = stack.split('\n');
  // Remove the first 2 lines (Error and this function)
  return lines.slice(2).join('\n');
}

// Timestamp utility
function getTimestamp() {
  return new Date().toISOString();
}

// Main debug logger
class DebugLogger {
  static log(category, level, message, data = null) {
    if (!DEBUG_CONFIG.ENABLED || !DEBUG_CONFIG.CATEGORIES[category] || !DEBUG_CONFIG.LEVEL[level]) {
      return;
    }

    const timestamp = getTimestamp();
    const stack = getStack();
    
    const logMessage = {
      timestamp,
      category,
      level,
      message,
      data,
      stack
    };

    // Use different console methods based on level
    switch(level) {
      case 'ERROR':
        console.error(logMessage);
        break;
      case 'WARN':
        console.warn(logMessage);
        break;
      case 'DEBUG':
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }

  // Convenience methods
  static error(category, message, data = null) {
    this.log(category, 'ERROR', message, data);
  }

  static warn(category, message, data = null) {
    this.log(category, 'WARN', message, data);
  }

  static info(category, message, data = null) {
    this.log(category, 'INFO', message, data);
  }

  static debug(category, message, data = null) {
    this.log(category, 'DEBUG', message, data);
  }
}

// DOM Utilities
const DOMDebug = {
  // Log element existence and properties
  checkElement(selector, context = 'Unknown') {
    const element = document.querySelector(selector);
    if (element) {
      DebugLogger.info('DOM', `Element found: ${selector} [${context}]`, {
        id: element.id,
        classes: Array.from(element.classList),
        visible: element.offsetParent !== null,
        dimensions: {
          width: element.offsetWidth,
          height: element.offsetHeight
        },
        position: {
          top: element.offsetTop,
          left: element.offsetLeft
        },
        styles: window.getComputedStyle(element)
      });
    } else {
      DebugLogger.error('DOM', `Element not found: ${selector} [${context}]`);
    }
    return element;
  },

  // Log event listener registration
  logEventListener(element, eventType, context = 'Unknown') {
    if (element) {
      DebugLogger.debug('EVENTS', `Event listener registered: ${eventType} [${context}]`, {
        element: element.tagName,
        id: element.id,
        classes: Array.from(element.classList)
      });
    } else {
      DebugLogger.error('EVENTS', `Failed to register event listener: ${eventType} [${context}]`);
    }
  },

  // Check menu state
  checkMenuState(menuId, context = 'Unknown') {
    const menu = document.querySelector(menuId);
    if (menu) {
      DebugLogger.debug('MENUS', `Menu state check: ${menuId} [${context}]`, {
        visible: !menu.classList.contains('hidden'),
        classes: Array.from(menu.classList),
        display: window.getComputedStyle(menu).display,
        position: {
          top: menu.offsetTop,
          left: menu.offsetLeft
        }
      });
    } else {
      DebugLogger.error('MENUS', `Menu not found: ${menuId} [${context}]`);
    }
  }
};

// Browser compatibility checks
const BrowserDebug = {
  checkCompatibility() {
    const browserInfo = {
      userAgent: navigator.userAgent,
      isFirefox: typeof InstallTrigger !== 'undefined',
      isChrome: !!window.chrome,
      features: {
        eventListeners: !!window.addEventListener,
        customEvents: !!window.CustomEvent,
        flexbox: CSS.supports('display', 'flex'),
        grid: CSS.supports('display', 'grid'),
      }
    };
    
    DebugLogger.info('INIT', 'Browser compatibility check', browserInfo);
    return browserInfo;
  }
};

// WebSocket connection monitoring
const NetworkDebug = {
  logWebSocketEvent(event, context = 'Unknown') {
    DebugLogger.debug('NETWORK', `WebSocket Event: ${event.type} [${context}]`, {
      data: event.data,
      timestamp: new Date().toISOString()
    });
  }
};

// Audio system debugging
const AudioDebug = {
  logAudioEvent(action, details, context = 'Unknown') {
    DebugLogger.debug('AUDIO', `Audio Event: ${action} [${context}]`, {
      ...details,
      timestamp: new Date().toISOString()
    });
  }
};

// Export all debug utilities
export {
  DebugLogger,
  DOMDebug,
  BrowserDebug,
  NetworkDebug,
  AudioDebug,
  DEBUG_CONFIG
};