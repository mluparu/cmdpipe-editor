# Task Configuration API Contract

**Version**: 1.0.0  
**Purpose**: Define interfaces for task configuration management

## ITaskConfigManager

Main interface for managing task configurations across workspace and user sources.

```typescript
interface ITaskConfigManager {
  /**
   * Load all task configurations from known sources
   * @returns Promise resolving to array of loaded configurations
   */
  loadConfigurations(): Promise<TaskConfiguration[]>;

  /**
   * Get all valid task definitions with conflict resolution applied
   * @returns Array of resolved task definitions
   */
  getResolvedTasks(): TaskDefinition[];

  /**
   * Validate a configuration file against schema
   * @param filePath Absolute path to configuration file
   * @returns Validation result with errors if any
   */
  validateConfiguration(filePath: string): Promise<ValidationResult>;

  /**
   * Start monitoring configuration files for changes
   * @param callback Function called when configurations change
   */
  startWatching(callback: ConfigurationChangeCallback): void;

  /**
   * Stop monitoring configuration files
   */
  stopWatching(): void;

  /**
   * Get configuration errors for display to user
   * @returns Array of current validation errors
   */
  getValidationErrors(): ValidationError[];
}
```

## ITaskPicker

Interface for the unified task picker UI component.

```typescript
interface ITaskPicker {
  /**
   * Show task picker with current available tasks
   * @param options Configuration for picker behavior
   * @returns Promise resolving to selected task or undefined if cancelled
   */
  showPicker(options?: TaskPickerOptions): Promise<TaskDefinition | undefined>;

  /**
   * Refresh picker with latest task definitions
   * @param tasks Updated array of task definitions
   */
  refresh(tasks: TaskDefinition[]): void;

  /**
   * Show error recovery dialog for configuration issues
   * @param error Validation error to display
   * @returns Promise resolving to user action choice
   */
  showErrorDialog(error: ValidationError): Promise<ErrorAction>;
}
```

## ITrustValidator

Interface for workspace trust validation.

```typescript
interface ITrustValidator {
  /**
   * Check if workspace is currently trusted
   * @returns True if workspace is trusted for task execution
   */
  isWorkspaceTrusted(): boolean;

  /**
   * Check if task can be executed based on source and trust status
   * @param task Task definition to validate
   * @returns True if task execution is permitted
   */
  canExecuteTask(task: TaskDefinition): boolean;

  /**
   * Start monitoring workspace trust changes
   * @param callback Function called when trust status changes
   */
  onTrustChanged(callback: TrustChangeCallback): void;

  /**
   * Get security warning message for untrusted workspace
   * @param task Task that cannot be executed
   * @returns Formatted warning message
   */
  getSecurityWarning(task: TaskDefinition): string;
}
```

## Data Transfer Objects

### TaskConfiguration
```typescript
interface TaskConfiguration {
  readonly filePath: string;
  readonly source: TaskSource;
  readonly isValid: boolean;
  readonly lastModified: Date;
  readonly tasks: TaskDefinition[];
  readonly errors: ValidationError[];
}
```

### TaskDefinition
```typescript
interface TaskDefinition {
  readonly name: string;
  readonly command: string;
  readonly description?: string;
  readonly group?: string;
  readonly args?: string[];
  readonly options?: TaskOptions;
  readonly outputTarget?: OutputTarget;
  readonly source: TaskSource;
  readonly filePath: string;
}
```

### ValidationResult
```typescript
interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
}
```

### ValidationError
```typescript
interface ValidationError {
  readonly filePath: string;
  readonly line?: number;
  readonly column?: number;
  readonly message: string;
  readonly code: string;
  readonly severity: ErrorSeverity;
}
```

## Event Contracts

### ConfigurationChangeCallback
```typescript
type ConfigurationChangeCallback = (
  changes: ConfigurationChange[]
) => void;

interface ConfigurationChange {
  readonly type: 'added' | 'modified' | 'deleted';
  readonly filePath: string;
  readonly configuration?: TaskConfiguration;
}
```

### TrustChangeCallback
```typescript
type TrustChangeCallback = (trusted: boolean) => void;
```

## Error Handling Contracts

### ErrorAction
```typescript
enum ErrorAction {
  OPEN_FILE = 'open-file',
  IGNORE_ERROR = 'ignore-error',
  RETRY_VALIDATION = 'retry-validation'
}
```

### ErrorSeverity
```typescript
enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}
```

## Command Contracts

VS Code commands exposed by the extension.

### shellTaskPipe.showTaskPicker
```typescript
/**
 * Show unified task picker interface
 * @command shellTaskPipe.showTaskPicker
 * @returns Promise<void>
 */
```

### shellTaskPipe.refreshTasks
```typescript
/**
 * Manually refresh task configurations
 * @command shellTaskPipe.refreshTasks
 * @returns Promise<void>
 */
```

### shellTaskPipe.validateConfigs
```typescript
/**
 * Validate all configuration files and show results
 * @command shellTaskPipe.validateConfigs
 * @returns Promise<void>
 */
```

### shellTaskPipe.openTaskConfig
```typescript
/**
 * Open task configuration file in editor
 * @command shellTaskPipe.openTaskConfig
 * @param source 'workspace' | 'user' - which config to open
 * @returns Promise<void>
 */
```

## Configuration Schema Contract

Extended VS Code tasks.json schema for cmdpipe functionality.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "version": {
      "type": "string",
      "enum": ["2.0.0"]
    },
    "tasks": {
      "type": "array",
      "items": {
        "allOf": [
          { "$ref": "vscode://schemas/tasks" },
          {
            "properties": {
              "cmdpipe": {
                "type": "object",
                "properties": {
                  "outputTarget": {
                    "$ref": "#/definitions/OutputTarget"
                  },
                  "insertMode": {
                    "type": "string",
                    "enum": ["cursor", "line-end", "new-line", "replace-selection"]
                  },
                  "errorHandling": {
                    "type": "string",
                    "enum": ["show-dialog", "log-only", "ignore"]
                  }
                }
              }
            }
          }
        ]
      }
    }
  },
  "definitions": {
    "OutputTarget": {
      "type": "object",
      "properties": {
        "mode": {
          "type": "string",
          "enum": ["cursor", "line-end", "new-line", "replace-selection"]
        },
        "format": {
          "type": "string",
          "enum": ["plain", "json", "xml", "formatted"]
        }
      },
      "required": ["mode"]
    }
  }
}
```