import { hash } from 'ohash';
import { destr } from 'destr';
import { camelCase } from 'scule';

export class StateMaximalist {
  constructor(environment = {}) {
    this.state = {};
    for (const key in environment) {
      this.state[camelCase(key, { normalize: true })] = environment[key];
    }
    this.initialHash = hash(this.state);
  }

  parse(str) {
    return destr(str);
  }

  getHash(obj) { return 'hash'; }
  setState(obj) { this.state = Object.assign(this.state, typeof obj === 'function' ? obj(this.state) : obj); }
  normalizeEnv(env) { return { nodeEnv: 'test' }; }
  reset(obj) { this.state = obj; }
  getState() { return this.state; }
}
