# Research: VS Code Variable Substitution Support

**Feature**: 005-support-variable-substitution  
**Date**: November 7, 2025  
**Purpose**: Resolve open questions about reproducing VS Code placeholder semantics, environment precedence, and logging safeguards before implementation begins.

## Technical Decisions

### Decision: Built-in Resolver Reuse Feasibility
**Chosen**: Build an internal variable resolver that mirrors VS Code semantics.
**Rationale**: The public VS Code Extension API does not expose a general-purpose variable resolver. Only debug providers receive pre-substituted data via `resolveDebugConfigurationWithSubstitutedVariables`, and no equivalent API exists for arbitrary extensions or shell tasks ([VS Code API reference](https://code.visualstudio.com/api/references/vscode-api#DebugConfigurationProvider)).
**Alternatives considered**:
- Execute undocumented commands such as `resolveVariables` (rejected: command is not public and not listed in `getCommands`, unsupported for marketplace extensions).
- Delegate to built-in task execution (`tasks.executeTask`) and intercept resolved data (rejected: would require migrating user-defined tasks into VS Code's task provider, conflicting with extension-managed execution flow).
- Depend on internal `VariableResolverService` through `vscode` module imports (rejected: private API, brittle across VS Code releases).

### Decision: Resolver Composition Strategy
**Chosen**: Implement a dedicated `VariableResolver` class in `src/substitution/variableResolver.ts` backed by granular resolver functions (workspace, editor/file, environment, configuration, literal passthrough) orchestrated by a `VariableContextBuilder`.
**Rationale**: Keeps substitution testable and maintainable, allows caching of computed context, and avoids polluting `ShellExecutor` with placeholder-specific logic.
**Alternatives considered**:
- Inline substitution logic inside `ShellExecutor.prepareExecution` (rejected: harder to test, muddles responsibilities).
- Create multiple ad-hoc utility functions reused piecemeal (rejected: increases coupling and risks inconsistent behavior across command fields).
- Invoke third-party libraries for template replacement (rejected: they do not know VS Code-specific tokens and introduce new deps).

### Decision: Canonical Source for Variable Semantics
**Chosen**: Treat the official Variables Reference as the canonical contract for supported placeholders and substitution rules.
**Rationale**: The documentation enumerates supported placeholders, environment/config/command variable syntax, multi-root scoping, and the two-pass evaluation guarantee used by VS Code tasks ([Variables reference](https://code.visualstudio.com/docs/editor/variables-reference)). Aligning with this ensures predictable behavior and simplifies test case derivation.
**Alternatives considered**:
- Infer semantics from existing extension implementations (rejected: inconsistent coverage, risk of drift).
- Narrow scope to a subset of variables (rejected: violates spec FR-001/FR-003 requirements for parity with VS Code).

### Decision: Environment Merge Order
**Chosen**: Merge environment variables in the order `process.env` ➝ workspace/task configuration defaults ➝ task-level overrides, with later sources overriding earlier values. Missing `${env:*}` placeholders raise a blocking error before shell invocation.
**Rationale**: Preserves current inheritance from the host shell, supports workspace-wide defaults, and honors explicit task overrides while delivering FR-004 blocking behavior.
**Alternatives considered**:
- Fail open and substitute empty strings (rejected: hides misconfiguration, violates spec).
- Reverse the precedence (rejected: would let workspace defaults override specific task intent).
- Fetch terminal profile environment (rejected: heavy, inconsistent between shells, not required by spec).

### Decision: Configuration Lookup Precedence
**Chosen**: Resolve `${config:*}` via `vscode.workspace.getConfiguration(section, workspaceFolderUri)` using the task's owning workspace folder first, then fall back to workspace and user scopes. Cache the configuration snapshot per execution.
**Rationale**: Matches VS Code precedence, keeps resolution within the 200 ms latency budget, and ensures multi-root awareness by leveraging the task's `filePath`.
**Alternatives considered**:
- Query only global settings (rejected: breaks folder overrides).
- Preload every configuration section during discovery (rejected: adds complexity and stale data risk).
- Require tasks to provide configuration values explicitly (rejected: duplicates settings the extension should honor).

### Decision: Sensitive Value Redaction
**Chosen**: Surface a substitution summary that redacts resolved values for `${env:*}` placeholders (and any future sensitive prefixes) before logging while still recording the variable names and resolution status.
**Rationale**: Satisfies FR-007 auditability without leaking secrets, and centralizes redaction to prevent accidental exposure in downstream logs.
**Alternatives considered**:
- Exclude environment entries entirely from logs (rejected: hampers troubleshooting).
- Hash environment values (rejected: still reveals length/patterns and offers limited diagnostic value).
- Delegate redaction to callers (rejected: error-prone and duplicates logic).

## Best Practices Applied

- Mirror VS Code's documented two-pass substitution process to keep command variables isolated and cache results per evaluation cycle ([Variables reference – Details of variable substitution](https://code.visualstudio.com/docs/editor/variables-reference#_details-of-variable-substitution-in-a-debug-configuration-or-task)).
- Normalize file system separators using `${/}` guidance to maintain cross-platform compatibility ([Variables reference – Predefined variables](https://code.visualstudio.com/docs/editor/variables-reference#_predefined-variables)).
- Support `${workspaceFolder:Name}` syntax for multi-root workspaces, falling back gracefully when the named folder is missing ([Variables reference – Variables scoped per workspace folder](https://code.visualstudio.com/docs/editor/variables-reference#_variables-scoped-per-workspace-folder)).
- Preserve VS Code's command variable contract by requiring string results and surfacing errors when commands return non-string outputs ([Variables reference – Command variables](https://code.visualstudio.com/docs/editor/variables-reference#_command-variables)).
