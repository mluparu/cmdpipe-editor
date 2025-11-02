import * as vscode from 'vscode';
import { WarningMessageModel } from '../types/trustTypes';

export type WarningActionResult = 'trust-workspace' | 'view-user-tasks' | 'dismiss';

export interface ISecurityWarningPresenter {
    showTaskBlockedWarning(model: WarningMessageModel): Promise<WarningActionResult>;
}

export class SecurityWarningPresenter implements ISecurityWarningPresenter {
    private activeWarning?: Promise<WarningActionResult>;
    private activeTelemetryId?: string;

    async showTaskBlockedWarning(model: WarningMessageModel): Promise<WarningActionResult> {
        if (this.activeWarning && this.activeTelemetryId === model.telemetryId) {
            return this.activeWarning;
        }

        const warningPromise = this.presentWarning(model);
        const trackedPromise = warningPromise.finally(() => {
            if (this.activeWarning === trackedPromise) {
                this.activeWarning = undefined;
                this.activeTelemetryId = undefined;
            }
        });

        this.activeWarning = trackedPromise;
        this.activeTelemetryId = model.telemetryId;

        return trackedPromise;
    }

    private async presentWarning(model: WarningMessageModel): Promise<WarningActionResult> {
        const message = `${model.title}\n\n${model.detail}`;
        const actionLabels: string[] = [model.primaryAction.label];

        if (model.secondaryAction) {
            actionLabels.push(model.secondaryAction.label);
        }

        const selection = await vscode.window.showWarningMessage(message, ...actionLabels);

        if (selection === model.primaryAction.label) {
            await vscode.commands.executeCommand(model.primaryAction.command);
            return 'trust-workspace';
        }

        if (model.secondaryAction && selection === model.secondaryAction.label) {
            await vscode.commands.executeCommand(model.secondaryAction.command);
            return 'view-user-tasks';
        }

        return 'dismiss';
    }
}
