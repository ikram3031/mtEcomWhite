import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendVersion = '2.0.1';
try {
  const pkgPath = path.resolve(__dirname, '../../package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.version) {
      backendVersion = pkg.version;
    }
  }
} catch (err) {
  console.error('Failed to read backend package.json version:', err);
}

// Return system runtime info, backend version, Node.js version, and environment
export const getSystemInfo = async (req, res, next) => {
  try {
    return res.json({
      status: 'success',
      data: {
        backendVersion,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
