# Tasks: Workspace Trust Task Safeguards

**Input**: Design documents from `/specs/004-block-untrusted-tasks/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory (constitution requires tests before implementation)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm baseline environment matches quickstart guidance.

- [X] T001 Ensure dependencies in `package.json` are installed via `npm install`.
- [X] T002 Execute initial TypeScript compilation using `npm run compile` defined in `package.json` and `tsconfig.json`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required before any user story can proceed.

- [X] T003 Create trust overlay types (`TrustContext`, `TaskAvailability`, `BlockedTaskAttempt`, `WarningMessageModel`) in `src/types/trustTypes.ts` per data-model.md.
- [X] T004 Extend `tests/__mocks__/vscode.ts` to stub `workspace.isTrusted` and trust change events for upcoming trust scenarios.

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Block Untrusted Workspace Tasks (Priority: P1) 🎯 MVP

**Goal**: Prevent workspace-defined tasks from executing when the workspace is untrusted or undecided.

**Independent Test**: In an untrusted workspace, attempt to run a workspace task and verify execution is blocked before any command launches.

### Tests for User Story 1 (write first)

- [X] T005 [P] [US1] Add trust guard decision unit tests covering trusted/untrusted cases in `tests/unit/utils/trustGuard.test.ts`.
- [X] T006 [P] [US1] Add integration test ensuring workspace tasks are blocked in `tests/integration/taskTrustExecution.test.ts`.

### Implementation for User Story 1

- [X] T007 [US1] Implement `ITaskTrustGuard` using `vscode.workspace.isTrusted` with logging hooks in `src/utils/trustGuard.ts`.
- [X] T008 [US1] Invoke the trust guard before executing workspace tasks in `src/commands/commandHandler.ts`.
- [X] T009 [US1] Emit structured blocked-attempt logs (task id, trust state) via `Logger` in `src/utils/logger.ts`.

**Checkpoint**: Workspace task execution is safely blocked when trust is absent.

---

## Phase 4: User Story 2 - Communicate Security Warning (Priority: P1)

**Goal**: Explain why a workspace task was blocked and guide the developer toward safe next steps.

**Independent Test**: Trigger a blocked workspace task and verify the warning names the task, states the trust restriction, and provides actions to resolve it.

### Tests for User Story 2 (write first)

- [X] T010 [P] [US2] Add presenter unit tests covering warning copy and actions in `tests/unit/ui/trustWarningPresenter.test.ts`.

### Implementation for User Story 2

- [X] T011 [US2] Implement `ISecurityWarningPresenter` with trust management and user task actions in `src/ui/trustWarningPresenter.ts`.
- [X] T012 [US2] Integrate the warning presenter into trust guard handling within `src/commands/commandHandler.ts`.
- [X] T013 [US2] Ensure repeated blocked attempts reuse the latest warning without stacking messages in `src/commands/commandHandler.ts`.

**Checkpoint**: Developers understand the block and see actionable guidance.

---

## Phase 5: User Story 3 - Preserve Trusted Task Access (Priority: P2)

**Goal**: Keep user-defined tasks runnable and clearly distinguish blocked workspace tasks.

**Independent Test**: In an untrusted workspace with both task sources, confirm user tasks run, workspace tasks remain blocked, and trust upgrades refresh availability.

### Tests for User Story 3 (write first)

- [X] T014 [P] [US3] Extend integration coverage to confirm user tasks execute and trust changes refresh availability in `tests/integration/taskTrustExecution.test.ts`.

### Implementation for User Story 3

- [X] T015 [US3] Implement `ITrustAwareTaskService` mapping in `src/ui/trustAwareTaskService.ts` to decorate tasks with availability metadata.
- [X] T016 [US3] Update `src/ui/taskPicker.ts` to render blocked workspace tasks distinctly while leaving user tasks selectable.
- [X] T017 [US3] Register `workspace.onDidGrantWorkspaceTrust` to refresh task availability in `src/extension.ts`.

**Checkpoint**: User tasks stay productive while workspace tasks respect trust changes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation and quality gates across stories.

- [X] T018 [P] Document workspace trust safeguards in `docs/index.md` and reference quickstart guidance.
- [X] T019 Run `npm run lint` defined in `package.json` and address reported issues.
- [ ] T020 Run `npm test` defined in `package.json` and stabilize failing suites.

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2**: Setup tasks must complete before foundational work.
- **Phase 2 → User Stories**: Trust types and test mocks from Phase 2 are prerequisites for all user stories.
- **User Story Order**: US1 (P1) delivers the MVP and must finish before US2 or US3 can ship; US2 depends on US1 guard behaviour; US3 depends on guard + warning infrastructure.
- **Polish Phase**: Runs after chosen user stories are complete.

## Parallel Opportunities

- T005 and T006 can be developed in parallel (unit vs integration tests).
- Documentation task T018 can proceed once warning copy is finalized (after US2).
- Lint (T019) and test (T020) commands may run concurrently with documentation if tooling/resources allow.

## Parallel Example: User Story 1

```bash
# In one terminal: write unit tests
code tests/unit/utils/trustGuard.test.ts

# In another terminal: draft integration coverage
code tests/integration/taskTrustExecution.test.ts
```

## Implementation Strategy

1. **MVP (User Story 1)**: Complete Phases 1–3 to block workspace tasks safely.
2. **Guided UX (User Story 2)**: Layer in warning messaging so developers understand trust actions.
3. **Productivity Safeguards (User Story 3)**: Preserve user task execution and react to trust upgrades.
4. **Polish**: Update docs, lint, and test to ensure readiness for release.

## Next steps to consider

- [ ] Restore the shell/editor APIs (or update their tests) so the global Jest run can pass, fulfilling T020.
- [ ] Decide whether to extend the VS Code mock so __fireGrantWorkspaceTrust() triggers listeners; current tests invoke the captured listener directly.
