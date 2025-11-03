# CmdPipe Extension

A VSCode extension that allows you to run arbitrary shell tasks and pipe their outputs directly into the editor at cursor position.

## Features

- **Shell Command Execution**: Run any shell command from VSCode
- **Text Insertion**: Insert command output directly at cursor position
- **Multiple Insertion Modes**: Cursor, selection replacement, line-end, document-end
- **Task Management**: Reuse tasks defined in .vscode/tasks.json
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Output Processing**: Format and filter command output
- **Progress Tracking**: Visual feedback for running commands
- **Notifications**: User-friendly feedback system

## Available Commands

| Command | Description | Command ID |
|---------|-------------|------------|
| `CmdPipe: Run Task` | Show task picker and run selected task | `cmdpipe.runTask` |
| `CmdPipe: Quick Command` | Enter and run a custom shell command and insert output | `cmdpipe.quickCommand` |
| `CmdPipe: Execute Selection` | Execute selected text as shell command | `cmdpipe.executeSelection` |
| `CmdPipe: Insert Date/Time` | Insert current date and time at cursor | `cmdpipe.insertDateTime` |
| `CmdPipe Config: Show Logs` | View extension logs | `cmdpipe.config.showLogs` |
| `CmdPipe Config: Refresh Tasks` | Refresh task configurations | `cmdpipe.config.refreshTasks` |
| `CmdPipe Config: Create Workspace Tasks` | Create tasks.json for workspace | `cmdpipe.config.createWorkspaceTasks` |
| `CmdPipe Config: Open User Configuration` | Open user configuration directory | `cmdpipe.config.openUserConfig` |
| `CmdPipe Config: Show Task Errors` | Display task configuration errors | `cmdpipe.config.showTaskErrors` |
| `CmdPipe Config: Validate Task Configurations` | Validate all task configurations | `cmdpipe.config.validateTaskConfigs` |

## Workspace Trust Safeguards

- Workspace-defined tasks are automatically blocked when VS Code marks the workspace as untrusted or undecided.
- User-defined tasks remain runnable and are surfaced separately in the task picker for quick access.
- Blocked workspace tasks display a lock icon and guidance in the picker so the restriction is clear before execution.
- Choosing a blocked task opens trust management actions

## Quick Start

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)

2. **Run a Quick Command**:
   - Type: `CmdPipe: Quick Command`
   - Type "echo Hello from CmdPipe!" in the prompt
   - This will insert "Hello from CmdPipe!" at your cursor

3. **Run a Task**:
   - Type: `CmdPipe: Run Task`
   - Select from available tasks that are predefined in .vscode/tasks.json

4. **Execute Selection**:
   - Select some text in your editor
   - Type: `CmdPipe: Execute Selection as Command`
   - The selected text will be executed as a shell command

## Run Task Command

The `cmdpipe.runTask` command opens a task picker that allows you to select and execute tasks defined in your workspace or user configuration. The output of the executed task is inserted at the current cursor position in the active editor.

### Example: Mapping `cmdpipe.runTask` to exeute a specific task for a shortcut key

You can add a custom keyboard shortcut for the `cmdpipe.runTask` command in your `keybindings.json`:

```json
{
    "key": "alt+shift+m",
    "command": "cmdpipe.runTask",
    "args": "active-meeting-header"
}
```
This binds `Alt+Shift+M` to execute the `active-meeting-header` task and insert its output at your cursor position.

The `args` parameter specifies the name of the task to execute. If omitted, the task picker will be shown to select a task interactively.

The task must be defined in your workspace's `tasks.json` or in the user configuration for it to be available for execution.

## Insert Date and Time

The `cmdpipe.insertDateTime` command inserts the current date and time at the cursor position. This is useful for quickly adding timestamps to documents or notes.

The command can be bound to a keyboard shortcut for faster access. The format of the inserted date and time can be customized in the extension settings. The command supports multiple date and time formats, including ISO, locale-specific, and custom formats defined by the user.

Valid formats: `iso`, `local`, `date`, `time`, `us-date`, `eu-date`, `long`, `short`, `timestamp`, `custom`

### Example: Mapping `cmdpipe.insertDateTime` to a Shortcut Key

You can add a custom keyboard shortcut for the `cmdpipe.insertDateTime` command in your `keybindings.json`:

```json
{
    "key": "alt+shift+d",
    "command": "cmdpipe.insertDateTime",
    "args": "us-date"
}
{
    "key": "alt+shift+c",
    "command": "cmdpipe.insertDateTime",
    "args": "time",
}
```

This binds `Alt+Shift+D` to insert the current date in the `us-date` format at your cursor position and `Alt+Shift+C` to insert the current time.

## Quick Command Execution

The `cmdpipe.quickCommand` command allows you to execute any shell command and insert its output directly at the cursor position in the active editor. This is useful for quickly running commands without leaving the editor context.

## Execute Selection Command

The `cmdpipe.executeSelection` command executes the currently selected text in the active editor as a shell command and inserts the output at the cursor position. This is particularly useful for running snippets of code or commands directly from your document similar to a REPL environment like Notebook cells.

## Configuration and Management Commands

The extension provides several commands to manage and configure its behavior:
- `cmdpipe.config.showLogs`: Opens the extension's log output for debugging and monitoring.
- `cmdpipe.config.refreshTasks`: Refreshes the task configurations from the workspace and user settings.
- `cmdpipe.config.createWorkspaceTasks`: Creates a default `tasks.json` file in the workspace if it doesn't exist.
- `cmdpipe.config.showTaskErrors`: Displays any errors found in the task configurations.
- `cmdpipe.config.validateTaskConfigs`: Validates all task configurations and reports any issues.

To learn more about configuring the extension, see the [Configuration](docs/index.md#configuration) section in the documentation.

## License

MIT License - see [LICENSE](LICENSE) file for details.
