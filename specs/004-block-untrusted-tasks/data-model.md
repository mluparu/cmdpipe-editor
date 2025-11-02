# Data Model: Workspace Trust Task Safeguards

**Feature**: 004-block-untrusted-tasks  
**Date**: November 1, 2025

## Overview

The feature builds on existing cmdpipe task entities. Instead of introducing parallel data structures, we extend the view-model around `TaskDefinition` to carry trust awareness and capture blocked-attempt telemetry. All additions are lightweight overlays so existing discovery, validation, and execution modules remain reusable.

## Entities

### TrustContext
- **Purpose**: Represents the current workspace trust state for gating decisions and UI updates.
- **Fields**:
  - `state: 'trusted' | 'untrusted' | 'undecided'` — derived from `vscode.workspace.isTrusted`; `undecided` when no explicit decision made.
  - `lastEvaluated: number` — epoch timestamp when trust was last checked.
  - `source: 'workspace-api'` — fixed marker indicating the value originates from VS Code Workspace Trust API.
- **Relationships**: Referenced by `TaskAvailability` to determine block reasons.
- **Validation Rules**: `state` must match one of the allowed literals; `lastEvaluated` must be updated whenever `state` changes.
- **State Transitions**:
  - `undecided → trusted` when trust granted (event-driven).
  - `undecided → untrusted` when user explicitly rejects trust.
  - `trusted → untrusted` triggers window reload; handled by run-time re-checks after activation.

### TaskAvailability
- **Purpose**: Augments existing `TaskDefinition` with trust-specific availability metadata without duplicating task records.
- **Fields**:
  - `task: TaskDefinition` — existing entity reused.
  - `isBlocked: boolean` — true when `task.source === Workspace` and `TrustContext.state !== 'trusted'`.
  - `blockReason?: 'workspace-untrusted' | 'undecided'` — populated only when `isBlocked` is true.
  - `nextActionHint?: 'manage-trust' | 'view-user-task'` — guides UI messaging.
- **Relationships**: Consumed by TaskPicker UI to render sections and warnings; feeds into execution guard for final check.
- **Validation Rules**: `blockReason` required when `isBlocked` is true; `nextActionHint` required when `isBlocked` is true.
- **State Transitions**: `isBlocked` flips according to trust events and per-execution checks; no persistence beyond session cache.

### BlockedTaskAttempt
- **Purpose**: Log record for each prevented task execution.
- **Fields**:
  - `timestamp: number` — epoch millis recorded at block time.
  - `taskId: string` — from `TaskDefinition.id`.
  - `taskSource: 'workspace' | 'user'` — primarily workspace, user included for diagnostics.
  - `trustState: TrustContext['state']` — state observed during block.
  - `message: string` — human-readable summary stored via existing logger.
- **Relationships**: Entries emitted through `Logger` and optionally surfaced in diagnostics UI.
- **Validation Rules**: `taskSource` must be `workspace` when recorded due to trust guard; `message` required.

### WarningMessageModel
- **Purpose**: Structure passed to UI helper to display consistent warning copy and actions.
- **Fields**:
  - `title: string` — headline text referencing task name.
  - `detail: string` — explanation referencing trust requirement.
  - `primaryAction: { label: string; command: 'workbench.action.manageTrustedFolders' }` — navigates to trust management.
  - `secondaryAction?: { label: string; command: 'cmdpipe.config.openUserConfig' }` — optional fallback.
  - `telemetryId: string` — key to correlate user response with log entry (local only for now).
- **Relationships**: Constructed on-demand inside command handler when a block occurs.
- **Validation Rules**: `primaryAction` command must remain consistent with VS Code trust UX; `telemetryId` generated from task id and timestamp.

## Derived/Supporting Types

- **TrustAwareTaskList**: Array of `TaskAvailability` produced by adapting results from `TaskConfigManager.getResolvedTasks()`; ensures no duplication of the underlying discovery logic.
- **TrustEventHandlers**: Collection of disposables returned from `vscode.workspace.onDidGrantWorkspaceTrust` registrations to facilitate cleanup.

## Notes

- No persistent storage changes are required; all new structures live in memory during extension session.
- Existing schemas (`TaskDefinition`, `ValidationError`) remain authoritative; trust overlay must never mutate original task data.
