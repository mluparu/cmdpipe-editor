# Feature Specification: Task Output Insertion and Command Consolidation

**Feature Branch**: `003-task-output-insertion`  
**Created**: October 28, 2025  
**Status**: Draft  
**Input**: User description: "Need to refine the current behavior of the app in a few specific ways: (1) TaskPicker currently only executes the task. What it needs to do is collect the output of the task execution and insert that text at the editor cursor's position or to replace the selection in the editor. (2) There is currently duplication between commandHandler, quickCommands, and taskPickerCommands. We need to reconcile this duplication, ideally by creating a single commandHandler file that registers all commands and has all the other helper functions for each command. Evaluate if there is more duplication left in the code for the new file and resolve that."

## Clarifications

### Session 2025-10-28

- Q: How should binary data output be handled? → A: Insert placeholder text "<<binary data was detected and saved to file>>" and save binary data to temporary file
- Q: When a task runs longer than expected or appears to hang, how should the system respond? → A: Show progress with cancel button after 10 seconds, no auto-timeout

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Task Output Collection and Insertion (Priority: P1)

A developer opens the task picker, selects a command (like `ls` or `echo`), and wants the command's output to be automatically inserted at their cursor position or replace their selected text in the editor, rather than just showing in a terminal.

**Why this priority**: This is the core value proposition of the extension - bridging shell commands with editor content. Without this, users get no direct benefit over using VS Code's built-in terminal.

**Independent Test**: Can be fully tested by opening task picker, selecting any command that produces output, and verifying the output appears at cursor position in the active editor.

**Acceptance Scenarios**:

1. **Given** an active editor with cursor positioned, **When** user opens task picker and selects a task, **Then** task output is inserted at cursor position
2. **Given** text is selected in an editor, **When** user executes a task via task picker, **Then** task output replaces the selected text
3. **Given** a task produces multi-line output, **When** task is executed from picker, **Then** all output lines are properly inserted with correct formatting
4. **Given** a task fails or produces error output, **When** task is executed, **Then** user is notified of the error and no invalid content is inserted

---

### User Story 2 - Unified Command Registration (Priority: P2)

Developers working with the codebase experience consistent command handling without encountering duplicate code paths, registration conflicts, or maintenance overhead from scattered command definitions.

**Why this priority**: Code quality and maintainability are critical for long-term development velocity and preventing bugs from inconsistent behavior between similar commands.

**Independent Test**: Can be tested by examining the codebase structure - all commands should be registered through a single entry point with no duplicate registration logic or command handling patterns.

**Acceptance Scenarios**:

1. **Given** extension activation, **When** all commands are registered, **Then** there is only one command registration system
2. **Given** similar command functionality exists, **When** examining the code, **Then** common logic is consolidated into shared utilities
3. **Given** a new command needs to be added, **When** implementing it, **Then** developer only needs to modify one file for command registration

---

### User Story 3 - Output Insertion Mode Selection (Priority: P3)

Users can specify how they want task output to be inserted into their editor - at cursor, replacing selection, or in an output panel - providing flexibility for different use cases.

**Why this priority**: Enhances user experience by providing options for different workflows, but the basic insertion functionality is more critical.

**Independent Test**: Can be tested by configuring different insertion modes and verifying each mode behaves as expected when executing tasks.

**Acceptance Scenarios**:

1. **Given** user preferences for insertion mode, **When** task is executed, **Then** output is inserted according to the configured mode
2. **Given** no insertion mode is configured, **When** task is executed, **Then** user is prompted to choose insertion mode
3. **Given** read-only editor is active, **When** task is executed, **Then** output is shown in output panel instead of attempting insertion

---

### Edge Cases

- What happens when task output is too large for practical insertion into editor?
- How does system handle tasks that run indefinitely or require user input?
- What occurs when no editor is active but user attempts task execution?
- How are non-text outputs (binary data) handled? → Binary data is detected and saved to temporary files with placeholder text inserted
- What happens when task execution times out or is cancelled? → Progress indicator shown after 10 seconds with cancel option, no automatic timeout

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: TaskPicker MUST collect task execution output and insert it into the active editor instead of only executing the task
- **FR-002**: System MUST support inserting task output at cursor position when no text is selected
- **FR-003**: System MUST support replacing selected text with task output when text is selected
- **FR-004**: System MUST consolidate command registration into a single CommandHandler that registers all extension commands
- **FR-005**: System MUST eliminate duplicate code between commandHandler, quickCommands, and taskPickerCommands files
- **FR-006**: System MUST provide error handling when task execution fails or produces errors
- **FR-007**: System MUST handle cases where no editor is active by showing appropriate user feedback
- **FR-008**: System MUST preserve existing command functionality while consolidating the code structure
- **FR-009**: System MUST support configurable output insertion modes (cursor, replace selection, output panel)
- **FR-010**: System MUST handle read-only editors gracefully by falling back to output panel display
- **FR-011**: System MUST detect binary data in task output and insert placeholder text "<<binary data was detected and saved to file>>" instead of raw binary content
- **FR-012**: System MUST save binary data output to a temporary file in the system TEMP directory with a unique filename
- **FR-013**: System MUST show progress indicator with cancel button for tasks running longer than 10 seconds
- **FR-014**: System MUST allow users to cancel long-running tasks without automatic timeout limits

### Key Entities

- **Task Execution Result**: Contains command output, error information, exit codes, and execution metadata
- **Output Insertion Context**: Tracks editor state, cursor position, selected text, and insertion preferences
- **Command Registry**: Central repository of all extension commands with their handlers and metadata
- **Insertion Mode**: Configuration determining how task output should be integrated into editor content

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can execute any task from task picker and see output inserted in editor within 2 seconds
- **SC-002**: 100% of existing command functionality remains available after consolidation
- **SC-003**: Code duplication between command files is reduced by at least 80%
- **SC-004**: Task execution with output insertion succeeds for 95% of typical shell commands
- **SC-005**: New command implementation requires modification of only 1-2 files instead of current 3+ files
- **SC-006**: Extension startup time remains within 10% of current performance after refactoring
