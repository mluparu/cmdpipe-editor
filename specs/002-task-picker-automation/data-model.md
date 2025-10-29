# Data Model: Task Picker Automation

**Feature**: 002-task-picker-automation  
**Date**: October 24, 2025  
**Purpose**: Define data structures and entity relationships

## Core Entities

### TaskConfiguration
Represents a complete task configuration file from disk.

**Fields**:
- `filePath: string` - Absolute path to configuration file
- `source: TaskSource` - Origin location (workspace or user)
- `isValid: boolean` - Validation status
- `lastModified: Date` - File modification timestamp
- `tasks: TaskDefinition[]` - Array of task definitions
- `errors: ValidationError[]` - Validation errors if invalid

**Validation Rules**:
- File path must be absolute and accessible
- JSON must be valid syntax
- Must conform to extended tasks.json schema
- At least one valid task definition required

**State Transitions**:
- `Loading` → `Valid` (successful validation)
- `Loading` → `Invalid` (validation failures)
- `Valid` → `Invalid` (file corruption, permission changes)
- `Invalid` → `Valid` (file fixes, permission restoration)

### TaskDefinition
Individual task specification within a configuration file.

**Fields**:
- `name: string` - Unique task identifier (within source)
- `command: string` - Shell command to execute
- `description?: string` - Human-readable task description
- `group?: string` - Task categorization (build, test, etc.)
- `args?: string[]` - Command arguments array
- `options?: TaskOptions` - Execution options
- `outputTarget?: OutputTarget` - Cmdpipe-specific output handling
- `source: TaskSource` - Origin location for conflict resolution
- `filePath: string` - Path to containing configuration file

**Validation Rules**:
- Name must be non-empty string, no special characters
- Command must be non-empty string
- Arguments must be valid string array if provided
- Output target must conform to OutputTarget schema

**Relationships**:
- Belongs to one TaskConfiguration
- May conflict with TaskDefinition from different source (same name)

### TaskSource
Enumeration of task configuration origins.

**Values**:
- `WORKSPACE` - Tasks from workspace .vscode directory
- `USER` - Tasks from user configuration directory

**Properties**:
- `WORKSPACE` requires workspace trust for execution
- `USER` always trusted for execution
- `WORKSPACE` takes precedence over `USER` for same task name

### ValidationError
Represents configuration file validation failure.

**Fields**:
- `filePath: string` - Path to file containing error
- `line?: number` - Line number of error (if applicable)
- `column?: number` - Column number of error (if applicable)
- `message: string` - Human-readable error description
- `code: string` - Error code for programmatic handling
- `severity: ErrorSeverity` - Error impact level

**Error Codes**:
- `INVALID_JSON` - JSON syntax error
- `SCHEMA_VIOLATION` - Schema validation failure
- `MISSING_REQUIRED` - Required field missing
- `INVALID_COMMAND` - Command field validation failure
- `FILE_ACCESS` - File system permission error

### TaskPickerItem
UI representation of a task for the picker interface.

**Fields**:
- `label: string` - Display name in picker
- `description: string` - Secondary text with source info
- `detail?: string` - Additional details (command preview)
- `task: TaskDefinition` - Associated task definition
- `iconPath?: string` - Icon indicating source/status
- `buttons?: QuickInputButton[]` - Action buttons

**Display Rules**:
- Label includes task name and group (if present)
- Description indicates source (workspace/user) and trust status
- Detail shows command preview (truncated if long)
- Icons differentiate workspace vs user tasks
- Disabled appearance for untrusted workspace tasks

### OutputTarget
Cmdpipe-specific configuration for output handling.

**Fields**:
- `mode: InsertMode` - How to insert output into editor
- `position?: CursorPosition` - Where to insert output
- `format?: OutputFormat` - Output formatting options
- `errorHandling?: ErrorHandling` - Error output behavior

**Insert Modes**:
- `CURSOR` - Insert at current cursor position
- `LINE_END` - Insert at end of current line
- `NEW_LINE` - Insert on new line after cursor
- `REPLACE_SELECTION` - Replace current selection

### FileWatcherState
Manages file system monitoring state.

**Fields**:
- `watchers: Map<string, FileSystemWatcher>` - Active file watchers by path
- `lastScanTime: Date` - Last complete directory scan
- `pendingChanges: Set<string>` - Files with pending change notifications
- `debounceTimer?: NodeJS.Timeout` - Debounce timer for batch processing

**Lifecycle**:
- Created on extension activation
- Watches workspace .vscode and user config directories
- Disposes all watchers on extension deactivation
- Handles watcher failures gracefully

## Entity Relationships

```text
TaskConfiguration (1) ──┐
                        ├── TaskDefinition (*)
                        └── ValidationError (*)

TaskDefinition ──────────── TaskSource (enum)
    │
    └─── OutputTarget (1)

TaskPickerItem ──────────── TaskDefinition (1)

FileWatcherState ────────── TaskConfiguration (*) [monitors]
```

## Data Flow

### Configuration Loading
1. `FileWatcherState` detects configuration files
2. `TaskConfiguration` created for each file
3. JSON parsed and validated against schema
4. `TaskDefinition` objects extracted from valid configurations
5. `ValidationError` objects created for invalid content

### Task Conflict Resolution
1. All `TaskDefinition` objects collected by name
2. `TaskSource.WORKSPACE` takes precedence over `TaskSource.USER`
3. Conflicts logged for user awareness
4. Resolved tasks used for picker population

### Trust Validation
1. Check `vscode.workspace.isTrusted` before execution
2. Filter workspace tasks if trust is false
3. User tasks always available regardless of trust
4. UI indicators reflect trust status

### Change Monitoring
1. `FileSystemWatcher` events trigger change detection
2. Debounce rapid changes (500ms timeout)
3. Reload affected `TaskConfiguration` objects
4. Refresh task picker if currently open
5. Notify user of validation errors

## Schema Definitions

### Extended Tasks.json Schema
Extends VS Code's standard tasks.json with cmdpipe-specific fields.

**Base Schema**: VS Code tasks.json v2.0.0
**Extensions**:
- `cmdpipe.outputTarget` - Output insertion configuration
- `cmdpipe.insertMode` - Cursor positioning behavior
- `cmdpipe.errorHandling` - Error output management

**Backward Compatibility**: All standard VS Code task properties supported