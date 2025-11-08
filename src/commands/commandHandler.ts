import * as vscode from 'vscode';
import { ShellExecutor } from '../shell/shellExecutor';
import { OutputProcessor } from '../shell/outputProcessor';
import { CursorManager } from '../editor/cursorManager';
import { TextInsertion } from '../editor/textInsertion';
import { TaskPicker } from '../ui/taskPicker';
import { TaskConfigManager } from '../config/taskConfigManager';
import { TaskDefinition, TaskExecutionResult } from '../types/taskTypes';
import { CommandRegistry, CommandRegistration, CommandMetadata, OutputInsertionContext } from '../types/extensionTypes';
import { TrustGuard, TrustViolationError } from '../discovery/trustGuard';
import { Logger } from '../utils/logger';
import { ErrorHandler, TaskExecutionError } from '../utils/errorHandler';
import { ISecurityWarningPresenter, SecurityWarningPresenter, WarningActionResult } from '../ui/trustWarningPresenter';
import { WarningMessageModel, TrustContext, TrustState } from '../types/trustTypes';
import { TrustAwareTaskService } from '../config/trustAwareTaskService';

/**
 * Unified command handler that manages all extension commands
 */
export class CommandHandler implements vscode.Disposable {
    private static instance: CommandHandler;
    private logger: Logger;
    private errorHandler: ErrorHandler;
    private shellExecutor: ShellExecutor;
    private outputProcessor: OutputProcessor;
    private cursorManager: CursorManager;
    private textInsertion: TextInsertion;
    private taskConfigManager: TaskConfigManager;
    private currentTaskPicker?: TaskPicker;
    private commandRegistry: CommandRegistry = new Map();
    private disposables: vscode.Disposable[] = [];
    private trustGuard: TrustGuard;
    private trustAwareTaskService: TrustAwareTaskService;
    private warningPresenter: ISecurityWarningPresenter;
    private pendingWarning?: Promise<WarningActionResult>;
    private lastWarningKey?: string;

    private constructor() {
        this.logger = Logger.getInstance();
        this.errorHandler = ErrorHandler.getInstance();
        this.shellExecutor = ShellExecutor.getInstance();
        this.outputProcessor = new OutputProcessor();
        this.cursorManager = CursorManager.getInstance();
        this.textInsertion = TextInsertion.getInstance();
        this.taskConfigManager = new TaskConfigManager();
        this.warningPresenter = new SecurityWarningPresenter();
        this.trustGuard = new TrustGuard();
        this.trustAwareTaskService = new TrustAwareTaskService(this.trustGuard);
        const trustDisposables = this.trustGuard.registerTrustListeners();
        this.disposables.push(...trustDisposables);
        this.setupFileWatching();
    }

    /**
     * Get the singleton instance
     */
    public static getInstance(): CommandHandler {
        if (!CommandHandler.instance) {
            CommandHandler.instance = new CommandHandler();
        }
        return CommandHandler.instance;
    }

    /**
     * Register all commands with VSCode
     */
    public registerAllCommands(context: vscode.ExtensionContext): void {
        this.registerShellTaskCommands();
        this.registerQuickCommands();
        this.registerTaskPickerCommands();
        
        // Add all registered commands to context subscriptions
        for (const registration of this.commandRegistry.values()) {
            context.subscriptions.push(registration.disposable);
        }

        this.logger.info(`Registered ${this.commandRegistry.size} commands`);
    }

    /**
     * Register shell task pipe commands
     */
    private registerShellTaskCommands(): void {
        // this.registerCommand({
        //     commandId: 'shellTaskPipe.runTaskAtCursor',
        //     handler: this.runTaskAtCursor.bind(this),
        //     metadata: {
        //         title: 'Run Task at Cursor',
        //         description: 'Execute a shell task and insert output at cursor position',
        //         category: 'Shell Task Pipe'
        //     }
        // });

        this.registerCommand({
            commandId: 'cmdpipe.config.showLogs',
            handler: this.showLogs.bind(this),
            metadata: {
                title: 'Show Logs',
                description: 'Display extension logs',
                category: 'CmdPipe Config'
            }
        });
    }

