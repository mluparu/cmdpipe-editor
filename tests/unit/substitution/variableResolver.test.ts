import { Uri } from "vscode";

import { VariableResolver, SubstitutionError } from "../../../src/substitution/variableResolver";
import {
    PlaceholderCategory,
    PlaceholderResolutionStatus,
    SubstitutionFailureReason
} from "../../../src/substitution/substitutionTypes";
import {
    createSubstitutionRequest
} from "./__helpers__/contextFactory";

describe("VariableResolver", () => {
    let resolver: VariableResolver;

    beforeEach(() => {
        resolver = new VariableResolver();
    });

    it("resolves environment placeholders using merged context env", async () => {
        const request = createSubstitutionRequest({
            command: "print ${env:API_KEY}",
            env: {
                API_KEY: "super-secret",
                REDUNDANT: "value"
            }
        });

        const result = await resolver.resolve(request);

        expect(result.command).toBe("print super-secret");
        expect(result.placeholders).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    token: "${env:API_KEY}",
                    category: PlaceholderCategory.ENV,
                    status: PlaceholderResolutionStatus.RESOLVED,
                    resolvedValue: "super-secret"
                })
            ])
        );
    });

    it("throws when environment variable is missing", async () => {
        const request = createSubstitutionRequest({
            command: "echo ${env:MISSING_VAR}",
            env: {}
        });

        await expect(resolver.resolve(request)).rejects.toBeInstanceOf(SubstitutionError);
        await expect(resolver.resolve(request)).rejects.toMatchObject({
            failure: expect.objectContaining({
                token: "${env:MISSING_VAR}",
                reason: SubstitutionFailureReason.MISSING_ENVIRONMENT
            })
        });
    });

    it("resolves workspaceFolder placeholders within command strings", async () => {
        const request = createSubstitutionRequest({
            command: "${workspaceFolder}/scripts/build.sh",
            workspaceFolder: {
                fsPath: "d:/workspace/app",
                name: "app",
                uri: Uri.file("d:/workspace/app")
            }
        });

        const result = await resolver.resolve(request);

        expect(result.command).toBe("d:/workspace/app/scripts/build.sh");
        expect(result.placeholders).toHaveLength(1);
        expect(result.placeholders[0]).toMatchObject({
            token: "${workspaceFolder}",
            category: PlaceholderCategory.WORKSPACE,
            status: PlaceholderResolutionStatus.RESOLVED,
            resolvedValue: "d:/workspace/app"
        });
    });

    it("resolves relative file placeholders using active editor context", async () => {
        const projectUri = Uri.file("d:/workspace/app");
        const request = createSubstitutionRequest({
            command: "echo",
            args: ["${relativeFile}"],
            workspaceFolder: {
                fsPath: projectUri.fsPath,
                name: "app",
                uri: projectUri
            },
            activeFile: {
                fsPath: "d:/workspace/app/src/main.ts",
                uri: Uri.file("d:/workspace/app/src/main.ts"),
                relativePath: "src/main.ts"
            }
        });

        const result = await resolver.resolve(request);

        expect(result.args[0]).toBe("src/main.ts");
        expect(result.placeholders).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    token: "${relativeFile}",
                    category: PlaceholderCategory.FILE,
                    status: PlaceholderResolutionStatus.RESOLVED,
                    resolvedValue: "src/main.ts"
                })
            ])
        );
    });

    it("throws a substitution error when file placeholders lack active editor context", async () => {
        const request = createSubstitutionRequest({
            args: ["${relativeFile}"],
            activeFile: null
        });

        await expect(resolver.resolve(request)).rejects.toBeInstanceOf(SubstitutionError);
        await expect(resolver.resolve(request)).rejects.toMatchObject({
            failure: expect.objectContaining({
                token: "${relativeFile}",
                reason: SubstitutionFailureReason.MISSING_FILE
            })
        });
    });

    it("resolves configuration placeholders using captured snapshot values", async () => {
        const request = createSubstitutionRequest({
            command: "cd ${config:cmdpipe.shell.defaultWorkingDirectory}",
            config: {
                "cmdpipe.shell.defaultWorkingDirectory": "d:/workspace/tools"
            }
        });

        const result = await resolver.resolve(request);

        expect(result.command).toBe("cd d:/workspace/tools");
        expect(result.placeholders).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    token: "${config:cmdpipe.shell.defaultWorkingDirectory}",
                    category: PlaceholderCategory.CONFIG,
                    status: PlaceholderResolutionStatus.RESOLVED,
                    resolvedValue: "d:/workspace/tools"
                })
            ])
        );
    });

    it("coerces non-string configuration values to strings", async () => {
        const request = createSubstitutionRequest({
            command: "echo ${config:editor.fontSize}px",
            config: new Map([
                ["editor.fontSize", 14]
            ])
        });

        const result = await resolver.resolve(request);

        expect(result.command).toBe("echo 14px");
    });

    it("throws when configuration value is missing", async () => {
        const request = createSubstitutionRequest({
            command: "${config:missing.setting}",
            config: new Map()
        });

        await expect(resolver.resolve(request)).rejects.toBeInstanceOf(SubstitutionError);
        await expect(resolver.resolve(request)).rejects.toMatchObject({
            failure: expect.objectContaining({
                token: "${config:missing.setting}",
                reason: SubstitutionFailureReason.MISSING_CONFIG,
                details: expect.objectContaining({ setting: "missing.setting" })
            })
        });
    });

    it("throws when configuration value type is unsupported", async () => {
        const request = createSubstitutionRequest({
            command: "${config:cmdpipe.shell.features}",
            config: new Map([
                ["cmdpipe.shell.features", { enabled: true }]
            ])
        });

        await expect(resolver.resolve(request)).rejects.toBeInstanceOf(SubstitutionError);
        await expect(resolver.resolve(request)).rejects.toMatchObject({
            failure: expect.objectContaining({
                token: "${config:cmdpipe.shell.features}",
                reason: SubstitutionFailureReason.INVALID_COMMAND_OUTPUT
            })
        });
    });
});
