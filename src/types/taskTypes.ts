// Type definitions for shell task configurations and execution

import { TaskSource, ValidationError } from './configTypes';

export type TaskCategory = 'file-system' | 'utility' | 'system' | 'development' | 'network' | 'custom';
// export type OutputFormat = 'raw' | 'json' | 'xml' | 'csv' | 'formatted';

export interface TaskDefinition {
    /** Unique identifier for the task */
    id: string;
    
    /** Display name shown in command palette */
    name: string;

    /** Source classification for trust and UI handling */
    source?: TaskSource;
    
    /** Brief description of what the task does */
    description?: string;
    
    /** Shell command to execute */
    command: string;
    
    /** Arguments to pass to the command (optional) */
    args?: string[];
    
    /** Working directory for command execution (optional) */
    workingDirectory?: string;
    
    /** Environment variables for command execution (optional) */
    environmentVariables?: Record<string, string>;
    
    /** Timeout in milliseconds (optional, defaults to global setting) */
    timeout?: number;
    
    /** Category for organizing tasks */
    category?: TaskCategory;
    
    /** Tags for searching and filtering */
    tags?: string[];
    
    /** Platforms this task is compatible with */
    platforms?: ('win32' | 'darwin' | 'linux')[];
    
    /** Shell-specific configuration */
    shell?: {
        /** Custom shell executable path */
        executable?: string;
        /** Custom shell arguments */
        args?: string[];
    };
    
    /** Output processing options */
    outputProcessing?: {
        /** Whether to trim leading/trailing whitespace */
        trimWhitespace?: boolean;
        /** Character encoding for output */
        encoding?: string;
        /** Maximum length of output to capture */
        maxOutputLength?: number;
    };
    
    /** Optional keyboard shortcut for the task */
    keybinding?: string;
    
    /** VSCode icon identifier for the task */
    icon?: string;
    
    /** Whether to show command execution in terminal (optional) */
    showInTerminal?: boolean;
}

export interface TaskConfiguration {
    /** Version of the configuration schema */
    version: string;
    
    /** Array of task definitions */
    tasks: TaskDefinition[];
    
    /** Global settings for all tasks */
    settings?: {
        /** Default timeout for all tasks */
        defaultTimeout?: number;
        
        /** Default working directory */
        defaultCwd?: string;
        
        /** Global environment variables */
        globalEnv?: Record<string, string>;
    };
}

export interface TaskExecutionResult {
    /** Whether the task executed successfully */
    success: boolean;
    
    /** Standard output from the command */
    output: Buffer;
    // TODO: Make this output binary always and handle encoding in OutputProcessor
    
    /** Standard error from the command */
    stderr?: Buffer;
    
    /** Exit code of the command */
    exitCode: number;
    
    /** Task ID that was executed */
    taskId: string;
    
    /** Time taken to execute in milliseconds */
    executionTime: number;
    
    /** Error message if execution failed */
    error?: string;
    
    /** Whether output contains binary data */
    isBinary: boolean;
    
    /** Path to temporary file if binary data was saved */
    tempFilePath?: string;
    
    /** Whether execution was cancelled by user */
    cancelled: boolean;
}

export interface TaskExecutionContext {
    /** The task definition being executed */
    task: TaskDefinition;
    
    /** Current cursor position in active editor */
    cursorPosition?: {
        line: number;
        character: number;
    };
    
    /** Current text selection in active editor */
    selection?: {
        start: { line: number; character: number };
        end: { line: number; character: number };
        text: string;
    };
    
    /** Whether the active editor is readonly */
    isReadonly: boolean;
    
    /** Path to the active document */
    documentPath?: string;
}

// /**
//  * Extended task definition for task picker automation
//  * Includes metadata for discovery, validation, and trust checking
//  */
// export interface ExtendedTaskDefinition extends TaskDefinition {
//     /** Source location where this task was discovered */
//     source: TaskSource;
    
//     /** File path of the configuration file containing this task */
//     filePath: string;
    
//     /** Whether this task is from a trusted source */
//     isTrusted: boolean;
    
//     /** Validation errors for this specific task */
//     validationErrors: ValidationError[];
    
//     /** Last modified timestamp of the source file */
//     lastModified: Date;
    
//     /** Hash of the task definition for change detection */
//     hash: string;
// }

// /**
//  * Complete task configuration file representation
//  * Used by TaskConfigManager for file-based task discovery
//  */
// export interface TaskConfigurationFile {
//     /** Absolute path to the configuration file */
//     filePath: string;
    
//     /** Source location (workspace or user) */
//     source: TaskSource;
    
//     /** Whether the file passed validation */
//     isValid: boolean;
    
//     /** File modification timestamp */
//     lastModified: Date;
    
//     /** Raw task definitions from the file */
//     tasks: ExtendedTaskDefinition[];
    
//     /** File-level validation errors */
//     errors: ValidationError[];
    
//     /** File content hash for change detection */
//     contentHash: string;
// }

// /**
//  * Task picker item for UI display
//  * Combines task definition with display metadata
//  */
// export interface TaskPickerItem {
//     /** The task definition */
//     task: ExtendedTaskDefinition;
    
//     /** Display label for the picker */
//     label: string;
    
//     /** Description shown in picker */
//     description: string;
    
//     /** Detail text (file path, source info) */
//     detail: string;
    
//     /** VS Code icon identifier */
//     iconPath?: string;
    
//     /** Whether item should be pre-selected */
//     picked?: boolean;
    
//     /** Whether item is disabled (untrusted) */
//     disabled?: boolean;
    
//     /** Tooltip text for disabled items */
//     tooltip?: string;
// }

// /**
//  * Options for task discovery and scanning
//  */
// export interface TaskDiscoveryOptions {
//     /** Whether to include workspace tasks */
//     includeWorkspace: boolean;
    
//     /** Whether to include user global tasks */
//     includeUser: boolean;
    
//     /** Whether to validate discovered tasks */
//     validateTasks: boolean;
    
//     /** Whether to check workspace trust */
//     checkTrust: boolean;
    
//     /** Maximum time to spend on discovery (ms) */
//     timeout?: number;
    
//     /** Whether to refresh cached results */
//     forceRefresh?: boolean;
// }