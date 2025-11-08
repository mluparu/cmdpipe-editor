# Quickstart: PowerShell Default Shell Detection

## Prerequisites
- Windows 10 or later workstation with both Command Prompt and PowerShell installed.
- VS Code with the cmdpipe extension running from the `006-detect-powershell-shell` branch.
- Ability to edit VS Code settings (`terminal.integrated.defaultProfile.windows`).

## Steps
1. **Configure PowerShell as default**
   - Open VS Code settings.
   - Set `terminal.integrated.defaultProfile.windows` to `PowerShell` (Windows PowerShell) and reload the window.
   - Repeat with `PowerShell Core` to verify the extension resolves both profiles.
   - Run `CmdPipe Config: Show Logs` and confirm the output channel records the detected default profile name, executable path, and launch arguments.
2. **Run extension task**
   - Trigger an existing cmdpipe task (e.g., sample workspace task) that launches a shell command from the Windows test workspace.
   - Confirm the task uses the detected PowerShell by checking the task header and the CmdPipe log entry showing `powershell.exe` or `pwsh.exe`.
   - Capture a screenshot or log snippet that shows the resolved shell for each profile.
3. **Scenario: Argument escaping smoke test**
   - Edit the sample task to include arguments such as `"C:\Program Files\Git"`, `"foo'bar"`, `"space value"`, and `&` symbols.
   - Re-run the task and verify PowerShell receives the raw arguments intact by comparing the echo output with the original input.
   - Note any escaping adjustments (e.g., doubled single quotes) in the CmdPipe log for future troubleshooting.
4. **Scenario: Fallback to Command Prompt**
   - Temporarily set `terminal.integrated.defaultProfile.windows` to a non-existent profile name (for example `Bogus-PowerShell`).
   - Run the task again and confirm the extension falls back to Command Prompt, logging a warning with the failure reason and the `cmd.exe` path.
   - Restore the valid profile value after validating the fallback workflow.
5. **Regression sweep**
   - Execute `npm test` to run unit and integration tests, confirming Windows-specific suites (`platformDetector` and `shellToEditor`) remain green alongside existing macOS/Linux coverage.

## Expected Results
- Tasks launched when PowerShell is configured run under PowerShell without manual overrides.
- Arguments are passed intact even with special characters.
- When the configured shell is unavailable, the extension cleanly falls back to Command Prompt and reports the issue.
- Test suite remains green across platforms.
