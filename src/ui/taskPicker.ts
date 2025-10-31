import * as vscode from 'vscode';
import { TaskConfigManager } from '../config/taskConfigManager';
import { TaskDefinition, TaskSource, TaskPickerItem, ValidationError } from '../types/configTypes';
import { Logger } from '../utils/logger';
import { ThemeIcon } from 'vscode';

/**
 * TaskPicker provides a VS Code QuickPick interface for selecting tasks
 * from both workspace and user configurations. It integrates with TaskConfigManager
 * to provide real-time task discovery and validation error reporting.
 * 
 * The picker returns the selected task to the caller for execution,
 * allowing for centralized handling of output insertion.
 */
export class TaskPicker implements vscode.Disposable {
    private readonly logger = Logger.getInstance();
    private quickPick?: vscode.QuickPick<TaskPickerItem | vscode.QuickPickItem>;
    private disposables: vscode.Disposable[] = [];
    private resolveSelection?: (task: TaskDefinition | undefined) => void;

    constructor(private readonly taskConfigManager: TaskConfigManager) {}

    /**
     * Show the task picker interface and return selected task
     * @returns Promise that resolves with selected task or undefined if cancelled
     */
    async showAndSelectTask(): Promise<TaskDefinition | undefined> {
        return new Promise<TaskDefinition | undefined>(async (resolve) => {
            this.resolveSelection = resolve;
            
            try {
                // Load latest configurations
                await this.taskConfigManager.loadConfigurations();

                // Check for validation errors first
                const validationErrors = this.taskConfigManager.getValidationErrors();
                if (validationErrors.length > 0) {
                    await this.showValidationErrors(validationErrors);
                }

                // Get resolved tasks
                const tasks = this.taskConfigManager.getResolvedTasks();
                
                if (tasks.length === 0) {
                    await this.showNoTasksMessage();
                    resolve(undefined);
                    return;
                }

                // Create and configure quick pick
                this.createQuickPickForSelection();
                if (!this.quickPick) {
                    throw new Error('Failed to create QuickPick');
                }

                // Populate with tasks
                this.populateTaskItems(tasks);

                // Show the picker
                this.quickPick.show();

                this.logger.info(`Displayed task picker with ${tasks.length} tasks for selection`);
            } catch (error) {
                this.logger.error('Failed to show task picker', error instanceof Error ? error : new Error(String(error)));
                
                vscode.window.showErrorMessage(
                    `Failed to load task configurations: ${error instanceof Error ? error.message : String(error)}`
                );
                resolve(undefined);
            }
        });
    }

    // /**
    //  * Show the task picker interface (legacy method for compatibility)
    //  * @returns Promise that resolves when picker is closed
    //  */
    // async show(): Promise<void> {
    //     try {
    //         // Load latest configurations
    //         await this.taskConfigManager.loadConfigurations();

    //         // Check for validation errors first
    //         const validationErrors = this.taskConfigManager.getValidationErrors();
    //         if (validationErrors.length > 0) {
    //             await this.showValidationErrors(validationErrors);
    //         }

    //         // Get resolved tasks
    //         const tasks = this.taskConfigManager.getResolvedTasks();
            
    //         if (tasks.length === 0) {
    //             await this.showNoTasksMessage();
    //             return;
    //         }

    //         // Create and configure quick pick
    //         this.createQuickPick();
    //         if (!this.quickPick) {
    //             throw new Error('Failed to create QuickPick');
    //         }

    //         // Populate with tasks
    //         this.populateTaskItems(tasks);

    //         // Show the picker
    //         this.quickPick.show();

    //         this.logger.info(`Displayed task picker with ${tasks.length} tasks`);
    //     } catch (error) {
    //         this.logger.error('Failed to show task picker', error instanceof Error ? error : new Error(String(error)));
            
    //         vscode.window.showErrorMessage(
    //             `Failed to load task configurations: ${error instanceof Error ? error.message : String(error)}`
    //         );
    //     }
    // }

    // /**
    //  * Refresh the task picker with latest configurations
    //  * @returns Promise that resolves when refresh is complete
    //  */
    // async refresh(): Promise<void> {
    //     try {
    //         if (!this.quickPick) {
    //             return;
    //         }

    //         // Reload configurations
    //         await this.taskConfigManager.loadConfigurations();
    //         const tasks = this.taskConfigManager.getResolvedTasks();

    //         // Update picker items
    //         this.populateTaskItems(tasks);

