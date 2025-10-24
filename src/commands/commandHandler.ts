import * as vscode from 'vscode';
import { ShellExecutor } from '../shell/shellExecutor';
import { OutputProcessor } from '../shell/outputProcessor';
import { CursorManager } from '../editor/cursorManager';
import { TextInsertion } from '../editor/textInsertion';
import { TaskDefinition, TaskExecutionResult } from '../types/taskTypes';
import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';

/**
 * Main command handler that orchestrates the shell-to-editor workflow
 */
export class CommandHandler {
    private static instance: CommandHandler;
    private logger: Logger;
    private errorHandler: ErrorHandler;
    private shellExecutor: ShellExecutor;
    private outputProcessor: OutputProcessor;
    private cursorManager: CursorManager;
    private textInsertion: TextInsertion;

    private constructor() {
        this.logger = Logger.getInstance();
        this.errorHandler = ErrorHandler.getInstance();
        this.shellExecutor = ShellExecutor.getInstance();
        this.outputProcessor = new OutputProcessor();
        this.cursorManager = CursorManager.getInstance();
        this.textInsertion = TextInsertion.getInstance();
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
    public registerCommands(context: vscode.ExtensionContext): void {
        const commands = [
            //vscode.commands.registerCommand('shellTaskPipe.runTask', this.runTask.bind(this)),
            vscode.commands.registerCommand('shellTaskPipe.runTaskAtCursor', this.runTaskAtCursor.bind(this)),
            vscode.commands.registerCommand('shellTaskPipe.openConfig', this.openConfig.bind(this)),
            vscode.commands.registerCommand('shellTaskPipe.reloadConfig', this.reloadConfig.bind(this)),
            vscode.commands.registerCommand('shellTaskPipe.showLogs', this.showLogs.bind(this))
        ];

        commands.forEach(command => context.subscriptions.push(command));
        this.logger.info('Registered shell task pipe commands');
    }

    /**
     * Main command: Run Shell Task
     * Shows a quick pick to select and execute a configured task
     */
    public async runTask(): Promise<void> {
        try {
            this.logger.info('runTask command invoked');

            // TODO: Get available tasks from configuration
            const tasks = await this.getAvailableTasks();
            
            if (tasks.length === 0) {
                vscode.window.showInformationMessage('No shell tasks configured. Use "Open Configuration" to add tasks.');
                return;
            }

            // Show task picker
            const selectedTask = await this.showTaskPicker(tasks);
            if (!selectedTask) {
                return; // User cancelled
            }

            await this.executeTask(selectedTask);

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to run shell task');
        }
    }

    /**
     * Run a shell task and insert output at cursor position
     */
    public async runTaskAtCursor(): Promise<void> {
        try {
            this.logger.info('runTaskAtCursor command invoked');

            // Get active editor info
            const editorInfo = this.cursorManager.getActiveEditor();
            if (!editorInfo) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            if (editorInfo.isReadonly) {
                vscode.window.showErrorMessage('Cannot insert output: editor is readonly');
                return;
            }

            // Get available tasks
            const tasks = await this.getAvailableTasks();
            if (tasks.length === 0) {
                vscode.window.showInformationMessage('No shell tasks configured.');
                return;
            }

            // Show task picker
            const selectedTask = await this.showTaskPicker(tasks);
            if (!selectedTask) {
                return;
            }

            // Execute task and insert output
            await this.executeTaskAndInsertOutput(selectedTask, editorInfo);

        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to run task at cursor');
        }
    }

    /**
     * Execute a task and insert its output at the current cursor position
     */
    private async executeTaskAndInsertOutput(
        task: TaskDefinition, 
        editorInfo: any
    ): Promise<void> {
        try {
            // Show progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Running task: ${task.name}`,
                cancellable: true
            }, async (progress, token) => {
                // Execute the shell task
                progress.report({ message: 'Executing command...' });
                const result = await this.shellExecutor.executeTask(task);

                if (token.isCancellationRequested) {
                    await this.shellExecutor.terminateTask(task.id);
                    return;
                }

                if (!result.success) {
                    throw new Error(result.error || 'Task execution failed');
                }

                // Process the output
                progress.report({ message: 'Processing output...' });
                const processedOutput = this.outputProcessor.processOutput(result.output, task);

                // Insert output at cursor
                progress.report({ message: 'Inserting output...' });
                const insertionResult = await this.textInsertion.insertAtCursor(
                    editorInfo, 
                    processedOutput
                );

                if (!insertionResult.success) {
                    throw new Error(insertionResult.error || 'Failed to insert output');
                }

                this.logger.info(`Task "${task.name}" completed successfully`);
                vscode.window.showInformationMessage(`Task "${task.name}" output inserted at cursor`);
            });

        } catch (error) {
            this.logger.error(`Task execution failed: ${(error as Error).message}`);
            vscode.window.showErrorMessage(`Task failed: ${(error as Error).message}`);
        }
    }

    /**
     * Execute a task without inserting output (show in output channel)
     */
    private async executeTask(task: TaskDefinition): Promise<void> {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Running task: ${task.name}`,
                cancellable: true
            }, async (progress, token) => {
                progress.report({ message: 'Executing command...' });
                
                const result = await this.shellExecutor.executeTask(task);

                if (token.isCancellationRequested) {
                    await this.shellExecutor.terminateTask(task.id);
                    return;
                }

                if (!result.success) {
                    throw new Error(result.error || 'Task execution failed');
                }

                // Process and display output
                progress.report({ message: 'Processing output...' });
                const processedOutput = this.outputProcessor.processOutput(result.output, task);
                const formattedOutput = this.outputProcessor.formatOutput(processedOutput, task);

                // Show output in dedicated channel
                this.showTaskOutput(task.name, formattedOutput, result);
            });

        } catch (error) {
            this.logger.error(`Task execution failed: ${(error as Error).message}`);
            vscode.window.showErrorMessage(`Task failed: ${(error as Error).message}`);
        }
    }

    /**
     * Show task picker for user selection
     */
    private async showTaskPicker(tasks: TaskDefinition[]): Promise<TaskDefinition | undefined> {
        const items = tasks.map(task => ({
            label: task.name,
            description: task.description || task.command,
            detail: task.category || 'Shell Task',
            task
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a shell task to run',
            matchOnDescription: true,
            matchOnDetail: true
        });

        return selected?.task;
    }

    /**
     * Get available tasks from configuration
     * TODO: Implement proper configuration loading
     */
    private async getAvailableTasks(): Promise<TaskDefinition[]> {
        // For now, return some example tasks
        // This will be replaced with actual configuration loading in T028
        return [
            {
                id: 'echo-hello',
                name: 'Echo Hello',
                description: 'Simple echo command',
                command: 'echo',
                args: ['Hello from shell task!'],
                category: 'utility',
                outputProcessing: {
                    trimWhitespace: true
                }
            },
            {
                id: 'list-files',
                name: 'List Files',
                description: 'List current directory contents',
                command: process.platform === 'win32' ? 'dir' : 'ls',
                args: process.platform === 'win32' ? ['/b'] : ['-la'],
                category: 'file-system',
                outputProcessing: {
                    trimWhitespace: true,
                    maxOutputLength: 2000
                }
            },
            {
                id: 'current-date',
                name: 'Current Date',
                description: 'Show current date and time',
                command: process.platform === 'win32' ? 'date' : 'date',
                args: process.platform === 'win32' ? ['/t'] : [],
                category: 'system',
                outputProcessing: {
                    trimWhitespace: true
                }
            }
        ];
    }

    /**
     * Show task output in a dedicated output channel
     */
    private showTaskOutput(taskName: string, output: string, result: TaskExecutionResult): void {
        const outputChannel = vscode.window.createOutputChannel(`Shell Task: ${taskName}`);
        outputChannel.appendLine(output);
        
        if (result.stderr) {
            outputChannel.appendLine('\n--- STDERR ---');
            outputChannel.appendLine(result.stderr);
        }
        
        outputChannel.appendLine(`\n--- EXECUTION INFO ---`);
        outputChannel.appendLine(`Exit Code: ${result.exitCode}`);
        outputChannel.appendLine(`Execution Time: ${result.executionTime}ms`);
        outputChannel.appendLine(`Task ID: ${result.taskId}`);
        
        outputChannel.show();
    }

    /**
     * Open configuration file
     */
    private async openConfig(): Promise<void> {
        try {
            vscode.window.showInformationMessage('Configuration management will be implemented in the next task');
            // TODO: Implement in T028
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to open configuration');
        }
    }

    /**
     * Reload configuration
     */
    private async reloadConfig(): Promise<void> {
        try {
            vscode.window.showInformationMessage('Configuration reload will be implemented in the next task');
            // TODO: Implement in T028
        } catch (error) {
            this.errorHandler.handleError(error as Error, 'Failed to reload configuration');
        }
    }

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
}