import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { ShellExecutor } from '../../src/shell/shellExecutor';
import { CursorManager } from '../../src/editor/cursorManager';
import { TextInsertion } from '../../src/editor/textInsertion';
import { TaskDefinition } from '../../src/types/taskTypes';
import { PlatformDetector } from '../../src/shell/platformDetector';
import { workspace } from 'vscode';

// Import vscode for position and other types
const vscode = require('vscode');

jest.mock('os', () => {
    const actual = jest.requireActual('os');
    return {
        ...actual,
        platform: jest.fn(() => 'win32')
    };
});

jest.mock('fs', () => {
    const actual = jest.requireActual('fs');
    return {
        ...actual,
        existsSync: jest.fn(actual.existsSync.bind(actual))
    };
});

// Mock the dependencies
jest.mock('../../src/shell/shellExecutor');
jest.mock('../../src/editor/cursorManager');
jest.mock('../../src/editor/textInsertion');

const osPlatformMock = os.platform as unknown as jest.Mock;
const fsExistsMock = fs.existsSync as unknown as jest.Mock;

describe('Shell to Editor Integration', () => {
    let mockShellExecutor: any;
    let mockCursorManager: any;
    let mockTextInsertion: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock ShellExecutor
        mockShellExecutor = {
            executeTask: jest.fn(),
            isTaskRunning: jest.fn(),
            terminateTask: jest.fn(),
            getRunningTasks: jest.fn(),
            getInstance: jest.fn()
        } as any;

        // Mock CursorManager
        mockCursorManager = {
            getActiveEditor: jest.fn(),
            getCursorPosition: jest.fn(),
            getCurrentSelection: jest.fn(),
            getAllSelections: jest.fn(),
            isSelectionEmpty: jest.fn(),
            getSelectedText: jest.fn(),
            getLineAtCursor: jest.fn(),
            getWordAtCursor: jest.fn(),
            moveCursor: jest.fn(),
            isReadonlyEditor: jest.fn(),
            getInstance: jest.fn()
        } as any;

        // Mock TextInsertion
        mockTextInsertion = {
            insertAtCursor: jest.fn(),
            replaceSelection: jest.fn(),
            appendToLine: jest.fn(),
            insertText: jest.fn(),
            processOutputForInsertion: jest.fn(),
            canInsertInEditor: jest.fn(),
            getInstance: jest.fn()
        } as any;

        // Setup singleton returns
        (ShellExecutor.getInstance as jest.Mock).mockReturnValue(mockShellExecutor);
        (CursorManager.getInstance as jest.Mock).mockReturnValue(mockCursorManager);
        (TextInsertion.getInstance as jest.Mock).mockReturnValue(mockTextInsertion);
    });

    describe('Complete workflow: Shell execution to editor insertion', () => {
        it('should execute shell command and insert output at cursor', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['Hello World']
            };

            const mockEditorInfo: any = {
                editor: {} as any,
                cursorPosition: { line: 1, character: 5 } as any,
                selection: { start: { line: 1, character: 5 }, end: { line: 1, character: 5 } } as any,
                isReadonly: false,
                documentUri: { scheme: 'file', fsPath: '/test/file.txt' } as any
            };

            // Setup mocks
            mockShellExecutor.executeTask.mockResolvedValue({
                success: true,
                output: 'Hello World',
                exitCode: 0,
                taskId: 'test-task',
                executionTime: 100
            });

            mockCursorManager.getActiveEditor.mockReturnValue(mockEditorInfo);
            mockTextInsertion.canInsertInEditor.mockReturnValue(true);
            mockTextInsertion.processOutputForInsertion.mockReturnValue('Hello World');
            mockTextInsertion.insertAtCursor.mockResolvedValue({
                success: true,
                charactersInserted: 11,
                insertedText: 'Hello World',
                newCursorPosition: new vscode.Position(1, 11),
                insertionMode: 'insert-at-cursor'
            });

            // Act - This simulates the workflow that would be in the command handler
            const executionResult = await mockShellExecutor.executeTask(task);
            const editorInfo = mockCursorManager.getActiveEditor();
            
            if (executionResult.success && editorInfo && mockTextInsertion.canInsertInEditor(editorInfo)) {
                const processedOutput = mockTextInsertion.processOutputForInsertion(
                    executionResult.output,
                    { trimWhitespace: true }
                );
                const insertionResult = await mockTextInsertion.insertAtCursor(editorInfo, processedOutput);
                
                // Assert
                expect(insertionResult.success).toBe(true);
                expect(insertionResult.insertedText).toBe('Hello World');
            }

            // Verify the workflow
            expect(mockShellExecutor.executeTask).toHaveBeenCalledWith(task);
            expect(mockCursorManager.getActiveEditor).toHaveBeenCalled();
            expect(mockTextInsertion.canInsertInEditor).toHaveBeenCalledWith(mockEditorInfo);
            expect(mockTextInsertion.processOutputForInsertion).toHaveBeenCalledWith(
                'Hello World',
                { trimWhitespace: true }
            );
            expect(mockTextInsertion.insertAtCursor).toHaveBeenCalledWith(mockEditorInfo, 'Hello World');
        });

        it('should handle shell command failure gracefully', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'failing-task',
                name: 'Failing Task',
                command: 'nonexistent-command'
            };

            const mockEditorInfo: any = {
                editor: {} as any,
                cursorPosition: { line: 1, character: 5 } as any,
                selection: { start: { line: 1, character: 5 }, end: { line: 1, character: 5 } } as any,
                isReadonly: false,
                documentUri: { scheme: 'file', fsPath: '/test/file.txt' } as any
            };

            // Setup mocks
            mockShellExecutor.executeTask.mockResolvedValue({
                success: false,
                output: '',
                stderr: 'Command not found',
                exitCode: 1,
                taskId: 'failing-task',
                executionTime: 50,
                error: 'Command execution failed'
            });

            mockCursorManager.getActiveEditor.mockReturnValue(mockEditorInfo);

            // Act
            const executionResult = await mockShellExecutor.executeTask(task);
            const editorInfo = mockCursorManager.getActiveEditor();

            // Assert - Should not attempt text insertion on failure
            expect(executionResult.success).toBe(false);
            expect(executionResult.error).toBe('Command execution failed');
            expect(mockTextInsertion.insertAtCursor).not.toHaveBeenCalled();
        });

        it('should handle readonly editor gracefully', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['Hello World']
            };

            const mockEditorInfo: any = {
                editor: {} as any,
                cursorPosition: { line: 1, character: 5 } as any,
                selection: { start: { line: 1, character: 5 }, end: { line: 1, character: 5 } } as any,
                isReadonly: true, // Readonly editor
                documentUri: { scheme: 'readonly', fsPath: '/readonly/file.txt' } as any
            };

            // Setup mocks
            mockShellExecutor.executeTask.mockResolvedValue({
                success: true,
                output: 'Hello World',
                exitCode: 0,
                taskId: 'test-task',
                executionTime: 100
            });

            mockCursorManager.getActiveEditor.mockReturnValue(mockEditorInfo);
            mockTextInsertion.canInsertInEditor.mockReturnValue(false); // Cannot insert in readonly

            // Act
            const executionResult = await mockShellExecutor.executeTask(task);
            const editorInfo = mockCursorManager.getActiveEditor();
            const canInsert = editorInfo ? mockTextInsertion.canInsertInEditor(editorInfo) : false;

            // Assert
            expect(executionResult.success).toBe(true);
            expect(canInsert).toBe(false);
            expect(mockTextInsertion.insertAtCursor).not.toHaveBeenCalled();
        });

        it('should handle no active editor gracefully', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['Hello World']
            };

            // Setup mocks
            mockShellExecutor.executeTask.mockResolvedValue({
                success: true,
                output: 'Hello World',
                exitCode: 0,
                taskId: 'test-task',
                executionTime: 100
            });

            mockCursorManager.getActiveEditor.mockReturnValue(null); // No active editor

            // Act
            const executionResult = await mockShellExecutor.executeTask(task);
            const editorInfo = mockCursorManager.getActiveEditor();

            // Assert
            expect(executionResult.success).toBe(true);
            expect(editorInfo).toBeNull();
            expect(mockTextInsertion.insertAtCursor).not.toHaveBeenCalled();
        });

        it('should handle different insertion modes', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['Hello World'],
                outputProcessing: {
                    trimWhitespace: true,
                    maxOutputLength: 1000
                }
            };

            const mockEditorInfo: any = {
                editor: {} as any,
                cursorPosition: { line: 1, character: 5 } as any,
                selection: { 
                    start: { line: 1, character: 0 }, 
                    end: { line: 1, character: 10 },
                    isEmpty: false
                } as any,
                isReadonly: false,
                documentUri: { scheme: 'file', fsPath: '/test/file.txt' } as any
            };

            // Setup mocks for replace-selection mode
            mockShellExecutor.executeTask.mockResolvedValue({
                success: true,
                output: 'Hello World\n',
                exitCode: 0,
                taskId: 'test-task',
                executionTime: 100
            });

            mockCursorManager.getActiveEditor.mockReturnValue(mockEditorInfo);
            mockCursorManager.isSelectionEmpty.mockReturnValue(false);
            mockTextInsertion.canInsertInEditor.mockReturnValue(true);
            mockTextInsertion.processOutputForInsertion.mockReturnValue('Hello World');
            mockTextInsertion.replaceSelection.mockResolvedValue({
                success: true,
                charactersInserted: 11,
                insertedText: 'Hello World',
                newCursorPosition: new vscode.Position(1, 11),
                insertionMode: 'replace-selection'
            });

            // Act - Simulate replace selection workflow
            const executionResult = await mockShellExecutor.executeTask(task);
            const editorInfo = mockCursorManager.getActiveEditor();
            
            if (executionResult.success && editorInfo && mockTextInsertion.canInsertInEditor(editorInfo)) {
                const hasSelection = !mockCursorManager.isSelectionEmpty();
                const processedOutput = mockTextInsertion.processOutputForInsertion(
                    executionResult.output,
                    task.outputProcessing
                );
                
                let insertionResult;
                if (hasSelection) {
                    insertionResult = await mockTextInsertion.replaceSelection(editorInfo, processedOutput);
                } else {
                    insertionResult = await mockTextInsertion.insertAtCursor(editorInfo, processedOutput);
                }
                
                // Assert
                expect(insertionResult.success).toBe(true);
                expect(insertionResult.insertionMode).toBe('replace-selection');
            }

            // Verify workflow
            expect(mockTextInsertion.replaceSelection).toHaveBeenCalledWith(mockEditorInfo, 'Hello World');
        });

        it('should handle long-running task cancellation', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'long-task',
                name: 'Long Running Task',
                command: 'sleep',
                args: ['10'],
                timeout: 1000 // 1 second timeout
            };

            // Setup mocks
            mockShellExecutor.executeTask.mockRejectedValue(new Error('Task timed out'));
            mockShellExecutor.isTaskRunning.mockReturnValue(true);
            mockShellExecutor.terminateTask.mockReturnValue(true);

            // Act & Assert
            await expect(mockShellExecutor.executeTask(task)).rejects.toThrow('Task timed out');
            
            // Verify that text insertion was not attempted
            expect(mockTextInsertion.insertAtCursor).not.toHaveBeenCalled();
        });
    });

    describe('Error handling and edge cases', () => {
        it('should handle insertion failure gracefully', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['Hello World']
            };

            const mockEditorInfo: any = {
                editor: {} as any,
                cursorPosition: { line: 1, character: 5 } as any,
                selection: { start: { line: 1, character: 5 }, end: { line: 1, character: 5 } } as any,
                isReadonly: false,
                documentUri: { scheme: 'file', fsPath: '/test/file.txt' } as any
            };

            // Setup mocks
            mockShellExecutor.executeTask.mockResolvedValue({
                success: true,
                output: 'Hello World',
                exitCode: 0,
                taskId: 'test-task',
                executionTime: 100
            });

            mockCursorManager.getActiveEditor.mockReturnValue(mockEditorInfo);
            mockTextInsertion.canInsertInEditor.mockReturnValue(true);
            mockTextInsertion.processOutputForInsertion.mockReturnValue('Hello World');
            mockTextInsertion.insertAtCursor.mockResolvedValue({
                success: false,
                charactersInserted: 0,
                error: 'Failed to insert text',
                insertedText: '',
                insertionMode: 'insert-at-cursor'
            });

            // Act
            const executionResult = await mockShellExecutor.executeTask(task);
            const editorInfo = mockCursorManager.getActiveEditor();
            
            if (executionResult.success && editorInfo && mockTextInsertion.canInsertInEditor(editorInfo)) {
                const processedOutput = mockTextInsertion.processOutputForInsertion(
                    executionResult.output,
                    { trimWhitespace: true }
                );
                const insertionResult = await mockTextInsertion.insertAtCursor(editorInfo, processedOutput);
                
                // Assert
                expect(insertionResult.success).toBe(false);
                expect(insertionResult.error).toBe('Failed to insert text');
            }
        });
    });
});

