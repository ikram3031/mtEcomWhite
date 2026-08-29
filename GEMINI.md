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

## 4. Code Style, Commenting & Core Logic Guardrails
- **Arrow Functions**: Always use arrow functions (`const myFunc = () => {}`) for functional components and all custom logic/handlers. Do not use standard `function` declarations.
- **No Inline Comments**: NEVER put inline comments inside code bodies, loops, conditions, or JSX blocks. Keep internal logic clean.
- **Single-Line Preceding Function Comment Only**: Place exactly one concise, single-line relative comment on the line immediately preceding the function declaration.
- **Core Logic Verification**: Always clarify and verify with the user before modifying core architectural, multi-tenant, inventory deduction, or payment logic.

**Example**:
```javascript
// Calculates and returns total discount applied across cart items
const calculateDiscount = (items) => {
  return items.reduce((acc, item) => acc + (item.price - item.discount), 0);
};
```

---

## 5. Deployment Rules (STRICT — NO EXCEPTIONS)
- **NEVER run any VPS build, `docker compose up --build`, or deployment command without user instruction.**
- When user instructs *"ডিপ্লয় দাও"*, execute the deployment commands directly using tools instead of outputting code text.
- **`temp` branch commits and `git push` are fine without confirmation.**
- **Merging `temp` into `Live` and pushing to GitHub is fine without confirmation.**
- **Only the actual VPS build/deploy step requires explicit user command.**
