# Research: PowerShell Default Shell Detection

## Decision 1: Default Shell Source of Truth on Windows
- **Decision**: Honor VS Code's `terminal.integrated.defaultProfile.windows` setting first, then fall back to `terminal.integrated.profiles.windows`, and finally use `process.env.COMSPEC`.
- **Rationale**: VS Code users expect the extension to mirror the terminal profile they configured in the editor. Falling back through the profiles list preserves compatibility with custom profiles, while `COMSPEC` ensures legacy environments still function.
- **Alternatives Considered**:
  - **Rely solely on `COMSPEC`**: Rejected because it ignores explicit VS Code preferences and keeps the existing bug.
  - **Inspect Windows registry for default shell**: Rejected due to fragility and because VS Code already exposes the preferred abstraction.

## Decision 2: PowerShell Executable Resolution
- **Decision**: Support both Windows PowerShell (`powershell.exe`) and PowerShell Core (`pwsh.exe`) by matching profile identifiers and verifying filesystem availability before selection.
- **Rationale**: Many developers have migrated to PowerShell Core; checking for both executables avoids false negatives while ensuring we execute a shell that actually exists.
- **Alternatives Considered**:
  - **Hard-code `powershell.exe`**: Rejected because it breaks environments using only PowerShell Core.
  - **Prompt the user when multiple shells exist**: Rejected to keep task execution non-interactive and aligned with VS Code's profile decisions.

## Decision 3: Argument Escaping Strategy for PowerShell
- **Decision**: Implement a quoting helper that wraps arguments in single quotes by default, doubles embedded single quotes, and defers to double quotes only when necessary to preserve trailing backslashes or variable expansion.
- **Rationale**: This mirrors established PowerShell quoting guidance and prevents command mangling for spaces, ampersands, and redirection symbols common in task definitions.
- **Alternatives Considered**:
  - **Reuse existing CMD escaping rules**: Rejected because CMD rules fail for PowerShell-specific parsing and would continue corrupting arguments.
  - **Quote the entire command string**: Rejected to avoid recomposing commands and to keep parity with the existing argument-array approach in `ShellExecutor`.
