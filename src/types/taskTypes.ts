// Type definitions for shell task configurations and execution

export type TaskCategory = 'file-system' | 'utility' | 'system' | 'development' | 'network' | 'custom';
export type OutputFormat = 'raw' | 'json' | 'xml' | 'csv' | 'formatted';

export interface TaskDefinition {
    /** Unique identifier for the task */
    id: string;
    
    /** Display name shown in command palette */
    name: string;
    
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
    output: string;
    
    /** Standard error from the command */
    stderr?: string;
    
    /** Exit code of the command */
    exitCode: number;
    
    /** Task ID that was executed */
    taskId: string;
    
    /** Time taken to execute in milliseconds */
    executionTime: number;
    
    /** Error message if execution failed */
    error?: string;
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