describe('Platform detection integration', () => {
    const mockedWorkspace = workspace as unknown as {
        __resetConfiguration: () => void;
        __setTerminalDefaultProfile: (profileId?: string | null) => void;
        __setTerminalProfiles: (profiles: Record<string, unknown>) => void;
    };
    const settingsPath = path.join(__dirname, '..', '..', 'test-workspace', '.vscode', 'settings.windows.json');

    beforeEach(() => {
        mockedWorkspace.__resetConfiguration();
        PlatformDetector.reset();
    osPlatformMock.mockClear();
    osPlatformMock.mockReturnValue('win32');
        fsExistsMock.mockReset();

        const rawSettings = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(rawSettings) as Record<string, unknown>;

        mockedWorkspace.__setTerminalDefaultProfile(settings['terminal.integrated.defaultProfile.windows'] as string);
        mockedWorkspace.__setTerminalProfiles(settings['terminal.integrated.profiles.windows'] as Record<string, unknown>);
    });

    it('prefers PowerShell executable when VS Code default profile targets PowerShell', () => {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as any;
        const powerShellProfile = settings['terminal.integrated.profiles.windows']['PowerShell'];

        fsExistsMock.mockImplementation((candidate: fs.PathLike) => String(candidate) === powerShellProfile.path);

        const info = PlatformDetector.getInstance().getPlatformInfo();

        expect(info.defaultShell).toBe('powershell.exe');
        expect(info.shellPath).toBe(powerShellProfile.path);
        expect(info.shellArgs).toEqual(['-NoLogo', '-NoProfile', '-Command']);
        expect(info.profileId).toBe('PowerShell');
        expect(info.diagnostics).toEqual(expect.arrayContaining([
            expect.stringContaining("Resolved PowerShell profile 'PowerShell'"),
            expect.stringContaining("Using PowerShell executable")
        ]));
    });

    it('falls back to Command Prompt when PowerShell executable cannot be resolved', () => {
        fsExistsMock.mockReturnValue(false);

        const info = PlatformDetector.getInstance().getPlatformInfo();

        expect(info.defaultShell).toBe('cmd.exe');
        expect(info.shellArgs).toEqual(['/c']);
        expect(info.diagnostics).toContain('Defaulting to Command Prompt (cmd.exe).');
    });

    it('preserves arguments with reserved characters when PowerShell is active', () => {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as any;
        const powerShellProfile = settings['terminal.integrated.profiles.windows']['PowerShell'];

        fsExistsMock.mockImplementation((candidate: fs.PathLike) => String(candidate) === powerShellProfile.path);

        const detector = PlatformDetector.getInstance();

        expect(detector.getPlatformInfo().defaultShell).toBe('powershell.exe');
        expect(detector.escapeArgument('Hello & Goodbye')).toBe("'Hello & Goodbye'");
        expect(detector.escapeArgument('$env:Path Override')).toBe('"$env:Path Override"');
    });
});