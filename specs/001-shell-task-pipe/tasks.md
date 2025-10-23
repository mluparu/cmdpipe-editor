# Tasks: Shell Task Pipe Extension

**Input**: Design documents from `/specs/001-shell-task-pipe/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Following TDD approach as specified in constitution - tests written before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

VSCode extension structure as defined in plan.md:
- Source code: `src/` directory structure
- Tests: `tests/` with unit, integration, and e2e subdirectories
- Documentation: `docs/` and root-level files
- Configuration: `.vscode/`, `package.json`, etc.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: VSCode extension project initialization and basic structure

- [x] T001 Create VSCode extension project structure per implementation plan
- [x] T002 Initialize TypeScript project with VSCode Extension API dependencies in package.json
- [x] T003 [P] Configure TypeScript compiler settings in tsconfig.json
- [x] T004 [P] Setup Jest testing framework in jest.config.js
- [x] T005 [P] Configure VSCode extension packaging in .vscodeignore
- [x] T006 [P] Setup development environment in .vscode/launch.json
- [x] T007 [P] Configure build tasks in .vscode/tasks.json
- [x] T008 [P] Setup linting and formatting with ESLint configuration

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T009 Create TypeScript type definitions in src/types/taskTypes.ts, src/types/configTypes.ts, src/types/extensionTypes.ts
- [x] T010 [P] Implement platform detection utility in src/shell/platformDetector.ts
- [x] T011 [P] Create JSON schema for task configuration in src/config/schema.json
- [x] T012 [P] Implement basic logger utility in src/utils/logger.ts
- [x] T013 [P] Create error handling utilities in src/utils/errorHandler.ts
- [x] T014 [P] Implement path resolution utilities in src/utils/pathResolver.ts
- [x] T015 Create extension entry point with activation hooks in src/extension.ts
- [x] T016 Setup extension manifest with contribution points in package.json

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Execute Shell Task at Cursor (Priority: P1) 🎯 MVP

**Goal**: Enable developers to run predefined shell commands and insert output at cursor position

**Independent Test**: Configure one shell task in JSON file, place cursor in editor, run command, verify output appears at cursor location

### Tests for User Story 1 (TDD Approach) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [P] [US1] Unit test for shell command execution in tests/unit/shell/shellExecutor.test.ts
- [x] T018 [P] [US1] Unit test for cursor position detection in tests/unit/editor/cursorManager.test.ts
- [x] T019 [P] [US1] Unit test for text insertion logic in tests/unit/editor/textInsertion.test.ts
- [x] T020 [P] [US1] Integration test for task execution workflow in tests/integration/shellToEditor.test.ts
- [x] T021 [P] [US1] E2E test for basic task execution in tests/e2e/basicWorkflow.test.ts

### Implementation for User Story 1

- [x] T022 [P] [US1] Implement cross-platform shell executor in src/shell/shellExecutor.ts
- [x] T023 [P] [US1] Create shell output processor in src/shell/outputProcessor.ts
- [x] T024 [P] [US1] Implement cursor position manager in src/editor/cursorManager.ts
- [x] T025 [P] [US1] Create text insertion handler in src/editor/textInsertion.ts
- [x] T026 [P] [US1] Implement selection state handler in src/editor/selectionHandler.ts
- [x] T027 [US1] Create task executor coordinator in src/commands/taskExecutor.ts (depends on T022-T026)
- [x] T030 [US1] Add timeout mechanism and error handling for hanging commands
- [x] T031 [US1] Integrate components in extension entry point for User Story 1 functionality

**Checkpoint**: At this point, User Story 1 should be fully functional - users can execute predefined shell tasks at cursor

---

## Phase 4: User Story 2 - Dynamic Task Configuration (Priority: P2)

**Goal**: Enable dynamic task definition through JSON configuration with automatic command registration

**Independent Test**: Create/edit task configuration file, save it, verify new commands appear in command palette without reload

### Tests for User Story 2 (TDD Approach) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T028 [US1] Implement basic command registration in src/commands/commandRegistry.ts
- [ ] T029 [US1] Add command palette integration in src/commands/commandPalette.ts
- [ ] T032 [P] [US2] Unit test for JSON configuration parsing in tests/unit/config/taskConfig.test.ts
- [ ] T033 [P] [US2] Unit test for file watching functionality in tests/unit/config/fileWatcher.test.ts
- [ ] T034 [P] [US2] Unit test for configuration validation in tests/unit/config/validator.test.ts
- [ ] T035 [P] [US2] Integration test for configuration to command mapping in tests/integration/configToCommand.test.ts
- [ ] T036 [P] [US2] E2E test for dynamic configuration changes in tests/e2e/configChanges.test.ts

### Implementation for User Story 2

- [ ] T037 [P] [US2] Implement task configuration parser in src/config/taskConfig.ts
- [ ] T038 [P] [US2] Create JSON schema validator in src/config/validator.ts
- [ ] T039 [P] [US2] Implement file watcher for configuration changes in src/config/fileWatcher.ts
- [ ] T040 [US2] Enhance command registry for dynamic registration in src/commands/commandRegistry.ts (depends on T037-T039)
- [ ] T041 [US2] Add configuration change event handling in src/commands/commandRegistry.ts
- [ ] T042 [US2] Implement automatic command cleanup for removed tasks
- [ ] T043 [US2] Add configuration reload mechanism without extension restart
- [ ] T044 [US2] Integrate dynamic configuration system with existing task execution

**Checkpoint**: At this point, User Story 2 should be fully functional - users can define custom tasks that automatically become available

---

## Phase 5: User Story 3 - Configuration Error Handling (Priority: P3)

**Goal**: Provide clear error messages and debugging support for configuration issues

**Independent Test**: Introduce JSON syntax errors and invalid configurations, verify appropriate error messages appear in output panel

### Tests for User Story 3 (TDD Approach) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T045 [P] [US3] Unit test for error message formatting in tests/unit/ui/errorDisplay.test.ts
- [ ] T046 [P] [US3] Unit test for output panel integration in tests/unit/ui/errorDisplay.test.ts
- [ ] T047 [P] [US3] Unit test for notification system in tests/unit/ui/notifications.test.ts
- [ ] T048 [P] [US3] Integration test for error handling workflow in tests/integration/errorHandling.test.ts
- [ ] T049 [P] [US3] E2E test for various error scenarios in tests/e2e/errorScenarios.test.ts

### Implementation for User Story 3

- [ ] T050 [P] [US3] Implement error display manager in src/ui/errorDisplay.ts
- [ ] T051 [P] [US3] Create notification system in src/ui/notifications.ts
- [ ] T052 [P] [US3] Implement status bar integration in src/ui/statusBar.ts
- [ ] T053 [US3] Enhance configuration validator with detailed error messages in src/config/validator.ts (depends on T050-T052)
- [ ] T054 [US3] Add execution error handling with user feedback
- [ ] T055 [US3] Implement error recovery mechanisms for configuration issues
- [ ] T056 [US3] Add comprehensive logging for debugging support
- [ ] T057 [US3] Integrate error handling system with all extension components

**Checkpoint**: At this point, User Story 3 should be fully functional - users receive clear error messages and debugging support

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, documentation, and marketplace readiness

### Documentation & User Experience

- [ ] T058 [P] Create marketplace README.md with feature overview and screenshots in docs/README.md
- [ ] T059 [P] Write comprehensive user guide in docs/USER_GUIDE.md
- [ ] T060 [P] Create API documentation in docs/API.md
- [ ] T061 [P] Write troubleshooting guide in docs/TROUBLESHOOTING.md
- [ ] T062 [P] Create usage examples and templates in docs/examples/
- [ ] T063 [P] Write contributing guidelines in docs/CONTRIBUTING.md

### Cross-Platform & Security

- [ ] T064 [P] Implement readonly editor detection with output panel fallback
- [ ] T065 [P] Add workspace trust integration for security
- [ ] T066 [P] Enhance cross-platform shell command escaping
- [ ] T067 [P] Add environment variable handling across platforms
- [ ] T068 [P] Implement working directory management

### Performance & Robustness

- [ ] T069 [P] Add performance monitoring and optimization
- [ ] T070 [P] Implement concurrent task execution handling
- [ ] T071 [P] Add memory management for large configuration files
- [ ] T072 [P] Optimize command registration performance

### Final Integration

- [ ] T073 Run full test suite and fix any integration issues
- [ ] T074 Performance testing with 50+ concurrent task definitions
- [ ] T075 Cross-platform compatibility testing (Windows, macOS, Linux)
- [ ] T076 Create extension package and validate marketplace requirements
- [ ] T077 Final documentation review and completion

---

## Dependencies & Implementation Strategy

### User Story Dependencies
- **US1 (P1)**: Independent - can be implemented first as MVP
- **US2 (P2)**: Builds on US1 - requires task execution foundation
- **US3 (P3)**: Builds on US1 & US2 - requires both configuration and execution systems

### Parallel Execution Opportunities
- **Phase 1-2**: Most setup and foundational tasks can run in parallel
- **Within User Stories**: Test writing, component implementation (different files)
- **Final Phase**: Documentation and cross-cutting concerns can run in parallel

### MVP Scope
**Recommended MVP**: User Story 1 only
- Provides immediate value: shell task execution at cursor
- Independently testable and deliverable
- Foundation for subsequent user stories

### Implementation Notes
- Follow TDD approach: write tests first, ensure they fail, then implement
- Each user story is independently testable and deliverable
- Emphasis on cross-platform compatibility throughout implementation
- All UI elements include descriptive, accessible text as specified in plan.md

**Total Tasks**: 77 implementation tasks
- **Setup**: 8 tasks
- **Foundation**: 8 tasks  
- **User Story 1**: 15 tasks (5 tests + 10 implementation)
- **User Story 2**: 13 tasks (5 tests + 8 implementation)
- **User Story 3**: 13 tasks (5 tests + 8 implementation)
- **Polish & Integration**: 20 tasks