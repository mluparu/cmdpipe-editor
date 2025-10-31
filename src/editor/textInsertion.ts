import * as vscode from 'vscode';
import { InsertionResult, OutputInsertionContext, InsertionMode } from '../types/extensionTypes';
import { Logger } from '../utils/logger';

/**
 * Options for text insertion formatting
 */
export interface InsertionOptions {
    /** Whether to maintain proper indentation */
    maintainIndentation?: boolean;
    
    /** Whether to add line breaks before/after insertion */
    addLineBreaks?: boolean;
    
    /** Custom prefix to add before the text */
    prefix?: string;
    
    /** Custom suffix to add after the text */
    suffix?: string;
    
    /** Whether to trim whitespace from inserted text */
    trimWhitespace?: boolean;
    
    /** Maximum length of output to process (for compatibility with output processing) */
    maxOutputLength?: number;
}

/**
 * TextInsertion handles inserting text into VSCode editors at cursor positions
 */
export class TextInsertion {
    private static instance: TextInsertion;
    private logger: Logger;

    private constructor() {
        this.logger = Logger.getInstance();
    }

    /**
     * Get the singleton instance of TextInsertion
     */
    public static getInstance(): TextInsertion {
        if (!TextInsertion.instance) {
            TextInsertion.instance = new TextInsertion();
        }
        return TextInsertion.instance;
    }

    // /**
    //  * Insert text at the current cursor position
    //  */
    // public async insertAtCursor(
    //     editorInfo: EditorInfo, 
    //     text: string, 
    //     options?: InsertionOptions
    // ): Promise<InsertionResult> {
    //     try {
    //         // Check if editor is readonly
    //         if (editorInfo.isReadonly) {
    //             return {
    //                 success: false,
    //                 charactersInserted: 0,
    //                 error: 'Cannot insert text: editor is readonly'
    //             };
    //         }

    //         // Process the text according to options
    //         const processedText = this.processText(text, options);
            
    //         // Create a workspace edit to insert the text
    //         const edit = new vscode.WorkspaceEdit();
    //         const insertPosition = editorInfo.cursorPosition;
            
    //         edit.insert(editorInfo.editor.document.uri, insertPosition, processedText);
            
    //         // Apply the edit
    //         const success = await vscode.workspace.applyEdit(edit);
            
    //         if (success) {
    //             // Calculate new cursor position
    //             const lines = processedText.split('\n');
    //             const newCursorPosition = this.calculateNewCursorPosition(insertPosition, lines);
                
    //             this.logger.debug(`Text inserted at ${insertPosition.line}:${insertPosition.character}`);
                
    //             return {
    //                 success: true,
    //                 charactersInserted: processedText.length,
    //                 newCursorPosition,
    //                 insertedText: processedText
    //             };
    //         } else {
    //             return {
    //                 success: false,
    //                 charactersInserted: 0,
    //                 error: 'Failed to apply text insertion'
    //             };
    //         }
    //     } catch (error) {
    //         this.logger.error('Error inserting text at cursor', error as Error);
    //         return {
    //             success: false,
    //             charactersInserted: 0,
    //             error: `Insertion failed: ${(error as Error).message}`
    //         };
    //     }
    // }

    // /**
    //  * Replace the current selection with new text
    //  */
    // public async replaceSelection(
    //     editorInfo: EditorInfo, 
    //     text: string, 
    //     options?: InsertionOptions
    // ): Promise<InsertionResult> {
    //     try {
    //         // Check if editor is readonly
    //         if (editorInfo.isReadonly) {
    //             return {
    //                 success: false,
    //                 charactersInserted: 0,
    //                 error: 'Cannot replace text: editor is readonly'
    //             };
    //         }

    //         // Process the text according to options
    //         const processedText = this.processText(text, options);
            
    //         // Create a workspace edit to replace the selection
    //         const edit = new vscode.WorkspaceEdit();
    //         const selection = editorInfo.selection;
            
