# Research: Task Picker Automation with Trust Validation

**Feature**: 002-task-picker-automation  
**Date**: October 24, 2025  
**Purpose**: Resolve technical unknowns and establish implementation approach

## Research Areas

### VS Code Tasks.json Schema Extension

**Decision**: Extend VS Code's standard tasks.json schema with cmdpipe-specific fields while maintaining backward compatibility

**Rationale**: 
- Leverages existing VS Code schema validation infrastructure
- Familiar format for developers already using VS Code tasks
- Enables gradual migration from standard tasks to cmdpipe tasks
- Provides built-in editor support with IntelliSense

**Alternatives considered**:
- Custom JSON schema: Would require completely new validation and tooling
- YAML format: Less familiar to VS Code users, requires additional parsing
- TOML format: Less common in VS Code ecosystem

**Implementation approach**:
- Define extended schema in `src/config/schema.json`
- Add cmdpipe-specific fields: `outputTarget`, `insertMode`, `errorHandling`
- Maintain compatibility with standard VS Code task properties

### File System Monitoring Strategy

**Decision**: Use VS Code's FileSystemWatcher API with debounced event handling

**Rationale**:
- Native VS Code API provides cross-platform compatibility
- Automatic cleanup when extension deactivates
- Respects VS Code's file watching preferences and performance settings
- Built-in handling of file system permissions

**Alternatives considered**:
- Node.js fs.watch: More direct but requires manual cross-platform handling
- Polling-based approach: Less efficient and responsive
- Manual refresh only: Poor user experience for dynamic workflows

**Implementation approach**:
- Watch both workspace .vscode directory and user config directory
- Debounce events (500ms) to handle rapid file changes
- Graceful handling of permission errors and missing directories

### Workspace Trust API Integration

**Decision**: Use VS Code's Workspace Trust API (vscode.workspace.isTrusted) with trust change event monitoring

**Rationale**:
- Official VS Code security boundary mechanism
- Automatic integration with VS Code's trust UI
- Consistent with other security-sensitive extensions
- Future-proof as trust API evolves

**Alternatives considered**:
- Custom trust management: Would duplicate VS Code functionality
- File path-based restrictions: Less secure and user-friendly
- User prompt for each execution: Poor user experience

**Implementation approach**:
- Check trust status before any workspace task execution
- Monitor trust change events to update UI state
- Clear security messaging in task picker UI

### Task Conflict Resolution Strategy

**Decision**: Workspace tasks take precedence over user tasks with same name, display clear source indicators

**Rationale**:
- Workspace-specific tasks are more contextually relevant
- Matches user's expectation that workspace config overrides global
- Provides path for future task chaining enhancements
- Clear UI feedback prevents confusion

**Alternatives considered**:
- User tasks take precedence: Less intuitive for workspace-specific workflows
- Merge tasks with same name: Complex semantics, potential conflicts
- Require unique names across sources: Too restrictive for users

**Implementation approach**:
- Hash map keyed by task name with source precedence logic
- UI indicators show task source (workspace icon vs user icon)
- Future-ready for task chaining implementation

### Error Recovery UI Patterns

**Decision**: Modal dialog with actionable buttons for configuration errors

**Rationale**:
- Ensures user sees critical configuration issues
- Provides immediate path to resolution
- Consistent with VS Code error reporting patterns
- Accessible keyboard navigation

**Alternatives considered**:
- Output panel only: Easy to miss, less actionable
- Notification toast: Auto-dismisses, less prominent
- Problems panel: Less immediate, requires navigation

**Implementation approach**:
- Modal dialog with error details, file path, and line number
- "Open File" button to navigate directly to problem
- "Ignore" button to suppress error until next restart
- Keyboard accessible with clear focus management

## Technology Stack Confirmation

### Core Dependencies
- **VS Code Extension API**: vscode.workspace, vscode.commands, vscode.window
- **JSON Schema Validation**: ajv library for robust validation with detailed error reporting
- **File System Operations**: VS Code's workspace.fs API for cross-platform compatibility
- **UI Components**: VS Code's QuickPick API for task picker, built-in dialog APIs

### Development Dependencies
- **Testing**: Jest + @vscode/test-runner for VS Code extension testing
- **Build**: TypeScript compiler with VS Code extension webpack config
- **Linting**: ESLint with VS Code extension rules
- **Documentation**: TypeDoc for API documentation generation

## Performance Considerations

### Task Loading Optimization
- Lazy loading of task configurations (load on demand)
- Caching validated configurations with file modification time checks
- Batch file operations to minimize I/O overhead
- Async/await patterns to prevent UI blocking

### Memory Management
- Dispose file watchers on extension deactivation
- Clear task cache when configuration files are deleted
- Use WeakMap for temporary UI state to enable garbage collection
- Monitor extension memory usage in development

### Error Handling Strategy
- Comprehensive input validation before processing
- Graceful degradation when file system operations fail
- Clear error messages with specific remediation steps
- Telemetry for error patterns (if user opts in)

## Security Considerations

### Input Validation
- Strict JSON schema validation for all configuration files
- Path traversal protection for file operations
- Command injection prevention in task execution
- Size limits for configuration files (10MB max)

### Trust Boundary Enforcement
- Never execute workspace tasks in untrusted workspaces
- Clear visual indicators for task source and trust status
- Audit logging for security-relevant operations
- Secure default configurations