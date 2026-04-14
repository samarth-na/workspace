# Frontend Code Quality Improvement Plan

## Goal

- Raise frontend quality from current baseline to production-ready standards.
- Target score: 17+/20 across accessibility, performance, responsiveness, theming, and maintainability.
- Prevent regressions with strict quality gates.

## Current Problem Map

- Duplicate architecture paths (`components/views/*` and `components/modules/*`) causing drift and maintenance overhead.
- Theming token mismatch (classes like `bg-card` / `bg-popover` used inconsistently with token definitions).
- Accessibility gaps (icon-only controls missing accessible names and inconsistent semantic labeling).
- Performance gaps (`<img>` usage in multiple places, hook dependency warning patterns, scroll ref behavior risk).
- Responsive gaps (hard-coded sidebar width, small touch targets in places).
- Code hygiene gaps (unused imports/vars, debug `console.log`, mixed style conventions).
- Missing automated test safety net for frontend behavior.

## Methodology

Use a 5-pass loop for each area:

1. Discover
2. Standardize
3. Refactor
4. Verify
5. Enforce

Execution style:

- Small vertical slices, not big-bang rewrites.
- Strangler migration for architecture consolidation.
- Definition of done per phase before implementation.
- Convert recurring quality issues into lint/test rules.

## Phase 0 - Baseline and Guardrails

### Actions

- Capture baseline metrics:
  - Lint count
  - Build success and time
  - A11y issue count on core screens
  - Bundle estimate
- Add/verify scripts:
  - `typecheck`
  - `lint:strict`
  - `test`
  - `test:e2e`
  - `check`
- Create `docs/frontend-quality.md` with repo standards.
- Define warning policy: no new warnings allowed.

### Definition of Done

- `bun run build` passes.
- `bun run lint` baseline captured and documented.
- Quality checklist is committed and referenced in PRs.

## Phase 1 - Architecture Consolidation (High Impact)

### Problems to Solve

- Two parallel UI systems with overlapping responsibility.
- Higher cognitive load for contributors.

### Actions

- Choose one canonical rendering path for app screens.
- Migrate features from non-canonical path.
- Remove stale/deprecated exports after parity.
- Standardize structure:
  - `components/ui` -> primitives
  - `components/shared` -> cross-feature UI
  - `components/features/<feature>` -> domain-specific views
- Enforce import boundaries and avoid circular dependencies.

### What to Look For

- Duplicate component names with different behavior.
- Duplicate view-state logic.
- Conflicting prop contracts.

### Definition of Done

- One clear component architecture remains.
- No orphaned duplicate feature components.

## Phase 2 - Accessibility Hardening

### Actions

- Add `aria-label` to all icon-only buttons.
- Ensure all inputs have associated labels.
- Validate keyboard navigation for:
  - Sidebar navigation
  - Dialog open/close/focus trap
  - Gallery modal navigation
  - Chat input interactions
- Ensure consistent visible focus styles.
- Validate semantic landmarks and heading hierarchy.

### Standards Reference

- WCAG 2.2 AA
- WAI-ARIA Authoring Practices
- Radix UI accessibility guidance

### Definition of Done

- Core user flows are keyboard-complete.
- No major WCAG AA violations in primary screens.

## Phase 3 - Theming and Token Integrity

### Actions

- Define and normalize semantic tokens (`card`, `popover`, etc.).
- Remove ad-hoc color usage from feature components.
- Ensure light/dark parity for all semantic tokens.
- Keep component styling token-driven.

### Best Practices

- Use semantic design tokens, not one-off color classes.
- Keep token definitions centralized.
- Use consistent naming conventions for theme primitives.

### What to Avoid

- Mixing raw color values with semantic tokens in same component.
- Temporary local token overrides.

### Definition of Done

- All major surfaces use tokenized semantics.
- No contrast regressions between light and dark.

## Phase 4 - Performance and Rendering Quality

### Actions

- Replace non-trivial `<img>` usage with `next/image` where appropriate.
- Add dimensions and loading strategy (`priority`, lazy) intentionally.
- Resolve unstable hook dependency patterns.
- Verify autoscroll targets correct scroll viewport element.
- Add bundle-awareness checks and split non-critical UI when needed.

### What to Look For

- Avoidable rerenders from unstable props or closures in large lists.
- Expensive effects on each render.
- Unbounded list rendering risks.

### Definition of Done

