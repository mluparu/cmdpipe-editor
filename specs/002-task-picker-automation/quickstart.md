# Quick Start: Task Picker Automation Implementation

**Feature**: 002-task-picker-automation  
**Date**: October 24, 2025  
**Purpose**: Step-by-step implementation guide

## Overview

This feature implements automatic task discovery and unified task picker with workspace trust validation for the cmdpipe VS Code extension. The implementation extends the existing extension architecture with new modules for task discovery, validation, and security.

## Implementation Priority Order

### Phase 1: Core Task Discovery (P1 - MVP)
1. **Task Configuration Management** - File discovery and parsing
2. **Basic Task Picker** - Simple UI without security features  
3. **File Watching** - Auto-refresh on configuration changes

### Phase 2: Security & Validation (P1 - Security Critical)
1. **Workspace Trust Integration** - Security boundary enforcement
2. **Task Validation System** - Schema validation and error reporting
3. **Error Recovery UI** - User-friendly error handling

### Phase 3: Polish & Documentation (P2 - User Experience)
1. **Enhanced UI** - Source indicators, accessibility improvements
2. **Comprehensive Documentation** - User guides and API docs
3. **Performance Optimization** - Caching and lazy loading

## Quick Start Steps

### Step 1: Set Up Core Infrastructure

1. **Create new type definitions**:
   ```bash
   # Create new files
   touch src/types/configTypes.ts
   touch src/discovery/taskScanner.ts
   touch src/validation/taskValidator.ts
   ```

2. **Update existing types**:
   - Extend `src/types/taskTypes.ts` with new interfaces
   - Add task picker types to `src/types/extensionTypes.ts`

3. **Install dependencies**:
   ```bash
   npm install ajv ajv-formats  # JSON schema validation
   npm install --save-dev @types/vscode  # Ensure latest VS Code types
   ```

### Step 2: Implement Task Discovery

1. **Create TaskConfigManager** (`src/config/taskConfigManager.ts`):
   - Scan workspace .vscode and user directories
   - Parse JSON configuration files
   - Implement basic conflict resolution (workspace precedence)

2. **Create TaskScanner** (`src/discovery/taskScanner.ts`):
   - Directory scanning with cross-platform path handling
   - File filtering for JSON configuration files
   - Async file reading with error handling

3. **Integrate with extension activation**:
   - Initialize TaskConfigManager in `src/extension.ts`
   - Load configurations on extension startup
   - Register for workspace folder changes

### Step 3: Build Basic Task Picker

1. **Create TaskPicker UI** (`src/ui/taskPicker.ts`):
   - Use VS Code QuickPick API for consistent UX
   - Display task name, description, and command preview
   - Handle user selection and cancellation

2. **Register picker command**:
   - Add `shellTaskPipe.showTaskPicker` command
   - Integrate with existing CommandHandler
   - Add keyboard shortcut (Ctrl+Shift+P by default)

3. **Test basic functionality**:
   - Create test configuration files
   - Verify task loading and display
   - Test task selection workflow

### Step 4: Add File Watching

1. **Create FileWatcher** (`src/discovery/fileWatcher.ts`):
   - Use VS Code FileSystemWatcher API
   - Watch both workspace and user directories
   - Implement debounced change handling (500ms)

2. **Integrate change notifications**:
   - Reload configurations on file changes
   - Update picker if currently open
   - Handle file deletion gracefully

3. **Test dynamic updates**:
   - Modify configuration files while extension running
   - Verify automatic refresh behavior
   - Test file creation/deletion scenarios

### Step 5: Implement Workspace Trust

1. **Create TrustValidator** (`src/validation/trustValidator.ts`):
   - Check `vscode.workspace.isTrusted` status
   - Monitor trust change events
   - Filter workspace tasks based on trust status

2. **Update task picker**:
   - Show trust status in task descriptions
   - Disable untrusted workspace tasks
   - Display security warnings for blocked tasks

3. **Add trust status indicators**:
   - Status bar item showing current trust state
   - Visual indicators in task picker
   - Clear messaging about security restrictions

