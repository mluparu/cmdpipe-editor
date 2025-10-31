import * as vscode from 'vscode';
import { TaskScanner } from '../discovery/taskScanner';
import { TaskResolver } from '../discovery/taskResolver';
import { TaskValidator } from '../validation/taskValidator';
import { 
    TaskConfiguration, 
    TaskDefinition, 
    ValidationResult, 
    ValidationError 
} from '../types/configTypes';
import { Logger } from '../utils/logger';

/**
 * Callback type for configuration change notifications
 */
export type ConfigurationChangeCallback = (changedFiles: string[]) => void;

/**
 * TaskConfigManager handles the loading, caching, and management of task configurations
 * from both workspace and user sources. It coordinates with TaskScanner for discovery,
 * TaskResolver for conflict resolution, and TaskValidator for validation.
 */
export class TaskConfigManager {
    private readonly logger = Logger.getInstance();
    private readonly taskScanner: TaskScanner;
    private readonly taskResolver: TaskResolver;
    private readonly taskValidator: TaskValidator;
    
    private configurations: TaskConfiguration[] = [];
    private isWatching = false;
    private watcherDisposable?: vscode.Disposable;
    private changeCallback?: ConfigurationChangeCallback;

    constructor() {
        this.taskScanner = new TaskScanner();
        this.taskResolver = new TaskResolver();
        this.taskValidator = new TaskValidator();
    }

