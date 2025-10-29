# Feature Specification: Task Picker Automation with Trust Validation

**Feature Branch**: `002-task-picker-automation`  
**Created**: October 24, 2025  
**Status**: Draft  
**Input**: User description: "Develop the extension by implementing the system that reads the tasks from disk and automatically populates the task picker. The extension should also take into account if the folder is a VS Code Trusted Folder and error out before launching any tasks from the workspace json file when not trusted. Several json files can be defined by the user: one in the workspace .vscode folder, one in the user folder. Validation of the json file when reading is also important."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Task Discovery (Priority: P1)

A developer opens a workspace containing task configuration files and wants to immediately see all available tasks in a unified picker without manual configuration. The extension automatically scans for task files in both workspace and user directories, validates them, and presents a consolidated list of executable tasks.

**Why this priority**: This is the core value proposition - eliminating manual task management by providing automatic discovery and validation of task configurations.

**Independent Test**: Can be fully tested by placing valid task configuration files in different locations (workspace .vscode folder, user folder), opening a workspace, and verifying all tasks appear in a unified picker interface.

**Acceptance Scenarios**:

1. **Given** valid task files exist in both workspace .vscode folder and user folder, **When** user opens task picker, **Then** all tasks from both locations are displayed in a unified interface
2. **Given** task files are modified on disk, **When** user reopens task picker, **Then** the list reflects the current state of task files without requiring extension reload
3. **Given** multiple task files exist in the same directory, **When** task picker loads, **Then** all tasks are merged without conflicts and duplicate task names are handled appropriately

---

### User Story 2 - Workspace Trust Validation (Priority: P1)

A developer opens an untrusted workspace containing task configurations and attempts to execute a workspace-defined task. The extension prevents execution and displays a clear security warning, while still allowing execution of user-defined tasks from trusted locations.

**Why this priority**: Critical security feature that prevents execution of potentially malicious tasks from untrusted sources while maintaining functionality for trusted operations.

**Independent Test**: Can be tested by opening an untrusted workspace with task configurations, attempting to run workspace tasks (should fail with security message), and verifying user tasks still work.

**Acceptance Scenarios**:

1. **Given** workspace is not trusted and contains task configurations, **When** user attempts to execute a workspace task, **Then** execution is blocked and security warning is displayed
2. **Given** workspace is not trusted, **When** user attempts to execute a user-folder task, **Then** task executes normally without security restrictions
3. **Given** workspace trust status changes to trusted, **When** user refreshes task picker, **Then** previously blocked workspace tasks become available for execution

---

### User Story 3 - Configuration Validation and Error Reporting (Priority: P2)

A developer has invalid JSON syntax or malformed task definitions in their configuration files and wants to understand what needs to be fixed. The extension validates all discovered configuration files, reports specific validation errors with file locations and line numbers, and gracefully handles partial failures.

**Why this priority**: Ensures robust handling of configuration errors while providing actionable feedback for debugging and fixing issues.

**Independent Test**: Can be tested by introducing various types of invalid configurations (syntax errors, missing required fields, invalid task definitions), and verifying specific error messages are displayed with file locations.

**Acceptance Scenarios**:

1. **Given** a task configuration file contains JSON syntax errors, **When** extension loads configurations, **Then** specific error messages with file path and line numbers are displayed in the output panel
2. **Given** multiple configuration files exist with mixed valid and invalid content, **When** task picker loads, **Then** valid tasks are available while invalid configurations are reported separately
3. **Given** a task definition is missing required fields, **When** configuration is validated, **Then** clear error message indicates which fields are required and in which file the error occurs

---

### Edge Cases

- What happens when task configuration files are deleted while extension is running?
- How does system handle task files with identical task names from different sources?
- What occurs when workspace trust status changes while extension is active?
- How does system respond to corrupted or unreadable task configuration files?
- What happens when user lacks file system permissions to read configuration directories?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically discover task configuration files in both workspace .vscode folder and user configuration folder on extension activation
- **FR-002**: System MUST validate JSON syntax and schema of all discovered task configuration files against VS Code tasks.json schema extended with cmdpipe-specific fields
- **FR-003**: System MUST check workspace trust status before allowing execution of workspace-defined tasks
- **FR-004**: System MUST prevent execution of workspace tasks when workspace is not trusted and display appropriate security warning
- **FR-005**: System MUST allow execution of user-folder tasks regardless of workspace trust status
- **FR-006**: System MUST provide unified task picker interface displaying tasks from all valid configuration sources
- **FR-007**: System MUST handle task name conflicts between different configuration sources with clear precedence rules
- **FR-008**: System MUST monitor configuration files for changes and automatically refresh task list
- **FR-009**: System MUST report validation errors with specific file paths, line numbers, and error descriptions
- **FR-010**: System MUST gracefully handle scenarios where configuration directories do not exist or are inaccessible
- **FR-011**: System MUST distinguish between workspace-sourced and user-sourced tasks in the picker interface
- **FR-012**: System MUST validate task definitions contain all required fields before making them available for execution

### Key Entities *(include if feature involves data)*

- **Task Configuration File**: JSON file extending VS Code tasks.json schema with cmdpipe-specific fields, located in either workspace .vscode folder or user configuration directory
- **Task Definition**: Individual task specification within configuration file containing command, name, description, and execution parameters
- **Task Source**: Origin location of task (workspace or user folder) determining security and trust requirements
- **Validation Result**: Outcome of configuration file validation including success status, error messages, and affected file locations
- **Trust Status**: Workspace trust state in VS Code determining which task sources are permitted for execution

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can access all valid tasks within 2 seconds of opening task picker regardless of configuration file count or size
- **SC-002**: System correctly blocks 100% of workspace task execution attempts in untrusted workspaces while maintaining user task functionality
- **SC-003**: Configuration validation identifies and reports specific errors within 1 second for files up to 10MB in size
- **SC-004**: Task list automatically refreshes within 3 seconds of configuration file changes without requiring manual reload
- **SC-005**: Extension handles up to 1000 task definitions across multiple configuration files without performance degradation
- **SC-006**: 95% of configuration errors include specific file path, line number, and actionable error description

## Clarifications

### Session 2025-10-24

- Q: Task Configuration File Format → A: Extend existing VS Code tasks.json schema with additional fields for cmdpipe-specific features