    //         this.logger.debug('Task picker refreshed');
    //     } catch (error) {
    //         this.logger.error('Failed to refresh task picker', error instanceof Error ? error : new Error(String(error)));
    //     }
    // }

    // /**
    //  * Create and configure the VS Code QuickPick
    //  */
    // private createQuickPick(): void {
    //     this.quickPick = vscode.window.createQuickPick<TaskPickerItem>();
        
    //     this.quickPick.title = 'Select Task';
    //     this.quickPick.placeholder = 'Choose a task to execute';
    //     this.quickPick.matchOnDescription = true;
    //     this.quickPick.matchOnDetail = true;

    //     // Handle task selection
    //     this.quickPick.onDidAccept(() => {
    //         const selectedItem = this.quickPick?.selectedItems[0];
    //         if (selectedItem && 'task' in selectedItem) {
    //             this.executeTask((selectedItem as TaskPickerItem).task);
    //             this.quickPick?.hide();
    //         }
    //     });

    //     // Handle picker close
    //     this.quickPick.onDidHide(() => {
    //         this.dispose();
    //     });

    //     // Handle search/filter changes
    //     this.quickPick.onDidChangeValue((value) => {
    //         // The built-in filtering handles this automatically
    //         // We could implement custom filtering logic here if needed
    //     });

    //     // Store disposable for cleanup
    //     this.disposables.push(this.quickPick);
    // }

    /**
     * Create and configure the VS Code QuickPick for task selection (returns selected task)
     */
    private createQuickPickForSelection(): void {
        this.quickPick = vscode.window.createQuickPick<TaskPickerItem>();
        
        this.quickPick.title = 'Select Task to Execute';
        this.quickPick.placeholder = 'Choose a task - output will be inserted at cursor position';
        this.quickPick.matchOnDescription = true;
        this.quickPick.matchOnDetail = true;

        // Handle task selection
        this.quickPick.onDidAccept(() => {
            const selectedItem = this.quickPick?.selectedItems[0];
            if (selectedItem && 'task' in selectedItem) {
                // Return the selected task through the promise
                this.resolveSelection?.((selectedItem as TaskPickerItem).task);
                this.quickPick?.hide();
            }
        });

        // Handle picker close/cancel
        this.quickPick.onDidHide(() => {
            // If no task was selected, resolve with undefined
            this.resolveSelection?.(undefined);
            this.dispose();
        });

        // Handle search/filter changes
        this.quickPick.onDidChangeValue((value) => {
            // The built-in filtering handles this automatically
            // We could implement custom filtering logic here if needed
        });

        // Store disposable for cleanup
        this.disposables.push(this.quickPick);
    }

    /**
     * Populate the quick pick with task items
     * @param tasks Array of resolved task definitions
     */
    private populateTaskItems(tasks: TaskDefinition[]): void {
        // Ensure quickPick is initialized before populating items
        if (!this.quickPick) {
            return;
        }
        
        const items: (TaskPickerItem | vscode.QuickPickItem)[] = [];

        // Group tasks by source
        const workspaceTasks = tasks.filter(task => task.source === TaskSource.WORKSPACE);
        const userTasks = tasks.filter(task => task.source === TaskSource.USER);

        // Add workspace tasks section
        if (workspaceTasks.length > 0) {
            items.push({
                label: 'Workspace Tasks',
                kind: vscode.QuickPickItemKind.Separator
            });

            for (const task of workspaceTasks) {
                items.push(this.createTaskPickerItem(task));
            }
        }

        // Add user tasks section
        if (userTasks.length > 0) {
            items.push({
                label: 'User Tasks',
                kind: vscode.QuickPickItemKind.Separator
            });

            for (const task of userTasks) {
                items.push(this.createTaskPickerItem(task));
            }
        }

        this.quickPick.items = items;
    }

    /**
     * Create a TaskPickerItem from a TaskDefinition
     * @param task Task definition to convert
     * @returns Formatted picker item
     */
    private createTaskPickerItem(task: TaskDefinition): TaskPickerItem {
        const icon = task.source === TaskSource.WORKSPACE ? '$(tools)' : '$(person)';
        const sourceLabel = task.source === TaskSource.WORKSPACE ? 'Workspace' : 'User';
        
        return {
            label: `${icon} ${task.name}`,
            description: `${sourceLabel} • ${task.group || 'general'}`,
            detail: task.command + (task.args?.length ? ` ${task.args.join(' ')}` : ''),
            task: task,
            iconPath: undefined, // Using codicon in label instead
            buttons: [
                {
                    iconPath: new ThemeIcon('info'),
                    tooltip: 'Show task details',
                    action: 'showDetails'
                },
                {
                    iconPath: new ThemeIcon('folder-opened'),
                    tooltip: 'Open configuration file',
                    action: 'openFile'
                }
            ]
        };
    }

