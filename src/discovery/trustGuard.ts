import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { TaskDefinition, TaskSource } from '../types/configTypes';
import { Logger } from '../utils/logger';
import { BlockedTaskAttempt, TrustContext, TrustGuardEvents, TrustState } from '../types/trustTypes';

export class TrustViolationError extends Error {
    constructor(
        public readonly taskId: string,
        public readonly trustState: TrustState,
        message: string
    ) {
        super(message);
        this.name = 'TrustViolationError';
    }
}

export interface ITaskTrustGuard {
    ensureCanExecute(task: TaskDefinition): Promise<void>;
    registerTrustListeners(): vscode.Disposable[];
    getCurrentContext(): TrustContext;
    on<E extends keyof TrustGuardEvents>(event: E, listener: TrustGuardEvents[E]): vscode.Disposable;
}

export class TrustGuard implements ITaskTrustGuard {
    private readonly logger = Logger.getInstance();
    private readonly eventEmitter = new EventEmitter();
    private trustContext: TrustContext;
    private readonly disposables: vscode.Disposable[] = [];
    private trustHasBeenGranted = vscode.workspace.isTrusted;

    constructor() {
        this.eventEmitter.setMaxListeners(0);
        this.trustContext = this.evaluateTrustContext();
    }

    /**
     * Ensures that the given task can be executed based on the current trust state.
     * Throws TrustViolationError if execution is not allowed.
     */
    async ensureCanExecute(task: TaskDefinition): Promise<void> {
        this.trustContext = this.evaluateTrustContext();

        if (task.source !== TaskSource.WORKSPACE) {
            return;
        }

        if (this.trustContext.state === 'trusted') {
            return;
        }

        const attempt = this.createBlockedAttempt(task);
        this.logger.warn(
            `[TrustGuard] Blocked workspace task "${task.name}" (trust state: ${attempt.trustState})`,
            attempt
        );
        this.emit('trust.blocked', attempt);

        throw new TrustViolationError(
            attempt.taskId,
            attempt.trustState,
            attempt.message
        );
    }

    registerTrustListeners(): vscode.Disposable[] {
        if (this.disposables.length > 0) {
            return [...this.disposables];
        }

        const disposable = vscode.workspace.onDidGrantWorkspaceTrust(() => {
            this.trustHasBeenGranted = true;
            this.trustContext = this.evaluateTrustContext();
            this.logger.info('[TrustGuard] Workspace trust granted');
            this.emit('trust.granted', this.trustContext);
        });

        this.disposables.push(disposable);
        return [...this.disposables];
    }

    getCurrentContext(): TrustContext {
        return { ...this.trustContext };
    }

    on<E extends keyof TrustGuardEvents>(event: E, listener: TrustGuardEvents[E]): vscode.Disposable {
        this.eventEmitter.on(event, listener as (...args: unknown[]) => void);
        return {
            dispose: () => {
                this.eventEmitter.off(event, listener as (...args: unknown[]) => void);
            }
        };
    }

    private evaluateTrustContext(): TrustContext {
        const isTrusted = vscode.workspace.isTrusted;
        const state: TrustState = isTrusted
            ? 'trusted'
            : this.trustHasBeenGranted
                ? 'untrusted'
                : 'undecided';

        return {
            state,
            lastEvaluated: Date.now(),
            source: 'workspace-api'
        };
    }

    private createBlockedAttempt(task: TaskDefinition): BlockedTaskAttempt {
        const message = `Workspace task "${task.name}" cannot run until the workspace is trusted.`;
        return {
            timestamp: Date.now(),
            taskId: task.name,
            taskSource: 'workspace',
            trustState: this.trustContext.state,
            message
        };
    }

    private emit<E extends keyof TrustGuardEvents>(event: E, payload: Parameters<TrustGuardEvents[E]>[0]): void {
        this.eventEmitter.emit(event, payload);
    }
}
