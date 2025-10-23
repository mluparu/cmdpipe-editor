// Type definitions for VSCode extension integration
import * as vscode from 'vscode';
import { TaskDefinition, TaskExecutionResult } from './taskTypes';

export interface ExtensionContext {
    /** VSCode extension context */
    context: vscode.ExtensionContext;
    
    /** Output channel for logging */
    outputChannel: vscode.OutputChannel;
    
    /** Configuration manager */
    configManager?: any;
    
    /** Command registry */
    commandRegistry?: any;
}

export interface CommandRegistration {
    /** Command identifier */
    commandId: string;
    
    /** Associated task definition */
    task: TaskDefinition;
    
    /** VSCode disposable for cleanup */
    disposable: vscode.Disposable;
}

export interface EditorInfo {
    /** Active text editor */
    editor: vscode.TextEditor;
    
    /** Current cursor position */
    cursorPosition: vscode.Position;
    
    /** Current selection */
    selection: vscode.Selection;
    
    /** Whether editor is readonly */
    isReadonly: boolean;
    
    /** Document URI */
    documentUri: vscode.Uri;
}

export interface InsertionResult {
    /** Whether insertion was successful */
    success: boolean;
    
    /** Number of characters inserted */
    charactersInserted: number;
    
    /** The actual text that was inserted (after processing) */
    insertedText?: string;
    
    /** The insertion mode that was used */
    insertionMode?: string;
    
    /** New cursor position after insertion */
    newCursorPosition?: vscode.Position;
    
    /** Error message if insertion failed */
    error?: string;
}

export interface PlatformInfo {
    /** Operating system platform */
    platform: 'win32' | 'darwin' | 'linux';
    
    /** Default shell for the platform */
    defaultShell: string;
    
    /** Shell executable path */
    shellPath: string;
    
    /** Shell arguments */
    shellArgs: string[];
    
    /** Path separator for the platform */
    pathSeparator: string;
    
    /** Environment variable name for PATH */
    pathEnvVar: string;
}

export interface ErrorInfo {
    /** Error type */
    type: 'validation' | 'execution' | 'editor' | 'system';
    
    /** Error message */
    message: string;
    
    /** Detailed error information */
    details?: string;
    
    /** Associated task (if applicable) */
    task?: TaskDefinition;
    
    /** Stack trace (if applicable) */
    stack?: string;
}