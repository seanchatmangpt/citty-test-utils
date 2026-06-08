/**
 * ConfigMaximalist - The ultimate UnJS-powered configuration loader.
 * Combines c12, rc9, defu, confbox, and jiti for a super-configuration experience.
 */

import { loadConfig, watchConfig } from 'c12';
import * as rc9 from 'rc9';
import { defu } from 'defu';
import * as confbox from 'confbox';
import { createJiti } from 'jiti';
import { resolve } from 'pathe';
import fs from 'node:fs';

/**
 * Super-configuration loader that reads from .rc files, YAML, TOML, JSON, and TS/JS files
 * simultaneously, merges them flawlessly, and applies schema validation.
 */
export class ConfigMaximalist {
  /**
   * @param {Object} options
   * @param {string} [options.name='app'] - Configuration name (used for file discovery)
   * @param {string} [options.cwd=process.cwd()] - Working directory to start discovery
   * @param {Object} [options.defaults={}] - Default configuration values
   * @param {Object} [options.overrides={}] - Override configuration values
   * @param {any} [options.schema] - Validation schema (Zod-like or function)
   */
  constructor(options = {}) {
    this.name = options.name || 'app';
    this.cwd = options.cwd || process.cwd();
    this.defaults = options.defaults || {};
    this.overrides = options.overrides || {};
    this.schema = options.schema || null;
    
    // Initialize jiti for runtime TS/ESM support
    this.jiti = createJiti(import.meta.url, {
      interopDefault: true,
      cache: true,
    });
  }

  /**
   * Loads the configuration from all supported sources.
   * @returns {Promise<Object>} The merged and validated configuration
   */
  async load() {
    // 1. Load main configuration using c12 (finds .ts, .js, .json, .yaml, .toml, .yml)
    // It typically finds ONE main config file.
    const c12Result = await loadConfig({
      name: this.name,
      cwd: this.cwd,
      jiti: this.jiti,
    });

    // 2. Aggressively search for other formats that might exist simultaneously
    const manualConfigs = {};
    const formats = ['json', 'yaml', 'yml', 'toml'];
    const searchNames = [this.name, `${this.name}.config`];

    for (const baseName of searchNames) {
      for (const ext of formats) {
        const filePath = resolve(this.cwd, `${baseName}.${ext}`);
        if (fs.existsSync(filePath)) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const parsed = this.parse(content, ext);
            Object.assign(manualConfigs, parsed);
          } catch (e) {
            // Ignore parse errors for optional files
          }
        }
      }
    }

    // 3. Load .rc configuration using rc9 (reads from local and user home)
    // We try multiple naming patterns for maximum compatibility
    const rcNames = [this.name, `.${this.name}rc`, `${this.name}rc`];
    let localRc = {};
    let userRc = {};
    
    for (const rcName of rcNames) {
      localRc = defu(localRc, rc9.read({ name: rcName, dir: this.cwd }));
      userRc = defu(userRc, rc9.readUser({ name: rcName }));
    }

    // 4. Merge everything flawlessly using defu
    // Priority: Overrides > c12Result > manualConfigs > localRc > userRc > Defaults
    const mergedConfig = defu(
      this.overrides,
      c12Result.config || {},
      manualConfigs,
      localRc,
      userRc,
      this.defaults
    );

    // 5. Apply Schema Validation if provided
    const validatedConfig = this._validate(mergedConfig);

    return {
      config: validatedConfig,
      layers: [
        { type: 'overrides', config: this.overrides },
        ...(c12Result.layers || []),
        { type: 'manual', config: manualConfigs },
        { type: 'rc-local', config: localRc },
        { type: 'rc-user', config: userRc },
        { type: 'defaults', config: this.defaults },
      ],
      cwd: this.cwd,
      name: this.name,
    };
  }

  /**
   * Watches for configuration changes.
   * @param {Function} onUpdate - Callback called when configuration is updated
   * @returns {Promise<Object>} Watcher object with close() method
   */
  async watch(onUpdate) {
    return await watchConfig({
      name: this.name,
      cwd: this.cwd,
      jiti: this.jiti,
      onUpdate: async (newConfig) => {
        // Re-load everything when something changes
        const reloaded = await this.load();
        if (onUpdate) {
          await onUpdate(reloaded);
        }
      },
    });
  }

  /**
   * Manually parse a configuration string using confbox.
   * @param {string} content - Raw configuration string
   * @param {'yaml'|'toml'|'json'} format - Format of the string
   * @returns {Object} Parsed configuration
   */
  parse(content, format = 'yaml') {
    switch (format.toLowerCase()) {
      case 'yaml':
      case 'yml':
        return confbox.parseYAML(content);
      case 'toml':
        return confbox.parseTOML(content);
      case 'json':
        return confbox.parseJSON(content);
      default:
        throw new Error(`[ConfigMaximalist] Unsupported format: ${format}`);
    }
  }

  /**
   * Internal validation helper.
   * @private
   */
  _validate(config) {
    if (!this.schema) return config;

    if (typeof this.schema.parse === 'function') {
      // Support Zod, Valibot, etc.
      return this.schema.parse(config);
    }

    if (typeof this.schema === 'function') {
      // Support custom validation functions
      return this.schema(config);
    }

    return config;
  }
}

/**
 * Convenience function for one-shot configuration loading.
 */
export async function loadMaximalistConfig(options = {}) {
  const loader = new ConfigMaximalist(options);
  return await loader.load();
}

/**
 * Export individual utilities for maximum flexibility.
 */
export const configUtils = {
  rc9,
  defu,
  confbox,
  jiti: createJiti(import.meta.url),
};
