import * as vscode from 'vscode';

/**
 * Log levels for the extension
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

/**
 * Logging categories for task picker automation features
 */
export enum LogCategory {
    GENERAL = 'General',
    TASK_DISCOVERY = 'TaskDiscovery',
    TASK_VALIDATION = 'TaskValidation',
    TASK_EXECUTION = 'TaskExecution',
    TRUST_VALIDATION = 'TrustValidation',
    FILE_WATCHING = 'FileWatching',
    CONFIGURATION = 'Configuration',
    USER_INTERFACE = 'UserInterface',
    ERROR_HANDLING = 'ErrorHandling',
    PERFORMANCE = 'Performance'
}

/**
 * Logger interface for extension-wide logging
 */
export interface ILogger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, error?: Error, ...args: any[]): void;
    setLevel(level: LogLevel): void;
    show?(preserveFocus?: boolean): void;
    dispose(): void;
}

/**
 * Basic logger implementation using VSCode output channel
 */
export class Logger implements ILogger {
    private static _instance: Logger;
    private _outputChannel: vscode.OutputChannel;
    private _logLevel: LogLevel = LogLevel.INFO;
    private _extensionName: string;

    private constructor(extensionName: string = 'CmdPipe: Run Task in Editor') {
        this._extensionName = extensionName;
        this._outputChannel = vscode.window.createOutputChannel(extensionName);
    }

    /**
     * Get the singleton logger instance
     */
    public static getInstance(extensionName?: string): Logger {
        if (!Logger._instance) {
            Logger._instance = new Logger(extensionName);
        }
        return Logger._instance;
    }

    /**
     * Set the minimum log level to display
     */
    public setLevel(level: LogLevel): void {
        this._logLevel = level;
        this.info(`Log level set to ${LogLevel[level]}`);
    }

    /**
     * Log debug message
     */
    public debug(message: string, ...args: any[]): void {
        if (this._logLevel <= LogLevel.DEBUG) {
            this.writeLog('DEBUG', message, args);
        }
    }

    /**
     * Log info message
     */
    public info(message: string, ...args: any[]): void {
        if (this._logLevel <= LogLevel.INFO) {
            this.writeLog('INFO', message, args);
        }
    }

    /**
     * Log warning message
     */
    public warn(message: string, ...args: any[]): void {
        if (this._logLevel <= LogLevel.WARN) {
            this.writeLog('WARN', message, args);
        }
    }

    /**
     * Log error message
     */
    public error(message: string, error?: Error, ...args: any[]): void {
        if (this._logLevel <= LogLevel.ERROR) {
            let errorDetails = '';
            if (error) {
                errorDetails = `\nError: ${error.message}`;
                if (error.stack) {
                    errorDetails += `\nStack: ${error.stack}`;
                }
            }
            this.writeLog('ERROR', message + errorDetails, args);
        }
    }

    /**
     * Show the output channel
     */
    public show(preserveFocus?: boolean): void {
        this._outputChannel.show(preserveFocus);
    }

    /**
     * Clear the output channel
     */
    public clear(): void {
        this._outputChannel.clear();
    }

    /**
     * Dispose of the logger resources
     */
    public dispose(): void {
        this._outputChannel.dispose();
    }

    /**
     * Write formatted log message to output channel
     */
    private writeLog(level: string, message: string, args: any[]): void {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ` | Args: ${JSON.stringify(args)}` : '';
        const logMessage = `[${timestamp}] [${level}] ${message}${formattedArgs}`;
        
        this._outputChannel.appendLine(logMessage);
        
        // Also log to console in development mode
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${this._extensionName}] ${logMessage}`);
        }
    }
}

/**
 * Create a scoped logger for specific modules
 */
export function createScopedLogger(scope: string): ILogger {
    const mainLogger = Logger.getInstance();
    
    return {
        debug: (message: string, ...args: any[]) => mainLogger.debug(`[${scope}] ${message}`, ...args),
        info: (message: string, ...args: any[]) => mainLogger.info(`[${scope}] ${message}`, ...args),
        warn: (message: string, ...args: any[]) => mainLogger.warn(`[${scope}] ${message}`, ...args),
        error: (message: string, error?: Error, ...args: any[]) => mainLogger.error(`[${scope}] ${message}`, error, ...args),
        setLevel: (level: LogLevel) => mainLogger.setLevel(level),
        show: (preserveFocus?: boolean) => mainLogger.show(preserveFocus),
        dispose: () => { /* Scoped loggers don't dispose the main logger */ }
    };
}

/**
 * Create a category-specific logger for task picker features
 */
export function createCategoryLogger(category: LogCategory): ILogger {
    return createScopedLogger(category);
}

/**
 * Pre-configured loggers for task picker automation features
 */
export const categoryLoggers = {
    general: createCategoryLogger(LogCategory.GENERAL),
    taskDiscovery: createCategoryLogger(LogCategory.TASK_DISCOVERY),
    taskValidation: createCategoryLogger(LogCategory.TASK_VALIDATION),
    taskExecution: createCategoryLogger(LogCategory.TASK_EXECUTION),
    trustValidation: createCategoryLogger(LogCategory.TRUST_VALIDATION),
    fileWatching: createCategoryLogger(LogCategory.FILE_WATCHING),
    configuration: createCategoryLogger(LogCategory.CONFIGURATION),
    userInterface: createCategoryLogger(LogCategory.USER_INTERFACE),
    errorHandling: createCategoryLogger(LogCategory.ERROR_HANDLING),
    performance: createCategoryLogger(LogCategory.PERFORMANCE)
};

/**
 * Convenient logging functions for quick use
 */
export const log = {
    debug: (message: string, ...args: any[]) => Logger.getInstance().debug(message, ...args),
    info: (message: string, ...args: any[]) => Logger.getInstance().info(message, ...args),
    warn: (message: string, ...args: any[]) => Logger.getInstance().warn(message, ...args),
    error: (message: string, error?: Error, ...args: any[]) => Logger.getInstance().error(message, error, ...args),
    show: (preserveFocus?: boolean) => Logger.getInstance().show(preserveFocus),
    clear: () => Logger.getInstance().clear()
};