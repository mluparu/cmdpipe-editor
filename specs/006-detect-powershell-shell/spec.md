# Feature Specification: PowerShell Default Shell Detection

**Feature Branch**: `006-detect-powershell-shell`  
**Created**: 2025-11-07  
**Status**: Draft  
**Input**: User description: "For Windows, the extension should detect if the default shell is Powershell, and use that instead of cmd.exe. Also escaping the arguments needs to be handled for Powershell specifically (the relevant code for that is PlatformDetector.escapeArgument)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Respect Windows PowerShell Default (Priority: P1)

Windows developer launches the extension on a workstation where PowerShell is the configured default shell and expects all extension-triggered tasks to honor that preference without extra setup.

**Why this priority**: Incorrect shell selection breaks most task flows on Windows and forces manual reconfiguration, so honoring the default shell is critical for day-one usability.

**Independent Test**: Configure a Windows profile with PowerShell as the default shell, trigger any extension task, and confirm it runs through PowerShell end-to-end without user intervention.

**Acceptance Scenarios**:

1. **Given** a Windows user whose VS Code setting `terminal.integrated.defaultProfile.windows` resolves to PowerShell, **When** they trigger a task from the extension, **Then** the task executes using PowerShell with no additional configuration steps.
2. **Given** a Windows user with PowerShell declared in `terminal.integrated.defaultProfile.windows`, **When** they inspect the detected platform information, **Then** the reported default shell reflects the PowerShell executable and arguments.

---

### User Story 2 - Safe Fallback to Command Prompt (Priority: P2)

Windows developer runs the extension on a machine where PowerShell is unavailable or deliberately not configured as default, and needs tasks to continue working without error.

**Why this priority**: Maintaining reliable task execution for environments without PowerShell protects backward compatibility and prevents regressions for existing users.

**Independent Test**: Simulate a Windows environment without a PowerShell default, trigger an extension task, and verify it still executes successfully with the fallback shell.

**Acceptance Scenarios**:

1. **Given** a Windows installation where PowerShell is not discoverable as the default shell, **When** an extension task runs, **Then** the task falls back to Command Prompt and completes successfully.

---

### User Story 3 - Preserve Argument Integrity in PowerShell (Priority: P3)

Windows developer runs a task containing spaces, quotes, and special characters in its arguments and expects the extension to pass them to PowerShell without corruption.

**Why this priority**: Proper escaping prevents failed executions and security issues caused by malformed command strings when PowerShell is in use.

**Independent Test**: Execute a Windows task via PowerShell that includes quotes, ampersands, and redirection symbols, and confirm the command runs exactly as authored.

**Acceptance Scenarios**:

1. **Given** a task with spaces, double quotes, and ampersands in its arguments, **When** the extension launches it through PowerShell, **Then** the task executes using the exact argument values defined by the user.

---

### Edge Cases

- Detecting PowerShell should gracefully handle scenarios where only PowerShell Core (`pwsh.exe`) exists or where multiple PowerShell versions are installed.
- If environment variables point to invalid shell paths, detection must fail safely and revert to the fallback shell without crashing.
- Argument escaping should handle trailing backslashes and nested quotes so that tasks do not silently drop parameters.
- When `terminal.integrated.defaultProfile.windows` references an unavailable shell, detection must fall back to a working shell and surface the problem in diagnostics.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST identify whether PowerShell is the active default shell on Windows by first honoring VS Code's `terminal.integrated.defaultProfile.windows` setting and then inspecting other relevant environment sources.
- **FR-002**: When PowerShell is identified as the default, the system MUST surface PowerShell (including the correct executable path and launch arguments) as the default shell in platform information consumed by task execution.
- **FR-003**: When PowerShell is not the default or is unavailable, the system MUST continue to expose Command Prompt as the default shell to preserve current task behavior.
- **FR-004**: When executing commands through PowerShell, the system MUST escape arguments using PowerShell-appropriate rules so that whitespace, quotes, and reserved characters are preserved exactly once delivered to the shell.
- **FR-005**: The system MUST retain existing behavior for non-Windows platforms, ensuring shell detection and argument handling remain unchanged for macOS and Linux users.

### Key Entities *(include if feature involves data)*

- **Platform Profile**: Describes detected operating system, default shell executable, shell arguments, and path conventions supplied to task execution components.
- **Command Execution Request**: Represents the command string plus argument list prepared for shell execution, including any escaping performed before dispatch.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of regression test runs on Windows with PowerShell configured as default execute tasks through PowerShell without manual overrides.
- **SC-002**: 0 task execution failures attributable to shell detection when running the current Windows regression suite.
- **SC-003**: 95% of Windows pilot users report that they no longer need to manually adjust shell settings within the extension after the update.
- **SC-004**: No increase in shell-related defect reports from macOS or Linux users during the first release cycle after launch.

## Assumptions

- PowerShell (Windows PowerShell or PowerShell Core) is installed on supported Windows environments even if not the active default shell.
- The extension continues to rely on existing configuration sources (system defaults and VS Code settings) to determine shell preferences rather than introducing new user-facing options, with the VS Code setting taking precedence when present.
- Regression validation will run on both 64-bit and 32-bit Windows environments to confirm consistent detection behavior.
