import * as path from "path";
import * as vscode from "vscode";

import { createScopedLogger } from "../utils/logger";
import { REDACTED_VALUE } from "./substitutionSummary";
import {
    PlaceholderCategory,
    PlaceholderResolutionStatus,
    SubstitutionFailureReason,
    type PlaceholderResolution,
    type SubstitutionFailure,
    type SubstitutionRequest,
    type SubstitutionResult
} from "./substitutionTypes";

const logger = createScopedLogger("VariableResolver");
const PLACEHOLDER_PATTERN = /\$\{([^}]+)\}/g;

export class SubstitutionError extends Error {
    public readonly failure: SubstitutionFailure;

    constructor(failure: SubstitutionFailure) {
        super(failure.message ?? `Failed to resolve placeholder ${failure.token}`);
        this.name = "SubstitutionError";
        this.failure = failure;
    }
}

/** Resolves VS Code style placeholders for task execution payloads. */
export class VariableResolver {
    public async resolve(request: SubstitutionRequest): Promise<SubstitutionResult> {
        const placeholders: PlaceholderResolution[] = [];
        const command = this.resolveString(request.command, request, placeholders);
        const args = request.args.map((entry) => this.resolveString(entry, request, placeholders));
        const workingDirectory = request.workingDirectory
            ? this.resolveString(request.workingDirectory, request, placeholders)
            : undefined;
        const environmentVariables = this.resolveDictionary(request.environmentVariables, request, placeholders);

        return {
            command,
            args,
            workingDirectory,
            environmentVariables,
            placeholders
        };
    }

    private resolveDictionary(
        source: Record<string, string> | undefined,
        request: SubstitutionRequest,
        placeholders: PlaceholderResolution[]
    ): Record<string, string> | undefined {
        if (!source) {
            return undefined;
        }

        const resolved: Record<string, string> = {};
        for (const [key, rawValue] of Object.entries(source)) {
            resolved[key] = this.resolveString(rawValue, request, placeholders);
        }
        return resolved;
    }

    private resolveString(
        input: string,
        request: SubstitutionRequest,
        placeholders: PlaceholderResolution[]
    ): string {
        PLACEHOLDER_PATTERN.lastIndex = 0;
        let resolved = "";
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        let encounteredPlaceholder = false;

        while ((match = PLACEHOLDER_PATTERN.exec(input)) !== null) {
            encounteredPlaceholder = true;
            const [token, identifier] = match;
            resolved += input.slice(lastIndex, match.index);

            const substitution = this.resolvePlaceholder(token, identifier, request);
            placeholders.push(substitution.placeholder);
            const failureReason = substitution.failureReason ?? SubstitutionFailureReason.UNSUPPORTED_PLACEHOLDER;

            if (substitution.placeholder.status !== PlaceholderResolutionStatus.RESOLVED) {
                throw new SubstitutionError({
                    token: token,
                    reason: failureReason,
                    message: substitution.placeholder.message,
                    details: substitution.details
                });
            }

            resolved += substitution.value ?? "";
            lastIndex = PLACEHOLDER_PATTERN.lastIndex;
        }

        if (!encounteredPlaceholder) {
            PLACEHOLDER_PATTERN.lastIndex = 0;
            return input;
        }

        if (lastIndex < input.length) {
            resolved += input.slice(lastIndex);
        }

        PLACEHOLDER_PATTERN.lastIndex = 0;

        return resolved;
    }

