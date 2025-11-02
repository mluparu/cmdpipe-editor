// Trust-related overlay types derived from the workspace trust feature data model

import type { Disposable } from 'vscode';
import type { TaskDefinition as ConfigTaskDefinition } from './configTypes';

export type TrustState = 'trusted' | 'untrusted' | 'undecided';

export interface TrustContext {
    /** Current workspace trust classification */
    state: TrustState;
    /** Epoch timestamp (ms) recording when trust was last evaluated */
    lastEvaluated: number;
    /** Source identifier for diagnostics and logging */
    source: 'workspace-api';
}

export type TrustBlockReason = 'workspace-untrusted' | 'undecided';
export type TrustNextActionHint = 'manage-trust' | 'view-user-task';

export interface TaskAvailability {
    /** Original task data reused across guard and UI flows */
    task: ConfigTaskDefinition;
    /** Indicates whether the task is currently blocked by trust rules */
    isBlocked: boolean;
    /** Machine-readable reason for a block, present only when blocked */
    blockReason?: TrustBlockReason;
    /** Action hint for UI messaging, present only when blocked */
    nextActionHint?: TrustNextActionHint;
}

export interface BlockedTaskAttempt {
    /** Timestamp (epoch ms) when the block occurred */
    timestamp: number;
    /** Stable identifier of the task being executed */
    taskId: string;
    /** Source classification for the task (workspace vs user) */
    taskSource: 'workspace' | 'user';
    /** Trust state observed when the block was triggered */
    trustState: TrustState;
    /** Human-readable summary used in logging */
    message: string;
}

export interface WarningMessageModel {
    /** Headline text referencing the blocked task */
    title: string;
    /** Detailed explanation referencing trust requirements */
    detail: string;
    /** Primary action encouraging workspace trust management */
    primaryAction: {
        label: string;
        command: 'workbench.action.manageTrustedFolders';
    };
    /** Optional secondary action linking to user task management */
    secondaryAction?: {
        label: string;
        command: 'cmdpipe.config.openUserConfig';
    };
    /** Telemetry correlation identifier (local only) */
    telemetryId: string;
}

export type TrustAwareTaskList = TaskAvailability[];

export type TrustGuardEvents = {
    'trust.blocked': (attempt: BlockedTaskAttempt) => void;
    'trust.granted': (context: TrustContext) => void;
};

export type TrustEventHandlers = Disposable[];
