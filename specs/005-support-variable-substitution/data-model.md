# Data Model: VS Code Variable Substitution in Shell Execution

**Feature**: 005-support-variable-substitution  
**Date**: November 7, 2025

## Overview

Variable substitution builds on existing task discovery artifacts while adding a dedicated context builder and resolver layer that runs before `ShellExecutor` hands control to the OS shell. The design introduces explicit snapshots of the runtime context, structured substitution results for logging, and typed error contracts so unresolved placeholders fail fast and predictably.

## Entities

### VariableContextSnapshot
- **Purpose**: Captures the union of workspace, editor, environment, and configuration data needed to resolve placeholders for a single task execution.
- **Fields**:
  - `task: TaskDefinition` — existing execution entity reused for metadata such as name and id.
  - `workspaceFolder: { uri: vscode.Uri; name: string; fsPath: string } | undefined` — owning workspace folder based on the task JSON file path.
  - `activeFile?: { uri: vscode.Uri; fsPath: string; relativePath?: string }` — currently focused document (if any); `relativePath` computed against `workspaceFolder`.
  - `editorSelection?: { start: Position; end: Position; text: string }` — mirrors selection data from `cursorManager` when available.
  - `env: Record<string, string>` — merged environment map following precedence rules.
  - `config: Map<string, unknown>` — resolved configuration values keyed by fully qualified setting name (e.g., `cmdpipe.shell.defaultWorkingDirectory`).
  - `timestamp: number` — epoch millis when snapshot generated (useful for caching / logging).
- **Relationships**: Produced by `VariableContextBuilder`, consumed by `VariableResolver`; referenced indirectly by logging when summarizing substitutions.
- **Validation Rules**: `workspaceFolder` must exist for `${workspaceFolder}` requests; `activeFile` required when file-scoped placeholders requested; `env` must include all keys declared in task JSON.
- **State Transitions**: Created fresh per task execution; not mutated after instantiation.

### SubstitutionRequest
- **Purpose**: Defines which task fields require placeholder processing and the raw values prior to substitution.
- **Fields**:
  - `command: string`
  - `args: string[]`
  - `workingDirectory?: string`
  - `environmentVariables?: Record<string, string>`
  - `additionalFields?: Record<string, unknown>` — hook for future expansion (e.g., output processing directives).
- **Relationships**: Passed from `ShellExecutor.prepareExecution` (or a pre-execution adapter) into `VariableResolver` alongside `VariableContextSnapshot`.
- **Validation Rules**: All fields must be strings/arrays of strings before resolution; `additionalFields` must be JSON-serializable.
- **State Transitions**: Represents input only; conversion to mutable execution options happens after resolution succeeds.

### SubstitutionResult
- **Purpose**: Encapsulates the fully substituted values along with metadata required for logging and downstream auditing.
- **Fields**:
  - `command: string`
  - `args: string[]`
  - `workingDirectory?: string`
  - `environmentVariables?: Record<string, string>`
  - `placeholders: PlaceholderResolution[]` — per-token results.
  - `warnings: string[]` — non-blocking issues (e.g., empty config value).
- **Relationships**: Returned by `VariableResolver`, then mapped into `ShellExecutor` options. `placeholders` feed the logging summary.
- **Validation Rules**: No unresolved placeholders permitted; non-string outputs cause failure before instantiation.
- **State Transitions**: Immutable snapshot; consumers must clone before mutating values.

### PlaceholderResolution
- **Purpose**: Describes the outcome of resolving a single placeholder token.
- **Fields**:
  - `token: string` — literal placeholder (e.g., `${env:API_KEY}`).
  - `resolvedValue?: string` — populated when resolution succeeds.
  - `redactedValue?: string` — value shown to logs when redaction is required.
  - `category: 'workspace' | 'file' | 'env' | 'config' | 'custom' | 'unsupported'`
  - `status: 'resolved' | 'missing' | 'unsupported'`
  - `message?: string` — explanation for `missing` or `unsupported` states.
- **Relationships**: Contained within `SubstitutionResult.placeholders` and surfaced via FR-007 validation summary.
- **Validation Rules**: Exactly one of `resolvedValue` or `redactedValue` must be defined when `status === 'resolved'`; `message` required when `status !== 'resolved'`.
- **State Transitions**: Created per placeholder; no mutation after logging.

### SubstitutionFailure
- **Purpose**: Typed error thrown when resolution cannot complete (e.g., missing env variable or workspace context).
- **Fields**:
  - `token: string`
  - `reason: 'missing-environment' | 'missing-config' | 'missing-file' | 'unsupported-placeholder' | 'invalid-command-output'`
  - `details?: Record<string, unknown>` — diagnostic payload reused by error handler.
- **Relationships**: Raised by `VariableResolver`; caught in `ShellExecutor` to generate a `TaskExecutionError` with FR-008 compliance.
- **Validation Rules**: `reason` must match known enum; `token` stored verbatim to aid debugging.
- **State Transitions**: Immutable error data passed along error pipeline; no retries without user action.

## Supporting Types

- **VariableContextBuilder**: Factory responsible for creating `VariableContextSnapshot`; depends on `TaskConfigManager`, `cursorManager`, and VS Code workspace APIs.
- **SubstitutionSummary**: Lightweight DTO derived from `SubstitutionResult` that lists tokens, categories, and log-safe values for FR-007 reporting.
- **CommandVariableResolver** (future placeholder): Interface reserved for invoking VS Code command variables while safely rejecting unsupported nested tokens per FR-010.

## Notes

- Existing `TaskDefinition` and `TaskExecutionResult` remain unchanged; substitution augments the execution pathway without rewriting schema.
- All new entities live in memory within the execution flow; no persistent storage is introduced.
- Enumerations (`category`, `reason`, `status`) should be exported for reuse in tests to prevent drift between implementation and assertions.
