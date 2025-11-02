import { TaskSource, TaskDefinition } from '../../../src/types/configTypes';
import { TrustViolationError, TrustGuard } from '../../../src/utils/trustGuard';
import { workspace } from 'vscode';
import { Logger } from '../../../src/utils/logger';

jest.mock('vscode');

describe('TrustGuard', () => {
    let guard: TrustGuard;
    const createTask = (source: TaskSource): TaskDefinition => ({
        name: source === TaskSource.WORKSPACE ? 'workspace-task' : 'user-task',
        command: 'echo',
        source,
        filePath: `/tmp/${source}-task.json`
    });

    beforeEach(() => {
        jest.clearAllMocks();
        (workspace as any).__resetTrustMock?.();
        const logger = Logger.getInstance();
        jest.spyOn(logger, 'warn');
        guard = new TrustGuard();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('allows workspace tasks when the workspace is trusted', async () => {
        (workspace as any).__setTrustState(true);
        const task = createTask(TaskSource.WORKSPACE);

        await expect(guard.ensureCanExecute(task)).resolves.toBeUndefined();
    });

    it('blocks workspace tasks when the workspace is untrusted', async () => {
    (workspace as any).isTrusted = false;
        expect((workspace as any).isTrusted).toBe(false);
        const task = createTask(TaskSource.WORKSPACE);

        await expect(guard.ensureCanExecute(task)).rejects.toMatchObject({
            taskId: task.name,
            trustState: 'untrusted'
        });
        const logger = Logger.getInstance();
        expect(logger.warn).toHaveBeenCalled();
    });

    it('allows user tasks even when the workspace is untrusted', async () => {
        (workspace as any).__setTrustState(false);
        const task = createTask(TaskSource.USER);

        await expect(guard.ensureCanExecute(task)).resolves.toBeUndefined();
    });
});
