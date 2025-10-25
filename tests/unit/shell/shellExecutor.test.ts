import { ShellExecutor } from '../../../src/shell/shellExecutor';
import { TaskDefinition, TaskExecutionResult } from '../../../src/types/taskTypes';
import { PlatformDetector } from '../../../src/shell/platformDetector';
import { ErrorType } from '../../../src/utils/errorHandler';

// Mock the platform detector
jest.mock('../../../src/shell/platformDetector');

describe('ShellExecutor', () => {
    let shellExecutor: ShellExecutor;
    let mockPlatformDetector: jest.Mocked<PlatformDetector>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock platform detector
        mockPlatformDetector = {
            getPlatformInfo: jest.fn().mockReturnValue({
                platform: 'win32',
                defaultShell: 'cmd.exe',
                shellArgs: ['/c'],
                pathSeparator: '\\'
            }),
            getDefaultShell: jest.fn().mockReturnValue('cmd.exe'),
            getShellArgs: jest.fn().mockReturnValue(['/c']),
            getPathSeparator: jest.fn().mockReturnValue('\\')
        } as any;

        (PlatformDetector.getInstance as jest.Mock).mockReturnValue(mockPlatformDetector);
        
        shellExecutor = ShellExecutor.getInstance();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('executeTask', () => {
        it('should execute a simple command and return output', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['Hello World']
            };

            // Act
            const result = await shellExecutor.executeTask(task);

            // Assert
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.output).toContain('Hello World');
            expect(result.exitCode).toBe(0);
            expect(result.taskId).toBe('test-task');
        }, 10000);

        it('should handle command execution timeout', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'timeout-task',
                name: 'Timeout Task',
                command: 'ping',
                args: ['-t', 'localhost'], // Continuous ping on Windows
                timeout: 1000 // 1 second timeout
            };

            // Act
            const result = await shellExecutor.executeTask(task);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toContain('timed out');
            expect(result.exitCode).toBe(-2);
        }, 15000);

        it('should handle command not found error', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'invalid-task',
                name: 'Invalid Task',
                command: 'non-existent-command-xyz123'
            };

            // Act
            const result = await shellExecutor.executeTask(task);

            // Assert
            expect(result.success).toBe(false);
            expect(result.exitCode).not.toBe(0);
            expect(result.error).toBeDefined();
        });

        it('should handle commands with non-zero exit codes', async () => {
            // Arrange - Use a command that will fail
            const task: TaskDefinition = {
                id: 'failing-task',
                name: 'Failing Task',
                command: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? 'exit' : 'false',
                args: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? ['1'] : []
            };

            // Act
            const result = await shellExecutor.executeTask(task);

            // Assert
            expect(result.success).toBe(false);
            expect(result.exitCode).toBe(1);
        });

        it('should use custom working directory when specified', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'pwd-task',
                name: 'PWD Task',
                command: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? 'cd' : 'pwd',
                workingDirectory: process.cwd()
            };

            // Act
            const result = await shellExecutor.executeTask(task);

            // Assert
            expect(result.success).toBe(true);
            expect(result.output).toContain(process.cwd());
        });

        it('should handle environment variables', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'env-task',
                name: 'Environment Task',
                command: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? 'echo' : 'echo',
                args: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? ['%TEST_VAR%'] : ['$TEST_VAR'],
                environmentVariables: {
                    TEST_VAR: 'test-value'
                }
            };

            // Act
            const result = await shellExecutor.executeTask(task);

            // Assert
            expect(result.success).toBe(true);
            expect(result.output).toContain('test-value');
        });

        it('should use custom shell when specified', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'custom-shell-task',
                name: 'Custom Shell Task',
                command: 'echo',
                args: ['test'],
                shell: {
                    executable: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? 'cmd.exe' : '/bin/sh',
                    args: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? ['/c'] : ['-c']
                }
            };

            // Act
            const result = await shellExecutor.executeTask(task);

            // Assert
            expect(result.success).toBe(true);
            expect(result.output).toContain('test');
        });

        it('should respect output length limits', async () => {
            // Arrange
            const longOutput = 'A'.repeat(100);
            const task: TaskDefinition = {
                id: 'long-output-task',
                name: 'Long Output Task',
                command: 'echo',
                args: [longOutput],
                outputProcessing: {
                    maxOutputLength: 50
                }
            };

            // Act
            const result = await shellExecutor.executeTask(task);

            // Assert
            expect(result.success).toBe(true);
            expect(result.output.length).toBeLessThanOrEqual(50);
        });

        it('should trim whitespace when configured', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'whitespace-task',
                name: 'Whitespace Task',
                command: 'echo',
                args: ['  test  '],
                outputProcessing: {
                    trimWhitespace: true
                }
            };

            // Act
            const result = await shellExecutor.executeTask(task);

            // Assert
            expect(result.success).toBe(true);
            expect(result.output).toBe('test');
        });
    });

    describe('isTaskRunning', () => {
        it('should return false for non-running task', () => {
            // Act & Assert
            expect(shellExecutor.isTaskRunning('non-existent-task')).toBe(false);
        });

        it('should return true for running task', async () => {
            // Arrange - Start a long-running task
            const task: TaskDefinition = {
                id: 'long-running-task',
                name: 'Long Running Task',
                command: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? 'ping' : 'sleep',
                args: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? ['-n', '10', 'localhost'] : ['5']
            };

            // Act
            const promise = shellExecutor.executeTask(task);
            
            // Assert
            expect(shellExecutor.isTaskRunning('long-running-task')).toBe(true);
            
            // Cleanup
            shellExecutor.terminateTask('long-running-task');
            await promise.catch(() => {}); // Ignore termination error
        });
    });

    describe('terminateTask', () => {
        it('should terminate a running task', async () => {
            // Arrange
            const task: TaskDefinition = {
                id: 'terminate-task',
                name: 'Terminate Task',
                command: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? 'ping' : 'sleep',
                args: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? ['-n', '100', 'localhost'] : ['10']
            };

            // Act
            const promise = shellExecutor.executeTask(task);
            
            // Wait a bit for the task to start
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const terminated = shellExecutor.terminateTask('terminate-task');
            
            // Assert
            expect(terminated).toBe(true);
            expect(shellExecutor.isTaskRunning('terminate-task')).toBe(false);
            
            await promise.catch(() => {}); // Should reject due to termination
        });

        it('should return false when terminating non-existent task', () => {
            // Act & Assert
            expect(shellExecutor.terminateTask('non-existent-task')).toBe(false);
        });
    });

    describe('getRunningTasks', () => {
        it('should return empty array when no tasks are running', () => {
            // Act & Assert
            expect(shellExecutor.getRunningTasks()).toEqual([]);
        });

        it('should return list of running task IDs', async () => {
            // Arrange
            const task1: TaskDefinition = {
                id: 'running-task-1',
                name: 'Running Task 1',
                command: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? 'ping' : 'sleep',
                args: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? ['-n', '10', 'localhost'] : ['5']
            };

            const task2: TaskDefinition = {
                id: 'running-task-2',
                name: 'Running Task 2',
                command: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? 'ping' : 'sleep',
                args: mockPlatformDetector.getPlatformInfo().platform === 'win32' ? ['-n', '10', 'localhost'] : ['5']
            };

            // Act
            const promise1 = shellExecutor.executeTask(task1);
            const promise2 = shellExecutor.executeTask(task2);
            
            // Wait for tasks to start
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const runningTasks = shellExecutor.getRunningTasks();
            
            // Assert
            expect(runningTasks).toHaveLength(2);
            expect(runningTasks).toContain('running-task-1');
            expect(runningTasks).toContain('running-task-2');
            
            // Cleanup
            shellExecutor.terminateTask('running-task-1');
            shellExecutor.terminateTask('running-task-2');
            await promise1.catch(() => {});
            await promise2.catch(() => {});
        });
    });
});