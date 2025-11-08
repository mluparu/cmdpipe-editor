# End-to-End Testing Guide

This document provides comprehensive testing procedures to validate the complete shell-to-editor workflow.

## Testing Environment Setup

### Prerequisites
- VSCode installed
- Shell Task Pipe extension installed and activated
- Terminal access (PowerShell/CMD on Windows, bash/zsh on macOS/Linux)
- Test workspace with `.vscode/shell-tasks.json` configuration

### Test Files Structure
```
test-workspace/
├── .vscode/
│   └── shell-tasks.json
├── test-file.txt
├── test-script.md
└── README.md
```

## Test Categories

### 1. Basic Command Execution

#### Test 1.1: Quick Echo Command
**Objective**: Verify basic command execution and text insertion

**Steps**:
1. Open `test-file.txt`
2. Place cursor at line 1, column 1
3. Execute: `Ctrl+Shift+P` → `Shell Task Pipe: Quick Echo`
4. **Expected**: "Hello from Shell Task Pipe!" inserted at cursor

**Success Criteria**:
- ✅ Text inserted at correct position
- ✅ No error notifications
- ✅ Cursor positioned after inserted text

#### Test 1.2: Quick Custom Command
**Objective**: Verify custom command input and execution

**Steps**:
1. Place cursor at end of previous text
2. Execute: `Ctrl+Shift+P` → `Shell Task Pipe: Quick Command`
3. Enter: `echo " - Custom command test"`
4. Press Enter
5. **Expected**: " - Custom command test" appended

**Success Criteria**:
- ✅ Command input dialog appears
- ✅ Command executes successfully
- ✅ Output appended correctly

### 2. Task Configuration Workflow

#### Test 2.1: Open Configuration
**Objective**: Verify configuration file management

**Steps**:
1. Execute: `Ctrl+Shift+P` → `Shell Task Pipe: Open Configuration`
2. **Expected**: `.vscode/shell-tasks.json` opens in editor

**Success Criteria**:
- ✅ Configuration file opens
- ✅ File contains valid JSON structure
- ✅ Example tasks visible

#### Test 2.2: Run Configured Task
**Objective**: Verify task execution from configuration

**Steps**:
1. Open new file
2. Execute: `Ctrl+Shift+P` → `Shell Task Pipe: Run Shell Task`
3. Select "Hello World" from task picker
4. **Expected**: Task output inserted at cursor

**Success Criteria**:
- ✅ Task picker displays available tasks
- ✅ Selected task executes
- ✅ Output matches expected result

#### Test 2.3: Reload Configuration
**Objective**: Verify dynamic configuration reloading

**Steps**:
1. Modify `.vscode/shell-tasks.json` (add new task)
2. Execute: `Ctrl+Shift+P` → `Shell Task Pipe: Reload Configuration`
3. Execute: `Ctrl+Shift+P` → `Shell Task Pipe: Run Shell Task`
4. **Expected**: New task appears in picker

**Success Criteria**:
- ✅ Configuration reloads without restart
- ✅ New tasks immediately available
- ✅ Modified tasks reflect changes

### 3. Selection and Text Processing

#### Test 3.1: Execute Selection
**Objective**: Verify selection-based command execution

**Steps**:
1. Type in editor: `echo "Selection test works"`
2. Select the entire line
3. Execute: `Ctrl+Shift+P` → `Shell Task Pipe: Execute Selection as Command`
4. **Expected**: "Selection test works" inserted below

**Success Criteria**:
- ✅ Selected text recognized as command
- ✅ Command executes correctly
- ✅ Output positioned appropriately

#### Test 3.2: Multiple Insertion Modes
**Objective**: Verify different text insertion modes

**Test 3.2a - Cursor Mode**:
1. Place cursor mid-line
2. Run quick echo
3. **Expected**: Text inserted at cursor position

**Test 3.2b - Line End Mode**:
1. Configure insertion mode to "line-end"
2. Place cursor mid-line
3. Run command
4. **Expected**: Text inserted at end of line

**Test 3.2c - Selection Replacement**:
1. Select text
2. Run command
3. **Expected**: Selected text replaced with output

### 4. Platform-Specific Commands

#### Test 4.1: Windows Commands
**Platform**: Windows only

**Test 4.1a - Directory Listing**:
1. Run task: "List Files (Windows)"
2. **Expected**: Windows `dir` output displayed

**Test 4.1b - System Info**:
1. Run task: "System Information (Windows)"
2. **Expected**: `systeminfo` output displayed

**Test 4.1c - Current Directory**:
1. Run task: "Current Directory (Windows)"
2. **Expected**: Current path displayed

#### Test 4.2: Unix/Linux Commands
**Platform**: macOS/Linux only

**Test 4.2a - File Listing**:
1. Run task: "List Files"
2. **Expected**: `ls -la` output displayed

