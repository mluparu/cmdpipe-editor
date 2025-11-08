# cmdpipe-editor Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-24

## Active Technologies
- File system for configuration files, temporary files for binary data (003-task-output-insertion)
- TypeScript 5.x + VS Code Extension API, existing cmdpipe task management modules (TaskConfigManager, TaskPicker, ShellExecutor), ajv for schema validation (004-block-untrusted-tasks)
- N/A (in-memory state and VS Code APIs) (004-block-untrusted-tasks)
- TypeScript 5.x + VS Code Extension API (`vscode.workspace`, `vscode.window`, configuration access), existing cmdpipe modules (`ShellExecutor`, `TaskConfigManager`, `TaskPicker`), ajv-backed task schema validation (005-support-variable-substitution)
- N/A (context gathered from runtime VS Code APIs) (005-support-variable-substitution)
- TypeScript 5.x targeting ES2020 + VS Code Extension API, Node.js standard library modules (`os`, `process`) (006-detect-powershell-shell)
- N/A (in-memory configuration only) (006-detect-powershell-shell)

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
- 006-detect-powershell-shell: Added TypeScript 5.x targeting ES2020 + VS Code Extension API, Node.js standard library modules (`os`, `process`)
- 005-support-variable-substitution: Added TypeScript 5.x + VS Code Extension API (`vscode.workspace`, `vscode.window`, configuration access), existing cmdpipe modules (`ShellExecutor`, `TaskConfigManager`, `TaskPicker`), ajv-backed task schema validation
- 004-block-untrusted-tasks: Added TypeScript 5.x + VS Code Extension API, existing cmdpipe task management modules (TaskConfigManager, TaskPicker, ShellExecutor), ajv for schema validation


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
