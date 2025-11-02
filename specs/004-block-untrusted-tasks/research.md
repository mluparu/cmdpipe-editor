# Research: Workspace Trust Task Safeguards

**Feature**: 004-block-untrusted-tasks  
**Date**: November 1, 2025  
**Purpose**: Resolve technical unknowns and solidify implementation approach for trust-gated task execution while reusing existing cmdpipe components.

## Workspace Trust Enforcement Trigger

- **Decision**: Gate task execution inside `CommandHandler` before delegating to `ShellExecutor`, using `vscode.workspace.isTrusted` on every run request.
- **Rationale**: Centralizes enforcement where all task execution currently flows, avoids duplicating checks inside multiple execution paths, and ensures consistent behavior regardless of UI entry point.
- **Alternatives considered**: Checking trust inside `ShellExecutor` (would duplicate logic for non-task shell commands); wrapping every command in separate guard (harder to maintain and risks missing future commands).

## Trust Change Monitoring

- **Decision**: Subscribe to `vscode.workspace.onDidGrantWorkspaceTrust` and re-run task discovery/refresh when fired, while continuing per-execution trust checks for ongoing safety.
- **Rationale**: Event fires when trust is elevated, allowing immediate UI updates without polling; revocation currently reloads the window, so per-execution checks cover the fallback scenario.
- **Alternatives considered**: Polling trust state (wastes resources and still needs event handling); relying solely on execution-time checks (would delay UI updates after trust is granted).

## Warning UX Pattern

- **Decision**: Use `vscode.window.showWarningMessage` with actions "Trust Workspace" and "View User Tasks", and log details via existing `Logger`.
- **Rationale**: Warning aligns with VS Code security messaging, provides actionable next steps, and reuses existing logging infrastructure for audit trail.
- **Alternatives considered**: Modal dialog (disruptive and inconsistent with VS Code trust UX); silent no-op (insufficient feedback); output channel only (too easy to miss).

## Task Availability Refresh

- **Decision**: Reuse `TaskConfigManager` and `TaskPicker` refresh pathways to update task lists after trust status changes, instead of building new refresh logic.
- **Rationale**: Preserves single source of truth for task discovery, honors existing validation/error reporting flows, and satisfies "avoid code duplication" constraint.
- **Alternatives considered**: Creating a new trust-aware task cache (duplicative and error-prone); forcing users to manually refresh (slower recovery and poorer UX).

## Security Audit Trail

- **Decision**: Extend existing logging to emit a structured warning entry for each blocked workspace task attempt, referencing task id/source and trust state.
- **Rationale**: Meets functional requirement FR-007 without introducing new logging systems, and supports future telemetry if added.
- **Alternatives considered**: Building a separate audit file (extra complexity); no logging (fails requirement and weakens diagnosability).