    /**
     * Load all task configurations from known sources
     * @returns Promise resolving to array of loaded configurations
     */
    async loadConfigurations(): Promise<TaskConfiguration[]> {
        try {
            this.logger.info('Loading task configurations from all sources');
            
            // Discover configurations from all sources
            this.configurations = await this.taskScanner.getAllTaskConfigurations();
            
            // Validate each configuration
            for (const config of this.configurations) {
                if (config.isValid) {
                    const validationResult = await this.validateConfiguration(config.filePath);
                    if (!validationResult.isValid) {
                        config.isValid = false;
                        config.errors.push(...validationResult.errors);
                    }
                }
            }

            this.logger.info(`Loaded ${this.configurations.length} task configurations`);
            
            // Log summary
            const validCount = this.configurations.filter(c => c.isValid).length;
            const invalidCount = this.configurations.length - validCount;
            
            if (invalidCount > 0) {
                this.logger.warn(`${invalidCount} configurations have validation errors`);
            }

            return this.configurations;
        } catch (error) {
            this.logger.error('Failed to load configurations', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Get currently loaded configurations without reloading
     * @returns Array of loaded configurations
     */
    getLoadedConfigurations(): TaskConfiguration[] {
        return [...this.configurations];
    }

    /**
     * Get all valid task definitions with conflict resolution applied
     * @returns Array of resolved task definitions
     */
    getResolvedTasks(): TaskDefinition[] {
        try {
            const resolvedTasks = this.taskResolver.resolveConflicts(this.configurations);
            this.logger.debug(`Resolved ${resolvedTasks.length} tasks after conflict resolution`);
            return resolvedTasks;
        } catch (error) {
            this.logger.error('Failed to resolve task conflicts', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }

    getTaskByName(taskName?: string): TaskDefinition | undefined {
        if (!taskName) {
            return undefined;
        }

        const resolvedTasks = this.getResolvedTasks();
        return resolvedTasks.find(task => task.name === taskName);
    }

    /**
     * Validate a configuration file against schema
     * @param filePath Absolute path to configuration file
     * @returns Validation result with errors if any
     */
    async validateConfiguration(filePath: string): Promise<ValidationResult> {
        try {
            return await this.taskValidator.validateFile(filePath);
        } catch (error) {
            this.logger.error(`Failed to validate configuration ${filePath}`, error instanceof Error ? error : new Error(String(error)));
            
            return {
                isValid: false,
                errors: [{
                    filePath,
                    message: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
                    code: 'VALIDATION_ERROR'
                }],
                warnings: []
            };
        }
    }

    /**
     * Start monitoring configuration files for changes
     * @param callback Function called when configurations change
     */
    startWatching(callback: ConfigurationChangeCallback): void {
        if (this.isWatching) {
            this.logger.debug('File watching already active');
            return;
        }

        try {
            this.changeCallback = callback;
            this.isWatching = true;

            // Create file watchers for configuration directories
            const watchers: vscode.Disposable[] = [];

            // Watch workspace .vscode directories
            if (vscode.workspace.workspaceFolders) {
                for (const folder of vscode.workspace.workspaceFolders) {
                    const vscodePattern = new vscode.RelativePattern(folder, '.vscode/tasks.json');
                    const watcher = vscode.workspace.createFileSystemWatcher(vscodePattern);
                    
                    watcher.onDidCreate(uri => this.handleFileChange([uri.fsPath]));
                    watcher.onDidChange(uri => this.handleFileChange([uri.fsPath]));
                    watcher.onDidDelete(uri => this.handleFileChange([uri.fsPath]));
                    
                    watchers.push(watcher);
                }
            }

            // Watch user configuration directory (if accessible)
            // Note: VS Code API limitations may prevent watching files outside workspace
            try {
                const userConfigPattern = new vscode.RelativePattern('~/.vscode/cmdpipe/tasks', '*.json');
                const userWatcher = vscode.workspace.createFileSystemWatcher(userConfigPattern);
                
                userWatcher.onDidCreate(uri => this.handleFileChange([uri.fsPath]));
                userWatcher.onDidChange(uri => this.handleFileChange([uri.fsPath]));
                userWatcher.onDidDelete(uri => this.handleFileChange([uri.fsPath]));
                
                watchers.push(userWatcher);
            } catch (error) {
                this.logger.debug('Could not set up user config file watching (expected limitation)');
            }

            // Combine all watchers into a single disposable
            this.watcherDisposable = {
                dispose: () => {
                    watchers.forEach(watcher => watcher.dispose());
                }
            };

            this.logger.info('Started file watching for task configurations');
        } catch (error) {
            this.logger.error('Failed to start file watching', error instanceof Error ? error : new Error(String(error)));
            this.isWatching = false;
        }
    }

    /**
     * Stop monitoring configuration files
     */
    stopWatching(): void {
        if (!this.isWatching) {
            return;
        }

        try {
            if (this.watcherDisposable) {
                this.watcherDisposable.dispose();
                this.watcherDisposable = undefined;
            }

            this.isWatching = false;
            this.changeCallback = undefined;

            this.logger.info('Stopped file watching for task configurations');
        } catch (error) {
            this.logger.error('Failed to stop file watching', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Get configuration errors for display to user
     * @returns Array of current validation errors
     */
    getValidationErrors(): ValidationError[] {
        const errors: ValidationError[] = [];
        
        for (const config of this.configurations) {
            if (!config.isValid) {
                errors.push(...config.errors);
            }
        }

        return errors;
    }

    /**
     * Refresh configurations by reloading from disk
     * @returns Promise resolving when refresh is complete
     */
    async refreshConfigurations(): Promise<void> {
        try {
            this.logger.info('Refreshing task configurations');
            await this.loadConfigurations();
            
            if (this.changeCallback) {
                // Get all configuration file paths for callback
                const filePaths = this.configurations.map(config => config.filePath);
                this.changeCallback(filePaths);
            }
        } catch (error) {
            this.logger.error('Failed to refresh configurations', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Handle file system changes
     * @param changedFiles Array of changed file paths
     */
    private async handleFileChange(changedFiles: string[]): Promise<void> {
        try {
            this.logger.debug(`File change detected: ${changedFiles.join(', ')}`);
            
            // Debounce multiple rapid changes
            await this.debounceFileChanges(changedFiles);
        } catch (error) {
            this.logger.error('Error handling file change', error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Debounce file changes to avoid excessive reloading
     * @param changedFiles Array of changed file paths
     */
    private async debounceFileChanges(changedFiles: string[]): Promise<void> {
        // Simple debouncing with a 500ms delay
        setTimeout(async () => {
            try {
                await this.refreshConfigurations();
            } catch (error) {
                this.logger.error('Error during debounced refresh', error instanceof Error ? error : new Error(String(error)));
            }
        }, 500);
    }

    /**
     * Dispose of resources
     */
    dispose(): void {
        this.stopWatching();
        this.configurations = [];
    }
}