### Step 6: Add Validation & Error Handling

1. **Create TaskValidator** (`src/validation/taskValidator.ts`):
   - Define extended JSON schema for cmdpipe tasks
   - Implement comprehensive validation with ajv
   - Generate detailed error messages with line numbers

2. **Create ErrorDialog** (`src/ui/errorDialog.ts`):
   - Modal dialog for configuration errors
   - "Open File" and "Ignore" action buttons
   - Accessible keyboard navigation

3. **Integrate error reporting**:
   - Show validation errors during configuration loading
   - Provide recovery actions for common issues
   - Log errors to extension output channel

### Step 7: Documentation & Polish

1. **Create user documentation**:
   - Task configuration format guide (`docs/task-configuration.md`)
   - Extension usage instructions (`docs/user-guide.md`)
   - Troubleshooting guide (`docs/troubleshooting.md`)

2. **Add accessibility features**:
   - ARIA labels for all UI components
   - Keyboard navigation support
   - High contrast theme compatibility

3. **Performance optimization**:
   - Lazy loading of configurations
   - Caching with invalidation
   - Memory management for file watchers

## Development Workflow

### Test-Driven Development
1. **Write tests first** for each component
2. **Implement minimal functionality** to pass tests
3. **Refactor and optimize** while maintaining test coverage

### Testing Strategy
- **Unit tests**: Individual components (validation, scanning, trust checking)
- **Integration tests**: File watching, task loading, UI interactions
- **E2E tests**: Complete user workflows from configuration to execution

### Code Review Checklist
- [ ] All new code has corresponding tests
- [ ] Accessibility requirements met
- [ ] Cross-platform compatibility verified
- [ ] Error handling comprehensive
- [ ] Documentation updated

## File Structure Reference

```text
src/
├── config/
│   └── taskConfigManager.ts      # Main configuration management
├── discovery/
│   ├── taskScanner.ts           # File system scanning
│   ├── fileWatcher.ts           # Change monitoring
│   └── taskResolver.ts          # Conflict resolution
├── validation/
│   ├── taskValidator.ts         # Schema validation
│   ├── trustValidator.ts        # Security validation
│   └── errorReporter.ts         # Error formatting
├── ui/
│   ├── taskPicker.ts           # Main picker interface
│   ├── errorDialog.ts          # Error recovery UI
│   └── trustWarning.ts         # Security warnings
└── types/
    └── configTypes.ts          # Configuration type definitions

docs/
├── task-configuration.md       # JSON format specification
├── user-guide.md              # Usage instructions
├── api-reference.md           # Internal API docs
└── troubleshooting.md         # Common issues

tests/
├── unit/
│   ├── validation/            # Validation tests
│   ├── discovery/             # Discovery tests
│   └── ui/                    # UI component tests
├── integration/
│   └── taskPickerWorkflow.test.ts
└── e2e/
    └── taskPickerAutomation.test.ts
```

## Common Gotchas

### Cross-Platform Considerations
- Use VS Code's URI and file system APIs instead of Node.js path/fs
- Test on Windows, macOS, and Linux
- Handle different line endings in configuration files

### VS Code Extension Best Practices
- Always dispose of watchers and listeners
- Use extension context for resource management
- Respect user's theme and accessibility settings
- Handle extension deactivation gracefully

### Performance Considerations
- Debounce file system events to prevent excessive processing
- Cache validated configurations with invalidation
- Use async/await properly to avoid blocking UI
- Monitor memory usage during development

### Security Best Practices
- Validate all user input before processing
- Respect workspace trust boundaries
- Sanitize file paths to prevent traversal attacks
- Clear error messages without exposing system internals

## Next Steps

After completing this implementation:

1. **Run comprehensive testing** across all supported platforms
2. **Gather user feedback** on task picker UX and error handling
3. **Monitor performance** with large numbers of tasks and files
4. **Plan future enhancements** like task chaining and advanced filtering
5. **Update documentation** based on real-world usage patterns