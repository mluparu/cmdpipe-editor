/**
 * Shared factories for variable substitution unit tests.
 */

import { Position, Uri } from "vscode";

import { TaskSource } from "../../../../src/types/configTypes";
import type { TaskDefinition, TaskExecutionDefaults } from "../../../../src/types/taskTypes";
import {
    PlaceholderCategory,
    PlaceholderResolutionStatus,
    type ActiveFileDescriptor,
    type EditorSelection,
    type PlaceholderResolution,
    type SubstitutionRequest,
    type SubstitutionResult,
    type VariableContextSnapshot,
    type WorkspaceFolderDescriptor
} from "../../../../src/substitution/substitutionTypes";

export interface CreateVariableContextOptions {
    task?: Partial<TaskDefinition>;
    workspaceFolder?: Partial<WorkspaceFolderDescriptor> | null;
    activeFile?: Partial<ActiveFileDescriptor> | null;
    editorSelection?: Partial<EditorSelection> | null;
    env?: Record<string, string>;
    config?: Record<string, unknown> | Map<string, unknown>;
    timestamp?: number;
    workspaceDefaults?: TaskExecutionDefaults;
}

export interface CreateSubstitutionRequestOptions extends CreateVariableContextOptions {
    taskId?: string;
    command?: string;
    args?: string[];
    workingDirectory?: string;
    environmentVariables?: Record<string, string>;
    additionalFields?: Record<string, unknown>;
}

/**
 * Builds a task definition suitable for substitution tests with sensible
 * defaults that can be overridden per call.
 */
export function createTaskDefinition(overrides: Partial<TaskDefinition> = {}): TaskDefinition {
    return {
        id: overrides.id ?? "task-001",
        name: overrides.name ?? "mock-task",
        command: overrides.command ?? "echo ${workspaceFolder}",
        source: overrides.source ?? TaskSource.WORKSPACE,
        description: overrides.description,
        args: overrides.args ?? ["--flag"],
        workingDirectory: overrides.workingDirectory,
        environmentVariables: overrides.environmentVariables ?? { FLAG: "value" },
        timeout: overrides.timeout,
        category: overrides.category,
        tags: overrides.tags,
        platforms: overrides.platforms,
        shell: overrides.shell,
        outputProcessing: overrides.outputProcessing,
        keybinding: overrides.keybinding,
        icon: overrides.icon,
        showInTerminal: overrides.showInTerminal,
        configurationFile: overrides.configurationFile ?? "d:/workspace/.vscode/tasks.json",
        workspaceFolder: overrides.workspaceFolder,
        workspaceDefaults: overrides.workspaceDefaults
    };
}

/**
 * Constructs a variable context snapshot with overridable sections.
 */
export function createVariableContextSnapshot(
    overrides: CreateVariableContextOptions = {}
): VariableContextSnapshot {
    const workspaceFolder = resolveWorkspaceFolder(overrides.workspaceFolder);
    const editorSelection = resolveEditorSelection(overrides.editorSelection);
    const taskOverrides: Partial<TaskDefinition> = {
        ...(overrides.task ?? {}),
        workspaceDefaults: overrides.workspaceDefaults ?? overrides.task?.workspaceDefaults
    };

    return {
        task: createTaskDefinition(taskOverrides),
        workspaceFolder,
        activeFile: resolveActiveFileDescriptor(overrides.activeFile, workspaceFolder ?? undefined),
        editorSelection,
        env: overrides.env ?? { FLAG: "value" },
        config: resolveConfig(overrides.config),
        timestamp: overrides.timestamp ?? Date.now()
    };
}

/**
 * Builds a substitution request bundle using the supplied overrides.
 */
export function createSubstitutionRequest(
    overrides: CreateSubstitutionRequestOptions = {}
): SubstitutionRequest {
    const context = createVariableContextSnapshot(overrides);

    return {
        taskId: overrides.taskId ?? "task-001",
        command: overrides.command ?? context.task.command,
        args: overrides.args ?? context.task.args ?? [],
        workingDirectory: overrides.workingDirectory,
        environmentVariables: overrides.environmentVariables ?? context.task.environmentVariables,
        additionalFields: overrides.additionalFields,
        context
    };
}

/**
 * Provides a reusable placeholder resolution stub for tests.
 */
export function createPlaceholderResolution(
    token: string,
    category: PlaceholderCategory,
    status: PlaceholderResolutionStatus = PlaceholderResolutionStatus.RESOLVED,
    values: Partial<Pick<PlaceholderResolution, "resolvedValue" | "redactedValue" | "message">> = {}
): PlaceholderResolution {
    return {
        token,
        category,
        status,
        resolvedValue: values.resolvedValue,
        redactedValue: values.redactedValue,
        message: values.message
    };
}

/**
 * Produces a substitution result payload that callers can expand for
 * additional assertions.
 */
export function createSubstitutionResult(
    placeholders: PlaceholderResolution[],
    overrides: Partial<Omit<SubstitutionResult, "placeholders">> = {}
): SubstitutionResult {
    return {
        command: overrides.command ?? "echo done",
        args: overrides.args ?? [],
        workingDirectory: overrides.workingDirectory,
        environmentVariables: overrides.environmentVariables,
        warnings: overrides.warnings,
        summary: overrides.summary,
        placeholders
    };
}

function resolveWorkspaceFolder(
    partial: Partial<WorkspaceFolderDescriptor> | null | undefined
): WorkspaceFolderDescriptor | undefined {
    if (partial === null) {
        return undefined;
    }

    return {
        uri: partial?.uri ?? Uri.file("d:/workspace"),
        name: partial?.name ?? "workspace",
        fsPath: partial?.fsPath ?? "d:/workspace"
    };
}

function resolveActiveFileDescriptor(
    partial: Partial<ActiveFileDescriptor> | null | undefined,
    workspaceFolder?: WorkspaceFolderDescriptor
): ActiveFileDescriptor | undefined {
    if (partial === null) {
        return undefined;
    }

    const uri = partial?.uri ?? Uri.file("d:/workspace/file.txt");
    const fsPath = partial?.fsPath ?? "d:/workspace/file.txt";
    const relativePath =
        partial?.relativePath ?? (workspaceFolder ? fsPath.replace(`${workspaceFolder.fsPath}/`, "") : undefined);

    return {
        uri,
        fsPath,
        relativePath,
        selection: partial?.selection ?? resolveEditorSelection(partial?.selection)
    };
}

function resolveEditorSelection(
    partial: Partial<EditorSelection> | null | undefined
): EditorSelection | undefined {
    if (partial === null) {
        return undefined;
    }

    return {
        start: partial?.start ?? new Position(0, 0),
        end: partial?.end ?? new Position(0, 5),
        text: partial?.text ?? "value"
    };
}

function resolveConfig(source?: Record<string, unknown> | Map<string, unknown>): Map<string, unknown> {
    if (!source) {
        return new Map();
    }

    if (source instanceof Map) {
        return new Map(source);
    }

    return new Map(Object.entries(source));
}
