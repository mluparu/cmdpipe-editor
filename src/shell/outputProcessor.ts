import { TaskDefinition } from '../types/taskTypes';
import { Logger } from '../utils/logger';

/**
 * Result of error and warning extraction from output
 */
export interface ErrorWarningResult {
    errors: string[];
    warnings: string[];
}

/**
 * OutputProcessor handles parsing, filtering, and formatting of shell command output
 */
export class OutputProcessor {
    private logger: Logger;

    constructor() {
        this.logger = Logger.getInstance();
    }
    /**
     * Process output according to task configuration
     */
    public processOutput(output: string, task: TaskDefinition, insertionMode: string = 'replace-selection'): string {
        let processed = output;
        const processing = task.outputProcessing;

        if (!processing) {
            return processed;
        }

        // Apply trimming (default to true when outputProcessing is defined but trimWhitespace is not specified)
        if (processing.trimWhitespace !== false) {
            processed = processed.trim();
        }

        // Apply length limitation
        if (processing.maxOutputLength && processed.length > processing.maxOutputLength) {
            processed = processed.substring(0, processing.maxOutputLength);
            this.logger.warn(`Output truncated to ${processing.maxOutputLength} characters for task: ${task.id}`);
        }

        if (insertionMode === 'append-line' && !processed.startsWith('\n')) {
            processed = '\n' + processed;
        }

        return processed;
    }

    /**
     * Format output with task information for display
     */
    public formatOutputForOutputChannel(output: string, task: TaskDefinition): string {
        const timestamp = new Date().toISOString();
        const header = `=== Task: ${task.name} (${task.id}) === ${timestamp} ===`;
        const separator = '='.repeat(header.length);
        
        if (output.trim() === '') {
            return `${header}\n(No output)\n${separator}`;
        }

        return `${header}\n${output}\n${separator}`;
    }

    /**
     * Filter output to include only lines matching specified patterns
     */
    public filterOutput(output: string, patterns: string[]): string {
        if (!output || patterns.length === 0) {
            return '';
        }

        const lines = output.split('\n');
        const filteredLines = lines.filter(line => 
            patterns.some(pattern => line.includes(pattern))
        );

        return filteredLines.join('\n');
    }

    /**
     * Extract error and warning lines from output
     */
    public extractErrorsAndWarnings(output: string): ErrorWarningResult {
        if (!output) {
            return { errors: [], warnings: [] };
        }

        const lines = output.split('\n');
        const errors: string[] = [];
        const warnings: string[] = [];

        // Common error patterns (case-insensitive)
        const errorPatterns = [
            /error/i,
            /failed/i,
            /exception/i,
            /fatal/i,
            /critical/i
        ];

        // Common warning patterns (case-insensitive)
        const warningPatterns = [
            /warning/i,
            /warn/i,
            /caution/i,
            /deprecated/i,
            /notice/i
        ];

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                continue;
            }

            // Check for errors first (they take precedence)
            if (errorPatterns.some(pattern => pattern.test(trimmedLine))) {
                errors.push(trimmedLine);
            } else if (warningPatterns.some(pattern => pattern.test(trimmedLine))) {
                warnings.push(trimmedLine);
            }
        }

        return { errors, warnings };
    }

    /**
     * Clean and normalize output for consistent processing
     */
    public normalizeOutput(output: string): string {
        if (!output) {
            return '';
        }

        // Normalize line endings to \n
        let normalized = output.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Remove ANSI escape codes (colors, cursor movements, etc.)
        normalized = normalized.replace(/\x1b\[[0-9;]*m/g, '');
        
        // Remove other control characters except newlines and tabs
        normalized = normalized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
        
        return normalized;
    }

    /**
     * Split output into individual lines, handling various line ending formats
     */
    public getOutputLines(output: string): string[] {
        if (!output) {
            return [];
        }

        const normalized = this.normalizeOutput(output);
        return normalized.split('\n').filter(line => line !== undefined);
    }

    /**
     * Extract specific data from output using regex patterns
     */
    public extractData(output: string, pattern: RegExp): string[] {
        if (!output) {
            return [];
        }

        const matches = output.match(new RegExp(pattern.source, 'g'));
        return matches || [];
    }

    /**
     * Check if output indicates successful completion
     */
    public isSuccessOutput(output: string): boolean {
        if (!output) {
            return true; // Empty output can be considered success
        }

        const normalized = this.normalizeOutput(output).toLowerCase();
        
        // Look for success indicators
        const successPatterns = [
            'success',
            'completed',
            'finished',
            'done',
            'ok'
        ];

        // Look for failure indicators
        const failurePatterns = [
            'error',
            'failed',
            'exception',
            'fatal'
        ];

        const hasFailure = failurePatterns.some(pattern => normalized.includes(pattern));
        const hasSuccess = successPatterns.some(pattern => normalized.includes(pattern));

        // If there are explicit failure indicators, it's not success
        if (hasFailure) {
            return false;
        }

        // If there are explicit success indicators, it's success
        if (hasSuccess) {
            return true;
        }

        // If no explicit indicators, assume success (exit code should be primary indicator)
        return true;
    }
}