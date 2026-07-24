# Source architecture

Akin keeps dependencies moving in one direction:

1. `domain/` contains framework-free business rules, catalogs, validation, and types.
2. `infrastructure/` adapts browser or platform APIs such as `localStorage`.
3. `features/` contains product-facing React code grouped by responsibility.
4. `convex/` owns backend orchestration and imports shared rules from `domain/`.

Feature folders use these names consistently when they are needed:

- `components/` for reusable feature UI.
- `experiences/` for route/auth/data-loading composition.
- `model/` for feature state, providers, and public types.
- `demo/` for demo-only state and experiences.

Existing top-level feature files may remain as compatibility facades while callers migrate. They should only re-export canonical modules and must not acquire new logic.
