import { CursorManager } from '../../../src/editor/cursorManager';
import { EditorInfo } from '../../../src/types/extensionTypes';

// VSCode is already mocked globally via Jest configuration
const vscode = require('vscode');

describe('CursorManager', () => {
    let cursorManager: CursorManager;

    beforeEach(() => {
        jest.clearAllMocks();
        vscode.window.activeTextEditor = undefined;
        
        // Now we can successfully create the CursorManager instance
        cursorManager = CursorManager.getInstance();
    });

    describe('getInstance', () => {
        it('should return a singleton instance', () => {
            const instance1 = CursorManager.getInstance();
            const instance2 = CursorManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('getActiveEditor', () => {
        it('should return null when no active editor', () => {
            // Arrange
            vscode.window.activeTextEditor = undefined;
            
            // Act
            const result = cursorManager.getActiveEditor();
            
            // Assert
            expect(result).toBeNull();
        });

        it('should return editor info when active editor exists', () => {
            // Arrange
            const mockEditor = createMockEditor();
            vscode.window.activeTextEditor = mockEditor;
            
            // Act
            const result = cursorManager.getActiveEditor();
            
            // Assert
            expect(result).not.toBeNull();
            expect(result?.editor).toBe(mockEditor);
            expect(result?.cursorPosition.line).toBe(1);
            expect(result?.cursorPosition.character).toBe(2);
        });

        it('should detect readonly editor correctly', () => {
            // Arrange
            const mockEditor = createMockEditor();
            mockEditor.document.uri.scheme = 'readonly';
            vscode.window.activeTextEditor = mockEditor;
            
            // Act
            const result = cursorManager.getActiveEditor();
            
            // Assert
            expect(result).not.toBeNull();
            expect(result?.isReadonly).toBe(true);
        });
    });

    describe('getCursorPosition', () => {
        it('should return cursor position from active selection', () => {
            // Arrange
            const mockEditor = createMockEditor();
            vscode.window.activeTextEditor = mockEditor;
            
            // Act
            const result = cursorManager.getCursorPosition();
            
            // Assert
            expect(result).not.toBeNull();
            expect(result?.line).toBe(1);
            expect(result?.character).toBe(2);
        });

        it('should return null when no active editor', () => {
            // Arrange
            vscode.window.activeTextEditor = undefined;
            
            // Act
            const result = cursorManager.getCursorPosition();
            
            // Assert
            expect(result).toBeNull();
        });
    });

    describe('getCurrentSelection', () => {
        it('should return current selection', () => {
            // Arrange
            const mockEditor = createMockEditor();
            vscode.window.activeTextEditor = mockEditor;
            
            // Act
            const result = cursorManager.getCurrentSelection();
            
            // Assert
            expect(result).not.toBeNull();
            expect(result).toBe(mockEditor.selection);
        });

        it('should return null when no active editor', () => {
            // Arrange
            vscode.window.activeTextEditor = undefined;
            
            // Act
            const result = cursorManager.getCurrentSelection();
            
            // Assert
            expect(result).toBeNull();
        });
    });

    describe('isSelectionEmpty', () => {
        it('should return true for empty selection', () => {
            // Arrange
            const mockEditor = createMockEditorWithEmptySelection();
            vscode.window.activeTextEditor = mockEditor;
            
            // Act
            const result = cursorManager.isSelectionEmpty();
            
            // Assert
            expect(result).toBe(true);
        });

        it('should return false for non-empty selection', () => {
            // Arrange
            const mockEditor = createMockEditorWithNonEmptySelection();
            vscode.window.activeTextEditor = mockEditor;
            
            // Act
            const result = cursorManager.isSelectionEmpty();
            
            // Assert
            expect(result).toBe(false);
        });

        it('should return true when no active editor', () => {
            // Arrange
            vscode.window.activeTextEditor = undefined;
            
            // Act
            const result = cursorManager.isSelectionEmpty();
            
            // Assert
            expect(result).toBe(true);
        });
    });

    describe('getSelectedText', () => {
        it('should return selected text', () => {
            // Arrange
            const mockEditor = createMockEditorWithNonEmptySelection();
            mockEditor.document.getText.mockReturnValue('selected text');
            vscode.window.activeTextEditor = mockEditor;
            
            // Act
            const result = cursorManager.getSelectedText();
            
            // Assert
            expect(result).toBe('selected text');
            expect(mockEditor.document.getText).toHaveBeenCalledWith(mockEditor.selection);
        });

        it('should return empty string for empty selection', () => {
            // Arrange
            const mockEditor = createMockEditorWithEmptySelection();
            vscode.window.activeTextEditor = mockEditor;
            
            // Act
            const result = cursorManager.getSelectedText();
            
            // Assert
            expect(result).toBe('');
        });

        it('should return empty string when no active editor', () => {
            // Arrange
            vscode.window.activeTextEditor = undefined;
            
            // Act
            const result = cursorManager.getSelectedText();
            
            // Assert
            expect(result).toBe('');
        });
    });

    describe('moveCursor', () => {
        it('should move cursor to specified position', async () => {
            // Arrange
            const mockEditor = createMockEditor();
            const targetPosition = new vscode.Position(2, 3);
            vscode.window.activeTextEditor = mockEditor;
            
            // Mock the editor selection assignment
            Object.defineProperty(mockEditor, 'selection', {
                writable: true,
                value: mockEditor.selection
            });
            
            // Act
            const result = await cursorManager.moveCursor(targetPosition);
            
            // Assert
            expect(result).toBe(true);
        });

        it('should return false when no active editor', async () => {
            // Arrange
            vscode.window.activeTextEditor = undefined;
            const targetPosition = new vscode.Position(2, 3);
            
            // Act
            const result = await cursorManager.moveCursor(targetPosition);
            
            // Assert
            expect(result).toBe(false);
        });
    });

    // Helper functions to create mock editors
    function createMockEditor() {
        const mockPosition = new vscode.Position(1, 2);
        const mockSelection = new vscode.Selection(mockPosition, mockPosition);
        
        return {
            document: {
                uri: { fsPath: '/test/file.txt', scheme: 'file' },
                languageId: 'plaintext',
                version: 1,
                getText: jest.fn().mockReturnValue('test content'),
                lineAt: jest.fn().mockReturnValue({
                    lineNumber: 1,
                    text: 'line2',
                    range: new vscode.Range(mockPosition, mockPosition),
                    firstNonWhitespaceCharacterIndex: 0,
                    isEmptyOrWhitespace: false
                }),
                getWordRangeAtPosition: jest.fn()
            },
            selection: mockSelection,
            selections: [mockSelection],
            options: {
                insertSpaces: true,
                tabSize: 4
            },
            revealRange: jest.fn()
        };
    }

    function createMockEditorWithEmptySelection() {
        const mockPosition = new vscode.Position(1, 2);
        const mockSelection = new vscode.Selection(mockPosition, mockPosition);
        
        return {
            document: {
                uri: { fsPath: '/test/file.txt', scheme: 'file' },
                languageId: 'plaintext',
                version: 1,
                getText: jest.fn().mockReturnValue(''),
                lineAt: jest.fn().mockReturnValue({
                    lineNumber: 1,
                    text: 'line2',
                    range: new vscode.Range(mockPosition, mockPosition),
                    firstNonWhitespaceCharacterIndex: 0,
                    isEmptyOrWhitespace: false
                }),
                getWordRangeAtPosition: jest.fn()
            },
            selection: mockSelection, // This will be isEmpty: true since start === end
            selections: [mockSelection],
            options: {
                insertSpaces: true,
                tabSize: 4
            },
            revealRange: jest.fn()
        };
    }

    function createMockEditorWithNonEmptySelection() {
        const startPosition = new vscode.Position(1, 2);
        const endPosition = new vscode.Position(1, 5);
        const mockSelection = new vscode.Selection(startPosition, endPosition);
        
        return {
            document: {
                uri: { fsPath: '/test/file.txt', scheme: 'file' },
                languageId: 'plaintext',
                version: 1,
                getText: jest.fn().mockReturnValue('test'),
                lineAt: jest.fn().mockReturnValue({
                    lineNumber: 1,
                    text: 'line2',
                    range: new vscode.Range(startPosition, endPosition),
                    firstNonWhitespaceCharacterIndex: 0,
                    isEmptyOrWhitespace: false
                }),
                getWordRangeAtPosition: jest.fn()
            },
            selection: mockSelection, // This will be isEmpty: false since start !== end
            selections: [mockSelection],
            options: {
                insertSpaces: true,
                tabSize: 4
            },
            revealRange: jest.fn()
        };
    }
});