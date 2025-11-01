// /*
//  * DEPRECATED: This file has been superseded by the unified CommandHandler.
//  * All quick command functionality has been moved to src/commands/commandHandler.ts
//  * This file is kept for reference but should not be used.
//  * 
//  * Date deprecated: 2025-10-29
//  * Replacement: CommandHandler.quickCommand(), CommandHandler.executeSelection(), CommandHandler.insertDateTime()
//  */

// import * as vscode from 'vscode';
// import { TaskDefinition } from '../types/taskTypes';
// import { CommandHandler } from './commandHandler';
// import { CursorManager } from '../editor/cursorManager';
// import { TextInsertion } from '../editor/textInsertion';
// import { Logger } from '../utils/logger';

// /**
//  * Quick commands for common shell task operations
//  */
// export class QuickCommands {
//     private static instance: QuickCommands;
//     private logger: Logger;
//     private commandHandler: CommandHandler;
//     private cursorManager: CursorManager;
//     private textInsertion: TextInsertion;

//     private constructor() {
//         this.logger = Logger.getInstance();
//         this.commandHandler = CommandHandler.getInstance();
//         this.cursorManager = CursorManager.getInstance();
//         this.textInsertion = TextInsertion.getInstance();
//     }

//     public static getInstance(): QuickCommands {
//         if (!QuickCommands.instance) {
//             QuickCommands.instance = new QuickCommands();
//         }
//         return QuickCommands.instance;
//     }

//     /**
//      * Register quick commands with VSCode
//      */
//     public registerCommands(context: vscode.ExtensionContext): void {
//         const commands = [
//             vscode.commands.registerCommand('shellTaskPipe.quickCommand', this.quickCommand.bind(this)),
//             vscode.commands.registerCommand('shellTaskPipe.executeSelection', this.executeSelection.bind(this)),
//             vscode.commands.registerCommand('shellTaskPipe.insertDateTime', this.insertDateTime.bind(this))
//         ];

//         commands.forEach(command => context.subscriptions.push(command));
//         this.logger.info('Registered quick commands');
//     }

//     /**
//      * Quick command - allows user to enter any shell command
//      */
//     public async quickCommand(): Promise<void> {
//         try {
//             const command = await vscode.window.showInputBox({
//                 prompt: 'Enter shell command to execute',
//                 placeHolder: 'ls -la'
//             });

//             if (!command) {
//                 return;
//             }

//             const editorInfo = this.cursorManager.getActiveEditor();
//             if (!editorInfo) {
//                 vscode.window.showErrorMessage('No active editor found');
//                 return;
//             }

//             // Parse command and args
//             const parts = command.trim().split(/\s+/);
//             const cmd = parts[0];
//             const args = parts.slice(1);

//             const task: TaskDefinition = {
//                 id: 'quick-command',
//                 name: 'Quick Command',
//                 command: cmd,
//                 args: args.length > 0 ? args : undefined,
//                 outputProcessing: {
//                     trimWhitespace: true
//                 }
//             };

//             await this.executeQuickTask(task, editorInfo);

//         } catch (error) {
//             this.logger.error('Quick command failed', error as Error);
//             vscode.window.showErrorMessage('Quick command failed');
//         }
//     }

//     /**
//      * Execute selected text as a shell command
//      */
//     public async executeSelection(insertionMode?: string): Promise<void> {
//         try {
//             const editorInfo = this.cursorManager.getActiveEditor();
//             if (!editorInfo) {
//                 vscode.window.showErrorMessage('No active editor found');
//                 return;
//             }

//             const selectedText = this.cursorManager.getSelectedText();
//             if (!selectedText.trim()) {
//                 vscode.window.showErrorMessage('No text selected');
//                 return;
//             }

//             // Parse the selected text as a command
//             const parts = selectedText.trim().split(/\s+/);
//             const cmd = parts[0];
//             const args = parts.slice(1);

//             const task: TaskDefinition = {
//                 id: 'execute-selection',
//                 name: 'Execute Selection',
//                 command: cmd,
//                 args: args.length > 0 ? args : undefined,
//                 outputProcessing: {
//                     trimWhitespace: true,
//                     maxOutputLength: 5000
//                 }
//             };

