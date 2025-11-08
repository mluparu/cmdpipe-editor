// Type definitions for VSCode extension integration
import * as vscode from 'vscode';
import { TaskDefinition, TaskExecutionResult } from './taskTypes';

export enum InsertionMode {
    /** Insert at current cursor position */
    CURSOR = 'cursor',
    /** Replace currently selected text */
    REPLACE_SELECTION = 'replace-selection',
    /** Show in VS Code output panel */
    OUTPUT_PANEL = 'output-panel',
    /** Append to current line */
    APPEND_LINE = 'append-line',
    /** Ask user for insertion preference */
    PROMPT = 'prompt' // TODO: Handle prompt mode in insertion logic
}

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
    
    /** VSCode disposable for cleanup */
    disposable: vscode.Disposable;
    
    /** Command handler function */
    handler: (...args: any[]) => any;
    
    /** Command metadata */
    metadata: CommandMetadata;
}

export type CommandRegistry = Map<string, CommandRegistration>;

export interface CommandMetadata {
    /** Human-readable command title */
    title: string;
    
    /** Command category for organization */
    category: string;
    
    /** Optional command description */
    description?: string;
    
    /** Optional when clause for conditional availability */
    when?: string;
    
    /** Optional icon identifier */
    icon?: string;
    
    /** Optional keyboard shortcut */
    shortcut?: string;
}

// export interface EditorInfo {
//     /** Active text editor */
//     editor: vscode.TextEditor;
    
//     /** Current cursor position */
//     cursorPosition: vscode.Position;
    
//     /** Current selection */
//     selection: vscode.Selection;
    
//     /** Whether editor is readonly */
//     isReadonly: boolean;
    
//     /** Document URI */
//     documentUri: vscode.Uri;
// }

export interface OutputInsertionContext {
    /** URI of the active editor */
    editorUri: vscode.Uri;
    
    /** Current cursor position */
    cursorPosition: vscode.Position;
    
    /** Currently selected text range */
    selectedRange?: vscode.Range;
    
    /** How to insert the output */
    insertionMode: InsertionMode;
    
    /** Whether the editor is read-only */
    isReadonly: boolean;
    
    /** Programming language of the editor */
    language: string;
    
    /** Whether an editor is currently active */
    hasActiveEditor: boolean;
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

    /** VS Code terminal profile identifier when detection originates from profiles */
    profileId?: string;

    /** Optional VS Code profile source metadata (e.g., PowerShell, Command Prompt) */
    profileSource?: string;

    /** Diagnostics collected while resolving the platform */
    diagnostics?: string[];
}

// export interface ErrorInfo {
//     /** Error type */
//     type: 'validation' | 'execution' | 'editor' | 'system';
    
//     /** Error message */
//     message: string;
    
//     /** Detailed error information */
//     details?: string;
    
//     /** Associated task (if applicable) */
//     task?: TaskDefinition;
    
//     /** Stack trace (if applicable) */
//     stack?: string;
// }