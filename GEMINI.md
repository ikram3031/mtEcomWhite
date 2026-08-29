# Git Commit & Centralized Logging Standards

## 1. Commit Message Format
Every commit message must strictly follow this structure:
`<LogID>(<type>): <description>`

- **LogID**: The corresponding changelog ID matching the action scope (e.g. `AA01`, `AB02`, `AD01`, `DEP01`, etc.).
- **type (4 letters max)**:
  - `feat` (New feature / capability)
  - `fix`  (Bug fix)
  - `refc` (Refactoring / code cleanup)
  - `docs` (Documentation updates)
  - `perf` (Performance improvements)
  - `chor` (Chores / dependency / build updates)
  - `styl` (Styling / CSS / theme UI changes)
  - `test` (Testing / test scripts)
- **description**: Clear, concise explanation of the change in sentence case.

**Examples**:
- `AA01(feat): add centralized multi-tenant capability config and cloudflare telemetry hub`
- `AB02(feat): add backend heartbeat telemetry scheduler and public health endpoint`
- `AD01(feat): integrate centralized config loader and policy helper in dashboard`

---

## 2. No Lazy Commits
- Never make lazy, generic, or single-word commits (e.g. `up`, `fix`, `test`, `wip`, `temp`, `changes`).
- Every commit must describe the exact business or technical logic changed.

---

## 3. Centralized Logging via Central Hub (Zero Local Docs)
- **NO LOCAL DOCUMENTATION OR BATCH FILES IN `Docs/`**: We no longer write or maintain markdown logs/batch files locally.
- All actions, changes, requirements, and test audits must be logged directly into the Central Cloudflare D1 Hub using the rich logger CLI:
  ```bash
  node client-kit/log.js "<ID>(<type>): <Summary>" \
    --reqs "- Business requirement and problem context" \
    --changes "- File and logic changes breakdown" \
    --notes "Verification and test notes"
  ```
- Refer to `AI_INSTRUCTIONS.md` for full scopes, endpoint details, and logger instructions.

---

## 4. Code Style & Commenting Standards
- **Arrow Functions**: Always use arrow functions (`const myFunc = () => {}`) for functional components and all custom logic/handlers. Do not use standard `function` declarations.
- **Function Comments Only**: Relative comments should only be placed on functions. 
- **Comment Placement**: Comments must be placed exactly on the line immediately preceding the function declaration. Avoid random inline comments or scattered block comments inside the code logic unless absolutely necessary. 

**Example**:
```javascript
// Calculates and returns the discounted total for cart items
const calculateDiscount = (items) => {
  // ...
}
```

---

## 5. Deployment Rules (STRICT — NO EXCEPTIONS)
- **NEVER run any VPS build, `docker compose up --build`, or deployment command on `Live` branch without the user's explicit confirmation first.**
- Before any live deploy, always stop and ask: *"Deploy করবো?"* and wait for the user to say yes.
- This applies to ALL environments marked as live/production:
  - `decantre-backend-live`, `decantre-dashboard-live` on `144.79.218.126`
  - `engulfic-backend-live`, `engulfic-dashboard-live` on `144.79.218.8`
  - Any other container with `-live` in the name.
- **`temp` branch commits and `git push` are fine without confirmation.**
- **Merging `temp` into `Live` and pushing to GitHub is fine without confirmation.**
- **Only the actual VPS build/deploy step requires confirmation.**
