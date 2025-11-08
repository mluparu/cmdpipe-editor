// Mock implementation of VSCode API for testing
export const window = {
    activeTextEditor: undefined,
    createOutputChannel: jest.fn().mockReturnValue({
        appendLine: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        clear: jest.fn(),
        dispose: jest.fn()
    }),
    showErrorMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    showTextDocument: jest.fn()
};

const trustListeners: Array<() => void> = [];

type ConfigurationSectionStore = Record<string, any>;
const ROOT_CONFIGURATION_SECTION = '__root__';
const configurationStore: Record<string, ConfigurationSectionStore> = {};

const getSectionKey = (section?: string): string => section ?? ROOT_CONFIGURATION_SECTION;

const ensureSectionStore = (section?: string): ConfigurationSectionStore => {
    const key = getSectionKey(section);
    if (!configurationStore[key]) {
        configurationStore[key] = {};
    }
    return configurationStore[key];
};

const getConfigurationValue = (section: string | undefined, key: string): any => {
    const store = ensureSectionStore(section);
    return store[key];
};

const setConfigurationValue = (section: string | undefined, key: string, value: unknown): void => {
    const store = ensureSectionStore(section);
    store[key] = value;
};

const hasConfigurationValue = (section: string | undefined, key: string): boolean => {
    const store = ensureSectionStore(section);
    return Object.prototype.hasOwnProperty.call(store, key);
};

const resetConfigurationStore = (): void => {
    Object.keys(configurationStore).forEach((key) => delete configurationStore[key]);
    setConfigurationValue('terminal.integrated', 'profiles.windows', {});
    setConfigurationValue('terminal.integrated', 'defaultProfile.windows', null);
};

const createConfiguration = (section?: string) => ({
    get: <T>(key: string, defaultValue?: T): T | undefined => {
        const value = getConfigurationValue(section, key);
        return (value === undefined ? defaultValue : value) as T | undefined;
    },
    update: (key: string, value: unknown) => {
        setConfigurationValue(section, key, value);
        return Promise.resolve();
    },
    has: (key: string) => hasConfigurationValue(section, key)
});

resetConfigurationStore();

const defaultGetConfiguration = (section?: string) => createConfiguration(section);
const getConfigurationMock = jest.fn(defaultGetConfiguration);

export const workspace = {
    workspaceFolders: undefined,
    getConfiguration: getConfigurationMock,
    onDidChangeConfiguration: jest.fn(),
    fs: {
        stat: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn()
    },
    applyEdit: jest.fn().mockResolvedValue(true),
    openTextDocument: jest.fn(),
    isTrusted: true,
    onDidGrantWorkspaceTrust: jest.fn((listener: () => void) => {
        trustListeners.push(listener);
        const disposable = {
            dispose: jest.fn(() => {
                const index = trustListeners.indexOf(listener);
                if (index >= 0) {
                    trustListeners.splice(index, 1);
                }
            })
        };
        return disposable;
    }),
    __setTrustState: (trusted: boolean) => {
        workspace.isTrusted = trusted;
    },
    __fireGrantWorkspaceTrust: () => {
        workspace.isTrusted = true;
        trustListeners.forEach((listener) => listener());
    },
    __resetTrustMock: () => {
        workspace.isTrusted = true;
        trustListeners.splice(0, trustListeners.length);
    },
    __setConfigurationValue: (section: string, key: string, value: unknown) => {
        setConfigurationValue(section, key, value);
    },
    __setConfigurationSection: (section: string, values: Record<string, unknown>) => {
        Object.entries(values).forEach(([key, value]) => setConfigurationValue(section, key, value));
    },
    __getConfigurationValue: (section: string, key: string) => getConfigurationValue(section, key),
    __setTerminalDefaultProfile: (profileId?: string | null) => {
        setConfigurationValue('terminal.integrated', 'defaultProfile.windows', profileId ?? null);
    },
    __setTerminalProfiles: (profiles: Record<string, unknown>) => {
        setConfigurationValue('terminal.integrated', 'profiles.windows', profiles);
    },
    __resetConfiguration: () => {
        getConfigurationMock.mockReset();
        resetConfigurationStore();
        getConfigurationMock.mockImplementation(defaultGetConfiguration);
    }
};

export const commands = {
    executeCommand: jest.fn(),
    registerCommand: jest.fn()
};

export class Position {
    constructor(public line: number, public character: number) {}
    
    isBefore() { return false; }
    isBeforeOrEqual() { return false; }
    isAfter() { return false; }
    isAfterOrEqual() { return false; }
    isEqual() { return false; }
    compareTo() { return 0; }
    translate() { return this; }
    with() { return this; }
}

export class Selection {
    constructor(
        public start: Position,
        public end: Position
    ) {}
    
    get active() { return this.end; }
    get anchor() { return this.start; }
    get isEmpty() { return this.start.line === this.end.line && this.start.character === this.end.character; }
    get isReversed() { return false; }
    get isSingleLine() { return this.start.line === this.end.line; }
    
    contains() { return false; }
    isEqual() { return false; }
    intersection() { return undefined; }
    union() { return this; }
    with() { return this; }
}

export class Range {
    constructor(
        public start: Position,
        public end: Position
    ) {}
    
    get isEmpty() { return this.start.line === this.end.line && this.start.character === this.end.character; }
    get isSingleLine() { return this.start.line === this.end.line; }
    
    contains() { return false; }
    isEqual() { return false; }
    intersection() { return undefined; }
    union() { return this; }
    with() { return this; }
}

export class WorkspaceEdit {
    replace() {}
    insert() {}
    delete() {}
    set() {}
}

export const Uri = {
    file: jest.fn().mockImplementation((path: string) => ({
        scheme: 'file',
        fsPath: path,
        path: path,
        toString: () => path
    })),
    parse: jest.fn()
};

export enum FileType {
    Unknown = 0,
    File = 1,
    Directory = 2,
    SymbolicLink = 64
}

// Export additional commonly used enums and constants
export enum TextEditorCursorStyle {
    Line = 1,
    Block = 2,
    Underline = 3
}

export enum TextEditorRevealType {
    Default = 1,
    InCenter = 2,
    InCenterIfOutsideViewport = 3,
    AtTop = 4
}

export const version = '1.74.0';
export const env = {
    appName: 'Visual Studio Code',
    appRoot: '',
    language: 'en'
};