import { readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

const CONFIG_DIR = join(homedir(), '.wp-post-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const CREDENTIALS_FILE = join(CONFIG_DIR, 'credentials.json');

// Derive encryption key from machine-specific data
function getEncryptionKey() {
  const seed = `wp-post-cli:${homedir()}:${process.env.USERNAME || process.env.USER || 'default'}`;
  return createHash('sha256').update(seed).digest();
}

function encrypt(text) {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(data) {
  const key = getEncryptionKey();
  const [ivHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function ensureConfigDir() {
  mkdirSync(CONFIG_DIR, { recursive: true });
  try {
    chmodSync(CONFIG_DIR, 0o700);
  } catch {
    // chmod may not work on Windows, acceptable
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeJson(filePath, data) {
  ensureConfigDir();
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  try {
    chmodSync(filePath, 0o600);
  } catch {
    // chmod may not work on Windows, acceptable
  }
}

// --- Public API ---

export function getConfigDir() {
  return CONFIG_DIR;
}

export function listProfiles() {
  const config = readJson(CONFIG_FILE);
  return config.profiles || {};
}

export function getDefaultProfileName() {
  const config = readJson(CONFIG_FILE);
  return config.defaultProfile || null;
}

export function setDefaultProfile(name) {
  const config = readJson(CONFIG_FILE);
  if (!config.profiles || !config.profiles[name]) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  config.defaultProfile = name;
  writeJson(CONFIG_FILE, config);
}

export function addProfile(name, url, user) {
  const config = readJson(CONFIG_FILE);
  if (!config.profiles) config.profiles = {};

  // Normalize URL: remove trailing slash
  url = url.replace(/\/+$/, '');

  config.profiles[name] = { url, user };

  // Auto-set default if first profile
  if (!config.defaultProfile) {
    config.defaultProfile = name;
  }

  writeJson(CONFIG_FILE, config);
}

export function removeProfile(name) {
  const config = readJson(CONFIG_FILE);
  if (!config.profiles || !config.profiles[name]) {
    throw new Error(`Profile "${name}" does not exist.`);
  }
  delete config.profiles[name];

  // Clear default if it was the removed profile
  if (config.defaultProfile === name) {
    const remaining = Object.keys(config.profiles);
    config.defaultProfile = remaining.length > 0 ? remaining[0] : null;
  }

  writeJson(CONFIG_FILE, config);

  // Also remove credentials
  const creds = readJson(CREDENTIALS_FILE);
  delete creds[name];
  writeJson(CREDENTIALS_FILE, creds);
}

export function setCredential(profileName, password) {
  const creds = readJson(CREDENTIALS_FILE);
  creds[profileName] = encrypt(password);
  writeJson(CREDENTIALS_FILE, creds);
}

export function getResolvedProfile(profileNameOption) {
  const config = readJson(CONFIG_FILE);
  const profiles = config.profiles || {};
  const name = profileNameOption || config.defaultProfile;

  if (!name) {
    throw new Error('No profile specified and no default profile set. Run: wp-post config add <name>');
  }

  const profile = profiles[name];
  if (!profile) {
    throw new Error(`Profile "${name}" not found. Run: wp-post config list`);
  }

  // Get credential
  const creds = readJson(CREDENTIALS_FILE);
  const encryptedPassword = creds[name];
  if (!encryptedPassword) {
    throw new Error(`No credentials found for profile "${name}". Run: wp-post config add ${name}`);
  }

  let password;
  try {
    password = decrypt(encryptedPassword);
  } catch {
    throw new Error(`Failed to decrypt credentials for profile "${name}". Re-add the profile.`);
  }

  return {
    name,
    url: profile.url,
    user: profile.user,
    password,
  };
}
