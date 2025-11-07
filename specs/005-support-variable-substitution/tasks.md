# Tasks: VS Code Variable Substitution in Shell Execution

**Input**: Design documents from `/specs/005-support-variable-substitution/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included because the spec and plan mandate test-first coverage for the substitution pipeline.

**Organization**: Tasks are grouped by user story so each increment is independently implementable and testable.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm workspace prerequisites before implementation starts

- [X] T001 Ensure dependencies are current by running `npm install` for package.json
- [X] T002 Review quickstart guidance to align tooling expectations in specs/005-support-variable-substitution/quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared substitution scaffolding required by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Define substitution data contracts from the data model in src/substitution/substitutionTypes.ts
- [X] T004 Author reusable substitution summary helper scaffolding in src/substitution/substitutionSummary.ts
- [X] T005 Create shared substitution test fixtures to drive unit coverage in tests/unit/substitution/__helpers__/contextFactory.ts

**Checkpoint**: Typed contracts, summary helpers, and fixtures exist to support story-specific development

---

## Phase 3: User Story 1 - Execute Workspace-Aware Tasks (Priority: P1) 🎯 MVP

**Goal**: Resolve workspace and file-scoped placeholders so tasks launch with correct workspace context (incl. multi-root support)

**Independent Test**: Run a task referencing `${workspaceFolder}/scripts/build.sh` and verify the spawned command uses the absolute workspace path without manual edits.

### Tests for User Story 1 ⚠️

- [X] T006 [P] [US1] Add workspace snapshot unit coverage for folder and relative file resolution in tests/unit/substitution/contextBuilder.test.ts
- [X] T007 [P] [US1] Add workspace placeholder parsing unit coverage in tests/unit/substitution/variableResolver.test.ts
- [X] T008 [P] [US1] Add integration coverage validating workspace placeholder substitution in tests/integration/variableSubstitutionWorkspace.test.ts

### Implementation for User Story 1

- [X] T009 [US1] Implement workspace context snapshot assembly (single and multi-root) in src/substitution/contextBuilder.ts
- [X] T010 [US1] Implement workspace placeholder substitution pipeline in src/substitution/variableResolver.ts
- [X] T011 [US1] Wire variable resolver invocation into the execution flow within src/shell/shellExecutor.ts
- [X] T012 [US1] Surface task workspace ownership metadata for substitution via src/discovery/taskResolver.ts
- [X] T013 [US1] Emit workspace substitution summaries through structured logging in src/utils/logger.ts

**Checkpoint**: Workspace placeholders resolve end-to-end with logging support and multi-root awareness

---

## Phase 4: User Story 2 - Inject Environment Context (Priority: P2)

**Goal**: Merge environment sources and resolve `${env:*}` placeholders with blocking errors and redacted logging

**Independent Test**: Execute a task referencing `${env:API_KEY}` with the variable defined and verify the command receives the value while logs redact the secret; rerun without the variable and confirm execution blocks with a descriptive error.

### Tests for User Story 2 ⚠️

- [X] T014 [P] [US2] Extend context builder unit coverage for environment merge precedence in tests/unit/substitution/contextBuilder.test.ts
- [X] T015 [P] [US2] Extend resolver unit coverage for environment placeholder substitution in tests/unit/substitution/variableResolver.test.ts
- [X] T016 [P] [US2] Add integration coverage for environment substitution success and failure in tests/integration/variableSubstitutionEnv.test.ts

### Implementation for User Story 2

- [X] T017 [US2] Implement merged environment snapshot logic with precedence rules in src/substitution/contextBuilder.ts
- [X] T018 [US2] Implement environment placeholder substitution with sensitive-value redaction in src/substitution/variableResolver.ts
- [X] T019 [US2] Redact environment values within substitution summaries in src/substitution/substitutionSummary.ts
- [X] T020 [US2] Route missing environment placeholder failures through the shared pipeline in src/utils/errorHandler.ts

**Checkpoint**: Environment placeholders resolve or fail fast with clear messaging and redacted diagnostics

---

## Phase 5: User Story 3 - Reuse Configuration Defaults (Priority: P3)

**Goal**: Resolve `${config:*}` placeholders honoring VS Code scope precedence and multi-placeholder strings

**Independent Test**: Configure `cmdpipe.shell.defaultWorkingDirectory`, reference `${config:cmdpipe.shell.defaultWorkingDirectory}` in a task, and verify the shell launches in the configured directory; remove the setting and confirm execution blocks with a descriptive error.

### Tests for User Story 3 ⚠️

- [X] T021 [P] [US3] Extend context builder unit coverage for configuration scope precedence in tests/unit/substitution/contextBuilder.test.ts
- [X] T022 [P] [US3] Extend resolver unit coverage for configuration placeholder substitution in tests/unit/substitution/variableResolver.test.ts
- [X] T023 [P] [US3] Add integration coverage for configuration substitution scenarios in tests/integration/variableSubstitutionConfig.test.ts

### Implementation for User Story 3

- [X] T024 [US3] Implement configuration snapshot retrieval with workspace-folder precedence in src/substitution/contextBuilder.ts
- [X] T025 [US3] Implement configuration placeholder substitution with multi-token support in src/substitution/variableResolver.ts
- [X] T026 [US3] Surface configuration substitution failures through the execution pipeline in src/shell/shellExecutor.ts
- [X] T027 [US3] Extend substitution summaries to display configuration tokens in src/substitution/substitutionSummary.ts

**Checkpoint**: Configuration placeholders resolve with correct precedence and integrated error handling

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, verification, and release readiness activities across stories

- [X] T028 Update docs/index.md with end-user guidance for variable substitution support
- [X] T029 Refresh quickstart instructions with final verification steps in specs/005-support-variable-substitution/quickstart.md
- [X] T030 Document substitution capabilities in README.md for repository visibility
- [X] T031 Run targeted substitution test suite via `npm test -- substitution` entry in package.json

---

## Dependencies & Execution Order

- **Phase Dependencies**: Setup (Phase 1) → Foundational (Phase 2) → User Story phases in priority order (Phases 3–5) → Polish (Final Phase)
- **User Story Dependencies**: US1 blocks US2 and US3; US2 and US3 can proceed in parallel after US1 if the team prefers, but each remains independently testable.
- **Task Dependencies**: Within each story, execute tests first (T006/T007/T008, T014/T015/T016, T021/T022/T023) so they fail, then implement supporting code in numerical order.

---

## Parallel Execution Examples

- **US1 Parallel Work**: T006, T007, and T008 can be authored concurrently to define failing tests before implementing T009–T013.
- **US2 Parallel Work**: T014, T015, and T016 can run in parallel once US1 completes, enabling simultaneous test authoring for environment scenarios.
- **US3 Parallel Work**: T021, T022, and T023 can be tackled together after US2 dependencies are satisfied, priming configuration coverage before implementation tasks.

---

## Implementation Strategy

1. Complete Setup and Foundational phases to establish shared contracts, helpers, and fixtures.
2. Deliver MVP by finishing User Story 1 (workspace substitution) and verifying its independent test.
3. Layer User Story 2 to add environment coverage, ensuring redaction and error propagation.
4. Add User Story 3 to complete configuration substitution, maintaining independent verification.
5. Conclude with polish tasks to document behavior and run targeted tests prior to release.