    //         if (selection.isEmpty) {
    //             // No selection, just insert at cursor
    //             return this.insertAtCursor(editorInfo, text, options);
    //         }
            
    //         edit.replace(editorInfo.editor.document.uri, selection, processedText);
            
    //         // Apply the edit
    //         const success = await vscode.workspace.applyEdit(edit);
            
    //         if (success) {
    //             // Calculate new cursor position and selection range
    //             const lines = processedText.split('\n');
    //             const newCursorPosition = this.calculateNewCursorPosition(selection.start, lines);
                
    //             // Create new selection for the inserted text
    //             const newSelection = new vscode.Selection(selection.start, newCursorPosition);
    //             editorInfo.editor.selection = newSelection;
                
    //             this.logger.debug(`Text replaced in selection from ${selection.start.line}:${selection.start.character} to ${selection.end.line}:${selection.end.character}`);
                
    //             return {
    //                 success: true,
    //                 charactersInserted: processedText.length,
    //                 newCursorPosition,
    //                 insertedText: processedText
    //             };
    //         } else {
    //             return {
    //                 success: false,
    //                 charactersInserted: 0,
    //                 error: 'Failed to apply text replacement'
    //             };
    //         }
    //     } catch (error) {
    //         this.logger.error('Error replacing selected text', error as Error);
    //         return {
    //             success: false,
    //             charactersInserted: 0,
    //             error: `Replacement failed: ${(error as Error).message}`
    //         };
    //     }
    // }

    // /**
    //  * Insert text at a specific position in the editor
    //  */
    // public async insertAtPosition(
    //     editorInfo: EditorInfo,
    //     position: vscode.Position,
    //     text: string,
    //     options?: InsertionOptions
    // ): Promise<InsertionResult> {
    //     try {
    //         // Check if editor is readonly
    //         if (editorInfo.isReadonly) {
    //             return {
    //                 success: false,
    //                 charactersInserted: 0,
    //                 error: 'Cannot insert text: editor is readonly'
    //             };
    //         }

    //         // Process the text according to options
    //         const processedText = this.processText(text, options);
            
    //         // Create a workspace edit to insert the text
    //         const edit = new vscode.WorkspaceEdit();
    //         edit.insert(editorInfo.editor.document.uri, position, processedText);
            
    //         // Apply the edit
    //         const success = await vscode.workspace.applyEdit(edit);
            
    //         if (success) {
    //             // Calculate new cursor position
    //             const lines = processedText.split('\n');
    //             const newCursorPosition = this.calculateNewCursorPosition(position, lines);
                
    //             this.logger.debug(`Text inserted at specific position ${position.line}:${position.character}`);
                
    //             return {
    //                 success: true,
    //                 charactersInserted: processedText.length,
    //                 newCursorPosition,
    //                 insertedText: processedText
    //             };
    //         } else {
    //             return {
    //                 success: false,
    //                 charactersInserted: 0,
    //                 error: 'Failed to apply text insertion at position'
    //             };
    //         }
    //     } catch (error) {
    //         this.logger.error('Error inserting text at position', error as Error);
    //         return {
    //             success: false,
    //             charactersInserted: 0,
    //             error: `Position insertion failed: ${(error as Error).message}`
    //         };
    //     }
    // }

    // /**
    //  * Append text to the end of the document
    //  */
    // public async appendToDocument(
    //     editorInfo: EditorInfo,
    //     text: string,
    //     options?: InsertionOptions
    // ): Promise<InsertionResult> {
    //     try {
    //         // Check if editor is readonly
    //         if (editorInfo.isReadonly) {
    //             return {
    //                 success: false,
    //                 charactersInserted: 0,
    //                 error: 'Cannot append text: editor is readonly'
    //             };
    //         }

    //         const document = editorInfo.editor.document;
    //         const lastLine = document.lineCount - 1;
    //         const lastLineText = document.lineAt(lastLine).text;
    //         const endPosition = new vscode.Position(lastLine, lastLineText.length);
            
