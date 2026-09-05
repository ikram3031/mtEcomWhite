import decantreConfig from './01decantre/config.json';
import engulficConfig from './02engulfic/config.json';
import toyolandConfig from './03toyoland/config.json';
import kawaiikutirConfig from './04kawaiikutir/config.json';
import activeSyncedConfig from './activeConfig.json';

const clientConfigs = {
  decantre: decantreConfig,
  engulfic: engulficConfig,
  toyoland: toyolandConfig,
  kawaiikutir: kawaiikutirConfig,
};

// Detects active client key from current window location hostname
const getClientFromHostname = () => {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname.toLowerCase();
  const matchedKey = Object.keys(clientConfigs).find((key) => hostname.includes(key));
  return matchedKey || null;
};

const envClient = import.meta.env?.VITE_CLIENT?.toLowerCase().trim();
const detectedClient = getClientFromHostname();
const activeKey = envClient || detectedClient || activeSyncedConfig?.clientKey || 'decantre';

export const clientConfig = activeKey === activeSyncedConfig?.clientKey
  ? activeSyncedConfig
  : (clientConfigs[activeKey] || activeSyncedConfig || decantreConfig);

// Helper to inspect active policy options safely
export const getPolicy = (policyPath, defaultValue = null) => {
  const parts = policyPath.split('.');
  let current = clientConfig.policies;
  for (const part of parts) {
    if (current === undefined || current === null) return defaultValue;
    current = current[part];
  }
  return current !== undefined ? current : defaultValue;
};

// Returns active client key string
export const getActiveClientKey = () => activeKey;

export default clientConfig;
