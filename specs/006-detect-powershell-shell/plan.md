# Implementation Plan: PowerShell Default Shell Detection

**Branch**: `006-detect-powershell-shell` | **Date**: 2025-11-07 | **Spec**: specs/006-detect-powershell-shell/spec.md
**Input**: Feature specification from `/specs/006-detect-powershell-shell/spec.md`

## Summary

- Update platform detection to honor VS Code's `terminal.integrated.defaultProfile.windows` setting before falling back to environment variables on Windows.
- Prefer PowerShell (Windows PowerShell or PowerShell Core) when the setting or system defaults point to it, while retaining command prompt as a safe fallback.
- Extend argument escaping logic with PowerShell-specific quoting rules so task execution preserves user-supplied arguments exactly once delivered to the shell.
- Keep macOS and Linux behavior untouched and ensure regression test coverage for Windows scenarios with and without PowerShell defaults.

## Technical Context

**Language/Version**: TypeScript 5.x targeting ES2020
**Primary Dependencies**: VS Code Extension API, Node.js standard library modules (`os`, `process`)
**Storage**: N/A (in-memory configuration only)
**Testing**: Jest test suite with existing unit and integration coverage
**Target Platform**: Cross-platform VS Code extension (Windows focus for this feature)
**Project Type**: VS Code extension (single project workspace)
**Performance Goals**: Platform detection completes within 50 ms per invocation and introduces no measurable delay to task launch
**Constraints**: Zero regression risk for macOS/Linux behavior; no new runtime dependencies; maintain compatibility with existing task execution pipeline
**Scale/Scope**: Applies to all extension users; scope limited to shell detection, argument escaping, and related diagnostics

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Cross-Platform Compatibility**: Plan preserves existing macOS/Linux code paths and adds Windows-specific logic guarded by detection, satisfying the principle.
- **Documentation-First**: Research, design artifacts, and quickstart deliverables are scheduled before implementation, keeping documentation ahead of coding.
- **Specification-Driven Development**: Implementation stays within the approved spec boundaries; no new scope introduced.
- **Test-First Development**: Plan includes expanding unit/integration tests before code modifications to enforce PowerShell detection and escaping behavior.
- **User Story-Driven Features**: Work items map directly to the three prioritized user stories in the specification.

Gate status: ✅ All constitutional requirements satisfied; proceed to Phase 0.

Post-Phase-1 review (2025-11-07): ✅ Design artifacts introduce no new constitutional risks; documentation remains ahead of implementation.

## Project Structure

### Documentation (this feature)

```text
specs/006-detect-powershell-shell/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md (created via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── shell/
│   ├── platformDetector.ts
│   ├── shellExecutor.ts
│   └── outputProcessor.ts
├── config/
│   ├── taskConfigManager.ts
│   └── trustAwareTaskService.ts
├── substitution/
│   ├── variableResolver.ts
│   └── contextBuilder.ts
└── utils/
    └── logger.ts

tests/
├── integration/
│   ├── shellToEditor.test.ts
│   └── variableSubstitutionConfig.test.ts
└── unit/
    ├── shell/
    │   └── platformDetector.test.ts
    └── utils/
        └── pathUtils.test.ts
```

**Structure Decision**: Reuse the existing single VS Code extension project layout under `src/` with corresponding unit and integration tests under `tests/`. No new top-level packages are required; updates stay within `src/shell` and companion utilities.

## Complexity Tracking

No constitutional violations or exceptional complexity introduced; table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
