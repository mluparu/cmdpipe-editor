# Shell Task Pipe Extension

A VSCode extension that allows you to run arbitrary shell tasks and pipe their outputs directly into the editor at cursor position.

## Features

- **Shell Command Execution**: Run any shell command from VSCode
- **Text Insertion**: Insert command output directly at cursor position
- **Multiple Insertion Modes**: Cursor, selection replacement, line-end, document-end
- **Task Management**: Define reusable tasks with configuration
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Output Processing**: Format and filter command output
- **Progress Tracking**: Visual feedback for running commands
- **Notifications**: User-friendly feedback system

## Installation

1. Build the extension:
   ```bash
   npm run compile
   ```

2. Package the extension (optional):
   ```bash
   npm install -g vsce
   vsce package
   ```

3. Install in VSCode via the Extensions panel or by opening the `.vsix` file

## Quick Start

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)

2. **Run a Quick Command**:
   - Type: `Shell Task Pipe: Quick Echo`
   - This will insert "Hello from Shell Task Pipe!" at your cursor

3. **Run a Custom Task**:
   - Type: `Shell Task Pipe: Run Shell Task`
   - Select from available tasks (examples included)

4. **Execute Selection**:
   - Select some text in your editor
   - Type: `Shell Task Pipe: Execute Selection as Command`
   - The selected text will be executed as a shell command

## Available Commands

| Command | Description |
|---------|-------------|
| `Shell Task Pipe: Run Shell Task` | Show task picker and run selected task |
| `Shell Task Pipe: Run Shell Task at Cursor` | Run task and insert output at cursor |
| `Shell Task Pipe: Quick Echo` | Quick demo command |
| `Shell Task Pipe: Quick Command` | Enter and run a custom command |
| `Shell Task Pipe: Execute Selection as Command` | Execute selected text as command |
| `Shell Task Pipe: Insert Date Time` | Insert current date and time |
| `Shell Task Pipe: Open Configuration` | Open task configuration file |
| `Shell Task Pipe: Reload Configuration` | Reload tasks from configuration |
| `Shell Task Pipe: Show Logs` | View extension logs |

## Configuration

### Task Configuration File

Tasks are defined in `.vscode/shell-tasks.json`. Example:

```json
{
  "version": "1.0.0",
  "tasks": [
    {
      "id": "hello-world",
      "name": "Hello World",
      "description": "Simple hello world command",
      "command": "echo",
      "args": ["Hello from Shell Task Pipe!"],
      "category": "utility",
      "timeout": 5000,
      "tags": ["demo", "test"]
    }
  ]
}
```

### Task Properties

- `id`: Unique identifier
- `name`: Display name in task picker
- `description`: Brief description
- `command`: Shell command to execute
- `args`: Command arguments (optional)
- `category`: Category for organization
- `timeout`: Execution timeout in milliseconds
- `workingDirectory`: Working directory (supports `${workspaceFolder}`)
- `platforms`: Supported platforms (`["win32", "darwin", "linux"]`)
- `tags`: Tags for filtering and organization
- `environmentVariables`: Custom environment variables
- `outputProcessing`: Output formatting options

### VSCode Settings

Configure the extension in VSCode settings (`settings.json`):

```json
{
  "shellTaskPipe.defaultShell": "powershell.exe",
  "shellTaskPipe.timeout": 30000,
  "shellTaskPipe.maxOutputSize": 1048576,
  "shellTaskPipe.outputFormat": "raw",
  "shellTaskPipe.insertionMode": "cursor",
  "shellTaskPipe.taskSources": [".vscode/shell-tasks.json"],
  "shellTaskPipe.includeExampleTasks": true,
  "shellTaskPipe.showNotifications": true,
  "shellTaskPipe.confirmDangerousCommands": true
}
```

## Testing the Extension

### Basic Workflow Test

1. **Open a new file** in VSCode
2. **Place cursor** where you want output
3. **Run Quick Echo**:
   - Command Palette → `Shell Task Pipe: Quick Echo`
   - Should insert "Hello from Shell Task Pipe!" at cursor
4. **Run Custom Command**:
   - Command Palette → `Shell Task Pipe: Quick Command`
   - Enter: `echo "Custom command works!"`
   - Press Enter

### Task Configuration Test

1. **Open configuration**:
   - Command Palette → `Shell Task Pipe: Open Configuration`
   - Should open `.vscode/shell-tasks.json`
2. **Run configured task**:
   - Command Palette → `Shell Task Pipe: Run Shell Task`
   - Select "Hello World" or another task
   - Should execute and insert output

### Selection Execution Test

1. **Type a command** in editor: `echo "Selected text execution"`
2. **Select the text**
3. **Execute selection**:
   - Command Palette → `Shell Task Pipe: Execute Selection as Command`
   - Should execute the selected text as command

### Platform-Specific Tests

#### Windows
- Test: `dir` command for file listing
- Test: `echo %date% %time%` for date/time
- Test: `systeminfo` for system information

#### macOS/Linux
- Test: `ls -la` command for file listing
- Test: `date` for current date/time
- Test: `uname -a` for system information

### Error Handling Tests

1. **Invalid command**:
   - Run: `nonexistentcommand123`
   - Should show error notification
2. **Timeout test**:
   - Run command that takes longer than timeout
   - Should handle timeout gracefully
3. **Permission test**:
   - Try running restricted commands
   - Should handle permissions appropriately

## Development

### Build and Test

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Watch mode for development
npm run watch

# Lint code
npm run lint
```

### Test Suite

- **Unit Tests**: 63 tests covering core components
- **Integration Tests**: 25 tests for workflow validation
- **All Tests**: 88 tests total with 100% pass rate

### Architecture

- **Shell Execution**: Cross-platform shell command execution
- **Text Insertion**: Multiple insertion modes with cursor management
- **Configuration**: JSON-based task definitions with validation
- **UI Components**: Status bar, progress tracking, notifications
- **Error Handling**: Comprehensive error handling and logging

## Troubleshooting

### Common Issues

1. **Commands not found**:
   - Check PATH environment variable
   - Ensure shell is properly configured
   - Try absolute paths for commands

2. **Permission denied**:
   - Check file/directory permissions
   - Run VSCode with appropriate privileges
   - Verify command accessibility

3. **Timeout errors**:
   - Increase timeout in configuration
   - Check command efficiency
   - Verify network connectivity for network commands

4. **Output not appearing**:
   - Check cursor position
   - Verify editor is active and writable
   - Check insertion mode settings

### Logs and Debugging

- **View logs**: Command Palette → `Shell Task Pipe: Show Logs`
- **Enable debug logging**: Set `"shellTaskPipe.logLevel": "debug"`
- **Check VSCode Developer Console**: `Help → Toggle Developer Tools`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run test suite: `npm test`
5. Submit pull request

## License

MIT License - see LICENSE file for details.