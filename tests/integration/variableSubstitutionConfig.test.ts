import { Uri, workspace } from "vscode";

import { VariableContextBuilder } from "../../src/substitution/contextBuilder";
import { VariableResolver, SubstitutionError } from "../../src/substitution/variableResolver";
import { withSubstitutionSummary } from "../../src/substitution/substitutionSummary";
import {
    PlaceholderCategory,
    PlaceholderResolutionStatus,
    SubstitutionFailureReason,
    type SubstitutionRequest
} from "../../src/substitution/substitutionTypes";
import type { TaskDefinition } from "../../src/types/taskTypes";

describe("Variable substitution configuration integration", () => {
    const builder = new VariableContextBuilder();
    const resolver = new VariableResolver();

    beforeEach(() => {
        (workspace as any).workspaceFolders = undefined;
        (workspace.getConfiguration as jest.Mock).mockReturnValue({
            get: jest.fn(),
            update: jest.fn(),
            has: jest.fn()
        });
    });

    afterEach(() => {
        (workspace as any).workspaceFolders = undefined;
        (workspace.getConfiguration as jest.Mock).mockReset();
    });

    it("resolves configuration placeholders with workspace precedence", async () => {
        const workspaceUri = Uri.file("d:/integrated/config");
        (workspace as any).workspaceFolders = [
            { uri: workspaceUri, name: "config", index: 0 }
        ];

        const folderGet = jest.fn().mockImplementation((key: string) => {
            if (key === "cmdpipe.shell.defaultWorkingDirectory") {
                return "d:/integrated/config/tools";
            }
            return undefined;
        });

        const fallbackGet = jest.fn().mockImplementation((key: string) => {
            if (key === "cmdpipe.shell.defaultWorkingDirectory") {
                return "d:/fallback/tools";
            }
            return undefined;
        });

        (workspace.getConfiguration as jest.Mock).mockImplementation((_section?: string, scope?: any) => {
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
            id: "config-success",
            name: "Config Success",
            command: "echo ${config:cmdpipe.shell.defaultWorkingDirectory}",
            args: ["--dir", "${config:cmdpipe.shell.defaultWorkingDirectory}"],
            workingDirectory: "${config:cmdpipe.shell.defaultWorkingDirectory}",
            configurationFile: "d:/integrated/config/.vscode/tasks.json"
        };

        const context = await builder.build(task, ["cmdpipe.shell.defaultWorkingDirectory"]);
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
        const summarised = withSubstitutionSummary(result);

        expect(result.command).toBe("echo d:/integrated/config/tools");
        expect(result.workingDirectory).toBe("d:/integrated/config/tools");
        expect(result.args[1]).toBe("d:/integrated/config/tools");
        const placeholder = result.placeholders.find((entry) => entry.category === PlaceholderCategory.CONFIG);
        expect(placeholder).toBeDefined();
        expect(placeholder).toMatchObject({
            token: "${config:cmdpipe.shell.defaultWorkingDirectory}",
            status: PlaceholderResolutionStatus.RESOLVED,
            resolvedValue: "d:/integrated/config/tools"
        });
        expect(summarised.summary?.tokens).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    token: "${config:cmdpipe.shell.defaultWorkingDirectory}",
                    displayValue: "d:/integrated/config/tools"
                })
            ])
        );
    });

    it("surfaces missing configuration values as substitution errors", async () => {
        (workspace.getConfiguration as jest.Mock).mockReturnValue({
            get: jest.fn().mockReturnValue(undefined),
            update: jest.fn(),
            has: jest.fn()
        });

        const task: TaskDefinition = {
            id: "config-missing",
            name: "Config Missing",
            command: "${config:cmdpipe.shell.defaultWorkingDirectory}"
        };

        const context = await builder.build(task, ["cmdpipe.shell.defaultWorkingDirectory"]);
        const request: SubstitutionRequest = {
            taskId: task.id,
            command: task.command,
            args: task.args ?? [],
            workingDirectory: task.workingDirectory,
            environmentVariables: task.environmentVariables,
            additionalFields: undefined,
            context
        };

        await expect(resolver.resolve(request)).rejects.toBeInstanceOf(SubstitutionError);
        await expect(resolver.resolve(request)).rejects.toMatchObject({
            failure: expect.objectContaining({
                token: "${config:cmdpipe.shell.defaultWorkingDirectory}",
                reason: SubstitutionFailureReason.MISSING_CONFIG
            })
        });
    });
});
