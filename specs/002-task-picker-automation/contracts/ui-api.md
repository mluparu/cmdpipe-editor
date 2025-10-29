# User Interface API Contract

**Version**: 1.0.0  
**Purpose**: Define interfaces for user-facing components with accessibility support

## ITaskPickerUI

Main task picker interface with comprehensive accessibility support.

```typescript
interface ITaskPickerUI {
  /**
   * Show task picker with keyboard navigation and screen reader support
   * @param tasks Available task definitions
   * @param options Picker configuration options
   * @returns Promise resolving to selected task or undefined
   */
  show(tasks: TaskDefinition[], options?: TaskPickerOptions): Promise<TaskDefinition | undefined>;

  /**
   * Update picker items while maintaining focus and selection state
   * @param tasks Updated task definitions
   */
  update(tasks: TaskDefinition[]): void;

  /**
   * Close picker and clean up resources
   */
  dispose(): void;
}

interface TaskPickerOptions {
  /** Placeholder text for picker input */
  placeholder?: string;
  
  /** Initial filter text */
  value?: string;
  
  /** Show source indicators (workspace/user icons) */
  showSourceIndicators?: boolean;
  
  /** Enable/disable untrusted workspace tasks */
  respectTrust?: boolean;
  
  /** Custom title for picker window */
  title?: string;
  
  /** Accessibility label for screen readers */
  ariaLabel?: string;
}
```

## IErrorDialogUI

Error recovery dialog with accessible action buttons.

```typescript
interface IErrorDialogUI {
  /**
   * Show error dialog with actionable recovery options
   * @param error Validation error details
   * @param options Dialog configuration
   * @returns Promise resolving to selected action
   */
  showErrorDialog(error: ValidationError, options?: ErrorDialogOptions): Promise<ErrorAction>;

  /**
   * Show batch error dialog for multiple configuration issues
   * @param errors Array of validation errors
   * @returns Promise resolving to batch action choice
   */
  showBatchErrorDialog(errors: ValidationError[]): Promise<BatchErrorAction>;
}

interface ErrorDialogOptions {
  /** Dialog title text */
  title?: string;
  
  /** Show detailed error information */
  showDetails?: boolean;
  
  /** Available action buttons */
  actions?: ErrorAction[];
  
  /** Default action for Enter key */
  defaultAction?: ErrorAction;
  
  /** Accessibility description */
  ariaDescription?: string;
}
```

## ITrustWarningUI

Security warning interface for untrusted workspace scenarios.

```typescript
interface ITrustWarningUI {
  /**
   * Show security warning for workspace trust violations
   * @param context Trust violation context
   * @returns Promise resolving to user response
   */
  showTrustWarning(context: TrustWarningContext): Promise<TrustWarningAction>;

  /**
   * Show trust status indicator in status bar
   * @param trusted Current workspace trust status
   */
  updateTrustIndicator(trusted: boolean): void;
}

interface TrustWarningContext {
  /** Task that cannot be executed */
  task: TaskDefinition;
  
  /** Reason for trust requirement */
  reason: string;
  
  /** Available user actions */
  availableActions: TrustWarningAction[];
  
  /** Show trust management UI link */
  showTrustManagement?: boolean;
}
```

## Task Picker Item Contract

Standardized task representation for consistent UI display.

```typescript
interface TaskPickerItem extends QuickPickItem {
  /** Primary display text (task name + group) */
  label: string;
  
  /** Secondary text with source and trust info */
  description: string;
  
  /** Additional details (command preview) */
  detail?: string;
  
  /** Associated task definition */
  task: TaskDefinition;
  
  /** Source indicator icon */
  iconPath?: ThemeIcon | { light: Uri; dark: Uri };
  
  /** Action buttons for task management */
  buttons?: QuickInputButton[];
  
  /** Accessibility label for screen readers */
  ariaLabel?: string;
  
  /** Whether task is currently executable */
  enabled: boolean;
  
  /** Tooltip text for hover information */
  tooltip?: string;
}
```

