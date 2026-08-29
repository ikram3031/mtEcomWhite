import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reads and parses JSON file safely with fallback
const readJson = (fileName) => {
  try {
    const filePath = path.resolve(__dirname, fileName);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (error) {
    console.error(`Failed to load config: ${fileName}`, error);
  }
  return {};
};

const coreConfig = readJson("config.core.json");
const activeClientConfig = readJson("activeClient.json");
const fallbackClientConfig = readJson("config.client.json");

const clientData = Object.keys(activeClientConfig).length > 0 ? activeClientConfig : fallbackClientConfig;

export const config = {
  ...coreConfig,
  ...clientData,
};

// Safely gets nested policy value from client config
export const getClientPolicy = (policyPath, defaultValue = null) => {
  const parts = policyPath.split(".");
  let current = config.policies;
  for (const part of parts) {
    if (current === undefined || current === null) return defaultValue;
    current = current[part];
  }
  return current !== undefined ? current : defaultValue;
};
