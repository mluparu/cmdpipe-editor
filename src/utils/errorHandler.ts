import * as vscode from 'vscode';
import { SubstitutionFailureReason } from '../substitution/substitutionTypes';
import { ILogger, createScopedLogger } from './logger';

/**
 * Error types for the extension
 */
export enum ErrorType {
    CONFIGURATION = 'configuration',
    TASK_EXECUTION = 'task_execution',
    FILE_SYSTEM = 'file_system',
    PLATFORM = 'platform',
    VALIDATION = 'validation',
    TIMEOUT = 'timeout',
    PERMISSION = 'permission',
    TRUST = 'trust',
    DISCOVERY = 'discovery',
    SCHEMA_VALIDATION = 'schema_validation',
    FILE_WATCHING = 'file_watching',
    UNKNOWN = 'unknown'
}

/**
 * Base error class for extension-specific errors
 */
export class ShellTaskPipeError extends Error {
    public readonly type: ErrorType;
    public readonly code: string;
    public readonly details?: any;
    public readonly timestamp: Date;

    constructor(
        message: string,
        type: ErrorType = ErrorType.UNKNOWN,
        code?: string,
        details?: any
    ) {
        super(message);
        this.name = 'ShellTaskPipeError';
        this.type = type;
        this.code = code || type.toUpperCase();
        this.details = details;
        this.timestamp = new Date();
        
        // Maintains proper stack trace for where error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ShellTaskPipeError);
        }
    }

    /**
     * Get a user-friendly error message
     */
    public getUserMessage(): string {
        switch (this.type) {
            case ErrorType.CONFIGURATION:
                return `Configuration Error: ${this.message}`;
            case ErrorType.TASK_EXECUTION:
                return `Task Execution Failed: ${this.message}`;
            case ErrorType.FILE_SYSTEM:
                return `File System Error: ${this.message}`;
            case ErrorType.PLATFORM:
                return `Platform Error: ${this.message}`;
            case ErrorType.VALIDATION:
                return `Validation Error: ${this.message}`;
            case ErrorType.TIMEOUT:
                return `Timeout Error: ${this.message}`;
            case ErrorType.PERMISSION:
                return `Permission Error: ${this.message}`;
            case ErrorType.TRUST:
                return `Workspace Trust Error: ${this.message}`;
            case ErrorType.DISCOVERY:
                return `Task Discovery Error: ${this.message}`;
            case ErrorType.SCHEMA_VALIDATION:
                return `Schema Validation Error: ${this.message}`;
            case ErrorType.FILE_WATCHING:
                return `File Watching Error: ${this.message}`;
            default:
                return `Error: ${this.message}`;
        }
    }

    /**
     * Get detailed error information for logging
     */
    public getDetailedInfo(): any {
        return {
            message: this.message,
            type: this.type,
            code: this.code,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack,
            details: this.details
        };
    }
}

/**
 * Configuration-specific error
 */
export class ConfigurationError extends ShellTaskPipeError {
    constructor(message: string, details?: any) {
        super(message, ErrorType.CONFIGURATION, 'CONFIG_ERROR', details);
        this.name = 'ConfigurationError';
    }
}

/**
 * Task execution error
 */
export class TaskExecutionError extends ShellTaskPipeError {
    public readonly exitCode?: number;
    public readonly stdout?: string;
    public readonly stderr?: string;

    constructor(
        message: string,
        exitCode?: number,
        stdout?: string,
        stderr?: string,
        details?: any
    ) {
        super(message, ErrorType.TASK_EXECUTION, 'TASK_EXEC_ERROR', details);
        this.name = 'TaskExecutionError';
        this.exitCode = exitCode;
        this.stdout = stdout;
        this.stderr = stderr;
    }

    public getDetailedInfo(): any {
        return {
            ...super.getDetailedInfo(),
            exitCode: this.exitCode,
            stdout: this.stdout,
            stderr: this.stderr
        };
    }
}

/**
 * Timeout error
 */
export class TimeoutError extends ShellTaskPipeError {
    public readonly timeoutMs: number;

    constructor(message: string, timeoutMs: number, details?: any) {
        super(message, ErrorType.TIMEOUT, 'TIMEOUT_ERROR', details);
        this.name = 'TimeoutError';
        this.timeoutMs = timeoutMs;
    }
}

/**
 * Trust validation error for workspace security
 */
