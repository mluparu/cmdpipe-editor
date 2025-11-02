# Implementation Plan: Workspace Trust Task Safeguards

**Branch**: `004-block-untrusted-tasks` | **Date**: November 1, 2025 | **Spec**: specs/004-block-untrusted-tasks/spec.md
**Input**: Feature specification from `specs/004-block-untrusted-tasks/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enforce workspace trust gating on task execution by checking `vscode.workspace.isTrusted` and reacting to trust change events, while reusing existing task discovery, picker, and shell execution flows to avoid new duplication. Deliver clear security warnings when workspace tasks are blocked and keep user-level tasks runnable.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: VS Code Extension API, existing cmdpipe task management modules (TaskConfigManager, TaskPicker, ShellExecutor), ajv for schema validation  
**Storage**: N/A (in-memory state and VS Code APIs)  
**Testing**: Jest with @vscode/test-runner  
**Target Platform**: VS Code desktop (Windows, macOS, Linux)  
**Project Type**: VS Code extension  
**Performance Goals**: Blocked task warning surfaces within 1 second; post-trust task availability refreshes within 2 seconds; 100% of workspace tasks blocked while untrusted  
**Constraints**: Must reuse existing task loading/execution plumbing to avoid duplication; must rely on VS Code Workspace Trust API and change monitoring; UI copy accessible and consistent with VS Code security UX  
**Scale/Scope**: Support up to 1000 tasks across workspace and user sources without perceptible delay

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Cross-Platform Compatibility ✅
- Enforcement logic relies exclusively on VS Code Workspace Trust APIs, which behave consistently on Windows, macOS, and Linux.
- No platform-specific shell mutations are introduced; shell handling stays inside existing `ShellExecutor` abstraction.
- **Design Impact**: Trust guard lives in command layer, maintaining cross-platform parity already validated by cmdpipe modules.

### II. Documentation-First ✅
- Specification, plan, research, data model, and contracts are produced before implementation.
- `quickstart.md` and updated docs will explain trust behavior changes prior to coding.
- **Design Impact**: Developers start from written guidance, preventing undocumented feature drift.

### III. Specification-Driven Development ✅
- All requirements derived from `specs/004-block-untrusted-tasks/spec.md` with no scope additions.
- Research confirms technical approach without altering user-facing commitments.
- **Design Impact**: Feature boundaries remain fixed, simplifying review and testing.

### IV. Test-First Development ✅
- Plan mandates new unit tests around trust guard decisions and integration tests covering mixed task sources.
- No production code will ship without accompanying tests exercising guard paths.
- **Design Impact**: Blocks regressions while embedding trust guard expectations into test suite.

### V. User Story-Driven Features ✅
- Implementation steps map to the three prioritized user stories (blocking, warning, preserving user tasks).
- Each story can be validated independently, enabling iterative delivery.
- **Design Impact**: Work can be sliced per story for focused PRs and reviews.

**Gate Status (post-design)**: PASS — Phase 0/1 artifacts uphold all constitutional principles without exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   ├── commandHandler.ts
│   ├── __taskPickerCommands.ts
│   └── __quickCommands.ts
├── config/
│   ├── schema.json
│   └── taskConfigManager.ts
├── discovery/
│   ├── taskResolver.ts
│   └── taskScanner.ts
├── editor/
│   ├── cursorManager.ts
│   └── textInsertion.ts
├── shell/
│   ├── outputProcessor.ts
│   ├── platformDetector.ts
│   └── shellExecutor.ts
├── types/
│   ├── configTypes.ts
│   └── taskTypes.ts
├── ui/
│   └── taskPicker.ts
├── utils/
│   ├── errorHandler.ts
│   └── logger.ts
└── validation/
    └── taskValidator.ts

tests/
├── e2e/
│   └── basicWorkflow.test.ts
├── integration/
│   └── shellToEditor.test.ts
└── unit/
    ├── config/
    ├── discovery/
    │   └── taskResolver.test.ts
    ├── editor/
    │   └── cursorManager.test.ts
    ├── shell/
    │   ├── outputProcessor.test.ts
    │   └── shellExecutor.test.ts
    └── validation/
```

**Structure Decision**: Reuse existing VS Code extension layout; work will focus on `src/ui/taskPicker.ts`, `src/commands/commandHandler.ts`, `src/shell/shellExecutor.ts`, and related test folders without introducing new top-level directories.

