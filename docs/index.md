# Task to Editor - CmdPipe-Editor

## How to build and install the extension locally

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

## Configuration

### Task Configuration File

Tasks are defined in `.vscode/tasks.json`. Example:

```json
{
  "version": "1.0.0",
  "tasks": [
    {
      "id": "hello-world",
      "name": "Hello World",
      "description": "Simple hello world command",
      "command": "echo",
      "args": ["Hello from CmdPipe!"],
      "category": "utility",
      "timeout": 5000,
      "tags": ["demo", "test"]
    }
  ]
}
```

### Task Properties

// ...existing code...
* `name`: Unique task name within its source
* `command`: Shell command to execute
* `description`: Human-readable description (optional)
* `group`: Task group (build, test, etc.) (optional)
* `args`: Command arguments (optional)
* `options`: Task execution options (see below)

## Variable Substitution

CmdPipe resolves VS Code style placeholders before a task runs so commands, arguments, working directories, and environment variables stay portable.

- Workspace placeholders: use `${workspaceFolder}`, `${workspaceFolder:<name>}`, `${workspaceFolderBasename}`, `${relativeFile}`, `${file}`, `${fileDirname}`, `${fileBasename}`, `${fileBasenameNoExtension}`, `${fileExtname}` to scope tasks to the current folder or active file.
- Environment placeholders: `${env:VAR_NAME}` merges `process.env`, workspace defaults, and task-level overrides. Missing variables block execution with a descriptive error and the logs redact resolved values.
- Configuration placeholders: `${config:cmdpipe.shell.defaultWorkingDirectory}` (and other settings) honor VS Code scope precedence. Non-string values surface validation failures.

Example task snippet:

```json
{
   "id": "build-with-context",
   "command": "${workspaceFolder}/scripts/build.sh",
   "args": ["--config", "${config:cmdpipe.build.profile}"],
   "workingDirectory": "${workspaceFolder}",
   "environmentVariables": {
      "API_TOKEN": "${env:API_TOKEN}"
   }
}
```

View substitution outcomes in the CmdPipe logs (`CmdPipe Config: Show Logs`) for troubleshooting redacted values and failure reasons.

### VSCode Settings

Configure the extension in VSCode settings (`settings.json`):

```json
{
  "cmdPipe.defaultShell": "powershell.exe",
  "cmdPipe.timeout": 30000,
  "cmdPipe.maxOutputSize": 1048576,
  "cmdPipe.outputFormat": "raw",
  "cmdPipe.insertionMode": "cursor",
  "cmdPipe.taskSources": [".vscode/shell-tasks.json"],
  "cmdPipe.includeExampleTasks": true,
  "cmdPipe.showNotifications": true,
  "cmdPipe.confirmDangerousCommands": true
}
```

## Testing the Extension

### Basic Workflow Test

1. **Open a new file** in VSCode
2. **Place cursor** where you want output
3. **Run Quick Echo**:
   - Command Palette → `CmdPipe: Quick Echo`
   - Should insert "Hello from CmdPipe!" at cursor
4. **Run Custom Command**:
   - Command Palette → `CmdPipe: Quick Command`
   - Enter: `echo "Custom command works!"`
   - Press Enter

### Task Configuration Test

1. **Open configuration**:
   - Command Palette → `CmdPipe: Open Configuration`
   - Should open `.vscode/shell-tasks.json`
2. **Run configured task**:
   - Command Palette → `CmdPipe: Run Shell Task`
   - Select "Hello World" or another task
   - Should execute and insert output

### Selection Execution Test

1. **Type a command** in editor: `echo "Selected text execution"`
2. **Select the text**
3. **Execute selection**:
   - Command Palette → `CmdPipe: Execute Selection as Command`
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

- **View logs**: Command Palette → `CmdPipe: Show Logs`
- **Enable debug logging**: Set `"cmdPipe.logLevel": "debug"`
- **Check VSCode Developer Console**: `Help → Toggle Developer Tools`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see [LICENSE](../LICENSE.md) file for details.