//             var selectedInsertionMode: string;

//             if (insertionMode) {
//                 const validModes = ['replace-selection', 'insert-at-cursor', 'append-line', 'show-output', 'prompt'];
//                 if (validModes.includes(insertionMode)) {
//                     selectedInsertionMode = insertionMode;
//                 } else {
//                     vscode.window.showErrorMessage(`Invalid insertion mode: ${insertionMode}. Valid modes are: ${validModes.join(', ')}`);
//                     return;
//                 }
//             }
//             else
//             {
//                 // Read insertion mode from settings if not provided, default to 'prompt'
//                 const config = vscode.workspace.getConfiguration('shellTaskPipe');
//                 const defaultInsertionMode = config.get<string>('executeSelectionInsertionMode', 'prompt');
//                 selectedInsertionMode = defaultInsertionMode;
//             }

//             if (!selectedInsertionMode || selectedInsertionMode === 'prompt') {                
//                 // Ask user where to insert the output
//                 const insertionModeChoice = await vscode.window.showQuickPick([
//                     { label: 'Replace Selection', value: 'replace-selection' },
//                     { label: 'Insert at Cursor', value: 'insert-at-cursor' },
//                     { label: 'Append to Line', value: 'append-line' },
//                     { label: 'Show in Output Panel', value: 'show-output' }
//                 ], {
//                     placeHolder: 'Where should the output be inserted?'
//                 });

//                 if (!insertionModeChoice) {
//                     return;
//                 }

//                 // override selected insertion mode
//                 selectedInsertionMode = insertionModeChoice.value;
//             }

//             if (selectedInsertionMode === 'show-output') {
//                 // Execute without inserting
//                 await this.executeQuickTask(task);
//             } else {
//                 // Execute and insert with specified mode
//                 await this.executeQuickTask(task, editorInfo, selectedInsertionMode);
//             }

//         } catch (error) {
//             this.logger.error('Execute selection failed', error as Error);
//             vscode.window.showErrorMessage('Execute selection failed');
//         }
//     }

//     /**
//      * Insert current date and time
//      * @param format Optional format parameter. If not provided, shows quick pick menu.
//      */
//     public async insertDateTime(format?: string): Promise<void> {
//         this.logger.info('Insert date/time command invoked');
//         try {
//             const editorInfo = this.cursorManager.getActiveEditor();
//             if (!editorInfo) {
//                 vscode.window.showErrorMessage('No active editor found');
//                 return;
//             }

//             let selectedFormat: string;

//             // If format parameter is provided, use it directly
//             if (format) {
//                 // Validate the format is supported
//                 const validFormats = ['iso', 'local', 'date', 'time', 'us-date', 'eu-date', 'long', 'short', 'timestamp', 'custom'];
//                 if (validFormats.includes(format)) {
//                     selectedFormat = format;
//                 } else {
//                     vscode.window.showErrorMessage(`Invalid date format: ${format}. Valid formats: ${validFormats.join(', ')}`);
//                     return;
//                 }
//             } else {
//                 // Show quick pick menu if no parameter provided
//                 const formatChoice = await vscode.window.showQuickPick([
//                     { label: 'ISO Format', value: 'iso', description: '2025-10-23T14:30:00Z' },
//                     { label: 'Local Date/Time', value: 'local', description: '10/23/2025, 2:30:00 PM' },
//                     { label: 'Date Only', value: 'date', description: '2025-10-23' },
//                     { label: 'Time Only', value: 'time', description: '14:30:00' },
//                     { label: 'US Date', value: 'us-date', description: '10/23/2025' },
//                     { label: 'European Date', value: 'eu-date', description: '23/10/2025' },
//                     { label: 'Long Format', value: 'long', description: 'Wednesday, October 23, 2025' },
//                     { label: 'Short Format', value: 'short', description: 'Oct 23, 2025' },
//                     { label: 'Timestamp', value: 'timestamp', description: '1729694200000' },
//                     { label: 'Custom Format', value: 'custom', description: '2025-10-23 14:30' }
//                 ], {
//                     placeHolder: 'Select date/time format'
//                 });

