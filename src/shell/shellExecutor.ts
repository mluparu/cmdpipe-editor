import { spawn, ChildProcess } from 'child_process';

import { VariableContextBuilder } from '../substitution/contextBuilder';
import { SubstitutionError, VariableResolver } from '../substitution/variableResolver';
import { withSubstitutionSummary } from '../substitution/substitutionSummary';
import type { SubstitutionFailure, SubstitutionRequest, SubstitutionResult } from '../substitution/substitutionTypes';
import { SubstitutionFailureReason } from '../substitution/substitutionTypes';
import { TaskDefinition, TaskExecutionResult } from '../types/taskTypes';
import { createScopedLogger } from '../utils/logger';
import { errorHandler, ShellTaskPipeError, TaskExecutionError, TimeoutError, ErrorType } from '../utils/errorHandler';
import { PlatformDetector } from './platformDetector';

const logger = createScopedLogger('ShellExecutor');
const CONFIG_PLACEHOLDER_PATTERN = /\$\{config:([^}]+)\}/g;

/**
 * Handles execution of shell commands across different platforms
 */
export class ShellExecutor {
    private static _instance: ShellExecutor;
    private _platformDetector: PlatformDetector;
    private _runningTasks: Map<string, ChildProcess> = new Map();
    private readonly contextBuilder: VariableContextBuilder;
    private readonly variableResolver: VariableResolver;

    private constructor() {
        this._platformDetector = PlatformDetector.getInstance();
        this.contextBuilder = new VariableContextBuilder();
        this.variableResolver = new VariableResolver();
    }

    public static getInstance(): ShellExecutor {
        if (!ShellExecutor._instance) {
            ShellExecutor._instance = new ShellExecutor();
        }
        return ShellExecutor._instance;
    }

    /**
     * Execute a shell task and return the result with enhanced output collection
     *  
     */
    public async executeTaskWithOutput(task: TaskDefinition): Promise<TaskExecutionResult> 
    {
        // options?: {
        // timeout?: number;
        // showProgress?: boolean;
        // progressDelay?: number;
        // cancellable?: boolean;
        // workingDirectory?: string;
        // environment?: Record<string, string>;}

        const startTime = Date.now();
        logger.info(`Executing task with output collection: ${task.name} (${task.id})`);

        try {
            // Validate task
            this.validateTask(task);

            // Check if task is already running
            if (this._runningTasks.has(task.id)) {
                throw new TaskExecutionError(
                    `Task '${task.id}' is already running`,
                    undefined,
                    '',
                    '',
                    { taskId: task.id }
                );
            }

            // Prepare command execution with custom options
            const { command, args, options: execOptions } = await this.prepareExecution(task);
            
            // // Override with provided options
            // if (options?.workingDirectory) {
            //     execOptions.cwd = options.workingDirectory;
            // }
            // if (options?.environment) {
            //     execOptions.env = { ...execOptions.env, ...options.environment };
            // }
            
            // Execute command with binary-safe output collection
            const result = await this.executeCommandWithBinaryOutput(
                task.id, 
                command, 
                args, 
                execOptions, 
                task.timeout
            );
            
            // Process result with binary detection
            const processedResult = this.processExecutionResultWithBinary(task, result, startTime);
            
            logger.info(`Task completed: ${task.id} (exit code: ${processedResult.exitCode}, time: ${processedResult.executionTime}ms, binary: ${processedResult.isBinary})`);
            
            return processedResult;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            logger.error(`Task failed: ${task.id}`, error as Error);

            // Clean up running task if it exists
            this._runningTasks.delete(task.id);

            return this.createErrorResultWithBinary(task, error as Error, executionTime);
        }
    }

    /**
     * Cancel a running task by ID
     */
    public async cancelTask(taskId: string): Promise<boolean> {
        const process = this._runningTasks.get(taskId);
        if (process) {
            logger.info(`Cancelling task: ${taskId}`);
            
            try {
                if (process.pid) {
                    // Kill the process tree on Windows
                    if (this._platformDetector.getPlatformInfo().platform === 'win32') {
                        spawn('taskkill', ['/pid', process.pid.toString(), '/f', '/t']);
                    } else {
                        process.kill('SIGTERM');
                        // Fallback to SIGKILL after 5 seconds
                        setTimeout(() => {
                            if (!process.killed) {
                                process.kill('SIGKILL');
                            }
                        }, 5000);
                    }
                }
                
                this._runningTasks.delete(taskId);
                return true;
            } catch (error) {
                logger.error(`Failed to cancel task ${taskId}:`, error as Error);
                return false;
            }
        }
        
        return false;
    }

