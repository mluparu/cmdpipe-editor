import * as os from 'os';
import { PlatformInfo } from '../types/extensionTypes';

/**
 * Utility class for detecting platform-specific information
 * and providing appropriate shell configuration
 */
export class PlatformDetector {
    private static _instance: PlatformDetector;
    private _platformInfo: PlatformInfo;

    private constructor() {
        this._platformInfo = this.detectPlatform();
    }

    public static getInstance(): PlatformDetector {
        if (!PlatformDetector._instance) {
            PlatformDetector._instance = new PlatformDetector();
        }
        return PlatformDetector._instance;
    }

    /**
     * Get platform information for the current system
     */
    public getPlatformInfo(): PlatformInfo {
        return { ...this._platformInfo };
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
            // Windows cmd.exe escaping
            // TODO: Handle escaping for PowerShell if needed
            if (arg.includes(' ') || arg.includes('"') || arg.includes('&') || arg.includes('<') || arg.includes('>') || arg.includes('|')) {
                return `"${arg.replace(/"/g, '""')}"`;
            }
            return arg;
        } else {
            // Unix shell escaping
            if (arg.includes(' ') || arg.includes("'") || arg.includes('"') || arg.includes('$') || arg.includes('&')) {
                return `'${arg.replace(/'/g, "'\"'\"'")}'`;
            }
            return arg;
        }
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

    private detectPlatform(): PlatformInfo {
        const platform = os.platform();
        
        switch (platform) {
            case 'win32':
                // TODO: Consider detecting PowerShell as default shell if available: powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "& { <resolved command + args> }"
                return {
                    platform: 'win32',
                    defaultShell: process.env.COMSPEC || 'cmd.exe',
                    shellPath: process.env.COMSPEC || 'cmd.exe',
                    shellArgs: ['/c'],
                    pathSeparator: '\\',
                    pathEnvVar: 'PATH'
                };
            
            case 'darwin':
                return {
                    platform: 'darwin',
                    defaultShell: process.env.SHELL || '/bin/zsh',
                    shellPath: process.env.SHELL || '/bin/zsh',
                    shellArgs: ['-c'],
                    pathSeparator: '/',
                    pathEnvVar: 'PATH'
                };
            
            case 'linux':
            default:
                return {
                    platform: 'linux',
                    defaultShell: process.env.SHELL || '/bin/bash',
                    shellPath: process.env.SHELL || '/bin/bash',
                    shellArgs: ['-c'],
                    pathSeparator: '/',
                    pathEnvVar: 'PATH'
                };
        }
    }
}