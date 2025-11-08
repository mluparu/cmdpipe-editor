import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { PlatformInfo } from '../types/extensionTypes';
import { createScopedLogger } from '../utils/logger';

type WindowsTerminalProfile = {
    path?: string;
    args?: string[];
    source?: string;
};

const WINDOWS_PATH_SEPARATOR = '\\';
const WINDOWS_PATH_ENV = 'PATH';
const DEFAULT_CMD_ARGS = ['/c'];
const DEFAULT_POWERSHELL_ARGS = ['-NoLogo', '-NoProfile', '-Command'];
const POWERSHELL_KEYWORDS = ['powershell', 'pwsh'];

const platformLogger = createScopedLogger('PlatformDetector');

/**
 * Utility class for detecting platform-specific information
 * and providing appropriate shell configuration
 */
export class PlatformDetector {
    private static _instance?: PlatformDetector;
    private _platformInfo: PlatformInfo;

    private constructor() {
        this._platformInfo = PlatformDetector.computePlatformInfo();
    }

    public static getInstance(): PlatformDetector {
        if (!PlatformDetector._instance) {
            PlatformDetector._instance = new PlatformDetector();
        }
        return PlatformDetector._instance;
    }

    // TODO: Call this method when the configuration changes
    public static reset(): void {
        PlatformDetector._instance = undefined;
    }

    /**
     * Get platform information for the current system
     */
    public getPlatformInfo(): PlatformInfo {
        const diagnostics = this._platformInfo.diagnostics;
        return {
            ...this._platformInfo,
            shellArgs: [...this._platformInfo.shellArgs],
            ...(diagnostics ? { diagnostics: [...diagnostics] } : {})
        };
    }

    /**
     * Force a fresh platform detection using the latest configuration
     */
    public reload(): PlatformInfo {
        this._platformInfo = PlatformDetector.computePlatformInfo();
        return this.getPlatformInfo();
    }

    /**
     * Get the default shell command for the current platform
     */
    public getDefaultShell(): string {
        return this._platformInfo.defaultShell;
    }

    /**
     * Get shell arguments for command execution
     */
    public getShellArgs(): string[] {
        return [...this._platformInfo.shellArgs];
    }

    /**
     * Get the appropriate path separator for the current platform
     */
    public getPathSeparator(): string {
        return this._platformInfo.pathSeparator;
    }

    /**
     * Check if the current platform is Windows
     */
    public isWindows(): boolean {
        return this._platformInfo.platform === 'win32';
    }

    /**
     * Check if the current platform is macOS
     */
    public isMacOS(): boolean {
        return this._platformInfo.platform === 'darwin';
    }

    /**
     * Check if the current platform is Linux
     */
    public isLinux(): boolean {
        return this._platformInfo.platform === 'linux';
    }

    /**
     * Escape command arguments for the current platform's shell
     */
    public escapeArgument(arg: string): string {
        if (this.isWindows()) {
            if (this.isPowerShellDefault()) {
                return PlatformDetector.escapePowerShellArgument(arg);
            }
            return PlatformDetector.escapeCmdArgument(arg);
        }

        return PlatformDetector.escapePosixArgument(arg);
    }

    private isPowerShellDefault(): boolean {
        const shellName = this._platformInfo.defaultShell.toLowerCase();
        if (POWERSHELL_KEYWORDS.some((keyword) => shellName.includes(keyword))) {
            return true;
        }

        const shellPathNormalized = this._platformInfo.shellPath.toLowerCase();
        return POWERSHELL_KEYWORDS.some((keyword) => shellPathNormalized.includes(keyword));
    }

    private static escapeCmdArgument(arg: string): string {
        if (arg.includes(' ') || arg.includes('"') || arg.includes('&') || arg.includes('<') || arg.includes('>') || arg.includes('|')) {
            return `"${arg.replace(/"/g, '""')}"`;
        }
        return arg;
    }

    private static escapePosixArgument(arg: string): string {
        if (arg.includes(' ') || arg.includes('\'') || arg.includes('"') || arg.includes('$') || arg.includes('&')) {
            const escaped = arg.replace(/\'/g, "'\"'\"'");
            return `'${escaped}'`;
        }
        return arg;
    }

