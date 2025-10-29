import { TaskResolver } from '../../../src/discovery/taskResolver';
import { TaskConfiguration, TaskDefinition, TaskSource } from '../../../src/types/configTypes';

describe('TaskResolver', () => {
    let taskResolver: TaskResolver;

    beforeEach(() => {
        taskResolver = new TaskResolver();
    });

    describe('resolveConflicts', () => {
        it('should return all tasks when no conflicts exist', () => {
            // Arrange
            const workspaceConfig: TaskConfiguration = {
                filePath: '/workspace/.vscode/tasks.json',
                source: TaskSource.WORKSPACE,
                isValid: true,
                lastModified: new Date(),
                tasks: [
                    {
                        name: 'build',
                        command: 'npm run build',
                        source: TaskSource.WORKSPACE,
                        filePath: '/workspace/.vscode/tasks.json'
                    }
                ],
                errors: []
            };

            const userConfig: TaskConfiguration = {
                filePath: '/user/tasks/my-tasks.json',
                source: TaskSource.USER,
                isValid: true,
                lastModified: new Date(),
                tasks: [
                    {
                        name: 'test',
                        command: 'npm test',
                        source: TaskSource.USER,
                        filePath: '/user/tasks/my-tasks.json'
                    }
                ],
                errors: []
            };

            const configurations = [workspaceConfig, userConfig];

            // Act
            const result = taskResolver.resolveConflicts(configurations);

            // Assert
            expect(result).toHaveLength(2);
            expect(result.find(task => task.name === 'build')).toBeDefined();
            expect(result.find(task => task.name === 'test')).toBeDefined();
        });

        it('should prioritize workspace tasks over user tasks for same name', () => {
            // Arrange
            const workspaceTask: TaskDefinition = {
                name: 'build',
                command: 'npm run build:prod',
                source: TaskSource.WORKSPACE,
                filePath: '/workspace/.vscode/tasks.json',
                description: 'Production build'
            };

            const userTask: TaskDefinition = {
                name: 'build',
                command: 'npm run build:dev',
                source: TaskSource.USER,
                filePath: '/user/tasks/my-tasks.json',
                description: 'Development build'
            };

            const workspaceConfig: TaskConfiguration = {
                filePath: '/workspace/.vscode/tasks.json',
                source: TaskSource.WORKSPACE,
                isValid: true,
                lastModified: new Date(),
                tasks: [workspaceTask],
                errors: []
            };

            const userConfig: TaskConfiguration = {
                filePath: '/user/tasks/my-tasks.json',
                source: TaskSource.USER,
                isValid: true,
                lastModified: new Date(),
                tasks: [userTask],
                errors: []
            };

            const configurations = [workspaceConfig, userConfig];

            // Act
            const result = taskResolver.resolveConflicts(configurations);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('build');
            expect(result[0].command).toBe('npm run build:prod'); // Workspace task should win
            expect(result[0].source).toBe(TaskSource.WORKSPACE);
            expect(result[0].description).toBe('Production build');
        });

        it('should handle multiple conflicts correctly', () => {
            // Arrange
            const workspaceConfig: TaskConfiguration = {
                filePath: '/workspace/.vscode/tasks.json',
                source: TaskSource.WORKSPACE,
                isValid: true,
                lastModified: new Date(),
                tasks: [
                    {
                        name: 'build',
                        command: 'workspace build',
                        source: TaskSource.WORKSPACE,
                        filePath: '/workspace/.vscode/tasks.json'
                    },
                    {
                        name: 'test',
                        command: 'workspace test',
                        source: TaskSource.WORKSPACE,
                        filePath: '/workspace/.vscode/tasks.json'
                    },
                    {
                        name: 'unique-workspace',
                        command: 'unique workspace task',
                        source: TaskSource.WORKSPACE,
                        filePath: '/workspace/.vscode/tasks.json'
                    }
                ],
                errors: []
            };

            const userConfig: TaskConfiguration = {
                filePath: '/user/tasks/my-tasks.json',
                source: TaskSource.USER,
                isValid: true,
                lastModified: new Date(),
                tasks: [
                    {
                        name: 'build',
                        command: 'user build',
                        source: TaskSource.USER,
                        filePath: '/user/tasks/my-tasks.json'
                    },
                    {
                        name: 'test',
                        command: 'user test',
                        source: TaskSource.USER,
                        filePath: '/user/tasks/my-tasks.json'
                    },
                    {
                        name: 'unique-user',
                        command: 'unique user task',
                        source: TaskSource.USER,
                        filePath: '/user/tasks/my-tasks.json'
                    }
                ],
                errors: []
            };

            const configurations = [workspaceConfig, userConfig];

            // Act
            const result = taskResolver.resolveConflicts(configurations);

            // Assert
            expect(result).toHaveLength(4); // 2 conflicts resolved + 2 unique tasks
            
            // Check workspace tasks won conflicts
            const buildTask = result.find(task => task.name === 'build');
            expect(buildTask?.command).toBe('workspace build');
            expect(buildTask?.source).toBe(TaskSource.WORKSPACE);

            const testTask = result.find(task => task.name === 'test');
            expect(testTask?.command).toBe('workspace test');
            expect(testTask?.source).toBe(TaskSource.WORKSPACE);

            // Check unique tasks are preserved
            expect(result.find(task => task.name === 'unique-workspace')).toBeDefined();
            expect(result.find(task => task.name === 'unique-user')).toBeDefined();
        });

        it('should ignore tasks from invalid configurations', () => {
            // Arrange
            const validConfig: TaskConfiguration = {
                filePath: '/workspace/.vscode/tasks.json',
                source: TaskSource.WORKSPACE,
                isValid: true,
                lastModified: new Date(),
                tasks: [
                    {
                        name: 'valid-task',
                        command: 'echo valid',
                        source: TaskSource.WORKSPACE,
                        filePath: '/workspace/.vscode/tasks.json'
                    }
                ],
                errors: []
            };

            const invalidConfig: TaskConfiguration = {
                filePath: '/user/tasks/invalid.json',
                source: TaskSource.USER,
                isValid: false,
                lastModified: new Date(),
                tasks: [
                    {
                        name: 'invalid-task',
                        command: 'echo invalid',
                        source: TaskSource.USER,
                        filePath: '/user/tasks/invalid.json'
                    }
                ],
                errors: [
                    {
                        filePath: '/user/tasks/invalid.json',
                        message: 'Invalid JSON',
                        code: 'INVALID_JSON'
                    }
                ]
            };

            const configurations = [validConfig, invalidConfig];

            // Act
            const result = taskResolver.resolveConflicts(configurations);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('valid-task');
        });

        it('should return empty array when no valid configurations provided', () => {
            // Arrange
            const invalidConfig: TaskConfiguration = {
                filePath: '/invalid.json',
                source: TaskSource.USER,
                isValid: false,
                lastModified: new Date(),
                tasks: [],
                errors: [
                    {
                        filePath: '/invalid.json',
                        message: 'Parse error',
                        code: 'INVALID_JSON'
                    }
                ]
            };

            const configurations = [invalidConfig];

            // Act
            const result = taskResolver.resolveConflicts(configurations);

            // Assert
            expect(result).toHaveLength(0);
        });

        it('should handle empty configurations array', () => {
            // Arrange
            const configurations: TaskConfiguration[] = [];

            // Act
            const result = taskResolver.resolveConflicts(configurations);

            // Assert
            expect(result).toHaveLength(0);
        });

        it('should preserve task properties during conflict resolution', () => {
            // Arrange
            const workspaceTask: TaskDefinition = {
                name: 'complex-task',
                command: 'npm run complex',
                source: TaskSource.WORKSPACE,
                filePath: '/workspace/.vscode/tasks.json',
                description: 'Complex workspace task',
                group: 'build',
                args: ['--production', '--verbose'],
                options: {
                    cwd: '${workspaceFolder}',
                    env: { NODE_ENV: 'production' }
                }
            };

            const userTask: TaskDefinition = {
                name: 'complex-task',
                command: 'npm run simple',
                source: TaskSource.USER,
                filePath: '/user/tasks/my-tasks.json',
                description: 'Simple user task'
            };

            const workspaceConfig: TaskConfiguration = {
                filePath: '/workspace/.vscode/tasks.json',
                source: TaskSource.WORKSPACE,
                isValid: true,
                lastModified: new Date(),
                tasks: [workspaceTask],
                errors: []
            };

            const userConfig: TaskConfiguration = {
                filePath: '/user/tasks/my-tasks.json',
                source: TaskSource.USER,
                isValid: true,
                lastModified: new Date(),
                tasks: [userTask],
                errors: []
            };

            const configurations = [workspaceConfig, userConfig];

            // Act
            const result = taskResolver.resolveConflicts(configurations);

            // Assert
            expect(result).toHaveLength(1);
            const resolvedTask = result[0];
            expect(resolvedTask.name).toBe('complex-task');
            expect(resolvedTask.command).toBe('npm run complex');
            expect(resolvedTask.description).toBe('Complex workspace task');
            expect(resolvedTask.group).toBe('build');
            expect(resolvedTask.args).toEqual(['--production', '--verbose']);
            expect(resolvedTask.options?.cwd).toBe('${workspaceFolder}');
            expect(resolvedTask.options?.env?.NODE_ENV).toBe('production');
        });
    });

    describe('getConflictingTasks', () => {
        it('should identify tasks with same name from different sources', () => {
            // Arrange
            const configurations: TaskConfiguration[] = [
                {
                    filePath: '/workspace/.vscode/tasks.json',
                    source: TaskSource.WORKSPACE,
                    isValid: true,
                    lastModified: new Date(),
                    tasks: [
                        {
                            name: 'build',
                            command: 'workspace build',
                            source: TaskSource.WORKSPACE,
                            filePath: '/workspace/.vscode/tasks.json'
                        },
                        {
                            name: 'unique',
                            command: 'unique task',
                            source: TaskSource.WORKSPACE,
                            filePath: '/workspace/.vscode/tasks.json'
                        }
                    ],
                    errors: []
                },
                {
                    filePath: '/user/tasks/my-tasks.json',
                    source: TaskSource.USER,
                    isValid: true,
                    lastModified: new Date(),
                    tasks: [
                        {
                            name: 'build',
                            command: 'user build',
                            source: TaskSource.USER,
                            filePath: '/user/tasks/my-tasks.json'
                        }
                    ],
                    errors: []
                }
            ];

            // Act
            const conflicts = taskResolver.getConflictingTasks(configurations);

            // Assert
            expect(conflicts).toHaveLength(1);
            expect(conflicts[0].taskName).toBe('build');
            expect(conflicts[0].workspaceTask).toBeDefined();
            expect(conflicts[0].userTask).toBeDefined();
            expect(conflicts[0].workspaceTask?.command).toBe('workspace build');
            expect(conflicts[0].userTask?.command).toBe('user build');
        });

        it('should return empty array when no conflicts exist', () => {
            // Arrange
            const configurations: TaskConfiguration[] = [
                {
                    filePath: '/workspace/.vscode/tasks.json',
                    source: TaskSource.WORKSPACE,
                    isValid: true,
                    lastModified: new Date(),
                    tasks: [
                        {
                            name: 'build',
                            command: 'npm run build',
                            source: TaskSource.WORKSPACE,
                            filePath: '/workspace/.vscode/tasks.json'
                        }
                    ],
                    errors: []
                },
                {
                    filePath: '/user/tasks/my-tasks.json',
                    source: TaskSource.USER,
                    isValid: true,
                    lastModified: new Date(),
                    tasks: [
                        {
                            name: 'test',
                            command: 'npm test',
                            source: TaskSource.USER,
                            filePath: '/user/tasks/my-tasks.json'
                        }
                    ],
                    errors: []
                }
            ];

            // Act
            const conflicts = taskResolver.getConflictingTasks(configurations);

            // Assert
            expect(conflicts).toHaveLength(0);
        });
    });
});