- No `@next/next/no-img-element` warnings in core app UI.
- Chat/gallery/files remain smooth with larger datasets.

## Phase 5 - Responsive and Interaction Robustness

### Actions

- Replace fixed widths with responsive constraints (`clamp`, breakpoints, collapsible states).
- Ensure touch targets are at least 44x44 for primary interactions.
- Validate at key viewport widths: 320, 375, 768, 1024, 1440.
- Remove horizontal overflow across all major screens.
- Define module-level mobile behavior explicitly.

### What to Avoid

- Desktop-first patches without mobile state planning.
- Hiding critical actions on mobile without an alternative path.

### Definition of Done

- No horizontal scrolling in primary views.
- Key actions remain accessible on small screens.

## Phase 6 - Code Hygiene and Consistency

### Actions

- Remove unused imports/variables.
- Remove debug `console.log` from app paths.
- Normalize formatting and naming conventions.
- Remove stale comments and dead code.
- Replace placeholders with real behavior or tracked TODO issues.

### Definition of Done

- Zero unused-variable warnings in active frontend code.
- No debug logs in merged frontend components.

## Phase 7 - Testing Strategy

### Actions

- Add component/unit testing:
  - Vitest
  - Testing Library
- Add accessibility test checks (`jest-axe` or equivalent).
- Add Playwright smoke E2E for:
  - Chat send + autoscroll
  - Gallery modal open/close/navigation
  - File navigation and layout toggles
- Focus assertions on behavior, not implementation details.

### What to Avoid

- Brittle tests tied to CSS class names.
- Overuse of snapshots for dynamic views.

### Definition of Done

- Smoke coverage exists for each major module.
- Tests run reliably in CI.

## Phase 8 - Global Quality Settings

### TypeScript (Recommended)

- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`
- `noPropertyAccessFromIndexSignature: true`

### ESLint (Recommended)

- `@typescript-eslint/no-unused-vars` -> error
- `no-console` -> error (allow only `warn`/`error` if needed)
- `react-hooks/exhaustive-deps` -> error
- `@next/next/no-img-element` -> error
- Enable `jsx-a11y` rule set

### Tooling

- Prettier + Tailwind class ordering plugin
- Standard `.editorconfig`
- Import ordering lint rule
- Pre-commit: lint-staged
- Pre-push: typecheck + test

### Definition of Done

- Local and CI checks are aligned.
- Standards enforced automatically.

## Phase 9 - CI/CD Quality Gates

### Required CI Jobs

- Install dependencies
- Lint
- Typecheck
- Unit tests
- E2E smoke tests
- Production build

### PR Blocking Conditions

- Lint errors or warning budget violations
- Type errors
- A11y smoke failures
- Build failures

### PR Template Checklist

- Accessibility reviewed
- Responsive behavior reviewed
- Tests added/updated
- No debug logs

### Definition of Done

- All quality checks are mandatory before merge.

## Best Practices to Follow Continuously

- Keep one source of truth per feature.
- Use semantic tokens for all reusable UI.
- Keep components focused and composable.
- Extract domain logic into hooks/helpers where needed.
- Turn repeated review feedback into lint/test enforcement.

## Anti-Patterns to Avoid

- Big-bang rewrites without migration safety.
- Adding features to deprecated paths.
- Treating warnings as optional.
- Overusing `use client` where server components suffice.
- Premature memoization without measured bottlenecks.

## Standard PR Review Checklist

- Accessibility: labels, focus, keyboard path, semantics.
- Performance: image strategy, rerender risk, effect dependencies.
- Responsive: no overflow, mobile interactions remain complete.
- Theming: semantic token use, light/dark readability.
- Hygiene: no dead code, no debug logs, no unused imports.

## Recommended Execution Order

1. Baseline + quality guardrails.
2. Architecture consolidation decision and migration.
3. P1 fixes: a11y labels, scroll behavior correctness, token mismatches, image strategy.
4. Lint/type strictness and hygiene cleanup.
5. Responsive hardening and touch target fixes.
6. Testing stack and CI quality gates.
7. Final quality audit and score re-evaluation.

## Success Metrics

- Lint: zero warnings (or strict documented budget)
- Build: stable and repeatable
- A11y: WCAG AA major issues resolved
- Performance: no obvious image/render anti-pattern warnings
- Architecture: single canonical feature path
- CI: quality gates enforced on every PR
