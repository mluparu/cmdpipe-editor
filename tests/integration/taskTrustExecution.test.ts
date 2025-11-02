import { TaskDefinition, TaskSource } from '../../src/types/configTypes';
import { TrustGuard, TrustViolationError } from '../../src/discovery/trustGuard';
import { TrustAwareTaskService } from '../../src/config/trustAwareTaskService';
import { TaskAvailability } from '../../src/types/trustTypes';
import { workspace } from 'vscode';

jest.mock('vscode');

describe('Task Trust Execution', () => {
    const createWorkspaceTask = (): TaskDefinition => ({
        name: 'build',
        command: 'npm run build',
        source: TaskSource.WORKSPACE,
        filePath: '/workspace/.vscode/tasks.json'
    });

    const createUserTask = (): TaskDefinition => ({
        name: 'user:lint',
        command: 'npm run lint',
        source: TaskSource.USER,
        filePath: '/user/tasks.json'
    });

    beforeEach(() => {
        jest.clearAllMocks();
        (workspace as any).__resetTrustMock?.();
    });

    it('prevents workspace task execution when workspace is untrusted', async () => {
    (workspace as any).isTrusted = false;
        const guard = new TrustGuard();
        const task = createWorkspaceTask();
        const executeMock = jest.fn();

        const runTask = async () => {
            await guard.ensureCanExecute(task);
            await executeMock();
        };

        await expect(runTask()).rejects.toBeInstanceOf(TrustViolationError);
        expect(executeMock).not.toHaveBeenCalled();
    });

    it('allows user tasks to execute when workspace is untrusted', async () => {
    (workspace as any).isTrusted = false;
        const guard = new TrustGuard();
        const userTask = createUserTask();

        await expect(guard.ensureCanExecute(userTask)).resolves.toBeUndefined();
    });

    it('updates task availability after workspace trust is granted', () => {
        (workspace as any).__setTrustState(false);
        const guard = new TrustGuard();
    guard.registerTrustListeners();
    expect((workspace as any).onDidGrantWorkspaceTrust).toHaveBeenCalled();
    const [trustListener] = (workspace as any).onDidGrantWorkspaceTrust.mock.calls[0] ?? [];
    expect(typeof trustListener).toBe('function');
        const service = new TrustAwareTaskService(guard);

        const workspaceTask = createWorkspaceTask();
        const userTask = createUserTask();

    const initialAvailability: TaskAvailability[] = service.mapToAvailability([workspaceTask, userTask]);
    const workspaceEntry = initialAvailability.find((entry) => entry.task.name === workspaceTask.name);
    const userEntry = initialAvailability.find((entry) => entry.task.name === userTask.name);

    expect(workspaceEntry?.isBlocked).toBe(true);
    expect(workspaceEntry?.blockReason).toBe('undecided');
        expect(userEntry?.isBlocked).toBe(false);

    (workspace as any).isTrusted = true;
    (trustListener as () => void)();

    const contextAfterGrant = guard.getCurrentContext();
    expect(contextAfterGrant.state).toBe('trusted');

    const refreshedAvailability: TaskAvailability[] = service.mapToAvailability([workspaceTask, userTask]);
    const refreshedWorkspaceEntry = refreshedAvailability.find((entry) => entry.task.name === workspaceTask.name);

        expect(refreshedWorkspaceEntry?.isBlocked).toBe(false);
        expect(refreshedWorkspaceEntry?.blockReason).toBeUndefined();
    });
});
