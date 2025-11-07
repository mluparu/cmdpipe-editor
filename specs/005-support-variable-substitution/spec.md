```markdown
# Feature Specification: VS Code Variable Substitution in Shell Execution

**Feature Branch**: `005-support-variable-substitution`  
**Created**: November 7, 2025  
**Status**: Draft  
**Input**: User description: "ShellExecutor.prepareExecution needs to do VS Code variable substitution for all variables defined in the JSON file in the format ${variableName} e.g., ${workspaceFolder}, ${file}, including environment variables and configuration variables, as documented in https://code.visualstudio.com/docs/reference/variables-reference"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Execute Workspace-Aware Tasks (Priority: P1)

Extension users define shell tasks in JSON that reference workspace-scoped placeholders (for example `${workspaceFolder}` and `${relativeFile}`) and expect the task to run with the same contextual values they see in core VS Code features.

**Why this priority**: Workspace-aware substitution is the primary gap preventing parity with VS Code tasks. Without it, tasks fail or require manual path edits, blocking core usage.

**Independent Test**: Configure a task that references `${workspaceFolder}/scripts/build.sh`, run it through the extension, and verify the resolved command uses the actual workspace path on disk without manual edits.

**Acceptance Scenarios**:

1. **Given** a workspace folder containing a task command `${workspaceFolder}/scripts/build.sh`, **When** the user executes the task, **Then** the launched process uses the absolute workspace path for `scripts/build.sh`.
2. **Given** a multi-root workspace where the task JSON belongs to Workspace A, **When** the user runs the task, **Then** `${workspaceFolder}` resolves to Workspace A's root directory.
3. **Given** a file-specific placeholder `${relativeFile}` in the task definition, **When** the active editor has an open file, **Then** the placeholder resolves to the file path relative to the owning workspace folder.

---

### User Story 2 - Inject Environment Context (Priority: P2)

Developers rely on environment variables embedded in task JSON (e.g., `${env:API_KEY}`) so tasks seamlessly inherit machine-specific secrets or configuration without hardcoding values.

**Why this priority**: Environment substitution removes the need to duplicate sensitive data inside task definitions and ensures portability across machines.

**Independent Test**: Define `${env:API_KEY}` in a task argument, set `API_KEY` in the shell environment, execute the task, and confirm the resolved command receives the environment value without exposing it in logs.

**Acceptance Scenarios**:

1. **Given** an environment variable `API_KEY` is present, **When** a task references `${env:API_KEY}`, **Then** the task receives the value exactly as provided by the environment.
2. **Given** a task references `${env:UNSET_VAR}` that is not defined, **When** the user initiates execution, **Then** the extension blocks execution and surfaces a clear error naming the unresolved variable.
3. **Given** sensitive values in environment variables, **When** substitution occurs, **Then** diagnostic logging redacts the resolved value while confirming the variable name.

---

### User Story 3 - Reuse Configuration Defaults (Priority: P3)

Teams store reusable paths or flags inside VS Code settings and expect task JSON placeholders like `${config:cmdpipe.shell.defaultWorkingDirectory}` to resolve before execution.

**Why this priority**: Configuration substitution enables centralized management of task defaults and aligns extension behavior with workspace policies.

**Independent Test**: Add a workspace setting `cmdpipe.shell.defaultWorkingDirectory`, reference it via `${config:cmdpipe.shell.defaultWorkingDirectory}` in a task, execute the task, and confirm the working directory matches the configured value.

**Acceptance Scenarios**:

1. **Given** a workspace setting `cmdpipe.shell.defaultWorkingDirectory` with value `/project/tools`, **When** the task references `${config:cmdpipe.shell.defaultWorkingDirectory}`, **Then** the shell launches with `/project/tools` as its working directory.
2. **Given** a configuration key is missing, **When** a task references `${config:missingKey}`, **Then** the extension surfaces a descriptive error and prevents execution.
3. **Given** multiple placeholders (workspace, env, config) in a single argument, **When** the task runs, **Then** all placeholders resolve before execution and the resulting argument is contiguous text.

---

### Edge Cases

- When a task references `${file}` but no editor is active, the system halts execution and prompts the user to open a file or choose an alternative variable.
- When an environment variable placeholder targets a value that is intentionally absent (e.g., optional feature flag), the system blocks execution and instructs the user to set the variable or adjust the task configuration before retrying.
- When a configuration placeholder points to a key that exists but resolves to an empty string, the task proceeds using the empty value and logs a warning for visibility.
- When placeholders appear in JSON arrays (e.g., command arguments), the system resolves each element individually and reassembles the array without losing ordering.
- When nested variable syntax or unsupported placeholders are supplied, the system reports them as unsupported and documents the first offending token.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST detect VS Code-style placeholders (`${...}`) within all task JSON fields that influence command execution (command, arguments, working directory, environment values).
- **FR-002**: System MUST resolve documented workspace variables (e.g., `${workspaceFolder}`, `${workspaceFolderBasename}`, `${relativeFile}`, `${workspaceFolder:*}`) using the same scoping rules as VS Code, including multi-root awareness.
- **FR-003**: System MUST resolve file and editor context variables (e.g., `${file}`, `${fileDirname}`, `${lineNumber}`) and, when no eligible editor is active, MUST block execution with an actionable message identifying the missing context.
- **FR-004**: System MUST resolve environment variables referenced as `${env:VAR_NAME}` using the merged environment (operating system, VS Code terminal settings, and task-level overrides) and MUST stop execution if a referenced variable is absent unless a default value is provided in the task definition.
- **FR-005**: System MUST resolve configuration variables referenced as `${config:section.setting}` by reading workspace → folder → user settings precedence and MUST surface a descriptive error if the key cannot be found.
- **FR-006**: System MUST support multiple placeholders within a single string and MUST substitute each placeholder while preserving surrounding literal text and quoting.
- **FR-007**: System MUST produce a validation summary prior to execution that lists all placeholders and their resolved values (with sensitive data redacted) so users can verify context when troubleshooting.
- **FR-008**: System MUST expose substitution failures through the existing error handling pipeline so calling commands and tests can detect and assert on failure states.
- **FR-009**: System MUST complete placeholder resolution and hand fully expanded values to the ShellExecutor without requiring downstream components to perform additional substitution.
- **FR-010**: System MUST allow future extension by recognizing custom placeholder prefixes (e.g., `${cmdpipe:...}`) and ignoring them without substitution while documenting the omission for developers.

### Key Entities

- **Task Definition Entry**: Represents a single task configuration sourced from JSON, including command, arguments, working directory, and metadata about originating workspace.
- **Variable Context Snapshot**: Aggregates runtime data required for substitution—active workspace information, active editor state, environment map, and merged configuration values.
- **Substitution Outcome**: Captures resolved values, redaction flags for sensitive data, and any errors encountered, enabling downstream logging and validation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Acceptance testing demonstrates 100% success across the VS Code-documented variable categories (workspace, file, env, config) with no manual adjustments required.
- **SC-002**: In all unresolved-placeholder scenarios exercised during QA, users receive a descriptive blocking message within 2 seconds of task invocation and no command processes start.
- **SC-003**: Placeholder resolution adds no more than 200 milliseconds median latency to task launch across Windows, macOS, and Linux reference environments.
- **SC-004**: Post-release feedback from pilot users indicates at least 90% satisfaction (4/5 or better on feedback form) with cross-machine portability of task definitions.

## Assumptions

- The extension executes tasks within a single active workspace folder; multi-root scenarios map the task to the folder where the task file resides.
- Users create task JSON using documented VS Code variable syntax; unsupported custom syntaxes are outside of scope for this iteration.
- Sensitive environment values can be redacted in logs without impacting the task's execution.

## Dependencies & Risks

- Relies on VS Code APIs for workspace context, configuration access, and environment resolution remaining stable.
- Requires comprehensive automated tests to cover placeholder combinations; inadequate coverage increases risk of silent substitution failures.
- Multi-root workspaces without a clear owner folder may still require follow-up UX guidance if ambiguity arises.

```