    private resolvePlaceholder(
        token: string,
        identifier: string,
        request: SubstitutionRequest
    ): {
        placeholder: PlaceholderResolution;
        value?: string;
        failureReason?: SubstitutionFailureReason;
        details?: Record<string, unknown>;
    } {
        if (identifier === "workspaceFolder") {
            return this.resolvePrimaryWorkspace(token, request);
        }

        if (identifier === "workspaceFolderBasename") {
            return this.resolveWorkspaceBasename(token, request);
        }

        if (identifier.startsWith("workspaceFolder:")) {
            return this.resolveNamedWorkspace(token, identifier.substring("workspaceFolder:".length));
        }

        if (identifier.startsWith("env:")) {
            return this.resolveEnvironmentVariable(token, identifier.substring("env:".length), request);
        }

        if (identifier.startsWith("config:")) {
            return this.resolveConfigurationSetting(token, identifier.substring("config:".length), request);
        }

        switch (identifier) {
            case "relativeFile":
                return this.resolveRelativeFile(token, request);
            case "file":
                return this.resolveFilePath(token, request);
            case "fileDirname":
                return this.resolveFileDirname(token, request);
            case "fileBasename":
                return this.resolveFileBasename(token, request);
            case "fileBasenameNoExtension":
                return this.resolveFileBasenameNoExtension(token, request);
            case "fileExtname":
                return this.resolveFileExtname(token, request);
            default:
                return {
                    placeholder: {
                        token,
                        category: PlaceholderCategory.UNSUPPORTED,
                        status: PlaceholderResolutionStatus.UNSUPPORTED,
                        message: `Unsupported placeholder ${identifier}`
                    },
                    failureReason: SubstitutionFailureReason.UNSUPPORTED_PLACEHOLDER
                };
        }
    }

    private resolvePrimaryWorkspace(
        token: string,
        request: SubstitutionRequest
    ): { placeholder: PlaceholderResolution; value?: string } {
        const workspaceFolder = request.context.workspaceFolder;
        if (!workspaceFolder) {
            return this.missingContext(token, PlaceholderCategory.WORKSPACE, "No workspace folder is associated with this task");
        }

        return {
            placeholder: {
                token,
                category: PlaceholderCategory.WORKSPACE,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: workspaceFolder.fsPath
            },
            value: workspaceFolder.fsPath
        };
    }

    private resolveWorkspaceBasename(
        token: string,
        request: SubstitutionRequest
    ): { placeholder: PlaceholderResolution; value?: string } {
        const workspaceFolder = request.context.workspaceFolder;
        if (!workspaceFolder) {
            return this.missingContext(token, PlaceholderCategory.WORKSPACE, "No workspace folder is associated with this task");
        }

        const basename = path.basename(workspaceFolder.fsPath);
        return {
            placeholder: {
                token,
                category: PlaceholderCategory.WORKSPACE,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: basename
            },
            value: basename
        };
    }

    private resolveNamedWorkspace(
        token: string,
        workspaceName: string
    ): { placeholder: PlaceholderResolution; value?: string; failureReason?: SubstitutionFailureReason } {
        const folder = vscode.workspace.workspaceFolders?.find((item) => item.name === workspaceName);
        if (!folder) {
            return this.missingContext(
                token,
                PlaceholderCategory.WORKSPACE,
                `Workspace folder '${workspaceName}' is not open`
            );
        }

        return {
            placeholder: {
                token,
                category: PlaceholderCategory.WORKSPACE,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: folder.uri.fsPath
            },
            value: folder.uri.fsPath
        };
    }

    private resolveEnvironmentVariable(
        token: string,
        rawName: string,
        request: SubstitutionRequest
    ): {
        placeholder: PlaceholderResolution;
        value?: string;
        failureReason?: SubstitutionFailureReason;
        details?: Record<string, unknown>;
    } {
        const variableName = rawName.trim();
        if (!variableName) {
            return {
                placeholder: {
                    token,
                    category: PlaceholderCategory.UNSUPPORTED,
                    status: PlaceholderResolutionStatus.UNSUPPORTED,
                    message: "Environment variable name is missing"
                },
                failureReason: SubstitutionFailureReason.UNSUPPORTED_PLACEHOLDER
            };
        }

        const value = request.context.env?.[variableName];
        if (typeof value !== "string") {
            return this.missingEnvironmentVariable(token, variableName);
        }

        return {
            placeholder: {
                token,
                category: PlaceholderCategory.ENV,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: value,
                redactedValue: REDACTED_VALUE
            },
            value,
            details: { variable: variableName }
        };
    }

