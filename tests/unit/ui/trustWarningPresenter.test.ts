import { window, commands } from 'vscode';
import { SecurityWarningPresenter } from '../../../src/ui/trustWarningPresenter';
import { WarningMessageModel } from '../../../src/types/trustTypes';

jest.mock('vscode');

describe('SecurityWarningPresenter', () => {
    let presenter: SecurityWarningPresenter;
    let model: WarningMessageModel;

    beforeEach(() => {
        jest.clearAllMocks();
        presenter = new SecurityWarningPresenter();
        model = {
            title: 'Task "build" is blocked',
            detail: 'Workspace trust is required before workspace tasks can execute. Current state: untrusted.',
            primaryAction: {
                label: 'Trust Workspace',
                command: 'workbench.action.manageTrustedFolders'
            },
            secondaryAction: {
                label: 'View User Tasks',
                command: 'cmdpipe.config.openUserConfig'
            },
            telemetryId: 'build-task-123'
        };
    });

    it('shows warning copy with primary and secondary actions and returns trust-workspace when primary selected', async () => {
        (window.showWarningMessage as jest.Mock).mockResolvedValue(model.primaryAction.label);

        const result = await presenter.showTaskBlockedWarning(model);

        expect(window.showWarningMessage).toHaveBeenCalledWith(
            `${model.title}\n\n${model.detail}`,
            model.primaryAction.label,
            model.secondaryAction?.label
        );
        expect(commands.executeCommand).toHaveBeenCalledWith(model.primaryAction.command);
        expect(result).toBe('trust-workspace');
    });

    it('returns view-user-tasks when secondary action selected', async () => {
        (window.showWarningMessage as jest.Mock).mockResolvedValue(model.secondaryAction?.label);

        const result = await presenter.showTaskBlockedWarning(model);

        expect(commands.executeCommand).toHaveBeenCalledWith(model.secondaryAction?.command);
        expect(result).toBe('view-user-tasks');
    });

    it('returns dismiss when no action is selected and does not execute any command', async () => {
        (window.showWarningMessage as jest.Mock).mockResolvedValue(undefined);

        const result = await presenter.showTaskBlockedWarning(model);

        expect(commands.executeCommand).not.toHaveBeenCalled();
        expect(result).toBe('dismiss');
    });

    it('omits secondary action when not provided', async () => {
        delete model.secondaryAction;
        (window.showWarningMessage as jest.Mock).mockResolvedValue(model.primaryAction.label);

        await presenter.showTaskBlockedWarning(model);

        expect(window.showWarningMessage).toHaveBeenCalledWith(
            `${model.title}\n\n${model.detail}`,
            model.primaryAction.label
        );
    });
});