    // /**
    //  * Execute a shell task and return the result
    //  */
    // public async executeTask(task: TaskDefinition): Promise<TaskExecutionResult> {
    //     const startTime = Date.now();
    //     logger.info(`Executing task: ${task.name} (${task.id})`);

    //     try {
    //         // Validate task
    //         this.validateTask(task);

    //         // Check if task is already running
    //         if (this._runningTasks.has(task.id)) {
    //             throw new TaskExecutionError(
    //                 `Task '${task.id}' is already running`,
    //                 undefined,
    //                 '',
    //                 '',
    //                 { taskId: task.id }
    //             );
    //         }

    //         // Prepare command execution
    //         const { command, args, options } = this.prepareExecution(task);
            
    //         // Execute command
    //         const result = await this.executeCommand(task.id, command, args, options, task.timeout);
            
    //         // Process result
    //         const processedResult = this.processExecutionResult(task, result, startTime);
            
    //         logger.info(`Task completed: ${task.id} (exit code: ${processedResult.exitCode}, time: ${processedResult.executionTime}ms)`);
            
    //         return processedResult;

    //     } catch (error) {
    //         const executionTime = Date.now() - startTime;
    //         logger.error(`Task failed: ${task.id}`, error as Error);

    //         // Clean up running task if it exists
    //         this._runningTasks.delete(task.id);

    //         return this.createErrorResult(task, error as Error, executionTime);
    //     }
    // }

    // /**
    //  * Check if a task is currently running
    //  */
    // public isTaskRunning(taskId: string): boolean {
    //     return this._runningTasks.has(taskId);
    // }

    // /**
    //  * Terminate a running task
    //  */
    // public terminateTask(taskId: string): boolean {
    //     const process = this._runningTasks.get(taskId);
    //     if (process) {
    //         logger.info(`Terminating task: ${taskId}`);
            
    //         try {
    //             if (process.pid) {
    //                 // Kill the process tree on Windows
    //                 if (this._platformDetector.getPlatformInfo().platform === 'win32') {
    //                     spawn('taskkill', ['/pid', process.pid.toString(), '/f', '/t']);
    //                 } else {
    //                     process.kill('SIGTERM');
    //                     // Fallback to SIGKILL after 5 seconds
    //                     setTimeout(() => {
    //                         if (!process.killed) {
    //                             process.kill('SIGKILL');
    //                         }
    //                     }, 5000);
    //                 }
    //             }
                
    //             this._runningTasks.delete(taskId);
    //             return true;
                
    //         } catch (error) {
    //             logger.error(`Failed to terminate task: ${taskId}`, error as Error);
    //             return false;
    //         }
    //     }
        
    //     return false;
    // }

    // /**
    //  * Get list of currently running task IDs
    //  */
    // public getRunningTasks(): string[] {
    //     return Array.from(this._runningTasks.keys());
    // }

    /**
     * Validate task definition
     */
    private validateTask(task: TaskDefinition): void {
        if (!task.id) {
            throw new ShellTaskPipeError('Task ID is required', ErrorType.VALIDATION);
        }
        
        if (!task.command) {
            throw new ShellTaskPipeError('Task command is required', ErrorType.VALIDATION);
        }
        
        // Validate platform compatibility
        const currentPlatform = this._platformDetector.getPlatformInfo().platform;
        const supportedPlatforms = task.platforms || ['win32', 'darwin', 'linux'];
        
        if (!supportedPlatforms.includes(currentPlatform)) {
            throw new ShellTaskPipeError(
                `Task '${task.id}' is not compatible with platform: ${currentPlatform}`,
                ErrorType.PLATFORM,
                'PLATFORM_INCOMPATIBLE',
                { taskId: task.id, platform: currentPlatform, supportedPlatforms }
            );
        }
    }