    private resolveConfigurationSetting(
        token: string,
        rawKey: string,
        request: SubstitutionRequest
    ): {
        placeholder: PlaceholderResolution;
        value?: string;
        failureReason?: SubstitutionFailureReason;
        details?: Record<string, unknown>;
    } {
        const settingKey = rawKey.trim();
        if (!settingKey) {
            return {
                placeholder: {
                    token,
                    category: PlaceholderCategory.UNSUPPORTED,
                    status: PlaceholderResolutionStatus.UNSUPPORTED,
                    message: "Configuration setting name is missing"
                },
                failureReason: SubstitutionFailureReason.UNSUPPORTED_PLACEHOLDER
            };
        }

        const hasSetting = request.context.config.has(settingKey);
        if (!hasSetting) {
            return this.missingConfigurationSetting(token, settingKey);
        }

        const value = request.context.config.get(settingKey);
        const serialised = this.serialiseConfigurationValue(value);
        if (serialised === undefined) {
            return this.invalidConfigurationValue(token, settingKey, value);
        }

        if (serialised.length === 0) {
            logger.warn(`Configuration setting '${settingKey}' resolved to an empty string`);
        }

        return {
            placeholder: {
                token,
                category: PlaceholderCategory.CONFIG,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: serialised
            },
            value: serialised,
            details: { setting: settingKey }
        };
    }

    private resolveRelativeFile(
        token: string,
        request: SubstitutionRequest
    ): { placeholder: PlaceholderResolution; value?: string; failureReason?: SubstitutionFailureReason } {
        const activeFile = request.context.activeFile;
        if (!activeFile) {
            return this.missingFileContext(token, "No active editor is available for ${relativeFile}");
        }

        const relative =
            activeFile.relativePath ??
            (request.context.workspaceFolder
                ? this.computeRelativePath(request.context.workspaceFolder.fsPath, activeFile.fsPath)
                : undefined);

        if (!relative) {
            return this.missingFileContext(token, "Unable to compute relative path for active file");
        }

        return {
            placeholder: {
                token,
                category: PlaceholderCategory.FILE,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: relative
            },
            value: relative
        };
    }

    private resolveFilePath(
        token: string,
        request: SubstitutionRequest
    ): { placeholder: PlaceholderResolution; value?: string; failureReason?: SubstitutionFailureReason } {
        const activeFile = request.context.activeFile;
        if (!activeFile) {
            return this.missingFileContext(token, "No active editor is available for ${file}");
        }

        return {
            placeholder: {
                token,
                category: PlaceholderCategory.FILE,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: activeFile.fsPath
            },
            value: activeFile.fsPath
        };
    }

    private resolveFileDirname(
        token: string,
        request: SubstitutionRequest
    ): { placeholder: PlaceholderResolution; value?: string; failureReason?: SubstitutionFailureReason } {
        const activeFile = request.context.activeFile;
        if (!activeFile) {
            return this.missingFileContext(token, "No active editor is available for ${fileDirname}");
        }

        const dirname = path.dirname(activeFile.fsPath);
        return {
            placeholder: {
                token,
                category: PlaceholderCategory.FILE,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: dirname
            },
            value: dirname
        };
    }

    private resolveFileBasename(
        token: string,
        request: SubstitutionRequest
    ): { placeholder: PlaceholderResolution; value?: string; failureReason?: SubstitutionFailureReason } {
        const activeFile = request.context.activeFile;
        if (!activeFile) {
            return this.missingFileContext(token, "No active editor is available for ${fileBasename}");
        }

        const basename = path.basename(activeFile.fsPath);
        return {
            placeholder: {
                token,
                category: PlaceholderCategory.FILE,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: basename
            },
            value: basename
        };
    }

    private resolveFileBasenameNoExtension(
        token: string,
        request: SubstitutionRequest
    ): { placeholder: PlaceholderResolution; value?: string; failureReason?: SubstitutionFailureReason } {
        const activeFile = request.context.activeFile;
        if (!activeFile) {
            return this.missingFileContext(token, "No active editor is available for ${fileBasenameNoExtension}");
        }

        const ext = path.extname(activeFile.fsPath);
        const basename = path.basename(activeFile.fsPath, ext);
        return {
            placeholder: {
                token,
                category: PlaceholderCategory.FILE,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: basename
            },
            value: basename
        };
    }

