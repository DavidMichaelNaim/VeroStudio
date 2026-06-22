/**
 * @fileoverview ComponentRegistry class tracking registered component schemas and graphics.
 */

import { ComponentDefinitions } from './definitions.js';

export class ComponentRegistry {
  constructor() {
    /** @type {Map<string, any>} */
    this.registry = new Map();
  }

  /**
   * Register a new component schema into the library.
   * @param {string} type - Unique identifier key.
   * @param {Object} definition - The definition details.
   */
  register(type, definition) {
    if (this.registry.has(type)) {
      console.warn(`Overwriting component definition for type: ${type}`);
    }
    this.registry.set(type, definition);
  }

  /**
   * Retrieve a component definition by type.
   * @param {string} type - Unique component type key.
   * @returns {Object | undefined} The registered definition object.
   */
  get(type) {
    return this.registry.get(type);
  }

  /**
   * Retrieve all registered component types.
   * @returns {string[]} List of registered keys.
   */
  getTypes() {
    return Array.from(this.registry.keys());
  }

  /**
   * Get all registered definitions.
   * @returns {Object[]}
   */
  getAll() {
    return Array.from(this.registry.values());
  }
}

// Create and export a singleton default library registry pre-populated with standard parts
export const defaultRegistry = new ComponentRegistry();
Object.keys(ComponentDefinitions).forEach((key) => {
  defaultRegistry.register(key, ComponentDefinitions[key]);
});
