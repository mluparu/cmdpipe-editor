import * as vscode from 'vscode';
import * as path from 'path';
import { TaskConfiguration, TaskDefinition, TaskSource, ValidationError } from '../types/configTypes';
import { Logger } from '../utils/logger';

/**
 * TaskScanner is responsible for discovering task configuration files
 * from both workspace and user configuration directories.
 */
export class TaskScanner {
    private readonly logger = Logger.getInstance();

    /**
     * Scan workspace .vscode directory for tasks.json files
     * @returns Promise resolving to array of workspace task configurations
     */
    async scanWorkspaceTasks(): Promise<TaskConfiguration[]> {
        const configurations: TaskConfiguration[] = [];

        try {
            if (!vscode.workspace.workspaceFolders?.length) {
                this.logger.debug('No workspace folders available');
                return configurations;
            }

            for (const workspaceFolder of vscode.workspace.workspaceFolders) {
                const vscodeDir = vscode.Uri.joinPath(workspaceFolder.uri, '.vscode');
                const tasksFile = vscode.Uri.joinPath(vscodeDir, 'tasks.json');

                try {
                    // Check if .vscode directory exists
                    await vscode.workspace.fs.stat(vscodeDir);
                    
                    // Check if tasks.json exists
                    await vscode.workspace.fs.stat(tasksFile);
                    
                    const config = await this.loadTaskConfiguration(
                        tasksFile.fsPath,
                        TaskSource.WORKSPACE
                    );
                    configurations.push(config);
                    
                    this.logger.debug(`Found workspace tasks.json at ${tasksFile.fsPath}`);
                } catch (error) {
                    // Directory or file doesn't exist, skip silently
                    this.logger.debug(`No workspace tasks.json found in ${workspaceFolder.uri.fsPath}`);
                }
            }
        } catch (error) {
            this.logger.error('Error scanning workspace tasks:', error instanceof Error ? error : new Error(String(error)));
        }

        return configurations;
    }

    /**
     * Scan user configuration directory for task files
     * @returns Promise resolving to array of user task configurations
     */
    async scanUserTasks(): Promise<TaskConfiguration[]> {
        const configurations: TaskConfiguration[] = [];

        try {
            const userConfigPath = this.getUserConfigPath();
            if (!userConfigPath) {
                this.logger.debug('No user config path available');
                return configurations;
            }

            const userConfigUri = vscode.Uri.file(userConfigPath);

            try {
                // Check if user config directory exists
                await vscode.workspace.fs.stat(userConfigUri);
                
                // Read all files in the directory
                const entries = await vscode.workspace.fs.readDirectory(userConfigUri);
                
                for (const [fileName, fileType] of entries) {
                    if (fileType === vscode.FileType.File && fileName.endsWith('.json')) {
                        const filePath = path.join(userConfigPath, fileName);
                        const config = await this.loadTaskConfiguration(
                            filePath,
                            TaskSource.USER
                        );
                        configurations.push(config);
                        
                        this.logger.debug(`Found user task file at ${filePath}`);
                    }
                }
            } catch (error) {
                // Directory doesn't exist, skip silently
                this.logger.debug(`No user config directory found at ${userConfigPath}`);
            }
        } catch (error) {
            this.logger.error('Error scanning user tasks:', error instanceof Error ? error : new Error(String(error)));
        }

        return configurations;
    }

    /**
     * Get all task configurations from both workspace and user sources
     * @returns Promise resolving to array of all task configurations
     */
    async getAllTaskConfigurations(): Promise<TaskConfiguration[]> {
        const [workspaceTasks, userTasks] = await Promise.all([
            this.scanWorkspaceTasks(),
            this.scanUserTasks()
        ]);

        return [...workspaceTasks, ...userTasks];
    }

