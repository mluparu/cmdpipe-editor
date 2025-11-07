import * as path from "path";
import * as vscode from "vscode";

import { createScopedLogger } from "../utils/logger";
import type { TaskDefinition } from "../types/taskTypes";
import type {
    ActiveFileDescriptor,
    EditorSelection,
    VariableContextSnapshot,
    WorkspaceFolderDescriptor
} from "./substitutionTypes";

const logger = createScopedLogger("VariableContextBuilder");

export interface VariableContextBuilderOptions {
    /** Optional time source override for deterministic testing. */
    clock?: () => number;
}

/** Builds variable resolution context snapshots for task executions. */
export class VariableContextBuilder {
    private readonly clock: () => number;

    constructor(options: VariableContextBuilderOptions = {}) {
        this.clock = options.clock ?? Date.now;
    }

    public async build(
        task: TaskDefinition,
        requestedConfigKeys: Iterable<string> = []
    ): Promise<VariableContextSnapshot> {
        const workspaceFolder = this.resolveWorkspaceFolder(task);
        const editorSelection = this.captureEditorSelection();
        const activeFile = this.resolveActiveFile(workspaceFolder, editorSelection);

        return {
            task,
            workspaceFolder,
            activeFile,
            editorSelection,
            env: this.buildEnvironmentSnapshot(task),
            config: this.buildConfigurationSnapshot(workspaceFolder, requestedConfigKeys),
            timestamp: this.clock()
        };
    }

    private resolveWorkspaceFolder(task: TaskDefinition): WorkspaceFolderDescriptor | undefined {
        if (task.workspaceFolder) {
            return {
                name: task.workspaceFolder.name,
                fsPath: task.workspaceFolder.fsPath,
                uri: task.workspaceFolder.uri
            };
        }

        const fromConfig = this.findWorkspaceByPath(task.configurationFile);
        if (fromConfig) {
            return fromConfig;
        }

        const fromWorkingDirectory = this.findWorkspaceByPath(task.workingDirectory);
        if (fromWorkingDirectory) {
            return fromWorkingDirectory;
        }

        if (vscode.workspace.workspaceFolders?.length) {
            logger.debug("Falling back to first workspace folder for task context", task.name);
            const fallback = vscode.workspace.workspaceFolders[0];
            return {
                name: fallback.name,
                fsPath: fallback.uri.fsPath,
                uri: fallback.uri
            };
        }

        logger.debug("No workspace folder could be resolved for task", task.name);
        return undefined;
    }

    private findWorkspaceByPath(candidate?: string): WorkspaceFolderDescriptor | undefined {
        if (!candidate) {
            return undefined;
        }

        try {
            const uri = vscode.Uri.file(candidate);
            const folder = vscode.workspace.getWorkspaceFolder(uri);
            if (folder) {
                return {
                    name: folder.name,
                    fsPath: folder.uri.fsPath,
                    uri: folder.uri
                };
            }
        } catch (error) {
            logger.debug(`Failed to resolve workspace for path ${candidate}`, error as Error);
        }

        const fallbackFolder = vscode.workspace.workspaceFolders?.find((folder) =>
            this.normalise(candidate).startsWith(this.normalise(folder.uri.fsPath))
        );

        if (!fallbackFolder) {
            return undefined;
        }

        return {
            name: fallbackFolder.name,
            fsPath: fallbackFolder.uri.fsPath,
            uri: fallbackFolder.uri
        };
    }

    private resolveActiveFile(
        workspaceFolder: WorkspaceFolderDescriptor | undefined,
        editorSelection?: EditorSelection
    ): ActiveFileDescriptor | undefined {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return undefined;
        }

        const document = editor.document;
        if (!document) {
            return undefined;
        }

        const fsPath = document.uri?.fsPath ?? document.fileName;
        const relativePath = workspaceFolder ? this.computeRelativePath(workspaceFolder.fsPath, fsPath) : undefined;

        return {
            uri: document.uri,
            fsPath,
            relativePath,
            selection: editorSelection
        };
    }

    private captureEditorSelection(): EditorSelection | undefined {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.selection || editor.selection.isEmpty) {
            return undefined;
        }

        const document = editor.document;
        if (!document) {
            return undefined;
        }

        const text = typeof document.getText === "function" ? document.getText(editor.selection) : "";
        return {
            start: editor.selection.start,
            end: editor.selection.end,
            text
        };
    }

    private buildEnvironmentSnapshot(task: TaskDefinition): Record<string, string> {
        const env: Record<string, string> = {};

        this.mergeEnvironment(env, process.env);
        if (task.workspaceDefaults?.env) {
            this.mergeEnvironment(env, task.workspaceDefaults.env);
        }
        if (task.environmentVariables) {
            this.mergeEnvironment(env, task.environmentVariables);
        }

        return env;
    }

    private mergeEnvironment(target: Record<string, string>, source: NodeJS.ProcessEnv | Record<string, unknown>): void {
        for (const [key, value] of Object.entries(source)) {
            if (typeof value === "string") {
                target[key] = value;
            }
        }
    }

    private buildConfigurationSnapshot(
        workspaceFolder: WorkspaceFolderDescriptor | undefined,
        requestedKeys: Iterable<string>
    ): Map<string, unknown> {
        const keys = new Set<string>();
        for (const key of requestedKeys) {
            if (typeof key !== "string") {
                continue;
            }

            const trimmed = key.trim();
            if (trimmed) {
                keys.add(trimmed);
            }
        }

        if (keys.size === 0) {
            return new Map();
        }

        const snapshot = new Map<string, unknown>();
        for (const key of keys) {
            const value = this.readConfigurationValue(key, workspaceFolder);
            if (value !== undefined) {
                snapshot.set(key, value);
            }
        }

        return snapshot;
    }

    private readConfigurationValue(
        key: string,
        workspaceFolder: WorkspaceFolderDescriptor | undefined
    ): unknown {
        try {
            const scoped = vscode.workspace.getConfiguration(undefined, workspaceFolder?.uri);
            const scopedValue = scoped.get(key);
            if (scopedValue !== undefined) {
                return scopedValue;
            }

            if (workspaceFolder) {
                const workspaceValue = vscode.workspace.getConfiguration(undefined).get(key);
                if (workspaceValue !== undefined) {
                    return workspaceValue;
                }
            }

            return vscode.workspace.getConfiguration(undefined, null).get(key);
        } catch (error) {
            logger.warn(`Failed to read configuration value for ${key}`, error as Error);
            return undefined;
        }
    }

    private computeRelativePath(basePath: string, targetPath: string): string | undefined {
        const relative = path.relative(basePath, targetPath);
        if (!relative || relative.startsWith("..")) {
            return undefined;
        }

        return relative.split(path.sep).join("/");
    }

    private normalise(p: string): string {
        const normalised = p.replace(/\\/g, "/");
        return process.platform === "win32" ? normalised.toLowerCase() : normalised;
    }
}