**Test 4.2b - System Info**:
1. Run task: "System Information"
2. **Expected**: `uname -a` output displayed

**Test 4.2c - Disk Usage**:
1. Run task: "Disk Usage"
2. **Expected**: `df -h` output displayed

### 5. Development Workflow Integration

#### Test 5.1: Git Integration
**Prerequisites**: Git repository initialized

**Test 5.1a - Git Status**:
1. Make changes to files
2. Run task: "Git Status"
3. **Expected**: Git status output with changed files

**Test 5.1b - Current Branch**:
1. Run task: "Git Current Branch"
2. **Expected**: Current branch name displayed

#### Test 5.2: Node.js Integration
**Prerequisites**: Node.js installed

**Test 5.2a - Version Check**:
1. Run task: "Node.js Version"
2. **Expected**: Node version number displayed

**Test 5.2b - NPM Dependencies**:
1. In project with `package.json`
2. Run task: "NPM Dependencies"
3. **Expected**: Dependency list displayed

### 6. Error Handling and Edge Cases

#### Test 6.1: Invalid Commands
**Objective**: Verify error handling for invalid commands

**Steps**:
1. Execute quick command: `invalidcommand123`
2. **Expected**: Error notification displayed

**Success Criteria**:
- ✅ Error message indicates command not found
- ✅ No text inserted in editor
- ✅ Extension remains functional

#### Test 6.2: Command Timeouts
**Objective**: Verify timeout handling

**Steps**:
1. Configure short timeout (e.g., 1000ms)
2. Run long-running command: `ping -c 10 google.com` (Unix) or `ping -n 10 google.com` (Windows)
3. **Expected**: Timeout error after configured time

**Success Criteria**:
- ✅ Command terminates after timeout
- ✅ Timeout notification displayed
- ✅ Partial output handling

#### Test 6.3: Permission Errors
**Objective**: Verify permission error handling

**Steps**:
1. Attempt to run restricted command
2. **Expected**: Permission error notification

**Success Criteria**:
- ✅ Clear permission error message
- ✅ No system instability
- ✅ Graceful error recovery

#### Test 6.4: Large Output Handling
**Objective**: Verify large output processing

**Steps**:
1. Run command with large output: `ls -la /usr/bin` (Unix) or `dir C:\\Windows\\System32` (Windows)
2. **Expected**: Output truncated if exceeds limit

**Success Criteria**:
- ✅ Output size limit respected
- ✅ Performance remains acceptable
- ✅ Truncation notification if applicable

### 7. User Interface and Experience

#### Test 7.1: Status Bar Integration
**Objective**: Verify status bar updates during execution

**Steps**:
1. Run medium-duration command
2. **Expected**: Status bar shows execution progress

**Success Criteria**:
- ✅ Status updates during execution
- ✅ Clear completion indication
- ✅ Status clears after completion

#### Test 7.2: Progress Notifications
**Objective**: Verify progress tracking

**Steps**:
1. Run command that takes several seconds
2. **Expected**: Progress notification displayed

**Success Criteria**:
- ✅ Progress indicator appears
- ✅ Cancellation option available
- ✅ Progress updates appropriately

#### Test 7.3: Notification System
**Objective**: Verify notification consistency

**Steps**:
1. Run various commands (success/error cases)
2. **Expected**: Appropriate notifications for each case

**Success Criteria**:
- ✅ Success notifications for completed tasks
- ✅ Error notifications for failures
- ✅ Consistent notification styling

### 8. Configuration and Settings

#### Test 8.1: VSCode Settings Integration
**Objective**: Verify settings synchronization

**Steps**:
1. Modify extension settings in VSCode
2. Run commands to verify changes take effect
3. **Expected**: Settings applied immediately

**Success Criteria**:
- ✅ Settings changes reflected
- ✅ No restart required
- ✅ Default values handled correctly

#### Test 8.2: Workspace-Specific Configuration
**Objective**: Verify workspace settings isolation

**Steps**:
1. Configure different settings per workspace
2. Switch between workspaces
3. **Expected**: Correct settings applied per workspace

**Success Criteria**:
- ✅ Workspace isolation maintained
- ✅ Settings switch with workspace
- ✅ No cross-workspace contamination

### 9. Performance and Reliability

#### Test 9.1: Concurrent Execution
**Objective**: Verify handling of multiple simultaneous commands

**Steps**:
1. Start long-running command
2. Attempt to start second command
3. **Expected**: Appropriate queuing or rejection

**Success Criteria**:
- ✅ System remains stable
- ✅ Clear feedback on concurrent operations
- ✅ No resource leaks

#### Test 9.2: Memory Usage
**Objective**: Verify memory efficiency

**Steps**:
1. Run many commands over extended period
2. Monitor VSCode memory usage
3. **Expected**: Stable memory consumption

**Success Criteria**:
- ✅ No memory leaks detected
- ✅ Garbage collection working
- ✅ Performance remains stable

