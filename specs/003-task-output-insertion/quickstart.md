# Quick Start: Task Output Insertion and Command Consolidation

**Feature**: Task Output Insertion and Command Consolidation  
**Date**: October 29, 2025

## Overview

This feature enhances the TaskPicker to collect task execution output and insert it directly into the active editor, while consolidating command handling logic across the extension.

## What's New

### 🎯 Primary Changes
- **Task Output Collection**: TaskPicker now captures command output instead of just executing tasks
- **Editor Integration**: Output is inserted at cursor position or replaces selected text
- **Binary Data Handling**: Binary output is saved to temporary files with placeholder text
- **Unified Commands**: All command registration consolidated into single CommandHandler

### 🔧 Enhanced Capabilities
- Progress indication for long-running tasks (>10 seconds)
- User-cancellable task execution
- Configurable output insertion modes
- Read-only editor fallback to output panel
- Cross-platform temporary file handling

## User Workflows

### Basic Task Output Insertion

1. **Open TaskPicker**: Use command palette or shortcut to open task picker
2. **Select Task**: Choose any configured task from the list
3. **Automatic Insertion**: Task output is automatically inserted at cursor position
4. **Binary Handling**: If binary data detected, placeholder text inserted and file saved

### Text Replacement Workflow

1. **Select Text**: Highlight text in the editor that you want to replace
2. **Execute Task**: Open TaskPicker and select a task
3. **Replace Content**: Selected text is replaced with task output
4. **Preserve Formatting**: Original text formatting and indentation preserved

### Long-Running Task Management

1. **Start Task**: Execute any task through TaskPicker
2. **Progress Indication**: After 10 seconds, progress dialog appears with cancel button
3. **User Control**: Cancel task at any time or let it complete
4. **Output Handling**: Completed output inserted according to user preferences

## Configuration Options

### Insertion Mode Settings

Configure default behavior in VS Code settings:

```json
{
  "cmdpipe.defaultInsertionMode": "cursor",
  "cmdpipe.showProgressAfter": 10000,
  "cmdpipe.binaryPlaceholderText": "<<binary data was detected and saved to file>>",
  "cmdpipe.maxOutputSize": 1048576
}
```

**Available Insertion Modes**:
- `cursor` - Insert at current cursor position
- `replace-selection` - Replace selected text
- `output-panel` - Show in output panel
- `append-line` - Append to current line
- `prompt` - Ask user each time

### Task Configuration

Tasks are configured through standard VS Code tasks.json:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "List Files",
      "type": "shell",
      "command": "ls",
      "args": ["-la"],
      "group": "build"
    },
    {
      "label": "Git Status",
      "type": "shell", 
      "command": "git",
      "args": ["status", "--short"],
      "group": "build"
    }
  ]
}
```

## Command Reference

### New Commands

| Command | ID | Description |
|---------|----|-----------| 
| Show Task Picker | `cmdpipe.showTaskPicker` | Open enhanced task picker with output insertion |
| Quick Command | `shellTaskPipe.quickCommand` | Execute ad-hoc command with output insertion |
| Execute Selection | `shellTaskPipe.executeSelection` | Run selected text as command |

### Consolidated Commands

All commands now registered through single CommandHandler:
- Eliminates duplicate registration logic
- Consistent error handling across commands
- Unified metadata and lifecycle management

## Developer Integration

### Using the Enhanced APIs

```typescript
// Execute task with output collection
const executor = new TaskExecutor();
const result = await executor.executeTaskWithOutput(task, {
  showProgress: true,
  cancellable: true,
  progressDelay: 10000
});

// Process and insert output
const processor = new OutputProcessor();
const processed = processor.processOutput(result.output, task, 'cursor');

const inserter = new OutputInsertion();
await inserter.insertAtCursor(context, processed.content);
```

### Command Registration

```typescript
// Unified command registration
const registry = CommandRegistry.getInstance();
registry.registerCommand(
  'myExtension.myCommand',
  async () => { /* handler */ },
  {
    title: 'My Command',
    category: 'MyExtension',
    description: 'Does something useful'
  }
);
```

## Troubleshooting

### Common Issues

**Output not inserting into editor**:
- Check if editor is read-only (output will go to panel instead)
- Verify active editor exists and has focus
- Check insertion mode configuration

**Binary data not handled correctly**:
- Ensure temp directory is writable
- Check file system permissions
- Verify binary detection logic with specific commands

**Commands not appearing**:
- Verify tasks.json configuration
- Check command registration in extension
- Restart VS Code if needed

**Long tasks not showing progress**:
- Check `cmdpipe.showProgressAfter` setting
- Verify task is actually long-running (>10 seconds)
- Ensure progress API is properly implemented

### Performance Considerations

- Large outputs (>1MB) may cause editor performance issues
- Binary files saved to temp directory are not automatically cleaned
- Multiple simultaneous tasks may impact system resources
- Progress UI updates are throttled to prevent excessive redraws

## Migration Notes

### For Extension Developers

- Command registration now centralized in CommandHandler
- Existing command handlers preserved but registration path changed
- New interfaces available for task execution and output processing
- Legacy APIs maintained for backward compatibility

### For Users

- All existing functionality preserved
- New output insertion behavior is opt-in via configuration
- Tasks.json format unchanged
- Keyboard shortcuts and command palette entries remain the same

## Next Steps

1. **Configure Tasks**: Set up tasks.json with your commonly used commands
2. **Customize Settings**: Adjust insertion modes and progress timing to your preference
3. **Try Workflows**: Test basic insertion, text replacement, and binary handling
4. **Advanced Usage**: Explore command consolidation benefits for extension development