    /**
     * Register quick commands
     */
    private registerQuickCommands(): void {
        this.registerCommand({
            commandId: 'cmdpipe.quickCommand',
            handler: this.quickCommand.bind(this),
            metadata: {
                title: 'Quick Command',
                description: 'Execute any shell command and insert output at cursor',
                category: 'CmdPipe'
            }
        });

        this.registerCommand({
            commandId: 'cmdpipe.executeSelection',
            handler: this.executeSelection.bind(this),
            metadata: {
                title: 'Execute Selection',
                description: 'Execute selected text as shell command',
                category: 'CmdPipe'
            }
        });

        this.registerCommand({
            commandId: 'cmdpipe.insertDateTime',
            handler: this.insertDateTime.bind(this),
            metadata: {
                title: 'Insert Date/Time',
                description: 'Insert current date and time at cursor',
                category: 'CmdPipe'
            }
        });
    }

    /**
     * Register task picker commands
     */
    private registerTaskPickerCommands(): void {
        this.registerCommand({
            commandId: 'cmdpipe.runTask',
            handler: this.showTaskPicker.bind(this),
            metadata: {
                title: 'Run Task',
                description: 'Show task picker to select and execute tasks',
                category: 'CmdPipe'
            }
        });

        this.registerCommand({
            commandId: 'cmdpipe.config.refreshTasks',
            handler: this.refreshTasks.bind(this),
            metadata: {
                title: 'Refresh Tasks',
                description: 'Refresh task configurations',
                category: 'CmdPipe Config'
            }
        });

        this.registerCommand({
            commandId: 'cmdpipe.config.createWorkspaceTasks',
            handler: this.createWorkspaceTasks.bind(this),
            metadata: {
                title: 'Create Workspace Tasks',
                description: 'Create tasks.json for workspace',
                category: 'CmdPipe Config'
            }
        });

        this.registerCommand({
            commandId: 'cmdpipe.config.openUserConfig',
            handler: this.openUserConfig.bind(this),
            metadata: {
                title: 'Open User Config',
                description: 'Open user configuration directory',
                category: 'CmdPipe Config'
            }
        });

        this.registerCommand({
            commandId: 'cmdpipe.config.showTaskErrors',
            handler: this.showTaskErrors.bind(this),
            metadata: {
                title: 'Show Task Errors',
                description: 'Display task configuration errors',
                category: 'CmdPipe Config'
            }
        });

        this.registerCommand({
            commandId: 'cmdpipe.config.validateTaskConfigs',
            handler: this.validateTaskConfigs.bind(this),
            metadata: {
                title: 'Validate Task Configs',
                description: 'Validate all task configurations',
                category: 'CmdPipe Config'
            }
        });
    }

    /**
     * Helper method to register individual commands
     */
    private registerCommand(options: {
        commandId: string;
        handler: (...args: any[]) => any;
        metadata: CommandMetadata;
    }): void {
        const disposable = vscode.commands.registerCommand(options.commandId, options.handler);
        
        const registration: CommandRegistration = {
            commandId: options.commandId,
            disposable,
            handler: options.handler,
            metadata: options.metadata
        };

        this.commandRegistry.set(options.commandId, registration);
        this.disposables.push(disposable);
    }

    /**
     * Setup file watching for task configurations
     */
    private setupFileWatching(): void {
        // Watch for changes to task configuration files
        const watcher = vscode.workspace.createFileSystemWatcher('**/{tasks.json,.vscode/tasks.json,cmdpipe/**/*.json}');
        // TODO: Is this the right set of files to watch?
        
        watcher.onDidChange(() => this.refreshTasks());
        watcher.onDidCreate(() => this.refreshTasks());
        watcher.onDidDelete(() => this.refreshTasks());
        
        this.disposables.push(watcher);
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
        this.commandRegistry.clear();
        
        if (this.currentTaskPicker) {
            this.currentTaskPicker.dispose();
            this.currentTaskPicker = undefined;
        }
    }

    // /**
    //  * Main command: Run Shell Task
    //  * Shows a quick pick to select and execute a configured task
    //  */
    // public async runTask(): Promise<void> {
    //     try {
    //         this.logger.info('runTask command invoked');

    //         const tasks = await this.getAvailableTasks();
            
    //         if (tasks.length === 0) {
    //             vscode.window.showInformationMessage('No shell tasks configured. Use "Open Configuration" to add tasks.');
    //             return;
    //         }

    //         // Show task picker
    //         const selectedTask = await this.showTaskPicker(tasks);
    //         if (!selectedTask) {
    //             return; // User cancelled
    //         }

    //         await this.executeTask(selectedTask);

    //     } catch (error) {
    //         this.errorHandler.handleError(error as Error, 'Failed to run shell task');
    //     }
    // }

    // /**
    //  * Run a shell task and insert output at cursor position
    //  */
    // public async runTaskAtCursor(): Promise<void> {
    //     try {
    //         this.logger.info('runTaskAtCursor command invoked');