    //         // Add a newline before the text if the document doesn't end with one
    //         let textToInsert = text;
    //         if (lastLineText.length > 0 && !lastLineText.endsWith('\n')) {
    //             textToInsert = '\n' + text;
    //         }
            
    //         return this.insertAtPosition(editorInfo, endPosition, textToInsert, options);
    //     } catch (error) {
    //         this.logger.error('Error appending text to document', error as Error);
    //         return {
    //             success: false,
    //             charactersInserted: 0,
    //             error: `Append failed: ${(error as Error).message}`
    //         };
    //     }
    // }

    // /**
    //  * Generic text insertion method with options
    //  */
    // public async insertText(
    //     editorInfo: EditorInfo,
    //     text: string,
    //     mode?: string
    // ): Promise<InsertionResult> {
    //     const insertionMode = mode || 'insert-at-cursor';
    //     let result: InsertionResult;
        
    //     switch (insertionMode) {
    //         case 'replace-selection':
    //             result = await this.replaceSelection(editorInfo, text);
    //             break;
    //         case 'insert-at-cursor':
    //             result = await this.insertAtCursor(editorInfo, text);
    //             break;
    //         case 'append-line':
    //             result = await this.appendToLine(editorInfo, text);
    //             break;
    //         case 'append-document':
    //             result = await this.appendToDocument(editorInfo, text);
    //             break;
    //         default:
    //             result = await this.insertAtCursor(editorInfo, text);
    //             break;
    //     }
        
    //     // Add the insertion mode to the result
    //     return {
    //         ...result,
    //         insertionMode
    //     };
    // }

    // /**
    //  * Append text to the end of the current line
    //  */
    // public async appendToLine(
    //     editorInfo: EditorInfo,
    //     text: string,
    //     options?: InsertionOptions
    // ): Promise<InsertionResult> {
    //     try {
    //         // Check if editor is readonly
    //         if (editorInfo.isReadonly) {
    //             return {
    //                 success: false,
    //                 charactersInserted: 0,
    //                 error: 'Cannot append text: editor is readonly'
    //             };
    //         }

    //         const currentPosition = editorInfo.cursorPosition;
    //         const document = editorInfo.editor.document;
    //         const currentLine = document.lineAt(currentPosition.line);
    //         const endOfLinePosition = new vscode.Position(currentPosition.line, currentLine.text.length);
            
    //         return this.insertAtPosition(editorInfo, endOfLinePosition, text, options);
    //     } catch (error) {
    //         this.logger.error('Error appending text to line', error as Error);
    //         return {
    //             success: false,
    //             charactersInserted: 0,
    //             error: `Append to line failed: ${(error as Error).message}`
    //         };
    //     }
    // }

    // /**
    //  * Process output for insertion with formatting options
    //  */
    // public processOutputForInsertion(
    //     output: string,
    //     options?: InsertionOptions
    // ): string {
    //     return this.processText(output, options);
    // }

    private processText(text: string, options?: InsertionOptions): string {
        if (!options) {
            return text;
        }

        let processed = text;

        // Trim whitespace if requested
        if (options.trimWhitespace) {
            processed = processed.trim();
        }

        // Limit length if specified
        if (options.maxOutputLength && processed.length > options.maxOutputLength) {
            processed = processed.substring(0, options.maxOutputLength);
        }

        // Add prefix and suffix
        if (options.prefix) {
            processed = options.prefix + processed;
        }
        if (options.suffix) {
            processed = processed + options.suffix;
        }

        // Add line breaks if requested
        if (options.addLineBreaks) {
            if (!processed.startsWith('\n')) {
                processed = '\n' + processed;
            }
            if (!processed.endsWith('\n')) {
                processed = processed + '\n';
            }
        }

        return processed;
    }