    private static escapePowerShellArgument(arg: string): string {
        if (arg.length === 0) {
            return "''";
        }

        const needsQuoting = /[\s'"&|<>^`(){}\[\],;!]/.test(arg);
        const needsExpansion = /(^|[^`])\$(\{|\(|[A-Za-z_])/.test(arg);
        const endsWithBackslash = /\\$/.test(arg);
        const containsBacktick = arg.includes('`');

        if (!needsQuoting && !needsExpansion && !endsWithBackslash && !containsBacktick) {
            return arg;
        }

        if ((needsExpansion && needsQuoting) || containsBacktick || (endsWithBackslash && needsQuoting)) {
            const escaped = arg.replace(/`/g, '``').replace(/"/g, '""');
            return `"${escaped}"`;
        }

        const escapedLiteral = arg.replace(/'/g, "''");
        return `'${escapedLiteral}'`;
    }

    /**
     * Format environment variables for the current platform
     */
    public formatEnvironmentVariable(name: string, value: string): string {
        if (this.isWindows()) {
            return `%${name}%`;
        } else {
            return `$${name}`;
        }
    }

    private static computePlatformInfo(): PlatformInfo {
        const platform = os.platform();
        
        switch (platform) {
            case 'win32':
                return PlatformDetector.resolveWindowsPlatform();
            
            case 'darwin':
                return PlatformDetector.createPosixPlatformInfo('darwin', process.env.SHELL || '/bin/zsh');
            
            case 'linux':
            default:
                return PlatformDetector.createPosixPlatformInfo('linux', process.env.SHELL || '/bin/bash');
        }
    }

    private static createPosixPlatformInfo(platform: 'darwin' | 'linux', shellPath: string): PlatformInfo {
        return {
            platform,
            defaultShell: shellPath,
            shellPath,
            shellArgs: ['-c'],
            pathSeparator: '/',
            pathEnvVar: 'PATH',
            diagnostics: []
        };
    }

    private static resolveWindowsPlatform(): PlatformInfo {
        const diagnostics: string[] = [];
        const terminalConfig = vscode.workspace.getConfiguration('terminal.integrated');
        const defaultProfileId = terminalConfig.get<string>('defaultProfile.windows') ?? undefined;
        const profiles = (terminalConfig.get<Record<string, WindowsTerminalProfile>>('profiles.windows') ?? {});

        const candidates = PlatformDetector.collectPowerShellCandidates(defaultProfileId, profiles);

        for (const candidate of candidates) {
            const resolved = PlatformDetector.tryResolvePowerShellProfile(candidate.id, candidate.profile, diagnostics);
            if (resolved) {
                diagnostics.push(`Resolved PowerShell profile '${candidate.id}' with executable '${resolved.shellPath}'.`);
                return {
                    ...resolved,
                    diagnostics
                };
            }
        }

        const reason = candidates.length === 0
            ? 'PowerShell profile not declared in VS Code settings.'
            : `Unable to resolve configured PowerShell profile${defaultProfileId ? ` '${defaultProfileId}'` : ''}.`;

        return PlatformDetector.createCommandPromptInfo(diagnostics, reason);
    }

    private static collectPowerShellCandidates(
        defaultProfileId: string | undefined,
        profiles: Record<string, WindowsTerminalProfile>
    ): Array<{ id: string; profile?: WindowsTerminalProfile }> {
        const candidates: Array<{ id: string; profile?: WindowsTerminalProfile }> = [];
        const seen = new Set<string>();

        if (defaultProfileId) {
            candidates.push({ id: defaultProfileId, profile: profiles[defaultProfileId] });
            seen.add(defaultProfileId);
        }

        for (const [profileId, profile] of Object.entries(profiles)) {
            if (seen.has(profileId)) {
                continue;
            }

            if (PlatformDetector.isPowerShellProfile(profileId, profile)) {
                candidates.push({ id: profileId, profile });
                seen.add(profileId);
            }
        }

        return candidates;
    }

    private static tryResolvePowerShellProfile(
        profileId: string,
        profile: WindowsTerminalProfile | undefined,
        diagnostics: string[]
    ): PlatformInfo | undefined {
        if (!profile) {
            diagnostics.push(`VS Code PowerShell profile '${profileId}' was not found in terminal.integrated.profiles.windows.`);
            return undefined;
        }

        if (!PlatformDetector.isPowerShellProfile(profileId, profile)) {
            diagnostics.push(`Profile '${profileId}' is not identified as PowerShell; skipping.`);
            return undefined;
        }

        const shellPath = PlatformDetector.selectPowerShellExecutable(profileId, profile, diagnostics);
        if (!shellPath) {
            return undefined;
        }

        const shellArgs = profile.args?.length ? [...profile.args] : [...DEFAULT_POWERSHELL_ARGS];
        const defaultShell = path.win32.basename(shellPath).toLowerCase();

        diagnostics.push(`Using PowerShell executable '${shellPath}' with args ${JSON.stringify(shellArgs)}.`);

        return {
            platform: 'win32',
            defaultShell,
            shellPath,
            shellArgs,
            pathSeparator: WINDOWS_PATH_SEPARATOR,
            pathEnvVar: WINDOWS_PATH_ENV,
            profileId,
            profileSource: profile.source,
            diagnostics
        };
    }

    private static selectPowerShellExecutable(
        profileId: string,
        profile: WindowsTerminalProfile,
        diagnostics: string[]
    ): string | undefined {
        const candidates = PlatformDetector.buildPowerShellPathCandidates(profile);

        for (const candidate of candidates) {
            if (!candidate) {
                continue;
            }

            try {
                if (fs.existsSync(candidate)) {
                    return candidate;
                }
            } catch (error) {
                diagnostics.push(`Error checking PowerShell executable '${candidate}': ${(error as Error).message}`);
            }
        }

        diagnostics.push(`PowerShell executable for profile '${profileId}' not found. Checked: ${candidates.filter(Boolean).join(', ') || 'none'}.`);
        return undefined;
    }

    private static buildPowerShellPathCandidates(profile: WindowsTerminalProfile): string[] {
        const paths = new Set<string>();

        if (profile.path) {
            paths.add(profile.path);
        }

        const defaults = PlatformDetector.defaultPowerShellPaths(profile.source);
        defaults.forEach((candidate) => paths.add(candidate));

        return Array.from(paths);
    }

    private static defaultPowerShellPaths(source?: string): string[] {
    const systemRoot = process.env.SystemRoot || process.env.SYSTEMROOT || path.win32.join('C:\\', 'Windows');
    const programFiles = process.env.ProgramFiles || path.win32.join('C:\\', 'Program Files');
        const programFilesX86 = process.env['ProgramFiles(x86)'];

        const defaults: string[] = [
            path.win32.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
        ];

        const preferPwsh = source?.toLowerCase().includes('core') ?? false;

        const pwshCandidates = [
            path.win32.join(programFiles, 'PowerShell', '7', 'pwsh.exe')
        ];

        if (programFilesX86) {
            pwshCandidates.push(path.win32.join(programFilesX86, 'PowerShell', '7', 'pwsh.exe'));
        }

        if (preferPwsh) {
            defaults.push(...pwshCandidates);
        } else {
            defaults.push(...pwshCandidates, path.win32.join(programFiles, 'PowerShell', '6', 'pwsh.exe'));
        }

        return defaults;
    }

    private static isPowerShellProfile(profileId: string, profile?: WindowsTerminalProfile): boolean {
        const idNormalized = profileId.toLowerCase();
        if (POWERSHELL_KEYWORDS.some((keyword) => idNormalized.includes(keyword))) {
            return true;
        }

        const sourceNormalized = profile?.source?.toLowerCase() ?? '';
        return POWERSHELL_KEYWORDS.some((keyword) => sourceNormalized.includes(keyword));
    }

    private static createCommandPromptInfo(diagnostics: string[], reason: string): PlatformInfo {
        const fallbackPath = (process.env.COMSPEC && process.env.COMSPEC.trim()) || 'C:\\Windows\\System32\\cmd.exe';
        const diagnosticsWithFallback = [...diagnostics, reason, 'Defaulting to Command Prompt (cmd.exe).'];
        platformLogger.warn(`PowerShell detection failed: ${reason}. Falling back to Command Prompt.`);

        return {
            platform: 'win32',
            defaultShell: 'cmd.exe',
            shellPath: fallbackPath,
            shellArgs: [...DEFAULT_CMD_ARGS],
            pathSeparator: WINDOWS_PATH_SEPARATOR,
            pathEnvVar: WINDOWS_PATH_ENV,
            diagnostics: diagnosticsWithFallback
        };
    }
}