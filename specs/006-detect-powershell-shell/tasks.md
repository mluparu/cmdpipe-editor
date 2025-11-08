# Tasks: PowerShell Default Shell Detection

**Input**: Design documents from `/specs/006-detect-powershell-shell/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include targeted unit and integration coverage where called out by user stories.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish test fixtures that simulate Windows VS Code shell preferences.

- [X] T001 Add terminal profile configuration stubs for Windows to `tests/__mocks__/vscode.ts`
- [X] T002 [P] Create VS Code PowerShell default profile settings fixture in `test-workspace/.vscode/settings.windows.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prepare platform detection types and structure for Windows-specific logic.

- [X] T003 Refactor Windows platform detection entry points in `src/shell/platformDetector.ts` to allow reloading configuration
- [X] T004 Extend `PlatformInfo` metadata with profile identifiers and diagnostics in `src/types/extensionTypes.ts`

**Checkpoint**: Platform detection layer ready for user story-specific enhancements.

---

## Phase 3: User Story 1 - Respect Windows PowerShell Default (Priority: P1)

**Goal**: Ensure the extension honors VS Code's PowerShell default shell configuration on Windows.

**Independent Test**: Configure `terminal.integrated.defaultProfile.windows` to PowerShell, trigger a task, and verify the process launches under PowerShell end-to-end.

### Implementation for User Story 1

- [X] T005 [US1] Resolve `terminal.integrated.defaultProfile.windows` before environment fallbacks in `src/shell/platformDetector.ts`
- [X] T006 [P] [US1] Map VS Code PowerShell profiles to executable path and arguments in `src/shell/platformDetector.ts`

### Tests for User Story 1

- [X] T007 [P] [US1] Add PowerShell default detection coverage in `tests/unit/shell/platformDetector.test.ts`
- [X] T008 [P] [US1] Verify PowerShell launch path via integration workflow in `tests/integration/shellToEditor.test.ts`

**Checkpoint**: PowerShell becomes the detected default shell when configured via VS Code.

---

## Phase 4: User Story 2 - Safe Fallback to Command Prompt (Priority: P2)

**Goal**: Guarantee reliable command execution when PowerShell is unavailable or misconfigured.

**Independent Test**: Simulate an invalid PowerShell default, run a task, and confirm Command Prompt executes with diagnostics explaining the fallback.

### Implementation for User Story 2

- [X] T009 [US2] Implement Command Prompt fallback when PowerShell profile cannot resolve in `src/shell/platformDetector.ts`
- [X] T010 [P] [US2] Surface fallback diagnostics through scoped logging in `src/utils/logger.ts`

### Tests for User Story 2

- [X] T011 [P] [US2] Add unit regression for fallback selection in `tests/unit/shell/platformDetector.test.ts`
- [X] T012 [P] [US2] Cover fallback execution flow in `tests/integration/shellToEditor.test.ts`

**Checkpoint**: Tasks run successfully under Command Prompt whenever PowerShell detection fails.

---

## Phase 5: User Story 3 - Preserve Argument Integrity in PowerShell (Priority: P3)

**Goal**: Escape task arguments with PowerShell-specific rules to avoid command corruption.

**Independent Test**: Execute a task containing spaces, quotes, ampersands, and redirection symbols and confirm PowerShell receives the exact argument values.

### Implementation for User Story 3

- [X] T013 [US3] Implement PowerShell single-quote escaping helper inside `src/shell/platformDetector.ts`

### Tests for User Story 3

- [X] T014 [P] [US3] Add PowerShell escaping unit cases to `tests/unit/shell/platformDetector.test.ts`
- [X] T015 [P] [US3] Validate argument preservation through PowerShell integration in `tests/integration/shellToEditor.test.ts`

### Contract & Documentation for User Story 3

- [X] T016 [P] [US3] Document PowerShell escaping behavior in `specs/006-detect-powershell-shell/contracts/shell-detection.openapi.yaml`

**Checkpoint**: Arguments survive PowerShell execution unchanged across unit and integration coverage.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation and regression coverage after user stories complete.

- [X] T017 [P] Update manual validation steps with PowerShell scenarios in `specs/006-detect-powershell-shell/quickstart.md`
- [X] T018 [P] Capture fallback and escaping guidance in `docs/E2E-TESTING.md`
- [X] T019 Run full regression suite via `npm test` defined in `package.json`

---

## Dependencies & Execution Order

- **Phase Dependencies**: Setup → Foundational → User Story phases (P1 → P2 → P3) → Polish. Later phases depend on completion of earlier phases.
- **Story Dependencies**: US1 depends on foundational tasks; US2 depends on foundational work and may reuse helpers from US1 but should keep fallback logic isolated; US3 depends on the updated detection pipeline from US1 and US2 for shell selection while focusing on escaping.
- **Within Story**: Implement detection logic tasks before adding or updating tests. Integration tests depend on unit-level fixtures being available.

## Parallel Execution Examples

- **User Story 1**: After T005 completes, run T006, T007, and T008 in parallel to map profiles and build tests using shared fixtures.
- **User Story 2**: With fallback logic (T009) in place, T010, T011, and T012 can proceed concurrently to add diagnostics and regression coverage.
- **User Story 3**: Once the escaping helper (T013) lands, execute T014, T015, and T016 in parallel to validate behavior and update the contract.

## Implementation Strategy

1. Deliver MVP by completing Setup, Foundational, and User Story 1 (T001–T008) to ensure PowerShell defaults work immediately.
2. Layer in fallback reliability (T009–T012) so environments without PowerShell remain stable.
3. Finish by hardening argument handling and documentation (T013–T019) before release.
4. Treat each user story as a deployable increment—validate its independent test criteria before moving forward.

## Report

- **Generated File**: `specs/006-detect-powershell-shell/tasks.md`
- **Total Tasks**: 19
- **Tasks per User Story**:
  - US1: 4 tasks (T005–T008)
  - US2: 4 tasks (T009–T012)
  - US3: 4 tasks (T013–T016)
- **Parallel Opportunities**: Highlighted in Parallel Execution Examples for US1, US2, and US3.
- **Independent Test Criteria**: Restated within each user story section for targeted validation.
- **Suggested MVP Scope**: Complete through User Story 1 (T001–T008) to ship PowerShell default detection.
- **Format Validation**: All tasks follow the required `- [ ] T### [P?] [US?] Description with file path` checklist format.