    /**
     * Calculate the new cursor position after inserting text
     */
    private calculateNewCursorPosition(
        startPosition: vscode.Position, 
        insertedLines: string[]
    ): vscode.Position {
        if (insertedLines.length === 1) {
            // Single line insertion
            return new vscode.Position(
                startPosition.line,
                startPosition.character + insertedLines[0].length
            );
        } else {
            // Multi-line insertion
            const lastLineLength = insertedLines[insertedLines.length - 1].length;
            return new vscode.Position(
                startPosition.line + insertedLines.length - 1,
                lastLineLength
            );
        }
    }

    // /**
    //  * Get current indentation at a position
    //  */
    // private getIndentationAtPosition(document: vscode.TextDocument, position: vscode.Position): string {
    //     const line = document.lineAt(position.line);
    //     const match = line.text.match(/^(\s*)/);
    //     return match ? match[1] : '';
    // }

    // /**
    //  * Apply consistent indentation to multi-line text
    //  */
    // private applyIndentation(text: string, baseIndentation: string): string {
    //     const lines = text.split('\n');
    //     return lines.map((line, index) => {
    //         // Don't indent the first line (it continues from cursor position)
    //         if (index === 0) {
    //             return line;
    //         }
    //         // Apply base indentation to subsequent lines
    //         return baseIndentation + line;
    //     }).join('\n');
    // }

    /**
     * Insert output using OutputInsertionContext with mode-specific handling
     */
    public async insertOutput(
        context: OutputInsertionContext,
        output: string,
        options?: InsertionOptions
    ): Promise<InsertionResult> {
        // If no active editor, show in output panel
        if (!context.hasActiveEditor) {
            await this.showInOutputPanel(output, 'Task Output');
            return {
                success: true,
                charactersInserted: 0,
                insertedText: output
            };
        }

        // Handle readonly editors
        if (context.isReadonly) {
            await this.showInOutputPanel(output, 'Task Output (Read-only Editor)');
            return {
                success: true,
                charactersInserted: 0,
                insertedText: output,
                insertionMode: 'output-panel'
            };
        }

        // Handle different insertion modes
        switch (context.insertionMode) {
            case InsertionMode.CURSOR:
                return await this.insertAtCursorPosition(context, output, options);
            
            case InsertionMode.REPLACE_SELECTION:
                return await this.replaceSelectedText(context, output, options);
            
            case InsertionMode.APPEND_LINE:
                return await this.appendToCurrentLine(context, output, options);
            
            case InsertionMode.OUTPUT_PANEL:
                await this.showInOutputPanel(output, 'Task Output');
                return {
                    success: true,
                    charactersInserted: 0,
                    insertedText: output,
                    insertionMode: 'output-panel'
                };
            
            default:
                // Fallback to cursor insertion
                return await this.insertAtCursorPosition(context, output, options);
        }
    }

    /**
     * Insert text at cursor position using OutputInsertionContext
     */
    private async insertAtCursorPosition(
        context: OutputInsertionContext,
        text: string,
        options?: InsertionOptions
    ): Promise<InsertionResult> {
        try {
            const processedText = this.processText(text, options);
            const edit = new vscode.WorkspaceEdit();
            
            edit.insert(context.editorUri, context.cursorPosition, processedText);
            
            const success = await vscode.workspace.applyEdit(edit);
            
            if (success) {
                const lines = processedText.split('\n');
                const newCursorPosition = this.calculateNewCursorPosition(context.cursorPosition, lines);
                
                this.logger.debug(`Text inserted at cursor ${context.cursorPosition.line}:${context.cursorPosition.character}`);
                
                return {
                    success: true,
                    charactersInserted: processedText.length,
                    newCursorPosition,
                    insertedText: processedText,
                    insertionMode: 'cursor'
                };
            } else {
                return {
                    success: false,
                    charactersInserted: 0,
                    error: 'Failed to apply text insertion at cursor'
                };
            }
        } catch (error) {
            this.logger.error('Error inserting text at cursor position', error as Error);
            return {
                success: false,
                charactersInserted: 0,
                error: `Text insertion failed: ${(error as Error).message}`
            };
        }
    }

