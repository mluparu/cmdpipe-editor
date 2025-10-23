import * as vscode from 'vscode';
import { EditorInfo } from '../types/extensionTypes';
import { createScopedLogger } from '../utils/logger';
import { ShellTaskPipeError, ErrorType } from '../utils/errorHandler';

const logger = createScopedLogger('CursorManager');

/**
 * Manages cursor position and selection state in VSCode editors
 */
export class CursorManager {
    private static _instance: CursorManager;

    private constructor() {}

    public static getInstance(): CursorManager {
        if (!CursorManager._instance) {
            CursorManager._instance = new CursorManager();
        }
        return CursorManager._instance;
    }

    /**
     * Get information about the currently active editor
     */
    public getActiveEditor(): EditorInfo | null {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            logger.debug('No active editor found');
            return null;
        }

        const cursorPosition = activeEditor.selection.active;
        const selection = activeEditor.selection;
        const documentUri = activeEditor.document.uri;
        const isReadonly = this.isReadonlyDocument(activeEditor.document);

        logger.debug(`Active editor found: ${documentUri.fsPath}, cursor at ${cursorPosition.line}:${cursorPosition.character}`);

        return {
            editor: activeEditor,
            cursorPosition,
            selection,
            isReadonly,
            documentUri
        };
    }

    /**
     * Get the current cursor position in the active editor
     */
    public getCursorPosition(): vscode.Position | null {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return null;
        }

        return activeEditor.selection.active;
    }

    /**
     * Get the current selection in the active editor
     */
    public getCurrentSelection(): vscode.Selection | null {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return null;
        }

        return activeEditor.selection;
    }

    /**
     * Get all selections in the active editor (for multi-cursor support)
     */
    public getAllSelections(): vscode.Selection[] {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return [];
        }

        return [...activeEditor.selections];
    }

    /**
     * Check if the current selection is empty (just a cursor position)
     */
    public isSelectionEmpty(): boolean {
        const selection = this.getCurrentSelection();
        
        if (!selection) {
            return true;
        }

        return selection.isEmpty;
    }

    /**
     * Get the text that is currently selected
     */
    public getSelectedText(): string {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor || activeEditor.selection.isEmpty) {
            return '';
        }

        return activeEditor.document.getText(activeEditor.selection);
    }

    /**
     * Get the line at the current cursor position
     */
    public getLineAtCursor(): vscode.TextLine | null {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return null;
        }

        const cursorPosition = activeEditor.selection.active;
        return activeEditor.document.lineAt(cursorPosition.line);
    }

    /**
     * Get the word at the current cursor position
     */
    public getWordAtCursor(): string {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return '';
        }

        const cursorPosition = activeEditor.selection.active;
        const wordRange = activeEditor.document.getWordRangeAtPosition(cursorPosition);
        
        if (!wordRange) {
            return '';
        }

        return activeEditor.document.getText(wordRange);
    }

    /**
     * Move the cursor to a specific position
     */
    public async moveCursor(position: vscode.Position): Promise<boolean> {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            logger.warn('Cannot move cursor: no active editor');
            return false;
        }

        try {
            const newSelection = new vscode.Selection(position, position);
            activeEditor.selection = newSelection;
            
            // Reveal the new cursor position
            activeEditor.revealRange(newSelection, vscode.TextEditorRevealType.InCenter);
            
            logger.debug(`Cursor moved to ${position.line}:${position.character}`);
            return true;
            
        } catch (error) {
            logger.error('Failed to move cursor', error as Error);
            return false;
        }
    }

    /**
     * Set the selection to a specific range
     */
    public async setSelection(selection: vscode.Selection): Promise<boolean> {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            logger.warn('Cannot set selection: no active editor');
            return false;
        }

        try {
            activeEditor.selection = selection;
            
            // Reveal the selection
            activeEditor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
            
            logger.debug(`Selection set from ${selection.start.line}:${selection.start.character} to ${selection.end.line}:${selection.end.character}`);
            return true;
            
        } catch (error) {
            logger.error('Failed to set selection', error as Error);
            return false;
        }
    }

    /**
     * Set multiple selections (for multi-cursor support)
     */
    public async setSelections(selections: vscode.Selection[]): Promise<boolean> {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            logger.warn('Cannot set selections: no active editor');
            return false;
        }

        if (selections.length === 0) {
            logger.warn('No selections provided');
            return false;
        }

        try {
            activeEditor.selections = selections;
            
            // Reveal the primary selection
            const primarySelection = selections[0];
            activeEditor.revealRange(primarySelection, vscode.TextEditorRevealType.InCenter);
            
            logger.debug(`Set ${selections.length} selections`);
            return true;
            
        } catch (error) {
            logger.error('Failed to set selections', error as Error);
            return false;
        }
    }

    /**
     * Check if the given editor info represents a readonly editor
     */
    public isReadonlyEditor(editorInfo: EditorInfo): boolean {
        return editorInfo.isReadonly;
    }

    /**
     * Check if a document is readonly based on its scheme or other properties
     */
    private isReadonlyDocument(document: vscode.TextDocument): boolean {
        // Check for readonly schemes
        const readonlySchemes = ['readonly', 'git', 'gitfs', 'output'];
        
        if (readonlySchemes.includes(document.uri.scheme)) {
            return true;
        }

        // Check if the document is untitled but saved (which would be readonly)
        if (document.isUntitled && !document.isDirty) {
            return false; // Untitled documents are typically editable
        }

        // Check for specific readonly indicators
        if (document.fileName && document.fileName.includes('.git/')) {
            return true;
        }

        // Default to writable for file scheme and untitled documents
        return false;
    }

    /**
     * Get the context around the cursor position
     */
    public getCursorContext(linesBefore: number = 2, linesAfter: number = 2): {
        beforeText: string;
        currentLine: string;
        afterText: string;
        cursorPosition: vscode.Position;
    } | null {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return null;
        }

        const document = activeEditor.document;
        const cursorPosition = activeEditor.selection.active;
        const currentLineNumber = cursorPosition.line;

        try {
            // Get lines before cursor
            const beforeStartLine = Math.max(0, currentLineNumber - linesBefore);
            const beforeLines: string[] = [];
            for (let i = beforeStartLine; i < currentLineNumber; i++) {
                beforeLines.push(document.lineAt(i).text);
            }

            // Get current line
            const currentLine = document.lineAt(currentLineNumber).text;

            // Get lines after cursor
            const afterEndLine = Math.min(document.lineCount - 1, currentLineNumber + linesAfter);
            const afterLines: string[] = [];
            for (let i = currentLineNumber + 1; i <= afterEndLine; i++) {
                afterLines.push(document.lineAt(i).text);
            }

            return {
                beforeText: beforeLines.join('\n'),
                currentLine,
                afterText: afterLines.join('\n'),
                cursorPosition
            };

        } catch (error) {
            logger.error('Failed to get cursor context', error as Error);
            return null;
        }
    }

    /**
     * Check if the cursor is at the beginning of a line
     */
    public isCursorAtLineStart(): boolean {
        const position = this.getCursorPosition();
        return position ? position.character === 0 : false;
    }

    /**
     * Check if the cursor is at the end of a line
     */
    public isCursorAtLineEnd(): boolean {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return false;
        }

        const position = activeEditor.selection.active;
        const line = activeEditor.document.lineAt(position.line);
        
        return position.character === line.text.length;
    }

    /**
     * Get the character at the cursor position
     */
    public getCharacterAtCursor(): string {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return '';
        }

        const position = activeEditor.selection.active;
        const line = activeEditor.document.lineAt(position.line);
        
        if (position.character >= line.text.length) {
            return '';
        }

        return line.text.charAt(position.character);
    }

    /**
     * Save the current cursor state for restoration later
     */
    public saveCursorState(): {
        selections: vscode.Selection[];
        visibleRange: vscode.Range | null;
    } | null {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return null;
        }

        return {
            selections: [...activeEditor.selections],
            visibleRange: activeEditor.visibleRanges.length > 0 ? activeEditor.visibleRanges[0] : null
        };
    }

    /**
     * Restore a previously saved cursor state
     */
    public async restoreCursorState(state: {
        selections: vscode.Selection[];
        visibleRange: vscode.Range | null;
    }): Promise<boolean> {
        const activeEditor = vscode.window.activeTextEditor;
        
        if (!activeEditor) {
            return false;
        }

        try {
            // Restore selections
            activeEditor.selections = state.selections;
            
            // Restore visible range if available
            if (state.visibleRange) {
                activeEditor.revealRange(state.visibleRange, vscode.TextEditorRevealType.InCenter);
            }

            return true;
            
        } catch (error) {
            logger.error('Failed to restore cursor state', error as Error);
            return false;
        }
    }
}