import * as vscode from 'vscode';
import { Logger, LogLevel } from './utils/logger';
import { errorHandler } from './utils/errorHandler';
import { ExtensionContext } from './types/extensionTypes';
import { CommandHandler } from './commands';

// Global extension context
let extensionContext: ExtensionContext;

/**
 * This method is called when the extension is activated
 * The extension is activated the very first time any command is executed
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const logger = Logger.getInstance('Shell Task Pipe');
    
    try {
        logger.info('Shell Task Pipe extension is being activated...');
        
        // Initialize extension context
        const outputChannel = vscode.window.createOutputChannel('Shell Task Pipe');
        extensionContext = {
            context,
            outputChannel
        };

        // Set up logging level based on configuration
        const config = vscode.workspace.getConfiguration('shellTaskPipe');
        const logLevel = config.get<string>('logLevel', 'info');
        logger.setLevel(getLogLevelFromString(logLevel));

        // Register all commands through unified command handler
        const commandHandler = CommandHandler.getInstance();
        commandHandler.registerAllCommands(context);
        
        // Add command handler to subscriptions for proper cleanup
        context.subscriptions.push(commandHandler);
        
        logger.info('Registered all shell task pipe commands');

        // Register extension cleanup
        context.subscriptions.push(
            outputChannel,
            logger,
            // Configuration change listener
            vscode.workspace.onDidChangeConfiguration(onConfigurationChanged)
        );

        logger.info('Shell Task Pipe extension activated successfully');
        
        // Show activation message for development
        if (process.env.NODE_ENV === 'development') {
            vscode.window.showInformationMessage('Shell Task Pipe extension activated!');
        }

    } catch (error) {
        logger.error('Failed to activate Shell Task Pipe extension', error as Error);
        await errorHandler.showError(
            error as Error,
            'Try reloading the window or reinstalling the extension'
        );
        throw error;
    }
}

/**
 * This method is called when the extension is deactivated
 */
export async function deactivate(): Promise<void> {
    const logger = Logger.getInstance();
    
    try {
        logger.info('Shell Task Pipe extension is being deactivated...');
        
        // Clean up any running tasks or watchers here
        // This will be expanded as we add more functionality
        
        logger.info('Shell Task Pipe extension deactivated successfully');
    } catch (error) {
        logger.error('Error during extension deactivation', error as Error);
    }
}

/**
 * Handle configuration changes
 */
function onConfigurationChanged(event: vscode.ConfigurationChangeEvent): void {
    const logger = Logger.getInstance();
    
    if (event.affectsConfiguration('shellTaskPipe')) {
        logger.info('Shell Task Pipe configuration changed');
        
        // Update log level if changed
        if (event.affectsConfiguration('shellTaskPipe.logLevel')) {
            const config = vscode.workspace.getConfiguration('shellTaskPipe');
            const logLevel = config.get<string>('logLevel', 'info');
            logger.setLevel(getLogLevelFromString(logLevel));
            logger.info(`Log level updated to: ${logLevel}`);
        }
        
        // Handle other configuration changes here as features are added
    }
}

/**
 * Convert string log level to LogLevel enum
 */
function getLogLevelFromString(level: string): LogLevel {
    switch (level.toLowerCase()) {
        case 'debug':
            return LogLevel.DEBUG;
        case 'info':
            return LogLevel.INFO;
        case 'warn':
        case 'warning':
            return LogLevel.WARN;
        case 'error':
            return LogLevel.ERROR;
        default:
            return LogLevel.INFO;
    }
}

/**
 * Get the current extension context
 * This is useful for other modules that need access to the context
 */
export function getExtensionContext(): ExtensionContext {
    if (!extensionContext) {
        throw new Error('Extension context not initialized. Extension may not be activated yet.');
    }
    return extensionContext;
}

/**
 * Check if the extension is currently active
 */
export function isExtensionActive(): boolean {
    return extensionContext !== undefined;
}

/**
 * Register a disposable with the extension context
 * This ensures proper cleanup when the extension is deactivated
 */
export function registerDisposable(disposable: vscode.Disposable): void {
    if (extensionContext) {
        extensionContext.context.subscriptions.push(disposable);
    }
}