# Data Model: Task Output Insertion and Command Consolidation

**Feature**: Task Output Insertion and Command Consolidation  
**Date**: October 29, 2025

## Core Entities

### TaskExecutionResult
Enhanced execution result with output collection capabilities.

**Fields**:
- `taskId: string` - Unique identifier for the task execution
- `output: string` - Captured standard output from task
- `stderr: string` - Captured error output from task  
- `exitCode: number` - Process exit code
- `success: boolean` - Whether execution completed successfully
- `error?: string` - Error message if execution failed
- `executionTime: number` - Total execution time in milliseconds
- `isBinary: boolean` - Whether output contains binary data
- `tempFilePath?: string` - Path to temporary file if binary data saved
- `cancelled: boolean` - Whether execution was cancelled by user

**Validation Rules**:
- `taskId` must be non-empty string
- `exitCode` must be valid integer (typically 0-255)
- `executionTime` must be non-negative number
- `tempFilePath` only present when `isBinary` is true

**State Transitions**:
- Pending → Running → Completed/Failed/Cancelled

### OutputInsertionContext
Tracks editor state and insertion preferences for task output.

**Fields**:
- `editorUri: vscode.Uri` - URI of the active editor
- `cursorPosition: vscode.Position` - Current cursor position
- `selectedRange?: vscode.Range` - Currently selected text range
- `insertionMode: InsertionMode` - How to insert the output
- `isReadonly: boolean` - Whether the editor is read-only
- `language: string` - Programming language of the editor
- `hasActiveEditor: boolean` - Whether an editor is currently active

**Validation Rules**:
- `editorUri` must be valid file URI when `hasActiveEditor` is true
- `selectedRange` must be valid range within document when present
- `insertionMode` must be valid enum value

### CommandRegistry
Central registry for all extension commands with metadata and handlers.

**Fields**:
- `commands: Map<string, CommandRegistration>` - Registered commands
- `disposables: vscode.Disposable[]` - Cleanup resources

**CommandRegistration Structure**:
- `id: string` - Command identifier
- `handler: Function` - Command handler function
- `metadata: CommandMetadata` - Command metadata

**CommandMetadata Structure**:
- `title: string` - Human-readable command title
- `category: string` - Command category for organization
- `description?: string` - Optional command description
- `when?: string` - Optional when clause for conditional availability

**Validation Rules**:
- Command IDs must follow VS Code naming convention (extension.commandName)
- Handlers must be valid callable functions
- Metadata must include required title and category fields

### InsertionMode
Enumeration defining how task output should be integrated into editor.

**Values**:
- `CURSOR` - Insert at current cursor position
- `REPLACE_SELECTION` - Replace currently selected text
- `OUTPUT_PANEL` - Show in VS Code output panel
- `APPEND_LINE` - Append to current line
- `PROMPT` - Ask user for insertion preference

**Business Rules**:
- `REPLACE_SELECTION` only available when text is selected
- `CURSOR` and `APPEND_LINE` fallback to `OUTPUT_PANEL` for read-only editors
- `PROMPT` presents user with available options based on editor state

## Entity Relationships

```
TaskExecutionResult
├── contains output data
└── referenced by OutputInsertionContext for insertion decisions

OutputInsertionContext  
├── tracks editor state
├── determines available insertion modes
└── guides output placement logic

CommandRegistry
├── manages all extension commands
├── handles command registration lifecycle
└── provides unified command execution entry points

InsertionMode
├── used by OutputInsertionContext
└── determines TaskExecutionResult output handling
```

## Data Flow

1. **Command Execution Flow**:
   ```
   User Action → CommandRegistry → TaskExecution → TaskExecutionResult
   ```

2. **Output Insertion Flow**:
   ```
   TaskExecutionResult → OutputInsertionContext → InsertionMode → Editor/OutputPanel
   ```

3. **Binary Data Handling Flow**:
   ```
   TaskExecutionResult.isBinary → TempFile Creation → Placeholder Text → Editor
   ```

## Persistence

- **TaskExecutionResult**: Temporary, exists only during command execution
- **OutputInsertionContext**: Temporary, created per insertion operation  
- **CommandRegistry**: In-memory, lifetime tied to extension lifecycle
- **Binary Data Files**: Temporary files in system TEMP directory, cleaned up after insertion

## Validation Schema

### TaskExecutionResult Validation
```typescript
interface TaskExecutionResultSchema {
  taskId: string & { minLength: 1 };
  output: string;
  stderr: string;
  exitCode: number & { minimum: 0; maximum: 255 };
  success: boolean;
  error?: string;
  executionTime: number & { minimum: 0 };
  isBinary: boolean;
  tempFilePath?: string & { when: { isBinary: true } };
  cancelled: boolean;
}
```

### OutputInsertionContext Validation
```typescript
interface OutputInsertionContextSchema {
  editorUri: vscode.Uri & { when: { hasActiveEditor: true } };
  cursorPosition: vscode.Position;
  selectedRange?: vscode.Range;
  insertionMode: InsertionMode;
  isReadonly: boolean;
  language: string;
  hasActiveEditor: boolean;
}
```