    //         // Get active editor info
    //         const editorInfo = this.cursorManager.getActiveEditor();
    //         if (!editorInfo) {
    //             vscode.window.showErrorMessage('No active editor found');
    //             return;
    //         }

    //         if (editorInfo.isReadonly) {
    //             vscode.window.showErrorMessage('Cannot insert output: editor is readonly');
    //             return;
    //         }

    //         // Get available tasks
    //         const tasks = await this.getAvailableTasks();
    //         if (tasks.length === 0) {
    //             vscode.window.showInformationMessage('No shell tasks configured.');
    //             return;
    //         }

    //         // Show simple task picker
    //         const selectedTask = await this.showSimpleTaskPicker(tasks);
    //         if (!selectedTask) {
    //             return;
    //         }

    //         // Execute task and insert output
    //         await this.executeTaskAndInsertOutput(selectedTask, editorInfo);

    //     } catch (error) {
    //         this.errorHandler.handleError(error as Error, 'Failed to run task at cursor');
    //     }
    // }

    // /**
    //  * Execute a task and insert its output at the current cursor position
    //  */
    // private async executeTaskAndInsertOutput(
    //     task: TaskDefinition, 
    //     editorInfo: any
    // ): Promise<void> {
    //     try {
    //         // Show progress indicator
    //         await vscode.window.withProgress({
    //             location: vscode.ProgressLocation.Notification,
    //             title: `Running task: ${task.name}`,
    //             cancellable: true
    //         }, async (progress, token) => {
    //             // Execute the shell task
    //             progress.report({ message: 'Executing command...' });
    //             const result = await this.shellExecutor.executeTask(task);

    //             if (token.isCancellationRequested) {
    //                 await this.shellExecutor.terminateTask(task.id);
    //                 return;
    //             }

    //             if (!result.success) {
    //                 throw new Error(result.error || 'Task execution failed');
    //             }

    //             // Process the output
    //             progress.report({ message: 'Processing output...' });
    //             const processedOutput = this.outputProcessor.processOutput(result.output, task, 'insert-at-cursor');

    //             // Insert output at cursor
    //             progress.report({ message: 'Inserting output...' });
    //             const insertionResult = await this.textInsertion.insertAtCursor(
    //                 editorInfo, 
    //                 processedOutput
    //             );

    //             if (!insertionResult.success) {
    //                 throw new Error(insertionResult.error || 'Failed to insert output');
    //             }

    //             this.logger.info(`Task "${task.name}" completed successfully`);
    //             vscode.window.showInformationMessage(`Task "${task.name}" output inserted at cursor`);
    //         });

    //     } catch (error) {
    //         this.logger.error(`Task execution failed: ${(error as Error).message}`);
    //         vscode.window.showErrorMessage(`Task failed: ${(error as Error).message}`);
    //     }
    // }

    // /**
    //  * Execute a task without inserting output (show in output channel)
    //  */
    // private async executeTask(task: TaskDefinition): Promise<void> {
    //     try {
    //         await vscode.window.withProgress({
    //             location: vscode.ProgressLocation.Notification,
    //             title: `Running task: ${task.name}`,
    //             cancellable: true
    //         }, async (progress, token) => {
    //             progress.report({ message: 'Executing command...' });
                
    //             const result = await this.shellExecutor.executeTask(task);

    //             if (token.isCancellationRequested) {
    //                 await this.shellExecutor.terminateTask(task.id);
    //                 return;
    //             }

    //             if (!result.success) {
    //                 throw new Error(result.error || 'Task execution failed');
    //             }

    //             // Process and display output
    //             progress.report({ message: 'Processing output...' });
    //             const processedOutput = this.outputProcessor.processOutput(result.output, task);
    //             const formattedOutput = this.outputProcessor.formatOutputForOutputChannel(processedOutput, task);

    //             // Show output in dedicated channel
    //             this.showTaskOutputInOutputChannel(task.name, formattedOutput, result);
    //         });

    //     } catch (error) {
    //         this.logger.error(`Task execution failed: ${(error as Error).message}`);
    //         vscode.window.showErrorMessage(`Task failed: ${(error as Error).message}`);
    //     }
    // }

