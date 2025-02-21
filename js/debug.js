// Debug configuration
const DEBUG = {
  // Feature flags for different debug categories
  UI: true,
  EVENTS: true,
  WEBSOCKET: true,
  MENU: true,
  AUDIO: true,
  DOM: true,
  BROWSER: true,
  
  // Log level configuration
  LOG_LEVEL: 'debug', // 'debug', 'info', 'warn', 'error'
};

// Browser detection
const browserInfo = {
  isFirefox: typeof InstallTrigger !== 'undefined',
  isChrome: !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime),
  isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  userAgent: navigator.userAgent,
};

class DebugManager {
  constructor() {
    this.startTime = performance.now();
    this.eventLog = [];
    this.errorLog = [];
    
    // Initialize browser info logging
    this.logBrowserInfo();
  }

  logBrowserInfo() {
    console.group('Browser Information');
    console.log('Browser:', browserInfo);
    console.log('User Agent:', navigator.userAgent);
    console.log('Window Size:', {
      inner: { width: window.innerWidth, height: window.innerHeight },
      outer: { width: window.outerWidth, height: window.outerHeight }
    });
    console.log('Screen:', {
      width: window.screen.width,
      height: window.screen.height,
      pixelRatio: window.devicePixelRatio
    });
    console.groupEnd();
  }

  log(category, message, data = null) {
    if (!DEBUG[category]) return;

    const timestamp = performance.now() - this.startTime;
    const logEntry = {
      timestamp: Math.round(timestamp),
      category,
      message,
      data
    };

    console.group(`${category} [${logEntry.timestamp}ms]`);
    console.log(message);
    if (data) console.log('Data:', data);
    console.groupEnd();

    this.eventLog.push(logEntry);
  }

  error(category, message, error) {
    const errorEntry = {
      timestamp: performance.now() - this.startTime,
      category,
      message,
      error: error instanceof Error ? error : new Error(error)
    };

    console.error(`${category} Error:`, message, error);
    this.errorLog.push(errorEntry);
  }

  // UI specific logging
  logUIEvent(elementId, eventType, details = null) {
    if (!DEBUG.UI) return;
    this.log('UI', `UI Event: ${eventType} on ${elementId}`, details);
  }

  // Menu state logging
  logMenuState(menuId, isVisible, trigger = '') {
    if (!DEBUG.MENU) return;
    this.log('MENU', `Menu State Change: ${menuId}`, {
      visible: isVisible,
      trigger,
      timestamp: new Date().toISOString()
    });
  }

  // DOM mutation logging
  logDOMChange(target, type, details = null) {
    if (!DEBUG.DOM) return;
    this.log('DOM', `DOM Mutation: ${type}`, {
      target: target.id || target.className || 'unknown',
      details
    });
  }

  // WebSocket logging
  logWebSocket(type, data) {
    if (!DEBUG.WEBSOCKET) return;
    this.log('WEBSOCKET', `WebSocket ${type}`, data);
  }

  // Audio logging
  logAudio(action, details) {
    if (!DEBUG.AUDIO) return;
    this.log('AUDIO', `Audio ${action}`, details);
  }

  // Element existence check
  checkElementExists(selector, context = 'Unknown') {
    const element = document.querySelector(selector);
    if (!element) {
      this.error('DOM', `Element not found: ${selector}`, `Context: ${context}`);
      return false;
    }
    return true;
  }

  // Event listener validation
  validateEventListener(element, eventType, handler) {
    if (!element) {
      this.error('EVENTS', `Cannot add ${eventType} listener to null element`);
      return false;
    }
    return true;
  }

  // Get current state summary
  getDebugSummary() {
    return {
      totalEvents: this.eventLog.length,
      totalErrors: this.errorLog.length,
      browserInfo,
      recentEvents: this.eventLog.slice(-10),
      recentErrors: this.errorLog.slice(-10)
    };
  }

  // Monitor specific element
  monitorElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      this.error('DOM', `Cannot monitor element: ${elementId} - not found`);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        this.logDOMChange(mutation.target, mutation.type, {
          addedNodes: mutation.addedNodes.length,
          removedNodes: mutation.removedNodes.length,
          attributes: mutation.attributeName
        });
      });
    });

    observer.observe(element, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }
}

// Create global debug instance
window.debug = new DebugManager();

// Export for module usage
export const debug = window.debug;

// Add some utility functions for common debugging tasks
export const debugUtils = {
  // Check if all required DOM elements are present
  validateRequiredElements() {
    const requiredElements = [
      '#game-screen',
      '#chat-window',
      '#right-panel',
      '#minimap-section',
      '#worlds-menu',
      '.bottom-icon:first-child',
      '.chat-input',
      '#current-username'
    ];

    console.group('Validating Required Elements');
    const results = requiredElements.map(selector => {
      const exists = document.querySelector(selector) !== null;
      console.log(`${selector}: ${exists ? '✓' : '✗'}`);
      return { selector, exists };
    });
    console.groupEnd();

    return results;
  },

  // Check event listeners
  validateEventListeners() {
    const elements = document.querySelectorAll('.bottom-icon, .icon');
    console.group('Validating Event Listeners');
    elements.forEach(element => {
      const listeners = getEventListeners(element);
      console.log(`Element ${element.className}:`, listeners);
    });
    console.groupEnd();
  },

  // Test menu transitions
  testMenuTransitions() {
    const menuButtons = document.querySelectorAll('.bottom-icon');
    console.group('Testing Menu Transitions');
    menuButtons.forEach(button => {
      button.click();
      console.log(`Clicked ${button.className}`);
      // Wait a bit between clicks
      setTimeout(() => {}, 100);
    });
    console.groupEnd();
  }
};

// Add specific Firefox debugging
if (browserInfo.isFirefox) {
  console.info('Firefox-specific debugging enabled');
  // Add extra logging for Firefox-specific issues
  window.addEventListener('error', (event) => {
    debug.error('FIREFOX', 'Uncaught error:', {
      message: event.message,
      filename: event.filename,
      lineNumber: event.lineno,
      colNumber: event.colno,
      error: event.error
    });
  });
}