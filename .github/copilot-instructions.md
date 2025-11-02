# cmdpipe-editor Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-24

## Active Technologies
- File system for configuration files, temporary files for binary data (003-task-output-insertion)
- TypeScript 5.x + VS Code Extension API, existing cmdpipe task management modules (TaskConfigManager, TaskPicker, ShellExecutor), ajv for schema validation (004-block-untrusted-tasks)
- N/A (in-memory state and VS Code APIs) (004-block-untrusted-tasks)

- TypeScript 5.x (VS Code Extension requirement) + VS Code Extension API, JSONSchema validation, File System Watchers (002-task-picker-automation)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x (VS Code Extension requirement): Follow standard conventions

## Recent Changes
- 004-block-untrusted-tasks: Added TypeScript 5.x + VS Code Extension API, existing cmdpipe task management modules (TaskConfigManager, TaskPicker, ShellExecutor), ajv for schema validation
- 003-task-output-insertion: Added TypeScript 5.x (VS Code Extension requirement) + VS Code Extension API, JSONSchema validation, File System Watchers

- 002-task-picker-automation: Added TypeScript 5.x (VS Code Extension requirement) + VS Code Extension API, JSONSchema validation, File System Watchers

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