    /**
     * Prepare command execution parameters
     */
    private async prepareExecution(task: TaskDefinition): Promise<{
        command: string;
        args: string[];
        options: any;
    }> {
        const substitution = await this.runSubstitution(task);
        const platformInfo = this._platformDetector.getPlatformInfo();

        let shell: string;
        let shellArgs: string[];

        if (task.shell) {
            shell = task.shell.executable || platformInfo.defaultShell;
            shellArgs = task.shell.args || platformInfo.shellArgs;
        } else {
            shell = platformInfo.defaultShell;
            shellArgs = platformInfo.shellArgs;
        }

        const commandLine = [substitution.command, ...substitution.args];
        const args = [...shellArgs, ...commandLine];

        const env = {
            ...process.env,
            ...(substitution.environmentVariables ?? {})
        };

        const cwd = substitution.workingDirectory || task.workingDirectory || process.cwd();

        const options = {
            shell: false,
            cwd,
            env,
            stdio: ['pipe', 'pipe', 'pipe'] as const,
            detached: false
        };

        logger.debug(`Prepared execution - Shell: ${shell}, Args: ${JSON.stringify(args)}, CWD: ${cwd}`);

        return { command: shell, args, options };
    }

    private async runSubstitution(task: TaskDefinition): Promise<SubstitutionResult> {
        const start = Date.now();
        const configKeys = this.extractConfigKeys(task);
        const context = await this.contextBuilder.build(task, configKeys);
        const request: SubstitutionRequest = {
            taskId: task.id,
            command: task.command,
            args: task.args ?? [],
            workingDirectory: task.workingDirectory,
            environmentVariables: task.environmentVariables,
            additionalFields: undefined,
            context
        };

        try {
            const resolved = await this.variableResolver.resolve(request);
            const withSummary = withSubstitutionSummary(resolved, { executionTimeMs: Date.now() - start });

            if (withSummary.summary) {
                logger.debug(`Substitution summary for task ${task.id}`, withSummary.summary);
            }

            return withSummary;
        } catch (error) {
            if (error instanceof SubstitutionError) {
                throw this.handleSubstitutionFailure(task, error);
            }

            throw error;
        }
    }

    private handleSubstitutionFailure(task: TaskDefinition, error: SubstitutionError): Error {
        if (error.failure.reason === SubstitutionFailureReason.MISSING_ENVIRONMENT) {
            const variableName = this.extractEnvironmentVariableName(error.failure);
            return errorHandler.createMissingEnvironmentVariableError(variableName, {
                token: error.failure.token,
                taskId: task.id
            });
        }

        if (error.failure.reason === SubstitutionFailureReason.MISSING_CONFIG) {
            const setting = this.extractConfigurationSettingName(error.failure);
            return errorHandler.createMissingConfigurationSettingError(setting, {
                token: error.failure.token,
                taskId: task.id
            });
        }

        return error;
    }

    private extractEnvironmentVariableName(failure: SubstitutionFailure): string {
        const detailsName = typeof failure.details?.variable === "string" ? failure.details.variable : undefined;
        if (detailsName) {
            return detailsName;
        }

        const match = /^\$\{env:([^}]+)\}$/i.exec(failure.token);
        if (match?.[1]) {
            return match[1];
        }

