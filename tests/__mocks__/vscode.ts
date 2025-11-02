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

export const workspace = {
    workspaceFolders: undefined,
    getConfiguration: jest.fn().mockReturnValue({
        get: jest.fn(),
        update: jest.fn(),
        has: jest.fn()
    }),
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