# Quickstart: VS Code Variable Substitution in Shell Execution

1. **Review specification & plan**  
   - Spec: `specs/005-support-variable-substitution/spec.md`  
   - Plan: `specs/005-support-variable-substitution/plan.md`

2. **Prepare the workspace**  
   - Install dependencies via `npm install` if not already up to date.  
   - Run `npm run compile` once, then `npm run watch` during development.

3. **Understand the substitution pipeline**  
   - `src/substitution/contextBuilder.ts` captures workspace, active file, environment, and configuration snapshots.  
   - `src/substitution/variableResolver.ts` resolves `${workspace*}`, `${env:*}`, and `${config:*}` placeholders.  
   - `src/substitution/substitutionSummary.ts` provides redacted logging of resolved placeholders.

4. **Run focused automated tests**  
   - Unit coverage lives in `tests/unit/substitution/contextBuilder.test.ts` and `tests/unit/substitution/variableResolver.test.ts`.  
   - Integration coverage is in `tests/integration/variableSubstitutionWorkspace.test.ts`, `tests/integration/variableSubstitutionEnv.test.ts`, and `tests/integration/variableSubstitutionConfig.test.ts`.

5. **Manual verification checklist**  
   - Define a task that references `${workspaceFolder}` and `${relativeFile}` and confirm execution uses absolute paths.  
   - Export `${env:API_TOKEN}` (or another secret) and verify missing values block execution while resolved values are redacted in logs.  
   - Create a `cmdpipe.shell.defaultWorkingDirectory` setting and validate `${config:cmdpipe.shell.defaultWorkingDirectory}` applies.

6. **Update user-facing guidance**  
   - Edit `docs/index.md` and `README.md` if new placeholders or behaviors require documentation tweaks.  
   - Capture troubleshooting notes in the docs when new edge cases surface.

7. **Final verification before PR**  
   - Run `npm run lint`.  
   - Run the targeted suite: `npm test -- substitution`.  
   - Finish with a full test pass: `npm test`.

8. **Next phase**  
   - Execute `/speckit.tasks` once the plan is approved and design artifacts remain in sync.
