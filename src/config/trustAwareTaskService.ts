import { TaskDefinition, TaskSource } from '../types/configTypes';
import { TaskAvailability, TrustBlockReason, TrustContext, TrustNextActionHint } from '../types/trustTypes';
import { ITaskTrustGuard } from '../discovery/trustGuard';

export interface ITrustAwareTaskService {
    mapToAvailability(tasks: TaskDefinition[]): TaskAvailability[];
    filterRunnable(tasks: TaskDefinition[]): TaskDefinition[];
}

export class TrustAwareTaskService implements ITrustAwareTaskService {
    constructor(private readonly trustGuard: Pick<ITaskTrustGuard, 'getCurrentContext'>) {}

    /**
     * Maps a list of tasks to their availability based on the current trust context.
     * @param tasks     The list of tasks to evaluate.
     * @returns       The mapped list of task availability.
     */
    mapToAvailability(tasks: TaskDefinition[]): TaskAvailability[] {
        const context = this.trustGuard.getCurrentContext();
        return tasks.map((task) => this.decorateTask(task, context));
    }

    /**
     * Filters a list of tasks to only those that are runnable based on the current trust context.
     * @param tasks    The list of tasks to filter.
     * @returns       The filtered list of runnable tasks.
     */
    filterRunnable(tasks: TaskDefinition[]): TaskDefinition[] {
        const context = this.trustGuard.getCurrentContext();
        return tasks.filter((task) => !this.shouldBlockTask(task, context));
    }

    /*** Decorates a task with its availability based on the current trust context. */
    private decorateTask(task: TaskDefinition, context: TrustContext): TaskAvailability {
        if (!this.shouldBlockTask(task, context)) {
            return { task, isBlocked: false };
        }

        return {
            task,
            isBlocked: true,
            blockReason: this.mapBlockReason(context),
            nextActionHint: this.mapNextActionHint(context)
        };
    }

    /*** Determines if a task should be blocked based on the current trust context. */
    private shouldBlockTask(task: TaskDefinition, context: TrustContext): boolean {
        return task.source === TaskSource.WORKSPACE && context.state !== 'trusted';
    }

    /*** Maps the block reason based on the current trust context. */
    private mapBlockReason(context: TrustContext): TrustBlockReason {
        return context.state === 'untrusted' ? 'workspace-untrusted' : 'undecided';
    }

    private mapNextActionHint(context: TrustContext): TrustNextActionHint {
        return 'manage-trust';
    }
}
