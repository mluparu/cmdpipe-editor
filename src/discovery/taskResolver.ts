import * as vscode from 'vscode';

import { TaskConfiguration, TaskDefinition, TaskSource } from '../types/configTypes';
import { Logger } from '../utils/logger';

/**
 * Interface representing a task name conflict between workspace and user sources
 */
export interface TaskConflict {
    /** Name of the conflicting task */
    taskName: string;
    
    /** Task definition from workspace source */
    workspaceTask?: TaskDefinition;
    
    /** Task definition from user source */
    userTask?: TaskDefinition;
}

/**
 * TaskResolver handles conflict resolution when tasks with the same name
 * exist in both workspace and user configurations. Workspace tasks take
 * precedence over user tasks to maintain workspace-specific behavior.
 */
export class TaskResolver {
    private readonly logger = Logger.getInstance();

    /**
     * Resolve conflicts between task configurations and return a unified task list
     * @param configurations Array of task configurations from all sources
     * @returns Array of resolved task definitions
     */
    resolveConflicts(configurations: TaskConfiguration[]): TaskDefinition[] {
        try {
            // Only process valid configurations
            const validConfigurations = configurations.filter(config => config.isValid);
            
            if (validConfigurations.length === 0) {
                this.logger.debug('No valid configurations to resolve');
                return [];
            }

            // Collect all tasks by name for conflict detection
            const tasksByName = new Map<string, TaskDefinition[]>();
            
            for (const config of validConfigurations) {
                for (const task of config.tasks) {
                    if (!tasksByName.has(task.name)) {
                        tasksByName.set(task.name, []);
                    }
                    tasksByName.get(task.name)!.push(task);
                }
            }

            // Resolve conflicts and build final task list
            const resolvedTasks: TaskDefinition[] = [];
            
            for (const [taskName, tasks] of tasksByName.entries()) {
                if (tasks.length === 1) {
                    // No conflict, add the single task
                    resolvedTasks.push(this.attachWorkspaceMetadata(tasks[0]));
                } else {
                    // Conflict exists, apply resolution rules
                    const resolvedTask = this.resolveTaskConflict(taskName, tasks);
                    if (resolvedTask) {
                        resolvedTasks.push(this.attachWorkspaceMetadata(resolvedTask));
                    }
                }
            }

            this.logger.info(`Resolved ${resolvedTasks.length} tasks from ${validConfigurations.length} configurations`);
            
            // Log conflicts if any
            const conflicts = this.getConflictingTasks(validConfigurations);
            if (conflicts.length > 0) {
                this.logger.info(`Resolved ${conflicts.length} task name conflicts`);
                for (const conflict of conflicts) {
                    this.logger.debug(`Conflict resolved for '${conflict.taskName}': workspace task took precedence`);
                }
            }

            return resolvedTasks;
        } catch (error) {
            this.logger.error('Failed to resolve task conflicts', error instanceof Error ? error : new Error(String(error)));
            return [];
        }
    }

    /**
     * Get a list of all conflicting tasks for reporting purposes
     * @param configurations Array of valid task configurations
     * @returns Array of task conflicts
     */
    getConflictingTasks(configurations: TaskConfiguration[]): TaskConflict[] {
        const conflicts: TaskConflict[] = [];
        const validConfigurations = configurations.filter(config => config.isValid);

        // Group tasks by name and source
        const tasksByName = new Map<string, { workspace?: TaskDefinition; user?: TaskDefinition }>();

        for (const config of validConfigurations) {
            for (const task of config.tasks) {
                if (!tasksByName.has(task.name)) {
                    tasksByName.set(task.name, {});
                }

                const taskGroup = tasksByName.get(task.name)!;
                if (task.source === TaskSource.WORKSPACE) {
                    taskGroup.workspace = task;
                } else if (task.source === TaskSource.USER) {
                    taskGroup.user = task;
                }
            }
        }

        // Identify conflicts (tasks that exist in both sources)
        for (const [taskName, taskGroup] of tasksByName.entries()) {
            if (taskGroup.workspace && taskGroup.user) {
                conflicts.push({
                    taskName,
                    workspaceTask: taskGroup.workspace,
                    userTask: taskGroup.user
                });
            }
        }

        return conflicts;
    }

