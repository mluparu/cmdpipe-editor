import { OutputProcessor } from '../../../src/shell/outputProcessor';
import { TaskDefinition } from '../../../src/types/taskTypes';

describe('OutputProcessor', () => {
    let outputProcessor: OutputProcessor;

    beforeEach(() => {
        outputProcessor = new OutputProcessor();
    });

    describe('processOutput', () => {
        it('should return output unchanged when no processing options are specified', () => {
            // Arrange
            const output = '  Test output with whitespace  \n';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test']
            };

            // Act
            const result = outputProcessor.processOutput(output, task);

            // Assert
            expect(result).toBe(output);
        });

        it('should trim whitespace when trimWhitespace is true', () => {
            // Arrange
            const output = '  Test output with whitespace  \n';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test'],
                outputProcessing: {
                    trimWhitespace: true
                }
            };

            // Act
            const result = outputProcessor.processOutput(output, task);

            // Assert
            expect(result).toBe('Test output with whitespace');
        });

        it('should not trim whitespace when trimWhitespace is explicitly false', () => {
            // Arrange
            const output = '  Test output with whitespace  \n';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test'],
                outputProcessing: {
                    trimWhitespace: false
                }
            };

            // Act
            const result = outputProcessor.processOutput(output, task);

            // Assert
            expect(result).toBe(output);
        });

        it('should trim whitespace by default when outputProcessing is defined but trimWhitespace is not specified', () => {
            // Arrange
            const output = '  Test output with whitespace  \n';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test'],
                outputProcessing: {
                    maxOutputLength: 1000
                }
            };

            // Act
            const result = outputProcessor.processOutput(output, task);

            // Assert
            expect(result).toBe('Test output with whitespace');
        });

        it('should truncate output when maxOutputLength is exceeded', () => {
            // Arrange
            const output = 'This is a very long output that should be truncated';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test'],
                outputProcessing: {
                    maxOutputLength: 20
                }
            };

            // Act
            const result = outputProcessor.processOutput(output, task);

            // Assert
            expect(result).toBe('This is a very long ');
            expect(result.length).toBe(20);
        });

        it('should apply both trimming and truncation when both are specified', () => {
            // Arrange
            const output = '   This is a very long output that should be processed   \n';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test'],
                outputProcessing: {
                    trimWhitespace: true,
                    maxOutputLength: 20
                }
            };

            // Act
            const result = outputProcessor.processOutput(output, task);

            // Assert
            expect(result).toBe('This is a very long ');
            expect(result.length).toBe(20);
        });

        it('should handle empty output', () => {
            // Arrange
            const output = '';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test'],
                outputProcessing: {
                    trimWhitespace: true,
                    maxOutputLength: 100
                }
            };

            // Act
            const result = outputProcessor.processOutput(output, task);

            // Assert
            expect(result).toBe('');
        });

        it('should handle whitespace-only output', () => {
            // Arrange
            const output = '   \n  \t  ';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test'],
                outputProcessing: {
                    trimWhitespace: true
                }
            };

            // Act
            const result = outputProcessor.processOutput(output, task);

            // Assert
            expect(result).toBe('');
        });

        it('should not truncate when output is shorter than maxOutputLength', () => {
            // Arrange
            const output = 'Short output';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test'],
                outputProcessing: {
                    maxOutputLength: 100
                }
            };

            // Act
            const result = outputProcessor.processOutput(output, task);

            // Assert
            expect(result).toBe('Short output');
        });
    });

    describe('formatOutput', () => {
        it('should return formatted output with task information', () => {
            // Arrange
            const output = 'Command output';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test']
            };

            // Act
            const result = outputProcessor.formatOutputForOutputChannel(output, task);

            // Assert
            expect(result).toContain('Test Task');
            expect(result).toContain('Command output');
        });

        it('should include task ID in formatted output', () => {
            // Arrange
            const output = 'Command output';
            const task: TaskDefinition = {
                id: 'test-task-123',
                name: 'Test Task',
                command: 'echo',
                args: ['test']
            };

            // Act
            const result = outputProcessor.formatOutputForOutputChannel(output, task);

            // Assert
            expect(result).toContain('test-task-123');
        });

        it('should handle empty output in formatting', () => {
            // Arrange
            const output = '';
            const task: TaskDefinition = {
                id: 'test-task',
                name: 'Test Task',
                command: 'echo',
                args: ['test']
            };

            // Act
            const result = outputProcessor.formatOutputForOutputChannel(output, task);

            // Assert
            expect(result).toContain('Test Task');
            expect(result).toBeTruthy();
        });
    });

    describe('filterOutput', () => {
        it('should filter lines containing specific patterns', () => {
            // Arrange
            const output = 'Line 1\nERROR: Something failed\nLine 3\nWARNING: Be careful\nLine 5';
            const patterns = ['ERROR:', 'WARNING:'];

            // Act
            const result = outputProcessor.filterOutput(output, patterns);

            // Assert
            expect(result).toBe('ERROR: Something failed\nWARNING: Be careful');
        });

        it('should return empty string when no patterns match', () => {
            // Arrange
            const output = 'Line 1\nLine 2\nLine 3';
            const patterns = ['ERROR:', 'WARNING:'];

            // Act
            const result = outputProcessor.filterOutput(output, patterns);

            // Assert
            expect(result).toBe('');
        });

        it('should handle empty output in filtering', () => {
            // Arrange
            const output = '';
            const patterns = ['ERROR:', 'WARNING:'];

            // Act
            const result = outputProcessor.filterOutput(output, patterns);

            // Assert
            expect(result).toBe('');
        });

        it('should handle empty patterns array', () => {
            // Arrange
            const output = 'Line 1\nLine 2\nLine 3';
            const patterns: string[] = [];

            // Act
            const result = outputProcessor.filterOutput(output, patterns);

            // Assert
            expect(result).toBe('');
        });

        it('should be case sensitive when filtering', () => {
            // Arrange
            const output = 'error: lowercase\nERROR: uppercase\nError: mixed case';
            const patterns = ['ERROR:'];

            // Act
            const result = outputProcessor.filterOutput(output, patterns);

            // Assert
            expect(result).toBe('ERROR: uppercase');
        });
    });

    describe('extractErrorsAndWarnings', () => {
        it('should extract error and warning lines from output', () => {
            // Arrange
            const output = 'Info: Starting process\nERROR: File not found\nWarning: Deprecated API\nDone';

            // Act
            const result = outputProcessor.extractErrorsAndWarnings(output);

            // Assert
            expect(result.errors).toHaveLength(1);
            expect(result.warnings).toHaveLength(1);
            expect(result.errors[0]).toContain('ERROR: File not found');
            expect(result.warnings[0]).toContain('Warning: Deprecated API');
        });

        it('should handle output with no errors or warnings', () => {
            // Arrange
            const output = 'Info: Starting process\nProcess completed successfully\nDone';

            // Act
            const result = outputProcessor.extractErrorsAndWarnings(output);

            // Assert
            expect(result.errors).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });

        it('should handle empty output', () => {
            // Arrange
            const output = '';

            // Act
            const result = outputProcessor.extractErrorsAndWarnings(output);

            // Assert
            expect(result.errors).toHaveLength(0);
            expect(result.warnings).toHaveLength(0);
        });

        it('should detect various error patterns', () => {
            // Arrange
            const output = 'ERROR: Type 1\nerror: Type 2\nError: Type 3\nFAILED: Type 4\nfailed: Type 5';

            // Act
            const result = outputProcessor.extractErrorsAndWarnings(output);

            // Assert
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should detect various warning patterns', () => {
            // Arrange
            const output = 'WARNING: Type 1\nwarning: Type 2\nWarn: Type 3\nCaution: Type 4';

            // Act
            const result = outputProcessor.extractErrorsAndWarnings(output);

            // Assert
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });
});