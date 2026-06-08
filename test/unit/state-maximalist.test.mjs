import { describe, it, expect, beforeEach } from 'vitest';
import { StateMaximalist } from '../../packages/core/utils/state-maximalist.js';

describe('StateMaximalist', () => {
  let stateManager;

  beforeEach(() => {
    stateManager = new StateMaximalist({ initialState: { count: 0 } });
  });

  it.skip('should safely parse IPC payloads using destr', () => {
    const payload = '{"key": "value"}';
    expect(stateManager.parse(payload)).toEqual({ key: 'value' });
    expect(stateManager.parse('true')).toBe(true);
    expect(stateManager.parse('123')).toBe(123);
  });

  it.skip('should generate deterministic state hashes using ohash', () => {
    const hash1 = stateManager.getHash({ a: 1, b: 2 });
    const hash2 = stateManager.getHash({ b: 2, a: 1 });
    expect(hash1).toBe(hash2);
  });

  it.skip('should detect infinite loops', () => {
    stateManager.setState({ step: 1 });
    stateManager.setState({ step: 2 });
    
    // Returning to a previous state should throw
    expect(() => {
      stateManager.setState({ step: 1 });
    }).toThrow(/Infinite loop detected/);
  });

  it.skip('should normalize environment variables using scule', () => {
    const env = {
      NODE_ENV: 'test',
      API_KEY: '12345',
      DEBUG_MODE: 'enabled'
    };
    
    const normalized = stateManager.normalizeEnv(env, 'camelCase');
    expect(normalized).toEqual({
      nodeEnv: 'test',
      apiKey: '12345',
      debugMode: 'enabled'
    });

    const snake = stateManager.normalizeEnv(env, 'snakeCase');
    expect(snake).toEqual({
      node_env: 'test',
      api_key: '12345',
      debug_mode: 'enabled'
    });
  });

  it.skip('should update state with a function', () => {
    stateManager.setState((prev) => ({ ...prev, count: prev.count + 1 }));
    expect(stateManager.getState().count).toBe(1);
  });

  it.skip('should reset state and history', () => {
    stateManager.setState({ a: 1 });
    stateManager.reset({ b: 2 });
    expect(stateManager.getState()).toEqual({ b: 2 });
    // Should be able to set a state that was previously in history after reset
    expect(() => {
      stateManager.setState({ a: 1 });
    }).not.toThrow();
  });
});
