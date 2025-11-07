import { Position, Selection, Uri, window, workspace } from "vscode";

import { VariableContextBuilder } from "../../src/substitution/contextBuilder";
import { VariableResolver } from "../../src/substitution/variableResolver";
import type { SubstitutionRequest } from "../../src/substitution/substitutionTypes";
import type { TaskDefinition } from "../../src/types/taskTypes";

const builder = new VariableContextBuilder();
const resolver = new VariableResolver();

describe("Variable substitution workspace integration", () => {
    beforeEach(() => {
        (workspace as any).workspaceFolders = undefined;
        (window as any).activeTextEditor = undefined;
    });

    afterEach(() => {
        (workspace as any).workspaceFolders = undefined;
        (window as any).activeTextEditor = undefined;
    });

    it("resolves workspace and file placeholders end-to-end", async () => {
        const workspaceUri = Uri.file("d:/integrated/workspace");
        (workspace as any).workspaceFolders = [
            { uri: workspaceUri, name: "workspace", index: 0 }
        ];

        const task: TaskDefinition = {
            id: "compile",
            name: "Compile Project",
            command: "${workspaceFolder}/bin/compile.sh",
            args: ["--file", "${relativeFile}"],
            configurationFile: "d:/integrated/workspace/.vscode/tasks.json"
        };

        const activeFileUri = Uri.file("d:/integrated/workspace/src/index.ts");
        const selection = new Selection(new Position(0, 0), new Position(0, 0));
        (window as any).activeTextEditor = {
            document: {
                uri: activeFileUri,
                fileName: activeFileUri.fsPath,
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

        const context = await builder.build(task);
        const request: SubstitutionRequest = {
            taskId: task.id,
            command: task.command,
            args: task.args ?? [],
            workingDirectory: task.workingDirectory,
            environmentVariables: task.environmentVariables,
            additionalFields: undefined,
            context
        };

        const result = await resolver.resolve(request);

        expect(result.command).toBe("d:/integrated/workspace/bin/compile.sh");
        expect(result.args[1]).toBe("src/index.ts");
        expect(result.placeholders.length).toBeGreaterThanOrEqual(2);
    });
});