//                 if (!formatChoice) {
//                     return;
//                 }

//                 selectedFormat = formatChoice.value;
//             }

//             const now = new Date();
//             const dateString = this.formatDate(now, selectedFormat);

//             const result = await this.textInsertion.replaceSelection(editorInfo, dateString);
            
//             if (result.success) {
//                 vscode.window.showInformationMessage('Date/time inserted');
//             } else {
//                 vscode.window.showErrorMessage('Failed to insert date/time');
//             }

//         } catch (error) {
//             this.logger.error('Insert date/time failed', error as Error);
//             vscode.window.showErrorMessage('Insert date/time failed');
//         }
//     }

//     /**
//      * Execute a quick task with optional output insertion
//      */
//     private async executeQuickTask(
//         task: TaskDefinition, 
//         editorInfo?: any, 
//         insertionMode: string = 'replace-selection'
//     ): Promise<void> {
//         try {
//             await vscode.window.withProgress({
//                 location: vscode.ProgressLocation.Notification,
//                 title: `Running: ${task.command}`,
//                 cancellable: true
//             }, async (progress, token) => {
//                 // Import ShellExecutor and OutputProcessor here to avoid circular dependencies
//                 const { ShellExecutor } = await import('../shell/shellExecutor');
//                 const { OutputProcessor } = await import('../shell/outputProcessor');
                
//                 const executor = ShellExecutor.getInstance();
//                 const processor = new OutputProcessor();

//                 progress.report({ message: 'Executing...' });
//                 const result = await executor.executeTask(task);

//                 if (token.isCancellationRequested) {
//                     await executor.terminateTask(task.id);
//                     return;
//                 }

//                 if (!result.success) {
//                     throw new Error(result.error || 'Command execution failed');
//                 }

//                 const processedOutput = processor.processOutput(result.output, task, insertionMode);

//                 if (editorInfo && this.textInsertion.canInsertInEditor(editorInfo)) {
//                     progress.report({ message: 'Inserting output...' });
                    
//                     let insertResult;
//                     switch (insertionMode) {
//                         case 'append-line':
//                             insertResult = await this.textInsertion.appendToLine(editorInfo, processedOutput);
//                             break;
//                         case 'insert-at-cursor':
//                             insertResult = await this.textInsertion.insertAtCursor(editorInfo, processedOutput);
//                             break;
//                         default:
//                         case 'replace-selection':
//                             insertResult = await this.textInsertion.replaceSelection(editorInfo, processedOutput);
//                             break;
//                     }

//                     if (!insertResult.success) {
//                         throw new Error('Failed to insert output');
//                     }

//                     vscode.window.showInformationMessage('Command output inserted');
//                 } else {
//                     // Show in output channel
//                     const outputChannel = vscode.window.createOutputChannel(`Quick Command: ${task.command}`);
//                     outputChannel.appendLine(processor.formatOutputForOutputChannel(processedOutput, task));
//                     outputChannel.show();
//                 }
//             });

//         } catch (error) {
//             this.logger.error(`Quick task failed: ${(error as Error).message}`);
//             vscode.window.showErrorMessage(`Command failed: ${(error as Error).message}`);
//         }
//     }

//     /**
//      * Format date object into a string based on the selected format
//      */
//     private formatDate(date: Date, format: string): string {
//         try {
//             switch (format) {
//                 case 'iso':
//                     return date.toISOString();
//                 case 'local':
//                     return date.toLocaleString();
//                 case 'date':
//                     return date.toISOString().split('T')[0];
//                 case 'time':
//                     return date.toTimeString().split(' ')[0];
//                 case 'us-date':
//                     return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
//                 case 'eu-date':
//                     return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
//                 case 'long':
//                     return date.toLocaleString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
//                 case 'short':
//                     return date.toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric' });
//                 case 'timestamp':
//                     return date.getTime().toString();
//                 case 'custom':
//                     return `${date.toISOString().split('T')[0]} ${date.toTimeString().split(' ')[0]}`;
//                 default:
//                     return date.toISOString();
//             }
//         } catch (error) {
//             this.logger.error('Date formatting failed', error as Error);
//             return date.toISOString();
//         }
//     }
// }