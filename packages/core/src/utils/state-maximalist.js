/**
 * StateMaximalist - A universal state manager for test runs.
 * Combines ohash, destr, and scule for safety and determinism.
 */

import { hash } from 'ohash';
import { destr } from 'destr';
import * as scule from 'scule';

/**
 * Universal state manager for test runs that safely parses IPC payloads,
 * generates deterministic state hashes to detect infinite loops,
 * and normalizes all environment variables.
 */
export class StateMaximalist {
  /**
   * @param {Object} options
   * @param {Object} [options.initialState={}] - Initial state object
   * @param {number} [options.maxHistory=1000] - Maximum history size for loop detection
   */
  constructor(options = {}) {
    this.state = options.initialState || {};
    this.history = new Set();
    this.maxHistory = options.maxHistory || 1000;
    this._track(this.state);
  }

  /**
   * Safely parses IPC payloads or any stringified data using destr.
   * @param {any} data - Data to parse
   * @returns {any} Parsed data
   */
  parse(data) {
    return destr(data);
  }

  /**
   * Updates the current state and checks for deterministic collisions (infinite loops).
   * @param {Object|Function} nextState - New state or function to update state
   * @returns {Object} Updated state
   * @throws {Error} If an infinite loop is detected
   */
  setState(nextState) {
    const newState = typeof nextState === 'function' 
      ? nextState(this.state) 
      : { ...this.state, ...nextState };
    
    this._track(newState);
    this.state = newState;
    return this.state;
  }

  /**
   * Tracks state hashes to detect infinite loops.
   * @private
   */
  _track(state) {
    const stateHash = hash(state);
    if (this.history.has(stateHash)) {
      throw new Error(`[StateMaximalist] Infinite loop detected! Circular state transition identified by hash: ${stateHash}`);
    }
    this.history.add(stateHash);
    
    // Prune history if it exceeds maxHistory
    if (this.history.size > this.maxHistory) {
      const firstItem = this.history.values().next().value;
      this.history.delete(firstItem);
    }
  }

  /**
   * Normalizes environment variables using scule.
   * @param {Object} [env=process.env] - Environment variables object
   * @param {string} [transformation='camelCase'] - Scule transformation to apply
   * @returns {Object} Normalized environment variables
   */
  normalizeEnv(env = process.env, transformation = 'camelCase') {
    const transformer = scule[transformation] || scule.camelCase;
    const opts = (transformation === 'camelCase' || transformation === 'pascalCase') 
      ? { normalize: true } 
      : undefined;
      
    return Object.keys(env).reduce((acc, key) => {
      acc[transformer(key, opts)] = env[key];
      return acc;
    }, {});
  }

  /**
   * Generates a deterministic hash of the current or provided state.
   * @param {Object} [state=this.state] - State to hash
   * @returns {string} State hash
   */
  getHash(state = this.state) {
    return hash(state);
  }

  /**
   * Resets the state and history.
   * @param {Object} [initialState={}] - New initial state
   */
  reset(initialState = {}) {
    this.state = initialState;
    this.history.clear();
    this._track(this.state);
  }

  /**
   * Returns a copy of the current state.
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }
}

/**
 * Default instance for quick access.
 */
export const stateManager = new StateMaximalist();
