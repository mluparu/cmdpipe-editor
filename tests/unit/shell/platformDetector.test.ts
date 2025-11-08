import * as os from 'os';
import * as fs from 'fs';
import { workspace } from 'vscode';

jest.mock('os', () => {
    const actual = jest.requireActual('os');
    return {
        ...actual,
        platform: jest.fn(() => 'win32')
    };
});

jest.mock('fs', () => ({
    existsSync: jest.fn()
}));

jest.mock('../../../src/utils/logger', () => {
    const actual = jest.requireActual('../../../src/utils/logger');
    const loggerMock = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        setLevel: jest.fn(),
        dispose: jest.fn()
    };

    return {
        ...actual,
        createScopedLogger: jest.fn(() => loggerMock),
        __loggerMock: loggerMock
    };
});

import { PlatformDetector } from '../../../src/shell/platformDetector';
import { createScopedLogger } from '../../../src/utils/logger';

const loggerModule = require('../../../src/utils/logger');
const loggerMock = loggerModule.__loggerMock as { warn: jest.Mock };

const fsExistsMock = fs.existsSync as jest.Mock;
const osPlatformMock = os.platform as unknown as jest.Mock;
const createScopedLoggerMock = createScopedLogger as unknown as jest.Mock;
const mockedWorkspace = workspace as unknown as {
    __resetConfiguration: () => void;
    __setTerminalDefaultProfile: (profileId?: string | null) => void;
    __setTerminalProfiles: (profiles: Record<string, unknown>) => void;
};

describe('PlatformDetector Windows PowerShell detection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        osPlatformMock.mockReturnValue('win32');
        mockedWorkspace.__resetConfiguration();
        PlatformDetector.reset();
        fsExistsMock.mockReset();
        createScopedLoggerMock.mockClear();
    });

    it('resolves PowerShell profile from VS Code settings', () => {
        const powerShellPath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';

        mockedWorkspace.__setTerminalDefaultProfile('PowerShell');
        mockedWorkspace.__setTerminalProfiles({
            PowerShell: {
                path: powerShellPath,
                source: 'PowerShell'
            }
        });

        fsExistsMock.mockImplementation((candidate: string) => candidate === powerShellPath);

        const detector = PlatformDetector.getInstance();
        const info = detector.getPlatformInfo();

        expect(info.platform).toBe('win32');
        expect(info.defaultShell).toBe('powershell.exe');
        expect(info.shellPath).toBe(powerShellPath);
        expect(info.shellArgs).toEqual(['-NoLogo', '-NoProfile', '-Command']);
        expect(info.profileId).toBe('PowerShell');
        expect(info.profileSource).toBe('PowerShell');
        expect(info.diagnostics).toBeDefined();
        expect(info.diagnostics).toEqual(expect.arrayContaining([
            expect.stringContaining("Resolved PowerShell profile 'PowerShell'"),
            expect.stringContaining('Using PowerShell executable')
        ]));
    });

    it('falls back to Command Prompt when PowerShell executable is unavailable', () => {
        const missingPath = 'C:\\Missing\\powershell.exe';

        mockedWorkspace.__setTerminalDefaultProfile('PowerShell');
        mockedWorkspace.__setTerminalProfiles({
            PowerShell: {
                path: missingPath,
                source: 'PowerShell'
            }
        });

        fsExistsMock.mockReturnValue(false);

        const detector = PlatformDetector.getInstance();
        const info = detector.getPlatformInfo();

        expect(info.defaultShell).toBe('cmd.exe');
        expect(info.shellPath.toLowerCase()).toContain('cmd');
        expect(info.shellArgs).toEqual(['/c']);
        expect(info.diagnostics).toContain('Defaulting to Command Prompt (cmd.exe).');
        expect(loggerMock.warn).toHaveBeenCalledWith(expect.stringContaining('PowerShell detection failed'));
    });

    describe('escapeArgument when PowerShell is the detected shell', () => {
        const powerShellPath = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
        let detector: PlatformDetector;

        beforeEach(() => {
            mockedWorkspace.__setTerminalDefaultProfile('PowerShell');
            mockedWorkspace.__setTerminalProfiles({
                PowerShell: {
                    path: powerShellPath,
                    source: 'PowerShell'
                }
            });

            fsExistsMock.mockImplementation((candidate: string) => candidate === powerShellPath);
            detector = PlatformDetector.getInstance();
            detector.getPlatformInfo();
        });

        it('returns argument unchanged when no escaping is required', () => {
            expect(detector.escapeArgument('simple')).toBe('simple');
        });

        it('wraps whitespace arguments using PowerShell single quotes', () => {
            expect(detector.escapeArgument('Hello World')).toBe("'Hello World'");
        });

        it('doubles embedded single quotes inside PowerShell literals', () => {
            expect(detector.escapeArgument("Bob's file")).toBe("'Bob''s file'");
        });

        it('prefers double quotes when preserving variable expansion with whitespace', () => {
            expect(detector.escapeArgument('$env:Path Overrides')).toBe('"$env:Path Overrides"');
        });

        it('doubles embedded double quotes when using PowerShell double quoting', () => {
            expect(detector.escapeArgument('$env:Path "Override"')).toBe('"$env:Path ""Override"""');
        });

        it('uses double quotes for paths ending with a backslash when whitespace is present', () => {
            expect(detector.escapeArgument('C:\\Tools\\My Folder\\')).toBe('"C:\\Tools\\My Folder\\"');
        });
    });
});
