import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Resolves target client key from args, env, or .client marker
const resolveClientKey = () => {
  const argClient = process.argv[2]?.toLowerCase()?.trim();
  if (argClient) return argClient;

  const envClient = process.env.CLIENT?.toLowerCase()?.trim() || process.env.CLIENT_NAME?.toLowerCase()?.trim();
  if (envClient) return envClient;

  const clientMarkerPath = path.join(rootDir, ".client");
  if (fs.existsSync(clientMarkerPath)) {
    const fileContent = fs.readFileSync(clientMarkerPath, "utf8").trim().toLowerCase();
    if (fileContent) return fileContent;
  }

  return "decantre";
};

// Copies unified client config to backend and dashboard active targets
const syncClientConfig = () => {
  const clientKey = resolveClientKey();
  const sourceConfigPath = path.join(rootDir, "configs", `${clientKey}.json`);

  if (!fs.existsSync(sourceConfigPath)) {
    console.error(`❌ Error: Source config not found for client [${clientKey}] at: ${sourceConfigPath}`);
    process.exit(1);
  }

  const rawConfig = fs.readFileSync(sourceConfigPath, "utf8");
  const parsed = JSON.parse(rawConfig);

  // Targets
  const backendConfigTarget = path.join(rootDir, "backend", "src", "config", "config.client.json");
  const backendActiveTarget = path.join(rootDir, "backend", "src", "config", "activeClient.json");
  const dashboardActiveTarget = path.join(rootDir, "dashboard", "src", "clientConfig", "activeConfig.json");

  // Ensure target directories exist
  [backendConfigTarget, backendActiveTarget, dashboardActiveTarget].forEach((tgt) => {
    const dir = path.dirname(tgt);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Write synced configs
  fs.writeFileSync(backendConfigTarget, JSON.stringify(parsed, null, 2), "utf8");
  fs.writeFileSync(backendActiveTarget, JSON.stringify(parsed, null, 2), "utf8");
  fs.writeFileSync(dashboardActiveTarget, JSON.stringify(parsed, null, 2), "utf8");

  console.log(`✨ Successfully synced configuration for client: [${parsed.brandName} (${clientKey})]`);
  console.log(`   ├─ Stock Policy:   ${parsed.policies?.stock?.mode || "N/A"}`);
  console.log(`   ├─ Pricing Policy: ${parsed.policies?.pricing?.mode || "N/A"}`);
  console.log(`   ├─ Backend:        ${backendActiveTarget}`);
  console.log(`   └─ Dashboard:      ${dashboardActiveTarget}`);
};

syncClientConfig();
