import * as vscode from 'vscode';
import { TaskConfigManager } from '../config/taskConfigManager';
import { TaskPicker } from '../ui/taskPicker';
import { Logger } from '../utils/logger';

/**
 * TaskPickerCommands provides command handlers for task picker functionality.
 * This class manages the lifecycle of task pickers and coordinates between
 * the UI and configuration management.
 */
export class TaskPickerCommands implements vscode.Disposable {
    private readonly logger = Logger.getInstance();
    private readonly taskConfigManager: TaskConfigManager;
    private currentTaskPicker?: TaskPicker;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.taskConfigManager = new TaskConfigManager();
        this.registerCommands();
        this.setupFileWatching();
    }

    /**
     * Register all task picker related commands
     */
    private registerCommands(): void {
        // Main command to show task picker
        this.disposables.push(
            vscode.commands.registerCommand('cmdpipe.showTaskPicker', () => {
                this.showTaskPicker();
            })
        );

        // Command to refresh task configurations
        this.disposables.push(
            vscode.commands.registerCommand('cmdpipe.refreshTasks', () => {
                this.refreshTasks();
            })
        );

        // Command to create new workspace tasks.json
        this.disposables.push(
            vscode.commands.registerCommand('cmdpipe.createWorkspaceTasks', () => {
                this.createWorkspaceTasks();
            })
        );

        // Command to open user configuration directory
        this.disposables.push(
            vscode.commands.registerCommand('cmdpipe.openUserConfig', () => {
                this.openUserConfig();
            })
        );

        // Command to show task configuration errors
        this.disposables.push(
            vscode.commands.registerCommand('cmdpipe.showTaskErrors', () => {
                this.showTaskErrors();
            })
        );

        // Command to validate task configurations
        this.disposables.push(
            vscode.commands.registerCommand('cmdpipe.validateTaskConfigs', () => {
                this.validateTaskConfigurations();
            })
        );

        this.logger.info('Task picker commands registered');
    }

    /**
     * Set up file watching for automatic refresh
     */
    private setupFileWatching(): void {
        this.taskConfigManager.startWatching((changedFiles) => {
            this.logger.debug(`Configuration files changed: ${changedFiles.join(', ')}`);
            
            // Refresh current task picker if open
            if (this.currentTaskPicker) {
                this.currentTaskPicker.refresh();
            }

            // Show notification for significant changes
            if (changedFiles.length > 0) {
                vscode.window.showInformationMessage(
                    'Task configurations updated',
                    'Refresh Picker'
                ).then(action => {
                    if (action === 'Refresh Picker' && this.currentTaskPicker) {
                        this.currentTaskPicker.refresh();
                    }
                });
            }
        });
    }

    /**
     * Show the task picker interface
     */
    async showTaskPicker(): Promise<void> {
        try {
            this.logger.info('Showing task picker');

            // Dispose existing picker if any
            this.disposeCurrentPicker();

            // Create new task picker
            this.currentTaskPicker = new TaskPicker(this.taskConfigManager);
            
            // Show the picker
            await this.currentTaskPicker.show();

        } catch (error) {
            this.logger.error('Failed to show task picker', error instanceof Error ? error : new Error(String(error)));
            
            vscode.window.showErrorMessage(
                `Failed to show task picker: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Refresh task configurations and reload picker
     */
    async refreshTasks(): Promise<void> {
        try {
            this.logger.info('Refreshing task configurations');

            // Refresh configurations
            await this.taskConfigManager.refreshConfigurations();

            // Refresh current picker if open
            if (this.currentTaskPicker) {
                await this.currentTaskPicker.refresh();
            }

            vscode.window.showInformationMessage('Task configurations refreshed');

        } catch (error) {
            this.logger.error('Failed to refresh tasks', error instanceof Error ? error : new Error(String(error)));
            
            vscode.window.showErrorMessage(
                `Failed to refresh tasks: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Create new workspace tasks.json file
     */
    async createWorkspaceTasks(): Promise<void> {
        try {
            if (!vscode.workspace.workspaceFolders?.length) {
                vscode.window.showWarningMessage('No workspace folder is open');
                return;
            }

            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            const vscodeDir = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode');
            const tasksFile = vscode.Uri.joinPath(vscodeDir, 'tasks.json');
            var tasksFileExists = false;

            // Check if tasks.json already exists
            try {
                await vscode.workspace.fs.stat(tasksFile);
                tasksFileExists = true;
            } catch {
                // File doesn't exist, continue
            }

            // // In case we want to override the existing tasks.json file
            // if (tasksFileExists) {
            //     const overwrite = await vscode.window.showWarningMessage(
            //         'tasks.json already exists. Overwrite?',
            //         'Yes',
            //         'No'
            //     );
            //     if (overwrite !== 'Yes') {
            //         return;
            //     }
            // }

            if (!tasksFileExists)
            {
                // Create .vscode directory if needed
                try {
                    await vscode.workspace.fs.stat(vscodeDir);
                } catch {
                    await vscode.workspace.fs.createDirectory(vscodeDir);
                }

                // Create tasks template
                const tasksTemplate = {
                    version: '2.0.0',
                    tasks: [
                        {
                            label: 'echo',
                            type: 'shell',
                            command: 'echo',
                            args: ['Hello from cmdpipe task picker!'],
                            group: 'build',
                            presentation: {
                                echo: true,
                                reveal: 'always',
                                focus: false,
                                panel: 'shared'
                            },
                            problemMatcher: []
                        },
                        {
                            label: 'build',
                            type: 'shell',
                            command: 'npm',
                            args: ['run', 'build'],
                            group: {
                                kind: 'build',
                                isDefault: true
                            },
                            presentation: {
                                echo: true,
                                reveal: 'always',
                                focus: false,
                                panel: 'shared'
                            },
                            problemMatcher: ['$tsc']
                        }
                    ]
                };

                // Write the file
                await vscode.workspace.fs.writeFile(
                    tasksFile,
                    Buffer.from(JSON.stringify(tasksTemplate, null, 2))
                );

                this.logger.info(`Created workspace tasks.json at ${tasksFile.fsPath}`);
                vscode.window.showInformationMessage('Workspace tasks.json created successfully');
            }
            else
            {
                this.logger.info(`Workspace tasks.json already exists at ${tasksFile.fsPath}`);
                vscode.window.showInformationMessage('Opening existing tasks.json');
            }

            // Open for editing
            const document = await vscode.workspace.openTextDocument(tasksFile);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            this.logger.error('Failed to create workspace tasks', error instanceof Error ? error : new Error(String(error)));
            
            vscode.window.showErrorMessage(
                `Failed to create workspace tasks: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Open user configuration directory
     * TODO: Question whether we need a folder for tasks or just one file
     * TODO: Question if we want to use the same tasks.json file that VS Code uses.
     *       Since this extension does its own task invocation, it may not support 
     *       all features that VSCode does. Might want to stick with ~/.vscode/cmdpipe/tasks
     */
    async openUserConfig(): Promise<void> {
        try {
            const userConfigPath = this.getUserConfigPath();
            if (!userConfigPath) {
                vscode.window.showWarningMessage('Unable to determine user configuration directory');
                return;
            }

            const userConfigUri = vscode.Uri.file(userConfigPath);

            // Create directory if it doesn't exist
            try {
                await vscode.workspace.fs.stat(userConfigUri);
            } catch {
                await vscode.workspace.fs.createDirectory(userConfigUri);
                
                // Create example user tasks file
                const exampleTasksFile = vscode.Uri.joinPath(userConfigUri, 'example-tasks.json');
                const exampleTasks = {
                    version: '2.0.0',
                    tasks: [
                        {
                            label: 'user-echo',
                            type: 'shell',
                            command: 'echo',
                            args: ['Hello from user tasks!'],
                            group: 'build'
                        }
                    ]
                };

                await vscode.workspace.fs.writeFile(
                    exampleTasksFile,
                    Buffer.from(JSON.stringify(exampleTasks, null, 2))
                );
            }

            // Open directory in file explorer
            await vscode.commands.executeCommand('revealFileInOS', userConfigUri);

            this.logger.info(`Opened user config directory: ${userConfigPath}`);
            vscode.window.showInformationMessage('User configuration directory opened');

        } catch (error) {
            this.logger.error('Failed to open user config', error instanceof Error ? error : new Error(String(error)));
            
            vscode.window.showErrorMessage(
                `Failed to open user config: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Show task configuration errors
     */
    async showTaskErrors(): Promise<void> {
        try {
            await this.taskConfigManager.loadConfigurations();
            const errors = this.taskConfigManager.getValidationErrors();

            if (errors.length === 0) {
                vscode.window.showInformationMessage('No task configuration errors found');
                return;
            }

            // Show errors in output channel
            this.logger.show();
            this.logger.info('=== Task Configuration Errors ===');
            
            for (const error of errors) {
                this.logger.error(
                    `${error.filePath}:${error.line || '?'}:${error.column || '?'} - ${error.message}`,
                    undefined
                );
            }

            vscode.window.showErrorMessage(
                `Found ${errors.length} task configuration error(s). Check output for details.`,
                'Open Output'
            ).then(action => {
                if (action === 'Open Output') {
                    this.logger.show();
                }
            });

        } catch (error) {
            this.logger.error('Failed to check task errors', error instanceof Error ? error : new Error(String(error)));
            
            vscode.window.showErrorMessage(
                `Failed to check task errors: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Validate all task configurations
     */
    async validateTaskConfigurations(): Promise<void> {
        try {
            this.logger.info('Validating all task configurations');

            await this.taskConfigManager.loadConfigurations();
            const configurations = this.taskConfigManager.getLoadedConfigurations();
            const errors = this.taskConfigManager.getValidationErrors();

            const validCount = configurations.filter(c => c.isValid).length;
            const totalCount = configurations.length;

            if (errors.length === 0) {
                vscode.window.showInformationMessage(
                    `All ${totalCount} task configuration(s) are valid`
                );
            } else {
                vscode.window.showWarningMessage(
                    `${validCount}/${totalCount} task configurations are valid. ${errors.length} error(s) found.`,
                    'Show Errors'
                ).then(action => {
                    if (action === 'Show Errors') {
                        this.showTaskErrors();
                    }
                });
            }

            this.logger.info(`Validation complete: ${validCount}/${totalCount} valid configurations`);

        } catch (error) {
            this.logger.error('Failed to validate configurations', error instanceof Error ? error : new Error(String(error)));
            
            vscode.window.showErrorMessage(
                `Validation failed: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Get user configuration directory path
     */
    private getUserConfigPath(): string | null {
        try {
            const userDataPath = process.env.APPDATA || 
                                process.env.HOME || 
                                process.env.USERPROFILE;
            
            if (!userDataPath) {
                return null;
            }

            return require('path').join(userDataPath, '.vscode', 'cmdpipe', 'tasks');
        } catch {
            return null;
        }
    }

    /**
     * Dispose current task picker if any
     */
    private disposeCurrentPicker(): void {
        if (this.currentTaskPicker) {
            this.currentTaskPicker.dispose();
            this.currentTaskPicker = undefined;
        }
    }

    /**
     * Dispose all resources
     */
    dispose(): void {
        this.disposeCurrentPicker();
        this.taskConfigManager.stopWatching();
        this.taskConfigManager.dispose();
        
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];

        this.logger.info('Task picker commands disposed');
    }
}