    // /**
    //  * Get available tasks from configuration
    //  */
    // private async getAvailableTasks(): Promise<TaskDefinition[]> {
    //     // For now, return some example tasks
    //     // This will be replaced with actual configuration loading in T028
    //     return [
    //         {
    //             id: 'echo-hello',
    //             name: 'Echo Hello',
    //             description: 'Simple echo command',
    //             command: 'echo',
    //             args: ['Hello from shell task!'],
    //             category: 'utility',
    //             outputProcessing: {
    //                 trimWhitespace: true
    //             }
    //         },
    //         {
    //             id: 'list-files',
    //             name: 'List Files',
    //             description: 'List current directory contents',
    //             command: process.platform === 'win32' ? 'dir' : 'ls',
    //             args: process.platform === 'win32' ? ['/b'] : ['-la'],
    //             category: 'file-system',
    //             outputProcessing: {
    //                 trimWhitespace: true,
    //                 maxOutputLength: 2000
    //             }
    //         },
    //         {
    //             id: 'current-date',
    //             name: 'Current Date',
    //             description: 'Show current date and time',
    //             command: process.platform === 'win32' ? 'date' : 'date',
    //             args: process.platform === 'win32' ? ['/t'] : [],
    //             category: 'system',
    //             outputProcessing: {
    //                 trimWhitespace: true
    //             }
    //         }
    //     ];
    // }

    // /**
    //  * Show simple task picker for user selection
    //  */
    // private async showSimpleTaskPicker(tasks: TaskDefinition[]): Promise<TaskDefinition | undefined> {
    //     const items = tasks.map(task => ({
    //         label: task.name,
    //         description: task.description || task.command,
    //         detail: task.category || 'Shell Task',
    //         task
    //     }));

    //     const selected = await vscode.window.showQuickPick(items, {
    //         placeHolder: 'Select a shell task to run',
    //         matchOnDescription: true,
    //         matchOnDetail: true
    //     });

    //     return selected?.task;
    // }

    // /**
    //  * Show task output in a dedicated output channel
    //  */
    // private showTaskOutputInOutputChannel(taskName: string, output: string, result: TaskExecutionResult): void {
    //     const outputChannel = vscode.window.createOutputChannel(`Shell Task: ${taskName}`);
    //     outputChannel.appendLine(output);
        
    //     if (result.stderr) {
    //         outputChannel.appendLine('\n--- STDERR ---');
    //         outputChannel.appendLine(result.stderr);
    //     }
        
    //     outputChannel.appendLine(`\n--- EXECUTION INFO ---`);
    //     outputChannel.appendLine(`Exit Code: ${result.exitCode}`);
    //     outputChannel.appendLine(`Execution Time: ${result.executionTime}ms`);
    //     outputChannel.appendLine(`Task ID: ${result.taskId}`);
        
    //     outputChannel.show();
    // }

    // /**
    //  * Open configuration file
    //  */
    // private async openConfig(): Promise<void> {
    //     try {
    //         vscode.window.showInformationMessage('Configuration management will be implemented in the next task');
    //     } catch (error) {
    //         this.errorHandler.handleError(error as Error, 'Failed to open configuration');
    //     }
    // }

    // /**
    //  * Reload configuration
    //  */
    // private async reloadConfig(): Promise<void> {
    //     try {
    //         vscode.window.showInformationMessage('Configuration reload will be implemented in the next task');
    //     } catch (error) {
    //         this.errorHandler.handleError(error as Error, 'Failed to reload configuration');
    //     }
    // }

    /**
     * Show extension logs
     */
    private async showLogs(): Promise<void> {
        try {
            // Show logger output channel
            this.logger.show();
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to show logs');
        }
    }

    // =============================================================================
    // QUICK COMMAND HANDLERS
    // =============================================================================

    /**
     * Quick command - allows user to enter any shell command
     */
    public async quickCommand(): Promise<void> {
        try {
            this.logger.info('Quick command invoked');

            // Get command from user
            const command = await vscode.window.showInputBox({
                prompt: 'Enter shell command to execute',
                placeHolder: 'e.g., echo "Hello World"'
            });

            if (!command) {
                return; // User cancelled
            }

            // Get current editor info
            const context = this.cursorManager.createOutputInsertionContext();
            if (!context) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            // Execute command and insert output
            await this.executeCommandAndInsertOutput(command, context);

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to execute quick command');
        }
    }

