# Git Architecture Guide: Multi-Client Project Management

## 1. Client-Specific Configurations

The biggest pain point in a multi-client repository strategy is `git merge` accidentally overriding a client's branding, API keys, or custom feature flags. Here is how to structure your project to prevent this completely:

### A. The Environment Variable Strategy (Recommended)

Never hardcode configuration in tracked files. Use `.env` files.

1. In `master`, track a `.env.example` file with dummy values.
2. Add `.env` to your `.gitignore`.
3. In each client branch (and on the client's deployment server), create an untracked `.env` file containing their specific database URLs, branding colors (e.g., `PRIMARY_COLOR=#FF0000`), and feature flags.
   **Why this works:** Because `.env` is ignored, Git never tracks it, meaning a merge from `master` will _never_ touch it.

### B. The "Base + Override" Config Pattern

If configurations must be complex objects (like JSON or YAML) that are version-controlled, split them into core and client files.

1. Create `config.core.json` (Tracked in `master`). This contains the default settings for all clients.
2. Create `config.client.json` (Tracked in client branches, ignored in `master`, or just uniquely filled out in client branches).
3. In your application initialization code, dynamically merge them at runtime, prioritizing the client config:

```javascript
// Example in Node.js
const coreConfig = require("./config.core.json");
let clientConfig = {};
try {
  clientConfig = require("./config.client.json");
} catch (e) {
  // no client config exists, use defaults
}

const finalConfig = { ...coreConfig, ...clientConfig };
```

**Why this works:** `master` only ever updates `config.core.json`. It doesn't know about `config.client.json`, so a merge will never cause conflicts or overwrites on the client's specific file.

### C. The Git Attributes "Ours" Strategy (Advanced)

If you have a file that _must_ exist in both `master` and the client branch with the exact same filename (e.g., `public/favicon.ico` or `src/theme.css`), and you want to ensure `master` never overrides the client's version during a merge:

1. You need to enable the "ours" merge driver globally once on your machine:
   ```bash
   git config --global merge.ours.driver true
   ```
2. In the client branch, create a `.gitattributes` file in the root directory.
3. Add the files you want to protect to this file:
   ```text
   src/theme.css merge=ours
   public/favicon.ico merge=ours
   ```
4. Commit the `.gitattributes` file to the client branch.

**Why this works:** When you run `git merge master` into the client branch, Git will see the `.gitattributes` file and say, "For `theme.css`, I will completely ignore what `master` is doing and keep 'our' (the client branch's) current version."