    // /**
    //  * Execute a selected task
    //  * @param task Task definition to execute
    //  */
    // private async executeTask(task: TaskDefinition): Promise<void> {
    //     try {
    //         this.logger.info(`Executing task: ${task.name} (${task.source})`);
            
    //         // Use VS Code's built-in task execution
    //         await vscode.commands.executeCommand('workbench.action.tasks.runTask', task.name);
            
    //         this.logger.debug(`Task execution initiated for: ${task.name}`);
    //     } catch (error) {
    //         this.logger.error(`Failed to execute task ${task.name}`, error instanceof Error ? error : new Error(String(error)));
            
    //         vscode.window.showErrorMessage(
    //             `Failed to execute task "${task.name}": ${error instanceof Error ? error.message : String(error)}`
    //         );
    //     }
    // }

    /**
     * Show validation errors to the user
     * @param errors Array of validation errors
     */
    private async showValidationErrors(errors: ValidationError[]): Promise<void> {
        const errorMessage = `Some task configurations have errors. Check the output for details.`;
        
        const action = await vscode.window.showErrorMessage(
            errorMessage,
            'Open Output',
            'Continue'
        );

        if (action === 'Open Output') {
            this.logger.show();
            
            // Log detailed error information
            for (const error of errors) {
                this.logger.error(`Validation error in ${error.filePath}: ${error.message}`, undefined);
            }
        }
    }

    /**
     * Show message when no tasks are found
     */
    private async showNoTasksMessage(): Promise<void> {
        const message = 'No tasks found. Create a tasks.json file in .vscode directory or user config folder.';
        
        const action = await vscode.window.showInformationMessage(
            message,
            'Create Workspace Tasks',
            'Open User Config'
        );

        if (action === 'Create Workspace Tasks') {
            await this.createWorkspaceTasksFile();
        } else if (action === 'Open User Config') {
            await this.openUserConfigDirectory();
        }
    }

    /**
     * Create a new tasks.json file in the workspace
     */
    private async createWorkspaceTasksFile(): Promise<void> {
        try {
            if (!vscode.workspace.workspaceFolders?.length) {
                vscode.window.showWarningMessage('No workspace folder is open');
                return;
            }

            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            const vscodeDir = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode');
            const tasksFile = vscode.Uri.joinPath(vscodeDir, 'tasks.json');

            // Create .vscode directory if it doesn't exist
            try {
                await vscode.workspace.fs.stat(vscodeDir);
            } catch {
                await vscode.workspace.fs.createDirectory(vscodeDir);
            }

            // Create basic tasks.json template
            // TODO: Check for reuse
            const tasksTemplate = {
                version: '2.0.0',
                tasks: [
                    {
                        label: 'echo',
                        type: 'shell',
                        command: 'echo',
                        args: ['Hello from cmdpipe!'],
                        group: 'build',
                        presentation: {
                            echo: true,
                            reveal: 'always',
                            focus: false,
                            panel: 'shared'
                        }
                    }
                ]
            };

            await vscode.workspace.fs.writeFile(
                tasksFile, 
                Buffer.from(JSON.stringify(tasksTemplate, null, 2))
            );

            // Open the file for editing
            const document = await vscode.workspace.openTextDocument(tasksFile);
            await vscode.window.showTextDocument(document);

            this.logger.info(`Created workspace tasks.json at ${tasksFile.fsPath}`);
        } catch (error) {
            this.logger.error('Failed to create workspace tasks.json', error instanceof Error ? error : new Error(String(error)));
            vscode.window.showErrorMessage(`Failed to create tasks.json: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Open user configuration directory
     */
    private async openUserConfigDirectory(): Promise<void> {
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
            }

            // Open directory in file explorer
            await vscode.commands.executeCommand('revealFileInOS', userConfigUri);

            this.logger.info(`Opened user config directory: ${userConfigPath}`);
        } catch (error) {
            this.logger.error('Failed to open user config directory', error instanceof Error ? error : new Error(String(error)));
            vscode.window.showErrorMessage(`Failed to open user config: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get the user configuration directory path
     * @returns User config path or null if not available
     */
    private getUserConfigPath(): string | null {
        // TODO: Avoid duplicated logic with TaskConfigManager and taskScanner
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
     * Dispose of resources
     */
    dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
        this.quickPick = undefined;
    }
}