### 10. Integration Testing

#### Test 10.1: Extension Lifecycle
**Objective**: Verify extension activation/deactivation

**Steps**:
1. Disable extension
2. Re-enable extension
3. Test core functionality
4. **Expected**: Full functionality restored

**Success Criteria**:
- ✅ Clean activation/deactivation
- ✅ No residual state issues
- ✅ Commands register correctly

#### Test 10.2: VSCode API Compatibility
**Objective**: Verify VSCode API usage

**Steps**:
1. Test in different VSCode versions (if possible)
2. Test with other extensions installed
3. **Expected**: No conflicts or compatibility issues

**Success Criteria**:
- ✅ API calls work correctly
- ✅ No extension conflicts
- ✅ Stable operation

### 11. Windows PowerShell Default Detection

#### Test 11.1: Default Profile - Windows PowerShell
**Objective**: Confirm the extension honors the VS Code PowerShell default profile

**Prerequisites**: `terminal.integrated.defaultProfile.windows` set to `PowerShell`

**Steps**:
1. Reload the VS Code window to apply the profile change.
2. Open the `CmdPipe: Run Task in Editor` output channel via `CmdPipe Config: Show Logs`.
3. Run the sample "Windows PowerShell Echo" task from the test workspace.
4. **Expected**: The log captures the resolved profile name, `powershell.exe` launch path, and PowerShell-specific arguments.

**Success Criteria**:
- ✅ Task output banner shows PowerShell
- ✅ CmdPipe log entry includes `powershell.exe`
- ✅ No fallback warnings recorded

#### Test 11.2: Default Profile - PowerShell Core (pwsh)
**Objective**: Validate detection when VS Code defaults to PowerShell Core

**Prerequisites**: `terminal.integrated.defaultProfile.windows` set to `PowerShell Core`

**Steps**:
1. Reload the VS Code window.
2. Reopen the CmdPipe output channel to capture fresh diagnostics.
3. Execute the sample PowerShell task and note the shell banner.
4. **Expected**: The log records the `pwsh.exe` path and arguments (for example `-NoLogo -NoProfile -Command`).

**Success Criteria**:
- ✅ Task output reflects PowerShell Core
- ✅ CmdPipe log entry includes `pwsh.exe`
- ✅ Diagnostics array remains empty

#### Test 11.3: PowerShell Argument Escaping
**Objective**: Ensure PowerShell receives escaped arguments without mutation

**Steps**:
1. Edit the sample task to use arguments containing spaces, double quotes, single quotes, and `&` symbols (e.g., `Write-Host "C:\Program Files" "foo'bar" '&signal'`).
2. Run the task under the current PowerShell default profile.
3. Inspect the task output and CmdPipe log to verify single quotes are doubled and literals remain intact.

**Success Criteria**:
- ✅ Output exactly matches the provided literals
- ✅ CmdPipe log shows the escaped payload with doubled single quotes
- ✅ No PowerShell parsing errors raised

#### Test 11.4: Fallback to Command Prompt
**Objective**: Verify diagnostics and fallback behavior when the PowerShell profile cannot resolve

**Steps**:
1. Set `terminal.integrated.defaultProfile.windows` to an invalid name (e.g., `Bogus-PowerShell`).
2. Reload VS Code and rerun the sample task.
3. Review the CmdPipe output channel.
4. **Expected**: The log records a warning, explains the PowerShell resolution failure, and notes that `cmd.exe` with `/c` arguments was selected.

**Success Criteria**:
- ✅ Task still executes using Command Prompt
- ✅ Warning diagnostic captured with the failure reason
- ✅ Restoring a valid profile removes the warning on the next run

## Test Results Template

### Test Session Information
- **Date**: [Date]
- **Tester**: [Name]
- **Platform**: [Windows/macOS/Linux version]
- **VSCode Version**: [Version]
- **Extension Version**: [Version]

### Test Results Summary
| Test Category | Tests Passed | Tests Failed | Notes |
|---------------|--------------|--------------|-------|
| Basic Commands | X/Y | Z | |
| Task Configuration | X/Y | Z | |
| Selection Processing | X/Y | Z | |
| Platform Commands | X/Y | Z | |
| Development Integration | X/Y | Z | |
| Error Handling | X/Y | Z | |
| User Interface | X/Y | Z | |
| Configuration | X/Y | Z | |
| Performance | X/Y | Z | |
| Integration | X/Y | Z | |

### Issues Found
| Issue ID | Severity | Description | Steps to Reproduce | Status |
|----------|----------|-------------|-------------------|--------|
| | | | | |

### Overall Assessment
- **Total Tests**: X
- **Passed**: Y
- **Failed**: Z
- **Pass Rate**: (Y/X * 100)%
- **Ready for Release**: [Yes/No]

### Recommendations
- [List any recommendations for improvements]
- [Performance optimizations]
- [Feature enhancements]
- [Bug fixes needed]