    /**
     * Execute selected text as shell command
     */
    public async executeSelection(): Promise<void> {
        try {
            this.logger.info('Execute selection command invoked');

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            const selection = editor.selection;
            if (selection.isEmpty) {
                vscode.window.showErrorMessage('No text selected');
                return;
            }

            const selectedText = editor.document.getText(selection);
            if (!selectedText.trim()) {
                vscode.window.showErrorMessage('Selected text is empty');
                return;
            }

            // Get current editor context
            // TODO: For selection execution, we want the default insertion to be "append below selection"
            // More specifically in the example "echo Hello" the outputted text should be "> echo Hello\nHello"
            // i.e. prepend the executed command to the result
            const context = this.cursorManager.createOutputInsertionContext();
            if (!context) {
                vscode.window.showErrorMessage('Unable to create insertion context');
                return;
            }

            // Execute selected text as command
            await this.executeCommandAndInsertOutput(selectedText.trim(), context);

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to execute selection');
        }
    }

    /**
     * Insert current date and time at cursor
     */
    public async insertDateTime(format?: string): Promise<void> {
        try {
            this.logger.info('Insert date/time command invoked');

            const context = this.cursorManager.createOutputInsertionContext();
            if (!context) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            let selectedFormat: string;

            // If format parameter is provided, use it directly
            if (format) {
                // Validate the format is supported
                const validFormats = ['iso', 'local', 'date', 'time', 'us-date', 'eu-date', 'long', 'short', 'timestamp', 'custom'];
                if (validFormats.includes(format)) {
                    selectedFormat = format;
                } else {
                    vscode.window.showErrorMessage(`Invalid date format: ${format}. Valid formats: ${validFormats.join(', ')}`);
                    return;
                }
            } else {
                // Show quick pick menu if no parameter provided
                const formatChoice = await vscode.window.showQuickPick([
                    { label: 'ISO Format', value: 'iso', description: '2025-10-23T14:30:00Z' },
                    { label: 'Local Date/Time', value: 'local', description: '10/23/2025, 2:30:00 PM' },
                    { label: 'Date Only', value: 'date', description: '2025-10-23' },
                    { label: 'Time Only', value: 'time', description: '14:30:00' },
                    { label: 'US Date', value: 'us-date', description: '10/23/2025' },
                    { label: 'European Date', value: 'eu-date', description: '23/10/2025' },
                    { label: 'Long Format', value: 'long', description: 'Wednesday, October 23, 2025' },
                    { label: 'Short Format', value: 'short', description: 'Oct 23, 2025' },
                    { label: 'Timestamp', value: 'timestamp', description: '1729694200000' },
                    { label: 'Custom Format', value: 'custom', description: '2025-10-23 14:30' }
                ], {
                    placeHolder: 'Select date/time format'
                });

                if (!formatChoice) {
                    return;
                }

                selectedFormat = formatChoice.value;
            }

            const now = new Date();
            const dateTimeString = this.formatDate(now, selectedFormat);

            const result = await this.textInsertion.insertOutput(context, dateTimeString);
            
            if (!result.success) {
                vscode.window.showErrorMessage(`Failed to insert date/time: ${result.error}`);
            }

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to insert date/time');
        }
    }

