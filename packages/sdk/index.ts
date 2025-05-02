/**
 * ErrorHub SDK
 * 
 * Provides tools for working with errors and their localization.
 */

// Re-export types for all environments
export * from './core/types';

// Conditional exports depending on the environment
if (typeof window !== 'undefined') {
  // Browser environment
  export * from './browser';
} else {
  // Node.js environment
  export * from './node';
} 