    /**
     * Resolve a conflict for a specific task name
     * @param taskName Name of the conflicting task
     * @param tasks Array of conflicting task definitions
     * @returns Resolved task definition
     */
    private resolveTaskConflict(taskName: string, tasks: TaskDefinition[]): TaskDefinition | null {
        if (tasks.length === 0) {
            return null;
        }

        if (tasks.length === 1) {
            return tasks[0];
        }

        // Resolution rule: Workspace tasks take precedence over user tasks
        const workspaceTask = tasks.find(task => task.source === TaskSource.WORKSPACE);
        if (workspaceTask) {
            this.logger.debug(`Conflict resolution for '${taskName}': workspace task selected`);
            return workspaceTask;
        }

        // If no workspace task, prefer user tasks
        const userTask = tasks.find(task => task.source === TaskSource.USER);
        if (userTask) {
            this.logger.debug(`Conflict resolution for '${taskName}': user task selected (no workspace conflict)`);
            return userTask;
        }

        // Fallback to first task (shouldn't happen with current sources)
        this.logger.warn(`Unexpected conflict resolution for '${taskName}': using first available task`);
        return tasks[0];
    }

    private attachWorkspaceMetadata(task: TaskDefinition): TaskDefinition {
        if (task.workspaceFolder) {
            return task;
        }

        const workspaceFolder = this.findOwningWorkspace(task.filePath);
        if (!workspaceFolder) {
            return task;
        }

        return {
            ...task,
            workspaceFolder: {
                name: workspaceFolder.name,
                fsPath: workspaceFolder.uri.fsPath,
                uri: workspaceFolder.uri
            }
        };
    }

    private findOwningWorkspace(filePath?: string): vscode.WorkspaceFolder | undefined {
        if (!filePath) {
            return undefined;
        }

        try {
            const uri = vscode.Uri.file(filePath);
            const folder = vscode.workspace.getWorkspaceFolder(uri);

            if (folder) {
                return folder;
            }
        } catch (error) {
            this.logger.debug(`Unable to determine workspace for ${filePath}: ${error}`);
        }

        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            return undefined;
        }

        const targetPath = this.normalisePath(filePath);
        return folders.find((folder) => targetPath.startsWith(this.normalisePath(folder.uri.fsPath)));
    }

    private normalisePath(value: string): string {
        const resolved = value.replace(/\\/g, '/');
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    }

    /**
     * Get statistics about the conflict resolution process
     * @param configurations Array of task configurations
     * @returns Object containing resolution statistics
     */
    getResolutionStatistics(configurations: TaskConfiguration[]): {
        totalTasks: number;
        validTasks: number;
        conflicts: number;
        workspaceTasks: number;
        userTasks: number;
    } {
        const validConfigurations = configurations.filter(config => config.isValid);
        const allTasks = validConfigurations.flatMap(config => config.tasks);
        const resolvedTasks = this.resolveConflicts(configurations);
        const conflicts = this.getConflictingTasks(validConfigurations);

        return {
            totalTasks: allTasks.length,
            validTasks: resolvedTasks.length,
            conflicts: conflicts.length,
            workspaceTasks: resolvedTasks.filter(task => task.source === TaskSource.WORKSPACE).length,
            userTasks: resolvedTasks.filter(task => task.source === TaskSource.USER).length
        };
    }

    /**
     * Validate that a task definition has required fields
     * @param task Task definition to validate
     * @returns Whether the task is valid
     */
    private isValidTask(task: TaskDefinition): boolean {
        return !!(
            task.name && 
            task.command && 
            task.source && 
            task.filePath
        );
    }

    /**
     * Create a summary of conflict resolution for logging/debugging
     * @param configurations Array of task configurations
     * @returns Human-readable summary string
     */
    createResolutionSummary(configurations: TaskConfiguration[]): string {
        const stats = this.getResolutionStatistics(configurations);
        const conflicts = this.getConflictingTasks(configurations.filter(c => c.isValid));

        let summary = `Task Resolution Summary:\n`;
        summary += `  Total tasks discovered: ${stats.totalTasks}\n`;
        summary += `  Valid tasks after resolution: ${stats.validTasks}\n`;
        summary += `  Workspace tasks: ${stats.workspaceTasks}\n`;
        summary += `  User tasks: ${stats.userTasks}\n`;
        summary += `  Conflicts resolved: ${stats.conflicts}\n`;

        if (conflicts.length > 0) {
            summary += `\nConflict Details:\n`;
            for (const conflict of conflicts) {
                summary += `  - ${conflict.taskName}: workspace task took precedence\n`;
            }
        }

        return summary;
    }
}