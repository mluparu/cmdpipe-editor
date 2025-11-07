import { VariableContextBuilder } from "../../src/substitution/contextBuilder";
import { withSubstitutionSummary } from "../../src/substitution/substitutionSummary";
import { VariableResolver, SubstitutionError } from "../../src/substitution/variableResolver";
import {
    PlaceholderCategory,
    PlaceholderResolutionStatus,
    SubstitutionFailureReason,
    type SubstitutionRequest
} from "../../src/substitution/substitutionTypes";
import type { TaskDefinition } from "../../src/types/taskTypes";

describe("Variable substitution environment integration", () => {
    const builder = new VariableContextBuilder();
    const resolver = new VariableResolver();

    it("resolves environment variables and redacts summaries", async () => {
        const originalProcessValue = process.env.API_KEY;
        process.env.API_KEY = "process-value";

        const task: TaskDefinition = {
            id: "env-success",
            name: "Environment Success",
            command: "curl --header \"X-API=${env:API_KEY}\"",
            args: ["--flag"],
            workspaceDefaults: {
                env: {
                    API_KEY: "workspace-value"
                }
            },
            environmentVariables: {
                API_KEY: "task-value"
            }
        };

        try {
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
            const summarised = withSubstitutionSummary(result);

            expect(summarised.command).toBe("curl --header \"X-API=task-value\"");
            const placeholder = summarised.placeholders.find((entry) => entry.token === "${env:API_KEY}");
            expect(placeholder).toBeDefined();
            expect(placeholder).toMatchObject({
                category: PlaceholderCategory.ENV,
                status: PlaceholderResolutionStatus.RESOLVED,
                resolvedValue: "task-value"
            });
            expect(summarised.summary?.tokens).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        token: "${env:API_KEY}",
                        displayValue: "[REDACTED]"
                    })
                ])
            );
        } finally {
            if (originalProcessValue === undefined) {
                delete process.env.API_KEY;
            } else {
                process.env.API_KEY = originalProcessValue;
            }
        }
    });

    it("surfaces missing environment variables as substitution errors", async () => {
        const originalMissing = process.env.UNSET_TOKEN;
        delete process.env.UNSET_TOKEN;

        const task: TaskDefinition = {
            id: "env-missing",
            name: "Environment Missing",
            command: "echo ${env:UNSET_TOKEN}"
        };

        try {
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

            await expect(resolver.resolve(request)).rejects.toBeInstanceOf(SubstitutionError);
            await expect(resolver.resolve(request)).rejects.toMatchObject({
                failure: expect.objectContaining({
                    token: "${env:UNSET_TOKEN}",
                    reason: SubstitutionFailureReason.MISSING_ENVIRONMENT
                })
            });
        } finally {
            if (originalMissing === undefined) {
                delete process.env.UNSET_TOKEN;
            } else {
                process.env.UNSET_TOKEN = originalMissing;
            }
        }
    });
});
