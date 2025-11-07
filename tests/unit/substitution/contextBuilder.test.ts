import { Position, Selection, Uri, window, workspace } from "vscode";

import { VariableContextBuilder } from "../../../src/substitution/contextBuilder";
import type { TaskDefinition } from "../../../src/types/taskTypes";

describe("VariableContextBuilder", () => {
    const builder = new VariableContextBuilder({ clock: () => 1700000000000 });

    beforeEach(() => {
        jest.clearAllMocks();
        (workspace as any).workspaceFolders = undefined;
        (window as any).activeTextEditor = undefined;
        (workspace.getConfiguration as jest.Mock).mockReturnValue({
            get: jest.fn(),
            update: jest.fn(),
            has: jest.fn()
        });
    });

    afterEach(() => {
        (workspace as any).workspaceFolders = undefined;
        (window as any).activeTextEditor = undefined;
        (workspace.getConfiguration as jest.Mock).mockReset();
    });

    it("merges environment variables with correct precedence", async () => {
        const originalProcessOnly = process.env.PROCESS_ONLY;
        const originalShared = process.env.SHARED_VAR;
        process.env.PROCESS_ONLY = "process-value";
        process.env.SHARED_VAR = "process-shared";

        const task: TaskDefinition = {
            id: "env-merge",
            name: "Env Merge",
            command: "echo",
            workspaceDefaults: {
                env: {
                    SHARED_VAR: "workspace-shared",
                    WORKSPACE_ONLY: "workspace-only"
                }
            },
            environmentVariables: {
                SHARED_VAR: "task-shared",
                TASK_ONLY: "task-only"
            }
        };

        const snapshot = await builder.build(task);

        expect(snapshot.env.PROCESS_ONLY).toBe("process-value");
        expect(snapshot.env.WORKSPACE_ONLY).toBe("workspace-only");
        expect(snapshot.env.TASK_ONLY).toBe("task-only");
        expect(snapshot.env.SHARED_VAR).toBe("task-shared");

        if (originalProcessOnly === undefined) {
            delete process.env.PROCESS_ONLY;
        } else {
            process.env.PROCESS_ONLY = originalProcessOnly;
        }

        if (originalShared === undefined) {
            delete process.env.SHARED_VAR;
        } else {
            process.env.SHARED_VAR = originalShared;
        }
    });

    it("captures workspace folder and relative file in single-root workspaces", async () => {
        const workspaceUri = Uri.file("d:/projects/sample");
        (workspace as any).workspaceFolders = [
            {
                uri: workspaceUri,
                name: "sample",
                index: 0
            }
        ];

        const task: TaskDefinition = {
            id: "build",
            name: "Build Project",
            command: "${workspaceFolder}/scripts/build.sh",
            args: ["--flag"],
            configurationFile: "d:/projects/sample/.vscode/tasks.json"
        };

        const documentUri = Uri.file("d:/projects/sample/src/app.ts");
        const selection = new Selection(new Position(0, 0), new Position(0, 0));
        (window as any).activeTextEditor = {
            document: {
                uri: documentUri,
                fileName: documentUri.fsPath,
                languageId: "typescript",
                isDirty: false,
                isUntitled: false,
                getText: jest.fn().mockReturnValue(""),
                lineAt: jest.fn(),
                getWordRangeAtPosition: jest.fn(),
                version: 1,
                eol: 1,
                isClosed: false
            },
            selection,
            selections: [selection]
        };

        const snapshot = await builder.build(task);

        expect(snapshot.workspaceFolder?.fsPath).toBe("d:/projects/sample");
        expect(snapshot.activeFile?.fsPath).toBe(documentUri.fsPath);
        expect(snapshot.activeFile?.relativePath).toBe("src/app.ts");
        expect(snapshot.env).toBeDefined();
        expect(snapshot.config).toBeInstanceOf(Map);
        expect(snapshot.timestamp).toBe(1700000000000);
    });

    it("picks the matching workspace folder in multi-root scenarios", async () => {
        const primaryUri = Uri.file("d:/projects/main");
        const secondaryUri = Uri.file("d:/projects/tools");
        (workspace as any).workspaceFolders = [
            { uri: primaryUri, name: "main", index: 0 },
            { uri: secondaryUri, name: "tools", index: 1 }
        ];

        const task: TaskDefinition = {
            id: "lint",
            name: "Lint Tools",
            command: "${workspaceFolder}/lint.sh",
            configurationFile: "d:/projects/tools/.vscode/tasks.json"
        };

        const snapshot = await builder.build(task);

        expect(snapshot.workspaceFolder?.fsPath).toBe("d:/projects/tools");
        expect(snapshot.workspaceFolder?.name).toBe("tools");
    });

    it("captures configuration values with workspace precedence", async () => {
        const workspaceUri = Uri.file("d:/projects/configured");
        (workspace as any).workspaceFolders = [
            { uri: workspaceUri, name: "configured", index: 0 }
        ];

        const folderGet = jest.fn().mockImplementation((key: string) => {
            if (key === "cmdpipe.shell.defaultWorkingDirectory") {
                return "d:/projects/configured/tools";
            }
            return undefined;
        });

        const fallbackGet = jest.fn().mockImplementation((key: string) => {
            if (key === "cmdpipe.shell.defaultWorkingDirectory") {
                return "d:/fallback/tools";
            }
            if (key === "editor.fontSize") {
                return 14;
            }
            return undefined;
        });

        (workspace.getConfiguration as jest.Mock).mockImplementation((section?: string, scope?: any) => {
            if (scope?.fsPath === workspaceUri.fsPath) {
                return {
                    get: folderGet,
                    update: jest.fn(),
                    has: jest.fn()
                };
            }

            return {
                get: fallbackGet,
                update: jest.fn(),
                has: jest.fn()
            };
        });

        const task: TaskDefinition = {
            id: "config-task",
            name: "Configured Task",
            command: "echo",
            configurationFile: "d:/projects/configured/.vscode/tasks.json"
        };

        const snapshot = await builder.build(task, [
            "cmdpipe.shell.defaultWorkingDirectory",
            "editor.fontSize"
        ]);

        expect(folderGet).toHaveBeenCalledWith("cmdpipe.shell.defaultWorkingDirectory");
        expect(fallbackGet).toHaveBeenCalledWith("editor.fontSize");
        expect(snapshot.config.get("cmdpipe.shell.defaultWorkingDirectory")).toBe("d:/projects/configured/tools");
        expect(snapshot.config.get("editor.fontSize")).toBe(14);
    });
});
