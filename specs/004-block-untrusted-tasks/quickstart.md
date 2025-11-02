# Quickstart: Workspace Trust Task Safeguards

1. **Review specification & plan**  
   - Spec: `specs/004-block-untrusted-tasks/spec.md`  
   - Plan: `specs/004-block-untrusted-tasks/plan.md`

2. **Install dependencies**  
   - Run `npm install` if workspace packages are outdated.

3. **Set up development environment**  
   - Compile TypeScript once via `npm run compile`.
   - Start `npm run watch` while iterating.

4. **Update trust guard logic**  
   - Modify `src/commands/commandHandler.ts` to invoke the trust guard before executing workspace tasks.
   - Reuse `TaskConfigManager` and `TaskPicker` outputs to avoid duplicate task filtering.

5. **Implement warning presenter**  
   - Extend UI helpers in `src/ui/taskPicker.ts` or dedicated utility to surface warning messages using `vscode.window.showWarningMessage`.

6. **Listen for trust changes**  
   - Register `vscode.workspace.onDidGrantWorkspaceTrust` during extension activation and refresh task availability when fired.

7. **Add tests first**  
   - Create unit tests in `tests/unit` for trust guard logic.
   - Add integration coverage ensuring blocked workspace tasks never execute while user tasks still run.

8. **Document updates**  
   - Update README/Docs if new user guidance is required.
   - Verify quickstart remains accurate after implementation.

9. **Run validation**  
   - `npm run lint`
   - `npm test`

10. **Prepare for tasks breakdown**  
   - Use `/speckit.tasks` once implementation plan is approved and clarifications (if any) are resolved.
