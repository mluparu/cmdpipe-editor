````markdown
# Task Trust Guard Contract

**Version**: 1.0.0  
**Date**: November 1, 2025

## Overview

Defines the programmatic surface for enforcing workspace trust on task execution while reusing existing task discovery and shell execution services.

## Interfaces

### ITaskTrustGuard

Central guard responsible for evaluating trust state before task execution and emitting audit events.

```typescript
interface ITaskTrustGuard {
  /**
   * Evaluate whether the provided task can be executed under the current trust context.
   * Throws a `TrustViolationError` when execution must be blocked.
   */
  ensureCanExecute(task: TaskDefinition): Promise<void>;

  /**
   * Register listeners needed to keep trust state in sync with VS Code workspace trust events.
   * Returns disposables that must be cleaned up on extension deactivate.
   */
  registerTrustListeners(): vscode.Disposable[];

  /**
   * Retrieve the latest trust context for use in UI rendering and diagnostics.
   */
  getCurrentContext(): TrustContext;
}
```

### ISecurityWarningPresenter

Abstraction over VS Code UI primitives to present consistent trust warnings.

```typescript
interface ISecurityWarningPresenter {
  /**
   * Show warning when a workspace task is blocked and return the user's chosen action.
   */
  showTaskBlockedWarning(model: WarningMessageModel): Promise<'trust-workspace' | 'view-user-tasks' | 'dismiss'>;
}
```

### ITrustAwareTaskService

Adaptor applied to existing task lists so the UI can distinguish runnable versus blocked tasks without duplicating discovery logic.

```typescript
interface ITrustAwareTaskService {
  /**
   * Decorate resolved tasks with trust availability metadata for rendering.
   */
  mapToAvailability(tasks: TaskDefinition[]): TaskAvailability[];

  /**
   * Filter tasks to those currently runnable under trust rules.
   */
  filterRunnable(tasks: TaskDefinition[]): TaskDefinition[];
}
```

## Error Types

### TrustViolationError

```typescript
class TrustViolationError extends Error {
  constructor(
    public readonly taskId: string,
    public readonly trustState: 'trusted' | 'untrusted' | 'undecided',
    public readonly message: string
  ) {
    super(message);
    this.name = 'TrustViolationError';
  }
}
```

## Events

### TrustGuardEvents

```typescript
interface TrustGuardEvents {
  /** Fired whenever a workspace task execution is blocked */
  'trust.blocked': (attempt: BlockedTaskAttempt) => void;

  /** Fired when workspace trust becomes trusted, allowing UI refresh */
  'trust.granted': (context: TrustContext) => void;
}
```

````