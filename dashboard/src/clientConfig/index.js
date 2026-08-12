import decantreConfig from './01decantre/config.json';
import ingulficConfig from './02ingulfic/config.json';
import toylandConfig from './03toyland/config.json';

const clientConfigs = {
  decantre: decantreConfig,
  ingulfic: ingulficConfig,
  toyland: toylandConfig,
};

// Resolve the active client identifier
const envClient = import.meta.env?.VITE_CLIENT?.toLowerCase().trim();

// Fallback to hostname detection
const getClientFromHostname = () => {
  if (typeof window === 'undefined') return 'decantre';
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.includes('ingulfic')) return 'ingulfic';
  if (hostname.includes('toyland')) return 'toyland';
  return 'decantre';
};

const activeKey = envClient || getClientFromHostname();

export const clientConfig = clientConfigs[activeKey] || decantreConfig;
export const getActiveClientKey = () => activeKey;
export default clientConfig;
