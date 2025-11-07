# Implementation Plan: VS Code Variable Substitution in Shell Execution

**Branch**: `005-support-variable-substitution` | **Date**: November 7, 2025 | **Spec**: specs/005-support-variable-substitution/spec.md
**Input**: Feature specification from `specs/005-support-variable-substitution/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add a reusable variable resolution pipeline so every shell task resolves VS Code-style placeholders (`${workspaceFolder}`, `${env:VAR}`, `${config:key}`, `${file}`) before reaching `ShellExecutor`. The feature will gather workspace, editor, env, and configuration context, redact sensitive outputs, and block execution with descriptive errors when placeholders cannot be resolved.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: VS Code Extension API (`vscode.workspace`, `vscode.window`, configuration access), existing cmdpipe modules (`ShellExecutor`, `TaskConfigManager`, `TaskPicker`), ajv-backed task schema validation  
**Storage**: N/A (context gathered from runtime VS Code APIs)  
**Testing**: Jest with @vscode/test-runner, existing integration harnesses under `tests/integration` and `tests/e2e`  
**Target Platform**: VS Code desktop on Windows, macOS, and Linux  
**Project Type**: VS Code extension (single project under `src/`)  
**Performance Goals**: Placeholder resolution adds ≤200 ms median latency to task launch (per SC-003) and maintains zero regression in execution throughput  
**Constraints**: Must redact sensitive data in logs, must block tasks when required context (env/config/file) is missing, must respect multi-root workspace scoping  
**Scale/Scope**: Support hundreds of tasks per workspace with full placeholder coverage without increasing memory footprint materially  
**Variable Resolver Strategy**: Centralize logic in a new `VariableResolver` backed by granular workspace/editor/env/config resolvers and invoked from `ShellExecutor`  
**Environment Merge Rules**: Merge `process.env` ➝ workspace defaults ➝ task overrides; missing `${env:*}` values raise blocking errors pre-execution

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Cross-Platform Compatibility ✅
- Placeholder resolution will normalize paths using existing `pathUtils` helpers and rely on VS Code abstractions to avoid OS-specific divergences.
- Multi-root workspace detection and environment merging will reuse APIs already validated across Windows, macOS, and Linux.

### II. Documentation-First ✅
- Plan, research, data model, contracts, and quickstart documents precede implementation.
- Quickstart will include substitution examples and troubleshooting guidance before code changes land.

### III. Specification-Driven Development ✅
- Scope follows the approved feature spec; no additional behavior beyond documented FRs/edge cases will be introduced.
- Research tasks focus on clarifying how to meet the listed requirements, not expand them.

### IV. Test-First Development ✅
- Unit, integration, and e2e tests will be authored upfront to guard substitution logic, unresolved-variable errors, and log redaction before implementation.

### V. User Story-Driven Features ✅
- Work is decomposed along the three prioritized user stories (workspace, environment, configuration substitution) enabling incremental delivery and validation.

**Gate Status (pre-design)**: PASS — proceed to Phase 0 research once clarification tasks are resolved.

**Gate Status (post-design)**: PASS — research resolved resolver strategy and environment precedence; design artifacts uphold all constitutional principles without exceptions.
## Project Structure

### Documentation (this feature)

```text
specs/005-support-variable-substitution/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── extension.ts
├── commands/
│   └── commandHandler.ts
├── config/
│   ├── taskConfigManager.ts
│   └── trustAwareTaskService.ts
├── discovery/
│   ├── taskResolver.ts
│   └── taskScanner.ts
├── editor/
│   └── cursorManager.ts
├── shell/
│   ├── shellExecutor.ts
│   ├── outputProcessor.ts
│   └── platformDetector.ts
├── substitution/
│   ├── variableResolver.ts (new)
│   └── contextBuilder.ts (new)
├── types/
│   ├── taskTypes.ts
│   └── extensionTypes.ts
├── ui/
│   └── trustWarningPresenter.ts
├── utils/
│   ├── logger.ts
│   └── pathUtils.ts
└── validation/
    └── taskValidator.ts

tests/
├── integration/
│   ├── shellToEditor.test.ts
│   └── taskTrustExecution.test.ts
├── e2e/
│   └── basicWorkflow.test.ts
└── unit/
    ├── shell/
    │   └── shellExecutor.test.ts
    ├── substitution/
    │   ├── variableResolver.test.ts (new)
    │   └── contextBuilder.test.ts (new)
    └── utils/
        └── trustGuard.test.ts
```

**Structure Decision**: Extend existing single-project VS Code extension layout by introducing a focused `src/substitution/` module for variable resolution logic and companion unit tests, while modifying `ShellExecutor` integration points.

## Complexity Tracking

No constitutional violations anticipated; table intentionally left empty.