export class TrustError extends ShellTaskPipeError {
    public readonly workspaceUri: string;
    public readonly taskSource: string;

    constructor(message: string, workspaceUri: string, taskSource: string, details?: any) {
        super(message, ErrorType.TRUST, 'TRUST_ERROR', details);
        this.name = 'TrustError';
        this.workspaceUri = workspaceUri;
        this.taskSource = taskSource;
    }

    public getDetailedInfo(): any {
        return {
            ...super.getDetailedInfo(),
            workspaceUri: this.workspaceUri,
            taskSource: this.taskSource
        };
    }
}

/**
 * Task discovery error
 * TODO: Use this in the discovery code (taskScanner.ts)
 */
export class DiscoveryError extends ShellTaskPipeError {
    public readonly searchPath: string;
    public readonly fileCount: number;

    constructor(message: string, searchPath: string, fileCount: number = 0, details?: any) {
        super(message, ErrorType.DISCOVERY, 'DISCOVERY_ERROR', details);
        this.name = 'DiscoveryError';
        this.searchPath = searchPath;
        this.fileCount = fileCount;
    }

    public getDetailedInfo(): any {
        return {
            ...super.getDetailedInfo(),
            searchPath: this.searchPath,
            fileCount: this.fileCount
        };
    }
}

/**
 * Schema validation error with detailed location information
 */
export class SchemaValidationError extends ShellTaskPipeError {
    public readonly filePath: string;
    public readonly line?: number;
    public readonly column?: number;
    public readonly schemaPath?: string;

    constructor(
        message: string,
        filePath: string,
        line?: number,
        column?: number,
        schemaPath?: string,
        details?: any
    ) {
        super(message, ErrorType.SCHEMA_VALIDATION, 'SCHEMA_VALIDATION_ERROR', details);
        this.name = 'SchemaValidationError';
        this.filePath = filePath;
        this.line = line;
        this.column = column;
        this.schemaPath = schemaPath;
    }

    public getDetailedInfo(): any {
        return {
            ...super.getDetailedInfo(),
            filePath: this.filePath,
            line: this.line,
            column: this.column,
            schemaPath: this.schemaPath
        };
    }

    /**
     * Get a user-friendly location string
     */
    public getLocationString(): string {
        const parts = [this.filePath];
        if (this.line !== undefined) {
            parts.push(`line ${this.line}`);
            if (this.column !== undefined) {
                parts.push(`column ${this.column}`);
            }
        }
        return parts.join(', ');
    }
}

/**
 * File watching error
 */
export class FileWatchingError extends ShellTaskPipeError {
    public readonly watchPath: string;
    public readonly watcherCount: number;

    constructor(message: string, watchPath: string, watcherCount: number = 0, details?: any) {
        super(message, ErrorType.FILE_WATCHING, 'FILE_WATCHING_ERROR', details);
        this.name = 'FileWatchingError';
        this.watchPath = watchPath;
        this.watcherCount = watcherCount;
    }

    public getDetailedInfo(): any {
        return {
            ...super.getDetailedInfo(),
            watchPath: this.watchPath,
            watcherCount: this.watcherCount
        };
    }
}

/**
 * Error handler utility class
 */
export class ErrorHandler {
    private static _instance: ErrorHandler;
    private _logger: ILogger;

    private constructor() {
        this._logger = createScopedLogger('ErrorHandler');
    }

    public static getInstance(): ErrorHandler {
        if (!ErrorHandler._instance) {
            ErrorHandler._instance = new ErrorHandler();
        }
        return ErrorHandler._instance;
    }

    /**
     * Handle and log an error with optional user notification
     */
    public handleError(
        error: Error,
        context?: string,
        showToUser: boolean = true,
        suggestedAction?: string
    ): void {
        const contextInfo = context ? ` in ${context}` : '';
        this._logger.error(`Error occurred${contextInfo}`, error);

        if (showToUser) {
            this.showErrorToUser(error, suggestedAction);
        }
    }

    /**
     * Show error message to user via VSCode UI
     */
    public async showErrorToUser(error: Error, suggestedAction?: string): Promise<void> {
        let message = error.message;
        const actions: string[] = [];

        if (error instanceof ShellTaskPipeError) {
            message = error.getUserMessage();
        }

        if (suggestedAction) {
            actions.push(suggestedAction);
        }

        // Always provide option to view logs
        actions.push('View Logs');

        const selectedAction = await vscode.window.showErrorMessage(
            message,
            ...actions
        );

        if (selectedAction === 'View Logs') {
            if (this._logger.show) {
                this._logger.show();
            } else {
                // Fallback: use command to show output panel
                vscode.commands.executeCommand('workbench.action.output.toggleOutput');
            }
        }
    }

