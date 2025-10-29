# Tasks: Task Picker Automation with Trust Validation

**Input**: Design documents from `/specs/002-task-picker-automation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks included following Test-First Development constitutional requirement.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

VS Code Extension project structure:
- **Source**: `src/` at repository root
- **Tests**: `tests/` at repository root  
- **Docs**: `docs/` at repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and VS Code extension structure

- [x] T001 Install additional dependencies (ajv, ajv-formats for JSON validation) in package.json
- [x] T002 [P] Create new type definitions in src/types/configTypes.ts
- [x] T003 [P] Create discovery module directory structure (src/discovery/, src/validation/, src/ui/)
- [x] T004 [P] Create test directory structure (tests/unit/validation/, tests/unit/discovery/, tests/unit/ui/)
- [x] T005 [P] Create documentation directory structure (docs/)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Extend existing task types in src/types/taskTypes.ts with new interfaces
- [x] T007 [P] Create base configuration types in src/types/configTypes.ts
- [x] T008 [P] Create JSON schema for extended tasks.json in src/config/schema.json
- [x] T009 [P] Implement base error handling extensions in src/utils/errorHandler.ts
- [x] T010 [P] Implement path utilities for cross-platform compatibility in src/utils/pathUtils.ts
- [x] T011 [P] Set up logging categories for task picker features in src/utils/logger.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automatic Task Discovery (Priority: P1) 🎯 MVP

**Goal**: Automatically discover and display tasks from workspace .vscode and user directories in unified picker

**Independent Test**: Place valid task configuration files in both workspace .vscode folder and user folder, open workspace, open task picker, verify all tasks appear in unified interface

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T012 [P] [US1] Unit test for TaskScanner in tests/unit/discovery/taskScanner.test.ts
- [x] T013 [P] [US1] Unit test for TaskConfigManager in tests/unit/config/taskConfigManager.test.ts
- [x] T014 [P] [US1] Unit test for TaskResolver in tests/unit/discovery/taskResolver.test.ts
- [x] T015 [P] [US1] Unit test for TaskPicker UI in tests/unit/ui/taskPicker.test.ts
- [x] T016 [P] [US1] Integration test for task discovery workflow in tests/integration/taskDiscovery.test.ts

### Implementation for User Story 1

- [x] T017 [P] [US1] Create TaskSource enum in src/types/configTypes.ts
- [x] T018 [P] [US1] Create TaskConfiguration interface in src/types/configTypes.ts
- [x] T019 [P] [US1] Create TaskDefinition interface extensions in src/types/configTypes.ts
- [x] T020 [US1] Implement TaskScanner for file system scanning in src/discovery/taskScanner.ts
- [x] T021 [US1] Implement TaskConfigManager for configuration management in src/config/taskConfigManager.ts
- [x] T022 [US1] Implement TaskResolver for conflict resolution in src/discovery/taskResolver.ts
- [x] T023 [US1] Implement TaskPicker UI component in src/ui/taskPicker.ts
- [x] T024 [US1] Create TaskPickerCommands in src/commands/taskPickerCommands.ts
- [x] T025 [US1] Register task picker commands in src/commands/commandHandler.ts
- [x] T026 [US1] Initialize task discovery in src/extension.ts activation
- [x] T027 [US1] Add showTaskPicker command to VS Code command palette

**Checkpoint**: At this point, User Story 1 should be fully functional - tasks are discovered and displayed

---

## Phase 4: User Story 2 - Workspace Trust Validation (Priority: P1)

**Goal**: Enforce workspace trust security boundaries and prevent execution of untrusted workspace tasks

**Independent Test**: Open untrusted workspace with task configurations, attempt to run workspace tasks (should fail with security message), verify user tasks still work

### Tests for User Story 2 ⚠️

- [ ] T028 [P] [US2] Unit test for TrustValidator in tests/unit/validation/trustValidator.test.ts
- [ ] T029 [P] [US2] Unit test for TrustWarning UI in tests/unit/ui/trustWarning.test.ts
- [ ] T030 [P] [US2] Integration test for trust validation workflow in tests/integration/trustValidation.test.ts

### Implementation for User Story 2

- [ ] T031 [P] [US2] Create TrustStatus interface in src/types/configTypes.ts
- [ ] T032 [P] [US2] Create TrustWarningContext interface in src/types/configTypes.ts
- [ ] T033 [US2] Implement TrustValidator for workspace trust checking in src/validation/trustValidator.ts
- [ ] T034 [US2] Implement TrustWarning UI component in src/ui/trustWarning.ts
- [ ] T035 [US2] Update TaskPicker to show trust status indicators in src/ui/taskPicker.ts
- [ ] T036 [US2] Update TaskConfigManager to filter by trust status in src/config/taskConfigManager.ts
- [ ] T037 [US2] Add trust change event monitoring in src/validation/trustValidator.ts
- [ ] T038 [US2] Update CommandHandler to validate trust before execution in src/commands/commandHandler.ts
- [ ] T039 [US2] Add trust status to task picker item display logic in src/ui/taskPicker.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - tasks discovered with trust enforcement

---

## Phase 5: User Story 3 - Configuration Validation and Error Reporting (Priority: P2)

**Goal**: Validate configuration files and provide actionable error recovery options

**Independent Test**: Create invalid JSON syntax or malformed task definitions, verify specific error messages with file locations and recovery actions

### Tests for User Story 3 ⚠️

- [ ] T040 [P] [US3] Unit test for TaskValidator in tests/unit/validation/taskValidator.test.ts
- [ ] T041 [P] [US3] Unit test for ErrorReporter in tests/unit/validation/errorReporter.test.ts
- [ ] T042 [P] [US3] Unit test for ErrorDialog UI in tests/unit/ui/errorDialog.test.ts
- [ ] T043 [P] [US3] Integration test for validation error workflow in tests/integration/validationErrors.test.ts

### Implementation for User Story 3

- [ ] T044 [P] [US3] Create ValidationError interface in src/types/configTypes.ts
- [ ] T045 [P] [US3] Create ValidationResult interface in src/types/configTypes.ts
- [ ] T046 [P] [US3] Create ErrorAction enum in src/types/configTypes.ts
- [ ] T047 [US3] Implement TaskValidator with JSON schema validation in src/validation/taskValidator.ts
- [ ] T048 [US3] Implement ErrorReporter for detailed error formatting in src/validation/errorReporter.ts
- [ ] T049 [US3] Implement ErrorDialog UI with recovery actions in src/ui/errorDialog.ts
- [ ] T050 [US3] Update TaskConfigManager to use validation in src/config/taskConfigManager.ts
- [ ] T051 [US3] Add validation error display to TaskPicker in src/ui/taskPicker.ts
- [ ] T052 [US3] Add file opening functionality to ErrorDialog in src/ui/errorDialog.ts
- [ ] T053 [US3] Add validation error logging to extension output channel in src/validation/errorReporter.ts

**Checkpoint**: All user stories should now be independently functional with comprehensive error handling

---

## Phase 6: File Watching and Real-time Updates

**Goal**: Monitor configuration files for changes and automatically refresh task list

- [ ] T054 [P] Unit test for FileWatcher in tests/unit/discovery/fileWatcher.test.ts
- [ ] T055 [P] Create FileWatcherState interface in src/types/configTypes.ts
- [ ] T056 Implement FileWatcher with debounced change handling in src/discovery/fileWatcher.ts
- [ ] T057 Integrate file watching with TaskConfigManager in src/config/taskConfigManager.ts
- [ ] T058 Add automatic task picker refresh on file changes in src/ui/taskPicker.ts
- [ ] T059 Add file watcher lifecycle management in src/extension.ts

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, accessibility, and performance improvements

- [ ] T060 [P] Create task configuration format documentation in docs/task-configuration.md
- [ ] T061 [P] Create user guide documentation in docs/user-guide.md
- [ ] T062 [P] Create API reference documentation in docs/api-reference.md
- [ ] T063 [P] Create troubleshooting guide in docs/troubleshooting.md
- [ ] T064 [P] Add accessibility labels and ARIA support to TaskPicker in src/ui/taskPicker.ts
- [ ] T065 [P] Add accessibility support to ErrorDialog in src/ui/errorDialog.ts
- [ ] T066 [P] Add keyboard navigation support to all UI components
- [ ] T067 [P] Implement performance optimization (caching, lazy loading) in src/config/taskConfigManager.ts
- [ ] T068 [P] Add comprehensive E2E test in tests/e2e/taskPickerAutomation.test.ts
- [ ] T069 [P] Code cleanup and refactoring across all modules
- [ ] T070 Validate implementation against quickstart.md requirements

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2)
- **File Watching (Phase 6)**: Depends on User Story 1 completion (TaskConfigManager)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1/US2 but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Type definitions before implementations
- Core services before UI components
- UI components before command registration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel (both P1)
- All tests for a user story marked [P] can run in parallel
- Type definitions within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for TaskScanner in tests/unit/discovery/taskScanner.test.ts"
Task: "Unit test for TaskConfigManager in tests/unit/config/taskConfigManager.test.ts"
Task: "Unit test for TaskResolver in tests/unit/discovery/taskResolver.test.ts"
Task: "Unit test for TaskPicker UI in tests/unit/ui/taskPicker.test.ts"

# Launch all type definitions for User Story 1 together:
Task: "Create TaskSource enum in src/types/configTypes.ts"
Task: "Create TaskConfiguration interface in src/types/configTypes.ts"
Task: "Create TaskDefinition interface extensions in src/types/configTypes.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Automatic Task Discovery)
4. Complete Phase 4: User Story 2 (Workspace Trust Validation)
5. **STOP and VALIDATE**: Test both P1 stories independently
6. Deploy/demo if ready (core security + discovery functionality)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Basic MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Secure MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo (Robust solution!)
5. Add File Watching → Real-time updates
6. Add Polish → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Task Discovery)
   - Developer B: User Story 2 (Trust Validation)
   - Developer C: User Story 3 (Error Handling)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD requirement)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- VS Code Extension APIs used throughout for cross-platform compatibility
- Trust validation is security-critical and must be thoroughly tested