/**
 * Shared type contracts for the variable substitution pipeline.
 *
 * These interfaces are driven directly from the feature specification and
 * data model documents. They intentionally avoid implementation details so
 * both production code and tests can depend on stable shapes while the
 * resolver evolves.
 */

import type { Position, Uri } from "vscode";

import type { TaskDefinition } from "../types/taskTypes";

/** Represents the owning workspace folder for a task execution. */
export interface WorkspaceFolderDescriptor {
    uri: Uri;
    name: string;
    fsPath: string;
}

/**
 * Describes the active file when a task is triggered, including selection
 * metadata gathered from the editor layer.
 */
export interface ActiveFileDescriptor {
    uri: Uri;
    fsPath: string;
    relativePath?: string;
    selection?: EditorSelection;
}

/** Normalised editor selection boundaries and captured text. */
export interface EditorSelection {
    start: Position;
    end: Position;
    text: string;
}

/** Snapshot of runtime context needed to resolve placeholders for a task. */
export interface VariableContextSnapshot {
    task: TaskDefinition;
    workspaceFolder?: WorkspaceFolderDescriptor;
    activeFile?: ActiveFileDescriptor;
    editorSelection?: EditorSelection;
    env: Record<string, string>;
    config: Map<string, unknown>;
    timestamp: number;
}

/** Raw substitution request constructed from task execution inputs. */
export interface SubstitutionRequest {
    taskId: string;
    command: string;
    args: string[];
    workingDirectory?: string;
    environmentVariables?: Record<string, string>;
    additionalFields?: Record<string, unknown>;
    context: VariableContextSnapshot;
}

/** Categories supported by the resolver for placeholder classification. */
export enum PlaceholderCategory {
    WORKSPACE = "workspace",
    FILE = "file",
    ENV = "env",
    CONFIG = "config",
    CUSTOM = "custom",
    UNSUPPORTED = "unsupported"
}

/** Resolution status for an individual placeholder token. */
export enum PlaceholderResolutionStatus {
    RESOLVED = "resolved",
    MISSING = "missing",
    UNSUPPORTED = "unsupported"
}

/** Structured representation of a single placeholder resolution attempt. */
export interface PlaceholderResolution {
    token: string;
    category: PlaceholderCategory;
    status: PlaceholderResolutionStatus;
    resolvedValue?: string;
    redactedValue?: string;
    message?: string;
}

/** Supported failure reasons when substitution cannot continue. */
export enum SubstitutionFailureReason {
    MISSING_ENVIRONMENT = "missing-environment",
    MISSING_CONFIG = "missing-config",
    MISSING_FILE = "missing-file",
    UNSUPPORTED_PLACEHOLDER = "unsupported-placeholder",
    INVALID_COMMAND_OUTPUT = "invalid-command-output"
}

/** Typed error payload thrown by the resolver for blocking failures. */
export interface SubstitutionFailure {
    token: string;
    reason: SubstitutionFailureReason;
    message?: string;
    details?: Record<string, unknown>;
    suggestion?: string;
}

/** Token snapshot surfaced to structured logs after resolution. */
export interface SubstitutionSummaryToken {
    token: string;
    displayValue: string;
    category?: PlaceholderCategory;
}

/** Summary payload emitted for logging resolver behaviour. */
export interface SubstitutionSummary {
    tokens: SubstitutionSummaryToken[];
    executionTimeMs?: number;
}

/** Fully substituted task payload returned to the shell executor. */
export interface SubstitutionResult {
    command: string;
    args: string[];
    workingDirectory?: string;
    environmentVariables?: Record<string, string>;
    placeholders: PlaceholderResolution[];
    warnings?: string[];
    summary?: SubstitutionSummary;
}

/** Utility type for consumers that expect immutable placeholder lists. */
export type ReadonlyPlaceholderResolutions = ReadonlyArray<PlaceholderResolution>;