        return failure.token;
    }

    private extractConfigurationSettingName(failure: SubstitutionFailure): string {
        const detailsSetting = typeof failure.details?.setting === "string" ? failure.details.setting : undefined;
        if (detailsSetting) {
            return detailsSetting;
        }

        const match = /^\$\{config:([^}]+)\}$/i.exec(failure.token);
        if (match?.[1]) {
            return match[1];
        }

        return failure.token;
    }

    private extractConfigKeys(task: TaskDefinition): string[] {
        const keys = new Set<string>();

        const collectFromString = (value?: string) => {
            if (!value) {
                return;
            }

            CONFIG_PLACEHOLDER_PATTERN.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = CONFIG_PLACEHOLDER_PATTERN.exec(value)) !== null) {
                const key = match[1]?.trim();
                if (key) {
                    keys.add(key);
                }
            }
        };

        collectFromString(task.command);
        (task.args ?? []).forEach((arg) => collectFromString(arg));
        collectFromString(task.workingDirectory);

        if (task.environmentVariables) {
            Object.values(task.environmentVariables).forEach((value) => collectFromString(value));
        }

        CONFIG_PLACEHOLDER_PATTERN.lastIndex = 0;

        return Array.from(keys);
    }

    // /**
    //  * Execute the command and return raw result
    //  */
    // private async executeCommand(
    //     taskId: string,
    //     command: string,
    //     args: string[],
    //     options: any,
    //     timeout?: number
    // ): Promise<{
    //     exitCode: number;
    //     stdout: string;
    //     stderr: string;
    // }> {
    //     return new Promise((resolve, reject) => {
    //         const child = spawn(command, args, options);
            
    //         // Store the running process
    //         this._runningTasks.set(taskId, child);

    //         let stdout = '';
    //         let stderr = '';
    //         let timeoutHandle: NodeJS.Timeout | undefined;

    //         // Set up timeout
    //         if (timeout && timeout > 0) {
    //             timeoutHandle = setTimeout(() => {
    //                 logger.warn(`Task ${taskId} timed out after ${timeout}ms`);
    //                 child.kill('SIGTERM');
                    
    //                 setTimeout(() => {
    //                     if (!child.killed) {
    //                         child.kill('SIGKILL');
    //                     }
    //                 }, 5000);
                    
    //                 reject(new TimeoutError(
    //                     `Task execution timed out after ${timeout}ms`,
    //                     timeout,
    //                     { taskId }
    //                 ));
    //             }, timeout);
    //         }

    //         // Handle process output
    //         if (child.stdout) {
    //             child.stdout.on('data', (data) => {
    //                 stdout += data.toString();
    //             });
    //         }

    //         if (child.stderr) {
    //             child.stderr.on('data', (data) => {
    //                 stderr += data.toString();
    //             });
    //         }

    //         // Handle process completion
    //         child.on('close', (code) => {
    //             if (timeoutHandle) {
    //                 clearTimeout(timeoutHandle);
    //             }
                
    //             this._runningTasks.delete(taskId);
                
    //             resolve({
    //                 exitCode: code || 0,
    //                 stdout,
    //                 stderr
    //             });
    //         });

    //         // Handle process errors
    //         child.on('error', (error) => {
    //             if (timeoutHandle) {
    //                 clearTimeout(timeoutHandle);
    //             }
                
    //             this._runningTasks.delete(taskId);
                
    //             reject(new TaskExecutionError(
    //                 `Failed to execute command: ${error.message}`,
    //                 -1,
    //                 stdout,
    //                 stderr,
    //                 { taskId, originalError: error.message }
    //             ));
    //         });
    //     });
    // }

    // /**
    //  * Process execution result and apply output processing
    //  */
    // private processExecutionResult(
    //     task: TaskDefinition,
    //     result: { exitCode: number; stdout: string; stderr: string },
    //     startTime: number
    // ): TaskExecutionResult {
    //     const executionTime = Date.now() - startTime;
    //     const success = result.exitCode === 0;

    //     // Apply output processing
    //     let output = result.stdout;
    //     const processing = task.outputProcessing;

    //     if (processing) {
    //         // Trim whitespace if configured
    //         if (processing.trimWhitespace !== false) {
    //             output = output.trim();
    //         }

    //         // Limit output length
    //         if (processing.maxOutputLength && output.length > processing.maxOutputLength) {
    //             output = output.substring(0, processing.maxOutputLength);
    //             logger.warn(`Output truncated to ${processing.maxOutputLength} characters for task: ${task.id}`);
    //         }
    //     }

    //     return {
    //         success,
    //         output,
    //         stderr: result.stderr,
    //         exitCode: result.exitCode,
    //         taskId: task.id,
    //         executionTime,
    //         isBinary: false,
    //         cancelled: false,
    //         ...(success ? {} : { error: `Command failed with exit code ${result.exitCode}` })
    //     };
    // }

    /**
     * Execute command with binary-safe output collection
     */
    private async executeCommandWithBinaryOutput(
        taskId: string,
        command: string,
        args: string[],
        options: any,
        timeout?: number
    ): Promise<{
        exitCode: number;
        stdout: Buffer;
        stderr: Buffer;
        cancelled: boolean;
    }> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, options);
            
            // Store the running process
            this._runningTasks.set(taskId, child);

            const stdoutChunks: Buffer[] = [];
            const stderrChunks: Buffer[] = [];
            let timeoutHandle: NodeJS.Timeout | undefined;
            let cancelled = false;

            // Set up timeout
            if (timeout && timeout > 0) {
                timeoutHandle = setTimeout(() => {
                    logger.warn(`Task ${taskId} timed out after ${timeout}ms`);

                    this.cancelTask(taskId);
                    cancelled = true;
                    
                    reject(new TimeoutError(
                        `Task execution timed out after ${timeout}ms`,
                        timeout,
                        { taskId }
                    ));
                }, timeout);
            }

            // Handle process output as binary data
            if (child.stdout) {
                child.stdout.on('data', (data: Buffer) => {
                    stdoutChunks.push(data);
                });
            }

            if (child.stderr) {
                child.stderr.on('data', (data: Buffer) => {
                    stderrChunks.push(data);
                });
            }

            // Handle process completion
            child.on('close', (code) => {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                
                this._runningTasks.delete(taskId);
                
                resolve({
                    exitCode: code || 0,
                    stdout: Buffer.concat(stdoutChunks),
                    stderr: Buffer.concat(stderrChunks),
                    cancelled
                });
            });

            // Handle process errors
            child.on('error', (error) => {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                
                this._runningTasks.delete(taskId);
                
                reject(new TaskExecutionError(
                    `Failed to execute command: ${error.message}`,
                    -1,
                    '',
                    '',
                    { taskId, originalError: error.message }
                ));
            });
        });
    }

    /**
     * Process execution result with binary detection
     */
    private processExecutionResultWithBinary(
        task: TaskDefinition,
        result: { exitCode: number; stdout: Buffer; stderr: Buffer; cancelled: boolean },
        startTime: number
    ): TaskExecutionResult {
        const executionTime = Date.now() - startTime;
        const success = result.exitCode === 0;

        // Convert buffers to strings for now (binary detection will be handled by OutputProcessor)
        let output = result.stdout; //.toString('utf8');
        const stderr = result.stderr; //.toString('utf8');

        // TODO: process text output elsewhere, after the binary check
        // // Apply basic output processing
        // const processing = task.outputProcessing;
        // if (processing) {
        //     // Trim whitespace if configured
        //     if (processing.trimWhitespace !== false) {
        //         output = output.trim();
        //     }

        //     // Limit output length
        //     if (processing.maxOutputLength && output.length > processing.maxOutputLength) {
        //         output = output.substring(0, processing.maxOutputLength);
        //         logger.warn(`Output truncated to ${processing.maxOutputLength} characters for task: ${task.id}`);
        //     }
        // }

        return {
            success,
            output, // Will be parsed later by OutputProcessor
            stderr,
            exitCode: result.exitCode,
            taskId: task.id,
            executionTime,
            isBinary: false, // Will be determined by OutputProcessor
            cancelled: result.cancelled,
            ...(success ? {} : { error: `Command failed with exit code ${result.exitCode}` })
        };
    }

    /**
     * Create an error result for failed execution with binary support
     */
    private createErrorResultWithBinary(
        task: TaskDefinition,
        error: Error,
        executionTime: number
    ): TaskExecutionResult {
        let errorMessage = error.message;
        let exitCode = -1;

        if (error instanceof TaskExecutionError) {
            exitCode = error.exitCode || -1;
        } else if (error instanceof TimeoutError) {
            errorMessage = `Task timed out after ${error.timeoutMs}ms`;
            exitCode = -2;
        }

        return {
            success: false,
            output: null as unknown as Buffer,
            stderr: null as unknown as Buffer,
            exitCode,
            taskId: task.id,
            executionTime,
            isBinary: false,
            cancelled: false,
            error: errorMessage
        };
    }

    // /**
    //  * Create an error result for failed execution
    //  */
    // private createErrorResult(
    //     task: TaskDefinition,
    //     error: Error,
    //     executionTime: number
    // ): TaskExecutionResult {
    //     let errorMessage = error.message;
    //     let exitCode = -1;

    //     if (error instanceof TaskExecutionError) {
    //         exitCode = error.exitCode || -1;
    //     } else if (error instanceof TimeoutError) {
    //         errorMessage = `Task timed out after ${error.timeoutMs}ms`;
    //         exitCode = -2;
    //     }

    //     return {
    //         success: false,
    //         output: null as unknown as Buffer,
    //         stderr: null as unknown as Buffer,
    //         exitCode,
    //         taskId: task.id,
    //         executionTime,
    //         isBinary: false,
    //         cancelled: false,
    //         error: errorMessage
    //     };
    // }
}