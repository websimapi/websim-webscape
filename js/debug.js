/**
 * Advanced Debugger for WebSim Applications
 * Provides runtime function tracing and logging capabilities
 */

class WebSimDebugger {
  constructor() {
    this.enabled = false;
    this.trackedModules = new Set();
    this.functionCalls = new Map();
    this.startTime = Date.now();
    this.logStyles = {
      functionEntry: 'color: #4CAF50; font-weight: bold',
      functionExit: 'color: #F44336; font-weight: bold',
      functionError: 'color: #FF0000; background: #FFEBEE',
      paramValue: 'color: #2196F3',
      returnValue: 'color: #9C27B0',
      timing: 'color: #FF9800'
    };
  }

  /**
   * Enable or disable the debugger
   */
  toggle(enabled = true) {
    this.enabled = enabled;
    console.log(`%cDebugger ${enabled ? 'enabled' : 'disabled'}`, 'color: #2196F3; font-weight: bold');
  }

  /**
   * Track a specific module's functions
   */
  trackModule(moduleObject, moduleName) {
    if (!this.enabled) return;
    
    this.trackedModules.add(moduleName);
    
    // Get all functions in the module
    const functions = Object.entries(moduleObject).filter(([_, value]) => 
      typeof value === 'function'
    );

    // Wrap each function with debug logging
    functions.forEach(([funcName, originalFunc]) => {
      moduleObject[funcName] = this.wrapFunction(originalFunc, funcName, moduleName);
    });
  }

  /**
   * Wrap a function with debug logging
   */
  wrapFunction(originalFunc, funcName, moduleName) {
    const debugger = this;
    
    return function(...args) {
      if (!debugger.enabled) return originalFunc.apply(this, args);

      const callId = Math.random().toString(36).substr(2, 9);
      const startTime = performance.now();

      // Log function entry
      console.groupCollapsed(
        `%c→ ${moduleName}.${funcName}()`,
        debugger.logStyles.functionEntry
      );
      
      // Log parameters if they exist
      if (args.length) {
        console.log(
          '%cParameters:',
          debugger.logStyles.paramValue,
          ...args
        );
      }

      // Track function call
      debugger.functionCalls.set(callId, {
        name: `${moduleName}.${funcName}`,
        startTime,
        args
      });

      try {
        // Execute original function
        const result = originalFunc.apply(this, args);

        // Handle promises
        if (result instanceof Promise) {
          return result
            .then(asyncResult => {
              debugger.logFunctionExit(callId, asyncResult);
              console.groupEnd();
              return asyncResult;
            })
            .catch(error => {
              debugger.logError(callId, error);
              console.groupEnd();
              throw error;
            });
        }

        // Handle synchronous returns
        debugger.logFunctionExit(callId, result);
        console.groupEnd();
        return result;

      } catch (error) {
        debugger.logError(callId, error);
        console.groupEnd();
        throw error;
      }
    };
  }

  /**
   * Log function exit with timing and return value
   */
  logFunctionExit(callId, returnValue) {
    if (!this.enabled) return;

    const call = this.functionCalls.get(callId);
    if (!call) return;

    const duration = performance.now() - call.startTime;
    
    // Log return value if it exists and isn't undefined
    if (returnValue !== undefined) {
      console.log(
        '%cReturn value:',
        this.logStyles.returnValue,
        returnValue
      );
    }

    // Log execution time
    console.log(
      `%cExecution time: ${duration.toFixed(2)}ms`,
      this.logStyles.timing
    );

    this.functionCalls.delete(callId);
  }

  /**
   * Log function errors
   */
  logError(callId, error) {
    if (!this.enabled) return;

    const call = this.functionCalls.get(callId);
    if (!call) return;

    console.log(
      '%cError in function execution:',
      this.logStyles.functionError,
      error
    );

    this.functionCalls.delete(callId);
  }

  /**
   * Get performance metrics for tracked functions
   */
  getMetrics() {
    if (!this.enabled) return {};

    const metrics = {};
    this.functionCalls.forEach((call, id) => {
      const duration = performance.now() - call.startTime;
      metrics[call.name] = metrics[call.name] || { calls: 0, totalTime: 0 };
      metrics[call.name].calls++;
      metrics[call.name].totalTime += duration;
    });

    return metrics;
  }
}

// Create global debugger instance
window.websimDebugger = new WebSimDebugger();

// Example usage:
/*
import { initializeMusicMenu } from './features/musicMenu.js';
import { initializeInventory } from './features/inventory.js';

// Enable debugging
websimDebugger.toggle(true);

// Track specific modules
websimDebugger.trackModule({ initializeMusicMenu }, 'MusicMenu');
websimDebugger.trackModule({ initializeInventory }, 'Inventory');
*/

export const debugger = window.websimDebugger;