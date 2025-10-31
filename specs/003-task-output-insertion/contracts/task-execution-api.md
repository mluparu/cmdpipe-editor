# Task Execution API Contract

**Version**: 1.0.0  
**Date**: October 29, 2025

## Overview

Defines the interface for task execution with output collection and editor insertion capabilities.

## Interfaces

### ITaskExecutor

Primary interface for executing tasks and collecting output.

```typescript
interface ITaskExecutor {
  /**
   * Execute a task and return results with output
   */
  executeTaskWithOutput(
    task: TaskDefinition, 
    options?: TaskExecutionOptions
  ): Promise<TaskExecutionResult>;

  /**
   * Cancel a running task by ID
   */
  cancelTask(taskId: string): Promise<boolean>;

  /**
   * Check if a task is currently running
   */
  isTaskRunning(taskId: string): boolean;
}
```

### IOutputProcessor

Interface for processing and analyzing task output.

```typescript
interface IOutputProcessor {
  /**
   * Detect if output contains binary data
   */
  isBinaryData(output: Buffer | string): boolean;

  /**
   * Process output for editor insertion
   */
  processOutput(
    output: string, 
    task: TaskDefinition, 
    insertionMode: InsertionMode
  ): ProcessedOutput;

  /**
   * Save binary data to temporary file
   */
  saveBinaryToTempFile(data: Buffer): Promise<string>;
}
```

### ICommandRegistry

Interface for unified command management.

```typescript
interface ICommandRegistry {
  /**
   * Register a command with metadata
   */
  registerCommand(
    id: string, 
    handler: (...args: any[]) => any, 
    metadata: CommandMetadata
  ): void;

  /**
   * Unregister a command
   */
  unregisterCommand(id: string): boolean;

  /**
   * Get all registered commands
   */
  getRegisteredCommands(): CommandRegistration[];

  /**
   * Execute a command by ID
   */
  executeCommand(id: string, ...args: any[]): Promise<any>;
}
```

### IOutputInsertion

Interface for inserting output into editor.

```typescript
interface IOutputInsertion {
  /**
   * Insert output at cursor position
   */
  insertAtCursor(
    context: OutputInsertionContext, 
    output: string
  ): Promise<InsertionResult>;

  /**
   * Replace selected text with output
   */
  replaceSelection(
    context: OutputInsertionContext, 
    output: string
  ): Promise<InsertionResult>;

  /**
   * Show output in output panel
   */
  showInOutputPanel(
    output: string, 
    title: string
  ): Promise<void>;

  /**
   * Determine best insertion mode for context
   */
  getBestInsertionMode(
    context: OutputInsertionContext
  ): InsertionMode;
}
```

## Data Types

### TaskExecutionOptions

```typescript
interface TaskExecutionOptions {
  timeout?: number;              // Max execution time in ms
  showProgress?: boolean;        // Show progress indicator
  progressDelay?: number;        // Delay before showing progress (default: 10000ms)
  cancellable?: boolean;         // Allow user cancellation
  workingDirectory?: string;     // Working directory for execution
  environment?: Record<string, string>; // Environment variables
}
```

### ProcessedOutput

```typescript
interface ProcessedOutput {
  content: string;               // Processed content for insertion
  isBinary: boolean;            // Whether original was binary
  tempFilePath?: string;        // Path to saved binary file
  encoding?: string;            // Detected encoding
  lineCount: number;            // Number of lines in output
  byteCount: number;            // Size in bytes
}
```

### InsertionResult

```typescript
interface InsertionResult {
  success: boolean;             // Whether insertion succeeded
  error?: string;               // Error message if failed
  position?: vscode.Position;   // Final cursor position
  linesInserted: number;        // Number of lines inserted
  charactersInserted: number;   // Number of characters inserted
}
```

### CommandMetadata

```typescript
interface CommandMetadata {
  title: string;                // Human-readable title
  category: string;             // Command category
  description?: string;         // Optional description
  icon?: string;                // Optional icon identifier
  when?: string;                // When clause for availability
  shortcut?: string;            // Optional keyboard shortcut
}
```

### CommandRegistration

```typescript
interface CommandRegistration {
  id: string;                   // Command identifier
  handler: Function;            // Command handler
  metadata: CommandMetadata;    // Command metadata
  disposable: vscode.Disposable; // VS Code disposable for cleanup
}
```

## Error Types

### TaskExecutionError

```typescript
class TaskExecutionError extends Error {
  constructor(
    public taskId: string,
    public exitCode: number,
    public stderr: string,
    message: string
  ) {
    super(message);
  }
}
```

### OutputInsertionError

```typescript
class OutputInsertionError extends Error {
  constructor(
    public context: OutputInsertionContext,
    public reason: 'readonly' | 'no-editor' | 'invalid-position',
    message: string
  ) {
    super(message);
  }
}
```

### BinaryDataError

```typescript
class BinaryDataError extends Error {
  constructor(
    public dataSize: number,
    public tempFilePath?: string,
    message: string
  ) {
    super(message);
  }
}
```

## Events

### TaskExecutionEvents

```typescript
interface TaskExecutionEvents {
  'task.started': (taskId: string) => void;
  'task.progress': (taskId: string, progress: number) => void;
  'task.completed': (result: TaskExecutionResult) => void;
  'task.failed': (error: TaskExecutionError) => void;
  'task.cancelled': (taskId: string) => void;
}
```

### OutputInsertionEvents

```typescript
interface OutputInsertionEvents {
  'insertion.started': (context: OutputInsertionContext) => void;
  'insertion.completed': (result: InsertionResult) => void;
  'insertion.failed': (error: OutputInsertionError) => void;
  'binary.detected': (tempFilePath: string) => void;
}
```

## Usage Examples

### Basic Task Execution

```typescript
const executor = new TaskExecutor();
const result = await executor.executeTaskWithOutput(
  { id: 'ls', command: 'ls', args: ['-la'] },
  { showProgress: true, cancellable: true }
);
```

### Command Registration

```typescript
const registry = new CommandRegistry();
registry.registerCommand(
  'extension.runTask',
  async () => { /* handler */ },
  { title: 'Run Task', category: 'Tasks' }
);
```

### Output Insertion

```typescript
const inserter = new OutputInsertion();
const result = await inserter.insertAtCursor(context, processedOutput);
```