    /**
     * Load and parse a task configuration file
     * @param filePath Absolute path to the configuration file
     * @param source Source type of the configuration
     * @returns TaskConfiguration object
     */
    private async loadTaskConfiguration(
        filePath: string,
        source: TaskSource
    ): Promise<TaskConfiguration> {
        const config: TaskConfiguration = {
            filePath,
            source,
            isValid: false,
            lastModified: new Date(),
            tasks: [],
            errors: []
        };

        try {
            // Get file stats for modification time
            const uri = vscode.Uri.file(filePath);
            const stats = await vscode.workspace.fs.stat(uri);
            config.lastModified = new Date(stats.mtime);

            // Read and parse file content
            const content = await vscode.workspace.fs.readFile(uri);
            const contentString = Buffer.from(content).toString('utf8');
            
            let parsed: any;
            try {
                parsed = JSON.parse(contentString);
            } catch (parseError) {
                config.errors.push({
                    filePath,
                    message: `Invalid JSON syntax: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
                    code: 'INVALID_JSON',
                    line: this.extractLineNumberFromError(parseError),
                    column: this.extractColumnNumberFromError(parseError)
                });
                return config;
            }

            // Validate and extract tasks
            if (!parsed || typeof parsed !== 'object') {
                config.errors.push({
                    filePath,
                    message: 'Configuration must be a valid JSON object',
                    code: 'INVALID_FORMAT'
                });
                return config;
            }

            if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
                config.errors.push({
                    filePath,
                    message: 'Configuration must contain a "tasks" array',
                    code: 'MISSING_TASKS_ARRAY'
                });
                return config;
            }

            // Convert tasks to TaskDefinition objects
            for (const [index, taskDef] of parsed.tasks.entries()) {
                if (!taskDef || typeof taskDef !== 'object') {
                    config.errors.push({
                        filePath,
                        message: `Task at index ${index} is not a valid object`,
                        code: 'INVALID_TASK_OBJECT'
                    });
                    continue;
                }

                const taskDefinition = this.createTaskDefinition(taskDef, source, filePath);
                if (taskDefinition) {
                    config.tasks.push(taskDefinition);
                } else {
                    config.errors.push({
                        filePath,
                        message: `Task at index ${index} is missing required fields (label, command)`,
                        code: 'MISSING_REQUIRED'
                    });
                }
            }

            config.isValid = config.errors.length === 0 && config.tasks.length > 0;
            
        } catch (error) {
            config.errors.push({
                filePath,
                message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
                code: 'FILE_ACCESS'
            });
        }

        return config;
    }

    /**
     * Create a TaskDefinition from a raw task object
     * @param taskDef Raw task definition object
     * @param source Task source
     * @param filePath File path containing the task
     * @returns TaskDefinition or null if invalid
     */
    private createTaskDefinition(
        taskDef: any,
        source: TaskSource,
        filePath: string
    ): TaskDefinition | null {
        if (!taskDef.label || !taskDef.command) {
            return null;
        }

        return {
            name: taskDef.label,
            command: taskDef.command,
            source,
            filePath,
            description: taskDef.detail || taskDef.description,
            group: taskDef.group,
            args: Array.isArray(taskDef.args) ? taskDef.args : undefined,
            options: taskDef.options ? {
                cwd: taskDef.options.cwd,
                env: taskDef.options.env,
                background: taskDef.options.background,
                shell: taskDef.options.shell
            } : undefined,
            outputTarget: taskDef.outputTarget ? {
                type: taskDef.outputTarget.type || 'terminal',
                location: taskDef.outputTarget.location,
                mode: taskDef.outputTarget.mode || 'append',
                format: taskDef.outputTarget.format
            } : undefined
        };
    }

    /**
     * Get the user configuration directory path
     * @returns User config path or null if not available
     */
    private getUserConfigPath(): string | null {
        try {
            // Try to get VS Code user data directory
            const userDataPath = process.env.APPDATA || 
                                process.env.HOME || 
                                process.env.USERPROFILE;
            
            if (!userDataPath) {
                return null;
            }

            // Create cmdpipe-specific config path
            return path.join(userDataPath, '.vscode', 'cmdpipe', 'tasks');
        } catch (error) {
            this.logger.warn('Failed to determine user config path:', error);
            return null;
        }
    }

    /**
     * Extract line number from JSON parse error
     * @param error Parse error object
     * @returns Line number or undefined
     */
    private extractLineNumberFromError(error: any): number | undefined {
        if (error && typeof error.message === 'string') {
            const match = error.message.match(/line (\d+)/i);
            return match ? parseInt(match[1], 10) : undefined;
        }
        return undefined;
    }

    /**
     * Extract column number from JSON parse error
     * @param error Parse error object
     * @returns Column number or undefined
     */
    private extractColumnNumberFromError(error: any): number | undefined {
        if (error && typeof error.message === 'string') {
            const match = error.message.match(/column (\d+)/i);
            return match ? parseInt(match[1], 10) : undefined;
        }
        return undefined;
    }
}