## Status Bar Integration

```typescript
interface IStatusBarProvider {
  /**
   * Show task count in status bar
   * @param count Number of available tasks
   * @param errors Number of configuration errors
   */
  updateTaskStatus(count: number, errors: number): void;

  /**
   * Show workspace trust status indicator
   * @param trusted Whether workspace is trusted
   */
  updateTrustStatus(trusted: boolean): void;

  /**
   * Show temporary status message
   * @param message Status text to display
   * @param timeout Auto-hide timeout in milliseconds
   */
  showTemporaryStatus(message: string, timeout?: number): void;
}
```

## Accessibility Requirements

### Keyboard Navigation
- **Tab/Shift+Tab**: Navigate between UI elements
- **Enter/Space**: Activate buttons and select items
- **Escape**: Close dialogs and pickers
- **Arrow Keys**: Navigate picker items
- **Ctrl+A**: Select all in multi-select contexts

### Screen Reader Support
- **ARIA Labels**: All interactive elements have descriptive labels
- **Role Attributes**: Proper semantic roles for UI components
- **Live Regions**: Status updates announced to screen readers
- **Focus Management**: Logical focus order and trap in modals

### Visual Accessibility
- **High Contrast**: Support for high contrast themes
- **Font Scaling**: Respect user font size preferences
- **Color Independence**: Information not conveyed by color alone
- **Focus Indicators**: Clear visual focus indicators

## UI Text Contract

Standardized text strings for consistent user experience.

```typescript
interface UITextContract {
  // Task Picker
  PICKER_PLACEHOLDER: "Search tasks by name or command...";
  PICKER_TITLE: "Select Shell Task";
  PICKER_NO_TASKS: "No tasks available";
  PICKER_LOADING: "Loading task configurations...";
  
  // Source Indicators
  SOURCE_WORKSPACE: "Workspace Task";
  SOURCE_USER: "User Task";
  TRUST_REQUIRED: "Requires Trusted Workspace";
  TRUST_BLOCKED: "Blocked by Workspace Trust";
  
  // Error Dialog
  ERROR_DIALOG_TITLE: "Task Configuration Error";
  ERROR_OPEN_FILE: "Open Configuration File";
  ERROR_IGNORE: "Ignore Error";
  ERROR_RETRY: "Retry Validation";
  
  // Trust Warning
  TRUST_WARNING_TITLE: "Workspace Trust Required";
  TRUST_WARNING_MESSAGE: "This task requires a trusted workspace to execute safely.";
  TRUST_MANAGE: "Manage Workspace Trust";
  TRUST_CANCEL: "Cancel Task";
  
  // Status Messages
  STATUS_TASKS_LOADED: "{count} tasks loaded";
  STATUS_VALIDATION_ERRORS: "{count} configuration errors";
  STATUS_TRUST_CHANGED: "Workspace trust status changed";
}
```

## Theme Integration

Support for VS Code theme customization.

```typescript
interface IThemeProvider {
  /**
   * Get theme-appropriate icons for task sources
   * @param source Task source type
   * @returns Theme icon or icon paths
   */
  getSourceIcon(source: TaskSource): ThemeIcon | { light: Uri; dark: Uri };

  /**
   * Get color for trust status indicators
   * @param trusted Whether workspace is trusted
   * @returns Theme color identifier
   */
  getTrustColor(trusted: boolean): ThemeColor;

  /**
   * Get error severity icon
   * @param severity Error severity level
   * @returns Appropriate warning/error icon
   */
  getErrorIcon(severity: ErrorSeverity): ThemeIcon;
}
```

## Command Palette Integration

```typescript
interface ICommandProvider {
  /**
   * Register commands for Command Palette integration
   * @param context Extension context for command registration
   */
  registerCommands(context: ExtensionContext): void;

  /**
   * Update command enablement based on current state
   * @param state Current extension state
   */
  updateCommandStates(state: ExtensionState): void;
}
```