    private resolveFileExtname(
        token: string,
        request: SubstitutionRequest
    ): { placeholder: PlaceholderResolution; value?: string; failureReason?: SubstitutionFailureReason } {
        const activeFile = request.context.activeFile;
        if (!activeFile) {
            return this.missingFileContext(token, "No active editor is available for ${fileExtname}");
        }

        const ext = path.extname(activeFile.fsPath);
        return {
            placeholder: {
                token,
                category: PlaceholderCategory.FILE,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: ext
            },
            value: ext
        };
    }

    private missingContext(
        token: string,
        category: PlaceholderCategory,
        message: string
    ): { placeholder: PlaceholderResolution; failureReason: SubstitutionFailureReason } {
        logger.warn(message);
        return {
            placeholder: {
                token,
                category,
                status: PlaceholderResolutionStatus.MISSING,
                message
            },
            failureReason: SubstitutionFailureReason.UNSUPPORTED_PLACEHOLDER
        };
    }

    private missingFileContext(
        token: string,
        message: string
    ): { placeholder: PlaceholderResolution; failureReason: SubstitutionFailureReason } {
        logger.warn(message);
        return {
            placeholder: {
                token,
                category: PlaceholderCategory.FILE,
                status: PlaceholderResolutionStatus.MISSING,
                message
            },
            failureReason: SubstitutionFailureReason.MISSING_FILE
        };
    }

    private missingEnvironmentVariable(
        token: string,
        variableName: string
    ): {
        placeholder: PlaceholderResolution;
        failureReason: SubstitutionFailureReason;
        details: Record<string, unknown>;
    } {
        const message = `Environment variable '${variableName}' is not defined`;
        logger.warn(message);
        return {
            placeholder: {
                token,
                category: PlaceholderCategory.ENV,
                status: PlaceholderResolutionStatus.MISSING,
                message
            },
            failureReason: SubstitutionFailureReason.MISSING_ENVIRONMENT,
            details: { variable: variableName }
        };
    }

    private missingConfigurationSetting(
        token: string,
        settingKey: string
    ): {
        placeholder: PlaceholderResolution;
        failureReason: SubstitutionFailureReason;
        details: Record<string, unknown>;
    } {
        const message = `Configuration setting '${settingKey}' is not defined`;
        logger.warn(message);
        return {
            placeholder: {
                token,
                category: PlaceholderCategory.CONFIG,
                status: PlaceholderResolutionStatus.MISSING,
                message
            },
            failureReason: SubstitutionFailureReason.MISSING_CONFIG,
            details: { setting: settingKey }
        };
    }

    private invalidConfigurationValue(
        token: string,
        settingKey: string,
        value: unknown
    ): {
        placeholder: PlaceholderResolution;
        failureReason: SubstitutionFailureReason;
        details: Record<string, unknown>;
    } {
        const message = `Configuration setting '${settingKey}' must resolve to a string-compatible value`;
        logger.warn(message);
        return {
            placeholder: {
                token,
                category: PlaceholderCategory.CONFIG,
                status: PlaceholderResolutionStatus.UNSUPPORTED,
                message
            },
            failureReason: SubstitutionFailureReason.INVALID_COMMAND_OUTPUT,
            details: {
                setting: settingKey,
                valueType: value === null ? "null" : typeof value
            }
        };
    }

    private serialiseConfigurationValue(value: unknown): string | undefined {
        if (value === undefined) {
            return undefined;
        }

        if (value === null) {
            return "";
        }

        if (typeof value === "string") {
            return value;
        }

        if (typeof value === "number" || typeof value === "boolean") {
            return String(value);
        }

        return undefined;
    }

    private computeRelativePath(basePath: string, targetPath: string): string | undefined {
        const relative = path.relative(basePath, targetPath);
        if (!relative || relative.startsWith("..")) {
            return undefined;
        }

        return relative.split(path.sep).join("/");
    }
}