    /**
     * Format date object into a string based on the selected format
     */
    private formatDate(date: Date, format: string): string {
        try {
            switch (format) {
                case 'iso':
                    return date.toISOString(); // example: "2025-10-23T14:30:00.000Z"
                case 'local':
                    return date.toLocaleString(); // example: "10/23/2025, 2:30:00 PM"
                case 'date':
                    return date.toISOString().split('T')[0]; // example: "2025-10-23"
                case 'time':
                    return date.toTimeString().split(' ')[0]; // example: "14:30:00"
                case 'us-date':
                    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`; // example: "10/23/2025"
                case 'eu-date':
                    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`; // example: "23/10/2025"
                case 'long':
                    return date.toLocaleString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); // example: "Wednesday, October 23, 2025"
                case 'short':
                    return date.toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric' }); // example: "Oct 23, 2025"
                case 'timestamp':
                    return date.getTime().toString(); // example: "1729694200000"
                case 'custom':
                    return `${date.toISOString().split('T')[0]} ${date.toTimeString().split(' ')[0]}`;
                default:
                    return date.toISOString();
            }
        } catch (error) {
            this.logger.error('Date formatting failed', error as Error);
            return date.toISOString();
        }
    }

    /**
     * Helper method to execute command and insert output using new OutputInsertionContext
     */
    private async executeCommandAndInsertOutput(command: string, context: OutputInsertionContext): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Executing: ${command}`,
            cancellable: true
        }, async (progress, token) => {
            try {
                // Execute the command
                progress.report({ message: 'Executing command...' });
                const task : TaskDefinition = {
                    id: `quick-${Date.now()}`,
                    name: 'Quick Command',
                    description: 'User entered command',
                    command: command,
                    args: [],
                    category: 'utility',
                    workingDirectory: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                };
                const result = await this.shellExecutor.executeTaskWithOutput(task);

                if (token.isCancellationRequested) {
                    return;
                }

                if (!result.success) {
                    throw new Error(result.error || 'Command execution failed');
                }

                // Process the output for binary content
                progress.report({ message: 'Processing output...' });
                const processedOutput = await this.outputProcessor.processOutputForTaskExecutionResult(result, task);
                let outputToInsert = processedOutput.content;

                // if (result.isBinary && result.tempFilePath) {
                //     outputToInsert = `[Binary output saved to: ${result.tempFilePath}]`;
                // }

                // Insert output using new context system
                progress.report({ message: 'Inserting output...' });
                const insertionResult = await this.textInsertion.insertOutput(context, outputToInsert);

                if (!insertionResult.success) {
                    throw new Error(insertionResult.error || 'Failed to insert output');
                }

                this.logger.debug(`Command executed successfully, inserted ${insertionResult.charactersInserted} characters`);

            } catch (error) {
                this.errorHandler.handleError(error as Error, 'Command execution failed');
                throw error;
            }
        });
    }

    // =============================================================================
    // TASK PICKER COMMAND HANDLERS
    // =============================================================================

    /**
     * Show task picker to select and execute tasks
     */
    public async showTaskPicker(taskName?: string): Promise<void> {
        try {
            this.logger.info('Task picker invoked');

            // Get current editor context for output insertion
            const context = this.cursorManager.createOutputInsertionContext();
            if (taskName) {
                this.logger.info(`Task Name provided: ${taskName}`);                
            }

            let selectedTask = this.taskConfigManager.getTaskByName(taskName);
            if (!selectedTask) 
            {
                // Create or reuse task picker
                if (!this.currentTaskPicker) {
                    this.currentTaskPicker = new TaskPicker(this.taskConfigManager, this.trustAwareTaskService);
                }
            
                // Show task picker and get selected task
                selectedTask = await this.currentTaskPicker.showAndSelectTask();
            }
            
            if (selectedTask && context) {
                const canExecute = await this.guardTaskExecution(selectedTask);
                if (!canExecute) {
                    return;
                }
                // Convert config task to execution task
                const executionTask = this.convertConfigTaskToExecutionTask(selectedTask);
                await this.executeTaskWithNewContext(executionTask, context);
            } 
            else if (selectedTask && !context) {
                const canExecute = await this.guardTaskExecution(selectedTask);
                if (!canExecute) {
                    return;
                }
                // No editor context - show in output panel
                vscode.window.showInformationMessage('No active editor found. Task output will be shown in output panel.');
                const executionTask = this.convertConfigTaskToExecutionTask(selectedTask);
                await this.executeTaskWithOutputPanel(executionTask);
            }

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to show task picker');
        }
    }

    /**
     * Convert a config TaskDefinition to an execution TaskDefinition
     * 
     * TODO: Do we need 2 separate types here? Can we unify them? The return value is compatible with VSCode's TaskDefinition 
     */
    private convertConfigTaskToExecutionTask(configTask: import('../types/configTypes').TaskDefinition): TaskDefinition {
        return {
            id: `config-${configTask.name.replace(/\s+/g, '-').toLowerCase()}`,
            name: configTask.name,
            description: configTask.description,
            command: configTask.command,
            args: configTask.args,
            source: configTask.source,
            workingDirectory: configTask.options?.cwd,
            environmentVariables: configTask.options?.env,
            category: 'custom',
            platforms: undefined,
            shell: configTask.options?.shell ? {
                executable: typeof configTask.options.shell === 'string' ? configTask.options.shell : undefined
            } : undefined,
            outputProcessing: {
                trimWhitespace: true,
                maxOutputLength: 10000
            },
            configurationFile: configTask.filePath,
            workspaceFolder: configTask.workspaceFolder
        };
    }

    private async guardTaskExecution(configTask: import('../types/configTypes').TaskDefinition): Promise<boolean> {
        try {
            await this.trustGuard.ensureCanExecute(configTask);
            return true;
        } catch (error) {
            if (error instanceof TrustViolationError) {
                await this.presentTrustWarning(configTask, error);
                return false;
            }

            throw error;
        }
    }

    private async presentTrustWarning(
        configTask: import('../types/configTypes').TaskDefinition,
        violation: TrustViolationError
    ): Promise<void> {
        const context = this.trustGuard.getCurrentContext();
        const warningKey = `${configTask.name}:${context.state}`;
        const warningModel = this.buildWarningModel(configTask.name, violation, context);

        // Avoid showing duplicate warnings
        // If a warning is already being shown for the same task and context, wait for it to finish
        if (this.pendingWarning && this.lastWarningKey === warningKey) {
            await this.pendingWarning;
            return;
        }

        const pending = this.warningPresenter.showTaskBlockedWarning(warningModel);
        const tracked = pending.finally(() => {
            if (this.pendingWarning === tracked) {
                this.pendingWarning = undefined;
                this.lastWarningKey = undefined;
            }
        });

        this.pendingWarning = tracked;
        this.lastWarningKey = warningKey;

        // Wait for the warning to be dismissed before proceeding
        await tracked;
    }

    private buildWarningModel(
        taskName: string,
        violation: TrustViolationError,
        context: TrustContext
    ): WarningMessageModel {
        const title = `Task "${taskName}" is blocked by workspace trust`;
        const trustDescription = this.describeTrustState(context.state);
        const detail = `${violation.message} Current workspace trust state: ${trustDescription}. Select "Trust Workspace" to review trust settings or "View User Tasks" to work with tasks you control.`;

        return {
            title,
            detail,
            primaryAction: {
                label: 'Trust Workspace',
                command: 'workbench.trust.manage'
            },
            secondaryAction: {
                label: 'View User Tasks',
                command: 'cmdpipe.config.openUserConfig'
            },
            telemetryId: `blocked-${taskName}-${context.state}`
        };
    }

    private describeTrustState(state: TrustState): string {
        switch (state) {
            case 'trusted':
                return 'trusted';
            case 'untrusted':
                return 'untrusted (workspace trust declined)';
            case 'undecided':
            default:
                return 'undecided (trust not granted yet)';
        }
    }

    /**
     * Execute task and show output in output panel only
     */
    private async executeTaskWithOutputPanel(task: TaskDefinition): Promise<void> {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running task: ${task.name}`,
            cancellable: true
        }, async (progress, token) => {
            try {
                // Execute the task
                progress.report({ message: 'Executing task...' });
                const result = await this.shellExecutor.executeTaskWithOutput(task);

                if (token.isCancellationRequested) {
                    return;
                }

                if (!result.success) {
                    throw new Error(result.error || 'Task execution failed');
                }

                // Show output in panel
                progress.report({ message: 'Displaying output...' });
                const outputChannel = vscode.window.createOutputChannel(`Task: ${task.name}`);

                const processedOutput = await this.outputProcessor.processOutputForTaskExecutionResult(result, task);
                outputChannel.appendLine(processedOutput.content);
                
                if (processedOutput.isBinary && processedOutput.tempFilePath) {
                    outputChannel.appendLine(`Output size: ${processedOutput.byteCount} bytes`);
                }

                outputChannel.show();
                this.logger.debug(`Task executed successfully, output shown in panel`);

            } catch (error) {
                this.errorHandler.handleError(error as Error, `Task execution failed: ${task.name}`);
                throw error;
            }
        });
    }

    /**
     * Execute a task using new OutputInsertionContext system
     */
    private async executeTaskWithNewContext(task: TaskDefinition, context: OutputInsertionContext): Promise<void> {
        // TODO: Address code duplication between this, executeCommandAndInsertOutput, and executeTaskWithOutputPanel
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running task: ${task.name}`,
            cancellable: true
        }, async (progress, token) => {
            try {
                // Execute the task
                progress.report({ message: 'Executing task...' });
                const result = await this.shellExecutor.executeTaskWithOutput(task);

                if (token.isCancellationRequested) {
                    return;
                }

                if (!result.success) {
                    throw new TaskExecutionError(result.error || 'Task execution failed', result.exitCode, result.output?.toString('utf8'), result.stderr?.toString('utf8'));
                }

                // Process output for binary content
                progress.report({ message: 'Processing output...' });

                const processedOutput = await this.outputProcessor.processOutputForTaskExecutionResult(result, task);
                let outputToInsert = processedOutput.content;

                if (processedOutput.isBinary && processedOutput.tempFilePath) {
                    vscode.window.showInformationMessage(`Binary output saved to: ${processedOutput.tempFilePath}`);
                }
                
                // let outputToInsert = result.output;

                // if (result.isBinary && result.tempFilePath) {
                //     outputToInsert = `[Binary output saved to: ${result.tempFilePath}]`;
                //     vscode.window.showInformationMessage(`Binary output saved to: ${result.tempFilePath}`);
                // }

                // Insert output using new context system
                progress.report({ message: 'Inserting output...' });
                const insertionResult = await this.textInsertion.insertOutput(context, outputToInsert);

                if (!insertionResult.success) {
                    throw new Error(insertionResult.error || 'Failed to insert output');
                }

                this.logger.debug(`Task executed successfully, inserted ${insertionResult.charactersInserted} characters`);

            } catch (error) {
                this.errorHandler.handleError(error as Error, `Task execution failed: ${task.name}`);
                throw error;
            }
        });
    }

    /**
     * Refresh task configurations
     */
    public async refreshTasks(): Promise<void> {
        try {
            this.logger.info('Refreshing task configurations');
            await this.taskConfigManager.refreshConfigurations();
            
            if (this.currentTaskPicker) {
                // Dispose current picker to force recreation with new configs
                this.currentTaskPicker.dispose();
                this.currentTaskPicker = undefined;
            }
            
            vscode.window.showInformationMessage('Task configurations refreshed');
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to refresh tasks');
        }
    }

    /**
     * Create workspace tasks.json
     */
    public async createWorkspaceTasks(): Promise<void> {
        try {
            this.logger.info('Creating workspace tasks.json');
            
            // Since TaskConfigManager doesn't have this method, we'll implement basic functionality
            if (!vscode.workspace.workspaceFolders?.[0]) {
                throw new Error('No workspace folder found');
            }

            const workspaceFolder = vscode.workspace.workspaceFolders[0];
            const vscodeFolder = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode');
            const tasksFile = vscode.Uri.joinPath(vscodeFolder, 'tasks.json');

            // Check if tasks.json already exists
            try {
                await vscode.workspace.fs.stat(tasksFile);
                const overwrite = await vscode.window.showWarningMessage(
                    'tasks.json already exists. Overwrite?', 
                    'Yes', 'No'
                );
                if (overwrite !== 'Yes') {
                    return;
                }
            } catch {
                // File doesn't exist, continue
            }

            // Create basic tasks.json content
            const tasksContent = {
                version: '2.0.0',
                tasks: [
                    {
                        label: 'echo-example',
                        type: 'shell',
                        command: 'echo',
                        args: ['Hello from workspace tasks!'],
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

            // Ensure .vscode directory exists
            try {
                await vscode.workspace.fs.createDirectory(vscodeFolder);
            } catch {
                // Directory might already exist
            }

            // Write tasks.json
            const content = JSON.stringify(tasksContent, null, 2);
            await vscode.workspace.fs.writeFile(tasksFile, Buffer.from(content, 'utf8'));
            
            vscode.window.showInformationMessage('Workspace tasks.json created successfully');
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to create workspace tasks');
        }
    }

    /**
     * Open user configuration directory
     */
    public async openUserConfig(): Promise<void> {
        try {
            this.logger.info('Opening user configuration directory');
            
            // Since TaskConfigManager doesn't have getUserConfigDirectory, 
            // we'll use VS Code's global storage path or workspace folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const configPath = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode');
            
            // Ensure directory exists
            try {
                await vscode.workspace.fs.createDirectory(configPath);
            } catch {
                // Directory might already exist
            }

            // TODO: Do we need to open the folder in VSCode? How about just open in file explorer? See taskPickerCommandHandler.ts:openUserConfig
            await vscode.commands.executeCommand('vscode.openFolder', configPath);
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to open user config');
        }
    }

    /**
     * Show task configuration errors
     */
    public async showTaskErrors(): Promise<void> {
        try {
            this.logger.info('Showing task configuration errors');
            const errors = this.taskConfigManager.getValidationErrors();
            
            if (errors.length === 0) {
                vscode.window.showInformationMessage('No task configuration errors found');
                return;
            }

            const errorMessage = errors.map(error => `${error.filePath}: ${error.message}`).join('\n');
            await vscode.window.showErrorMessage('Task Configuration Errors', {
                detail: errorMessage,
                modal: true
            });
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to show task errors');
        }
    }

    /**
     * Validate all task configurations
     */
    public async validateTaskConfigs(): Promise<void> {
        try {
            this.logger.info('Validating task configurations');
            
            // Since TaskConfigManager doesn't have validateAllConfigurations,
            // we'll use the getValidationErrors method as an indicator
            const errors = this.taskConfigManager.getValidationErrors();
            
            if (errors.length === 0) {
                vscode.window.showInformationMessage('All task configurations are valid');
            } else {
                vscode.window.showWarningMessage(`Found ${errors.length} configuration errors. Use "Show Task Errors" for details.`);
            }
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to validate task configs');
        }
    }
}