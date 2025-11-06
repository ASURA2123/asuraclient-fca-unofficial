/**
 * Configuration module for FCA/AsuraClient
 * Supports loading configuration from JSON, YAML files and environment variables
 * @module config
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const logger = require("../func/logger");

/**
 * Default configuration values
 * @type {Object}
 */
const defaultConfig = {
  autoUpdate: true,
  mqtt: { enabled: true, reconnectInterval: 3600 },
  autoLogin: true,
  credentials: { 
    email: "", 
    password: "", 
    twofactor: "" 
  },
  logging: {
    level: "info",
    format: "json"
  },
  security: {
    encryptCredentials: true,
    encryptionKey: ""
  }
};

/**
 * Validates configuration values
 * @param {Object} config - Configuration object to validate
 * @throws {Error} If validation fails
 */
function validateConfig(config) {
  if (typeof config.autoUpdate !== "boolean") {
    throw new Error("autoUpdate must be a boolean");
  }
  
  if (config.mqtt && typeof config.mqtt.enabled !== "boolean") {
    throw new Error("mqtt.enabled must be a boolean");
  }
  
  if (config.mqtt && typeof config.mqtt.reconnectInterval !== "number") {
    throw new Error("mqtt.reconnectInterval must be a number");
  }
  
  if (typeof config.autoLogin !== "boolean") {
    throw new Error("autoLogin must be a boolean");
  }
  
  if (config.logging && !['info', 'warn', 'error', 'debug'].includes(config.logging.level)) {
    throw new Error("logging.level must be one of: info, warn, error, debug");
  }
  
  if (config.logging && !['json', 'text'].includes(config.logging.format)) {
    throw new Error("logging.format must be one of: json, text");
  }
}

/**
 * Loads configuration from environment variables
 * @returns {Object} Configuration from environment variables
 */
function loadFromEnv() {
  const config = {};
  
  // Only set values that are actually defined in environment variables
  if (process.env.FCA_AUTO_UPDATE !== undefined) {
    config.autoUpdate = process.env.FCA_AUTO_UPDATE === 'true';
  }
  
  if (process.env.FCA_MQTT_ENABLED !== undefined || process.env.FCA_MQTT_RECONNECT_INTERVAL !== undefined) {
    config.mqtt = {};
    if (process.env.FCA_MQTT_ENABLED !== undefined) {
      config.mqtt.enabled = process.env.FCA_MQTT_ENABLED !== 'false';
    }
    if (process.env.FCA_MQTT_RECONNECT_INTERVAL !== undefined) {
      config.mqtt.reconnectInterval = parseInt(process.env.FCA_MQTT_RECONNECT_INTERVAL) || 3600;
    }
  }
  
  if (process.env.FCA_AUTO_LOGIN !== undefined) {
    config.autoLogin = process.env.FCA_AUTO_LOGIN === 'true';
  }
  
  if (process.env.FCA_EMAIL !== undefined || process.env.FCA_PASSWORD !== undefined || process.env.FCA_TWOFACTOR !== undefined) {
    config.credentials = {};
    if (process.env.FCA_EMAIL !== undefined) {
      config.credentials.email = process.env.FCA_EMAIL || "";
    }
    if (process.env.FCA_PASSWORD !== undefined) {
      config.credentials.password = process.env.FCA_PASSWORD || "";
    }
    if (process.env.FCA_TWOFACTOR !== undefined) {
      config.credentials.twofactor = process.env.FCA_TWOFACTOR || "";
    }
  }
  
  if (process.env.FCA_LOG_LEVEL !== undefined || process.env.FCA_LOG_FORMAT !== undefined) {
    config.logging = {};
    if (process.env.FCA_LOG_LEVEL !== undefined) {
      config.logging.level = process.env.FCA_LOG_LEVEL || "info";
    }
    if (process.env.FCA_LOG_FORMAT !== undefined) {
      config.logging.format = process.env.FCA_LOG_FORMAT || "json";
    }
  }
  
  if (process.env.FCA_ENCRYPT_CREDENTIALS !== undefined || process.env.FCA_ENCRYPTION_KEY !== undefined) {
    config.security = {};
    if (process.env.FCA_ENCRYPT_CREDENTIALS !== undefined) {
      config.security.encryptCredentials = process.env.FCA_ENCRYPT_CREDENTIALS === 'true';
    }
    if (process.env.FCA_ENCRYPTION_KEY !== undefined) {
      config.security.encryptionKey = process.env.FCA_ENCRYPTION_KEY || "";
    }
  }
  
  return config;
}

/**
 * Loads configuration from a file (JSON or YAML)
 * @param {string} configPath - Path to the configuration file
 * @returns {Object|null} Configuration object or null if file doesn't exist
 */
function loadFromFile(configPath) {
  if (!fs.existsSync(configPath)) {
    return null;
  }
  
  try {
    const ext = path.extname(configPath).toLowerCase();
    const fileContent = fs.readFileSync(configPath, "utf8");
    
    if (ext === '.json') {
      return JSON.parse(fileContent);
    } else if (ext === '.yaml' || ext === '.yml') {
      return yaml.load(fileContent);
    } else {
      logger(`Unsupported config file format: ${ext}`, "warn");
      return null;
    }
  } catch (err) {
    logger(`Error reading config file ${configPath}: ${err.message}`, "error");
    return null;
  }
}

/**
 * Loads configuration from multiple sources with priority:
 * 1. Environment variables
 * 2. Config file (JSON/YAML)
 * 3. Default values
 * @returns {Object} Final configuration object
 */
function loadConfig() {
  // Start with default config
  let config = { ...defaultConfig };
  
  // Load from config files
  const configPaths = [
    path.join(process.cwd(), "fca-config.json"),
    path.join(process.cwd(), "fca-config.yaml"),
    path.join(process.cwd(), "fca-config.yml")
  ];
  
  for (const configPath of configPaths) {
    const fileConfig = loadFromFile(configPath);
    if (fileConfig) {
      config = { ...config, ...fileConfig };
      break;
    }
  }
  
  // Override with environment variables
  const envConfig = loadFromEnv();
  config = { ...config, ...envConfig };
  
  // Validate configuration
  try {
    validateConfig(config);
  } catch (err) {
    logger(`Configuration validation failed: ${err.message}`, "error");
    // Fall back to default config
    config = { ...defaultConfig };
  }
  
  return { config };
}

module.exports = { loadConfig, defaultConfig, validateConfig };