    /**
     * Replace selected text using OutputInsertionContext
     */
    private async replaceSelectedText(
        context: OutputInsertionContext,
        text: string,
        options?: InsertionOptions
    ): Promise<InsertionResult> {
        try {
            const processedText = this.processText(text, options);
            const edit = new vscode.WorkspaceEdit();
            
            if (context.selectedRange) {
                edit.replace(context.editorUri, context.selectedRange, processedText);
            } else {
                // No selection, fall back to cursor insertion
                edit.insert(context.editorUri, context.cursorPosition, processedText);
            }
            
            const success = await vscode.workspace.applyEdit(edit);
            
            if (success) {
                const lines = processedText.split('\n');
                const startPos = context.selectedRange?.start || context.cursorPosition;
                const newCursorPosition = this.calculateNewCursorPosition(startPos, lines);
                
                this.logger.debug(`Text replaced selection at ${startPos.line}:${startPos.character}`);
                
                return {
                    success: true,
                    charactersInserted: processedText.length,
                    newCursorPosition,
                    insertedText: processedText,
                    insertionMode: 'replace-selection'
                };
            } else {
                return {
                    success: false,
                    charactersInserted: 0,
                    error: 'Failed to replace selected text'
                };
            }
        } catch (error) {
            this.logger.error('Error replacing selected text', error as Error);
            return {
                success: false,
                charactersInserted: 0,
                error: `Text replacement failed: ${(error as Error).message}`
            };
        }
    }

    /**
     * Append text to current line using OutputInsertionContext
     */
    private async appendToCurrentLine(
        context: OutputInsertionContext,
        text: string,
        options?: InsertionOptions
    ): Promise<InsertionResult> {
        try {
            // Get the document to find end of current line
            const document = await vscode.workspace.openTextDocument(context.editorUri);
            const currentLine = document.lineAt(context.cursorPosition.line);
            const endOfLinePosition = new vscode.Position(context.cursorPosition.line, currentLine.text.length);
            
            const processedText = this.processText(text, { ...options, prefix: ' ' }); // Add space before appended text
            const edit = new vscode.WorkspaceEdit();
            
            edit.insert(context.editorUri, endOfLinePosition, processedText);
            
            const success = await vscode.workspace.applyEdit(edit);
            
            if (success) {
                const lines = processedText.split('\n');
                const newCursorPosition = this.calculateNewCursorPosition(endOfLinePosition, lines);
                
                this.logger.debug(`Text appended to line ${context.cursorPosition.line}`);
                
                return {
                    success: true,
                    charactersInserted: processedText.length,
                    newCursorPosition,
                    insertedText: processedText,
                    insertionMode: 'append-line'
                };
            } else {
                return {
                    success: false,
                    charactersInserted: 0,
                    error: 'Failed to append text to line'
                };
            }
        } catch (error) {
            this.logger.error('Error appending text to line', error as Error);
            return {
                success: false,
                charactersInserted: 0,
                error: `Text append failed: ${(error as Error).message}`
            };
        }
    }

    /**
     * Show output in VS Code output panel
     */
    private async showInOutputPanel(output: string, title: string): Promise<void> {
        const outputChannel = vscode.window.createOutputChannel(title);
        outputChannel.appendLine(output);
        outputChannel.show();
        
        this.logger.debug(`Output shown in panel: ${title}`);
    }

    // /**
    //  * Determine if editor context allows insertion
    //  */
    // public canInsertInEditor(context: OutputInsertionContext): boolean {
    //     return context.hasActiveEditor && !context.isReadonly;
    // }

    // /**
    //  * Get best insertion mode for context
    //  */
    // public getBestInsertionMode(context: OutputInsertionContext): InsertionMode {
    //     if (!context.hasActiveEditor || context.isReadonly) {
    //         return InsertionMode.OUTPUT_PANEL;
    //     }

    //     if (context.selectedRange && !context.selectedRange.isEmpty) {
    //         return InsertionMode.REPLACE_SELECTION;
    //     }

    //     return InsertionMode.CURSOR;
    // }
}