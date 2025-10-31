import { spawn, ChildProcess } from 'child_process';
import { TaskDefinition, TaskExecutionResult } from '../types/taskTypes';
import { PlatformDetector } from './platformDetector';
import { createScopedLogger } from '../utils/logger';
import { ShellTaskPipeError, TaskExecutionError, TimeoutError, ErrorType } from '../utils/errorHandler';

const logger = createScopedLogger('ShellExecutor');

/**
 * Handles execution of shell commands across different platforms
 */
export class ShellExecutor {
    private static _instance: ShellExecutor;
    private _platformDetector: PlatformDetector;
    private _runningTasks: Map<string, ChildProcess> = new Map();

    private constructor() {
        this._platformDetector = PlatformDetector.getInstance();
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
            const { command, args, options: execOptions } = this.prepareExecution(task);
            
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
    private prepareExecution(task: TaskDefinition): {
        command: string;
        args: string[];
        options: any;
    } {
        const platformInfo = this._platformDetector.getPlatformInfo();
        
        // Determine shell and command
        let shell: string;
        let shellArgs: string[];
        
        if (task.shell) {
            shell = task.shell.executable || platformInfo.defaultShell;
            shellArgs = task.shell.args || platformInfo.shellArgs;
        } else {
            shell = platformInfo.defaultShell;
            shellArgs = platformInfo.shellArgs;
        }

        // Build command arguments
        const commandLine = [task.command, ...(task.args || [])].join(' ');
        const args = [...shellArgs, commandLine];

        // Prepare environment variables
        const env = {
            ...process.env,
            ...task.environmentVariables
        };

        // Set working directory
        const cwd = task.workingDirectory || process.cwd();

        const options = {
            shell: false, // We're handling shell manually
            cwd,
            env,
            stdio: ['pipe', 'pipe', 'pipe'] as const,
            detached: false
        };

        logger.debug(`Prepared execution - Shell: ${shell}, Args: ${JSON.stringify(args)}, CWD: ${cwd}`);

        return { command: shell, args, options };
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
            // TODO: Avoid duplication of timeout logic across methods in this class; use Windows specific handling as needed
            if (timeout && timeout > 0) {
                timeoutHandle = setTimeout(() => {
                    logger.warn(`Task ${taskId} timed out after ${timeout}ms`);
                    cancelled = true;
                    child.kill('SIGTERM');
                    
                    setTimeout(() => {
                        if (!child.killed) {
                            child.kill('SIGKILL');
                        }
                    }, 5000);
                    
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
        let output = result.stdout.toString('utf8');
        const stderr = result.stderr.toString('utf8');

        // Apply basic output processing
        const processing = task.outputProcessing;
        if (processing) {
            // Trim whitespace if configured
            if (processing.trimWhitespace !== false) {
                output = output.trim();
            }

            // Limit output length
            if (processing.maxOutputLength && output.length > processing.maxOutputLength) {
                output = output.substring(0, processing.maxOutputLength);
                logger.warn(`Output truncated to ${processing.maxOutputLength} characters for task: ${task.id}`);
            }
        }

        return {
            success,
            output,
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
            output: '',
            stderr: '',
            exitCode,
            taskId: task.id,
            executionTime,
            isBinary: false,
            cancelled: false,
            error: errorMessage
        };
    }

    /**
     * Create an error result for failed execution
     */
    private createErrorResult(
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
            output: '',
            stderr: '',
            exitCode,
            taskId: task.id,
            executionTime,
            isBinary: false,
            cancelled: false,
            error: errorMessage
        };
    }
}