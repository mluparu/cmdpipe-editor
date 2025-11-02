# Task to Editor - CmdPipe-Editor

| Command ID | Description | Implementation File |
|-------------------------------|--------------------------------------------------|-------------------|
| cmdpipe.runTask                | Show task picker to select and execute tasks     | commandHandler.ts |
| cmdpipe.insertDateTime         | Insert current date and time at cursor           | commandHandler.ts |
| cmdpipe.quickCommand           | Execute any shell command and insert output      | commandHandler.ts |
| cmdpipe.executeSelection       | Execute selected text as shell command           | commandHandler.ts |
| cmdpipe.config.showLogs        | Display extension logs                           | commandHandler.ts |
| cmdpipe.config.refreshTasks    | Refresh task configurations                      | commandHandler.ts |
| cmdpipe.config.createWorkspaceTasks | Create tasks.json for workspace              | commandHandler.ts |
| cmdpipe.config.openUserConfig  | Open user configuration directory                | commandHandler.ts |
| cmdpipe.config.showTaskErrors  | Display task configuration errors                | commandHandler.ts |
| cmdpipe.config.validateTaskConfigs | Validate all task configurations             | commandHandler.ts |

## Workspace Trust Safeguards

- Workspace-defined tasks are automatically blocked when VS Code marks the workspace as untrusted or undecided.
- User-defined tasks remain runnable and are surfaced separately in the task picker for quick access.
- Blocked workspace tasks display a lock icon and guidance in the picker so the restriction is clear before execution.
- Choosing a blocked task opens trust management actions; the full onboarding workflow is described in `specs/004-block-untrusted-tasks/quickstart.md`.