# Git Commit & Changelog Standards

## 1. Commit Message Format
Every commit message must strictly follow this structure:
`<LogID>(<type>): <description>`

- **LogID**: The corresponding changelog ID matching the doc entry:
  - Dashboard changes: `AD01`, `AD76`, etc. (or `NDxx` if following active sequence).
  - Backend changes: `AB01`, `AB84`, etc.
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
- `AD76(feat): add localstorage persistence and in-dropdown category search to meta catalog`
- `AB85(fix): resolve category regex and comma separated query parsing in product filter`
- `AD77(styl): refine sidebar menu vertical spacing and golden active border`

---

## 2. No Lazy Commits
- Never make lazy, generic, or single-word commits (e.g. `up`, `fix`, `test`, `wip`, `temp`, `changes`).
- Every commit must describe the exact business or technical logic changed.

---

## 3. Changelog Documentation & Batch Files
- All changelog entries are maintained under the root `Docs/` directory with separate subdirectories for each component:
  - **Dashboard**: `Docs/dashboard/` (e.g. `AD01-200.md`, `AD201-400.md`, etc.)
  - **Backend**: `Docs/backend/` (e.g. `AB01-200.md`, `AB201-400.md`, etc.)
- **Batch Range Rules**:
  - Each markdown file corresponds to a defined serial range (e.g. `01` to `200`).
  - Entries must be added at the top (latest first) within the active range file.
  - When a batch limit is reached (e.g. moving to log `201`), create the next batch file (e.g. `AD201-400.md` or `AB201-400.md`) if it doesn't already exist and write the new logs there.
  - Never write logs beyond the assigned range in a completed batch file.

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
