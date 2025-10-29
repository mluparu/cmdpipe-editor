/**
 * Configuration-specific type definitions for task picker automation
 * 
 * This module contains types for configuration management, validation,
 * and task discovery functionality.
 */

import { IconPath } from "vscode";

/**
 * Enum representing the source location of a task configuration
 */
export enum TaskSource {
    /** Tasks from workspace .vscode folder */
    WORKSPACE = 'workspace',
    
    /** Tasks from user global configuration */
    USER = 'user'
}

/**
 * Interface representing a complete task configuration file
 */
export interface TaskConfiguration {
    /** Absolute path to the configuration file */
    filePath: string;
    
    /** Source location of this configuration */
    source: TaskSource;
    
    /** Whether the configuration is valid */
    isValid: boolean;
    
    /** File modification timestamp */
    lastModified: Date;
    
    /** Array of task definitions in this configuration */
    tasks: TaskDefinition[];
    
    /** Validation errors for this configuration */
    errors: ValidationError[];
}

/**
 * Interface representing a task definition with cmdpipe extensions
 */
export interface TaskDefinition {
    /** Unique task name within its source */
    name: string;
    
    /** Shell command to execute */
    command: string;
    
    /** Source location of this task */
    source: TaskSource;
    
    /** Path to the file containing this task */
    filePath: string;
    
    /** Human-readable description */
    description?: string;
    
    /** Task group (build, test, etc.) */
    group?: string;
    
    /** Command arguments */
    args?: string[];
    
    /** Task execution options */
    options?: TaskOptions;
    
    /** Output target for cmdpipe integration */
    outputTarget?: OutputTarget;
}

/**
 * Interface for task execution options
 */
export interface TaskOptions {
    /** Working directory for task execution */
    cwd?: string;
    
    /** Environment variables */
    env?: { [key: string]: string };
    
    /** Whether to run in background */
    background?: boolean;
    
    /** Shell to use for execution */
    shell?: boolean | string;
}

/**
 * Interface for cmdpipe output target configuration
 */
export interface OutputTarget {
    /** Target type (editor, terminal, file) */
    type: 'editor' | 'terminal' | 'file';
    
    /** Target location (file path, editor position) */
    location?: string;
    
    /** Whether to append or replace content */
    mode?: 'append' | 'replace';
    
    /** Output format options */
    format?: {
        /** Whether to include timestamps */
        timestamps?: boolean;
        
        /** Whether to include command echo */
        echo?: boolean;
    };
}

/**
 * Interface representing a task item for the picker UI
 */
export interface TaskPickerItem {
    /** Display label in picker */
    label: string;
    
    /** Secondary description text */
    description: string;
    
    /** Additional detail text */
    detail?: string;
    
    /** Associated task definition */
    task: TaskDefinition;
    
    /** Icon path or theme icon id */
    iconPath?: IconPath;
    
    /** Action buttons for the item */
    buttons?: Array<{
        iconPath: IconPath;
        tooltip: string;
        action: string;
    }>;
}

/**
 * Interface representing validation error details
 */
export interface ValidationError {
    /** Error message describing what went wrong */
    message: string;
    
    /** File path where the error occurred */
    filePath: string;
    
    /** Line number in the file (if applicable) */
    line?: number;
    
    /** Column number in the file (if applicable) */
    column?: number;
    
    /** JSON schema path where validation failed */
    schemaPath?: string;
    
    /** Error code for programmatic handling */
    code: string;
}

/**
 * Interface representing the result of validation
 */
export interface ValidationResult {
    /** Whether validation passed */
    isValid: boolean;
    
    /** Array of validation errors (empty if valid) */
    errors: ValidationError[];
    
    /** Warnings that don't prevent execution */
    warnings: ValidationError[];
}

/**
 * Enum representing possible error recovery actions
 */
export enum ErrorAction {
    /** Open the file in editor */
    OPEN_FILE = 'openFile',
    
    /** Show detailed error information */
    SHOW_DETAILS = 'showDetails',
    
    /** Ignore this error */
    IGNORE = 'ignore',
    
    /** Reload configuration */
    RELOAD = 'reload'
}

/**
 * Interface representing workspace trust status
 */
export interface TrustStatus {
    /** Whether the workspace is trusted */
    isTrusted: boolean;
    
    /** URI of the workspace being checked */
    workspaceUri: string;
    
    /** Timestamp when trust status was checked */
    checkedAt: Date;
}

/**
 * Interface for trust warning context
 */
export interface TrustWarningContext {
    /** The task that triggered the warning */
    taskName: string;
    
    /** Source of the untrusted task */
    source: TaskSource;
    
    /** File path of the configuration */
    filePath: string;
    
    /** Suggested actions for the user */
    suggestedActions: ErrorAction[];
}

/**
 * Interface for file watcher state
 */
export interface FileWatcherState {
    /** Whether the watcher is currently active */
    isActive: boolean;
    
    /** Set of files currently being watched */
    watchedFiles: Set<string>;
    
    /** Timestamp of last file change detected */
    lastChangeAt?: Date;
    
    /** Number of pending change events */
    pendingChanges: number;
}