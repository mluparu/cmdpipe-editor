/**
 * Helper utilities for producing log-safe substitution summaries.
 *
 * These helpers focus on redacting sensitive tokens while still surfacing
 * enough diagnostic information to troubleshoot substitution behaviour.
 */

import {
    PlaceholderCategory,
    PlaceholderResolution,
    PlaceholderResolutionStatus,
    SubstitutionResult,
    SubstitutionSummary,
    SubstitutionSummaryToken
} from "./substitutionTypes";

/** Default literal used when a value must be redacted. */
export const REDACTED_VALUE = "[REDACTED]";

/** Categories that require redaction when no explicit redacted value exists. */
const DEFAULT_SENSITIVE_CATEGORIES: ReadonlySet<PlaceholderCategory> = new Set([
    PlaceholderCategory.ENV
]);

export interface SummaryBuildOptions {
    /** Optional execution timing to embed within the summary payload. */
    executionTimeMs?: number;
    /** Override sensitive categories that should always be redacted. */
    sensitiveCategories?: ReadonlySet<PlaceholderCategory> | PlaceholderCategory[];
}

/**
 * Generates a structured summary for a collection of placeholder resolutions.
 */
export function buildSubstitutionSummary(
    placeholders: ReadonlyArray<PlaceholderResolution>,
    options: SummaryBuildOptions = {}
): SubstitutionSummary {
    const sensitiveCategories = normaliseSensitiveCategories(options.sensitiveCategories);
    const tokens: SubstitutionSummaryToken[] = placeholders.map((placeholder) => ({
        token: placeholder.token,
        category: placeholder.category,
        displayValue: deriveDisplayValue(placeholder, sensitiveCategories)
    }));

    return {
        tokens,
        executionTimeMs: options.executionTimeMs
    };
}

/**
 * Returns a new result with an attached summary derived from the provided
 * placeholders. The original result is not mutated to keep call sites pure.
 */
export function withSubstitutionSummary(
    result: SubstitutionResult,
    options: SummaryBuildOptions = {}
): SubstitutionResult {
    return {
        ...result,
        summary: buildSubstitutionSummary(result.placeholders, options)
    };
}

function deriveDisplayValue(
    placeholder: PlaceholderResolution,
    sensitiveCategories: ReadonlySet<PlaceholderCategory>
): string {
    if (placeholder.status !== PlaceholderResolutionStatus.RESOLVED) {
        return placeholder.message ?? placeholder.status;
    }

    if (placeholder.redactedValue) {
        return placeholder.redactedValue;
    }

    if (shouldRedact(placeholder, sensitiveCategories)) {
        return REDACTED_VALUE;
    }

    return placeholder.resolvedValue ?? "";
}

function shouldRedact(
    placeholder: PlaceholderResolution,
    sensitiveCategories: ReadonlySet<PlaceholderCategory>
): boolean {
    return sensitiveCategories.has(placeholder.category);
}

function normaliseSensitiveCategories(
    override?: ReadonlySet<PlaceholderCategory> | PlaceholderCategory[]
): ReadonlySet<PlaceholderCategory> {
    if (!override) {
        return DEFAULT_SENSITIVE_CATEGORIES;
    }

    if (override instanceof Set) {
        return override;
    }

    return new Set(override);
}