    /**
     * Show warning message to user
     */
    public async showWarning(
        message: string,
        actions?: string[]
    ): Promise<string | undefined> {
        this._logger.warn(message);
        return vscode.window.showWarningMessage(message, ...(actions || []));
    }

    /**
     * Show information message to user
     */
    public async showInfo(
        message: string,
        actions?: string[]
    ): Promise<string | undefined> {
        this._logger.info(message);
        return vscode.window.showInformationMessage(message, ...(actions || []));
    }

    /**
     * Wrap a function with error handling
     */
    public withErrorHandling<T>(
        fn: () => T | Promise<T>,
        context?: string,
        showToUser: boolean = true
    ): () => Promise<T | undefined> {
        return async (): Promise<T | undefined> => {
            try {
                return await fn();
            } catch (error) {
                this.handleError(error as Error, context, showToUser);
                return undefined;
            }
        };
    }

    /**
     * Create an error from unknown value (useful for catch blocks)
     */
    public createError(
        error: unknown,
        defaultMessage: string = 'An unknown error occurred',
        type: ErrorType = ErrorType.UNKNOWN
    ): ShellTaskPipeError {
        if (error instanceof ShellTaskPipeError) {
            return error;
        }

        if (error instanceof Error) {
            return new ShellTaskPipeError(error.message, type, undefined, {
                originalError: error.name,
                stack: error.stack
            });
        }

        return new ShellTaskPipeError(
            defaultMessage,
            type,
            undefined,
            { originalValue: error }
        );
    }

    /**
     * Validate and throw appropriate error if condition is not met
     */
    public assert(
        condition: boolean,
        message: string,
        type: ErrorType = ErrorType.VALIDATION
    ): void {
        if (!condition) {
            throw new ShellTaskPipeError(message, type);
        }
    }

    public createMissingEnvironmentVariableError(
        variableName: string,
        details?: Record<string, unknown>
    ): TaskExecutionError {
        return new TaskExecutionError(
            `Environment variable '${variableName}' is not defined`,
            undefined,
            undefined,
            undefined,
            {
                variableName,
                reason: SubstitutionFailureReason.MISSING_ENVIRONMENT,
                ...details
            }
        );
    }

    public createMissingConfigurationSettingError(
        settingKey: string,
        details?: Record<string, unknown>
    ): TaskExecutionError {
        return new TaskExecutionError(
            `Configuration setting '${settingKey}' is not defined`,
            undefined,
            undefined,
            undefined,
            {
                settingKey,
                reason: SubstitutionFailureReason.MISSING_CONFIG,
                ...details
            }
        );
    }
}

/**
 * Convenient error handling functions
 */
export const errorHandler = {
    handle: (error: Error, context?: string, showToUser?: boolean, suggestedAction?: string) =>
        ErrorHandler.getInstance().handleError(error, context, showToUser, suggestedAction),
    
    showError: (error: Error, suggestedAction?: string) =>
        ErrorHandler.getInstance().showErrorToUser(error, suggestedAction),
    
    showWarning: (message: string, actions?: string[]) =>
        ErrorHandler.getInstance().showWarning(message, actions),
    
    showInfo: (message: string, actions?: string[]) =>
        ErrorHandler.getInstance().showInfo(message, actions),
    
    withErrorHandling: <T>(fn: () => T | Promise<T>, context?: string, showToUser?: boolean) =>
        ErrorHandler.getInstance().withErrorHandling(fn, context, showToUser),
    
    createError: (error: unknown, defaultMessage?: string, type?: ErrorType) =>
        ErrorHandler.getInstance().createError(error, defaultMessage, type),
    
    assert: (condition: boolean, message: string, type?: ErrorType) =>
        ErrorHandler.getInstance().assert(condition, message, type),

    createMissingEnvironmentVariableError: (variableName: string, details?: Record<string, unknown>) =>
        ErrorHandler.getInstance().createMissingEnvironmentVariableError(variableName, details),

    createMissingConfigurationSettingError: (settingKey: string, details?: Record<string, unknown>) =>
        ErrorHandler.getInstance().createMissingConfigurationSettingError(settingKey, details)
};