# Data Model: PowerShell Default Shell Detection

## Entity: Platform Profile
- **Description**: Represents the detected operating system context and shell configuration exposed to task execution services.
- **Fields**:
  - `platform` (enum: `win32`, `darwin`, `linux`)
  - `defaultShell` (string: canonical shell identifier such as `powershell.exe`, `pwsh.exe`, `cmd.exe`)
  - `shellPath` (string: absolute path to the executable actually invoked)
  - `shellArgs` (string[]) – ordered arguments passed when launching the shell (`['-c']`, `['/c']`, `['-NoLogo', '-NoProfile', '-Command']`)
  - `pathSeparator` (string: `/` or `\`)
  - `pathEnvVar` (string: name of path environment variable, usually `PATH`)
  - `diagnostics` (optional string[]): human-readable notes describing fallback or detection issues
- **Relationships**:
  - Consumed by `ShellExecutor` to create command invocations.
  - Derived from VS Code configuration and environment state read by `PlatformDetector`.

## Entity: Command Execution Request
- **Description**: Encapsulates the command and arguments prepared for shell execution after escaping.
- **Fields**:
  - `command` (string: executable or script to run)
  - `args` (string[]): raw argument list before shell-specific escaping
  - `escapedArgs` (string[]): arguments after applying CMD/PowerShell/Linux quoting strategy
  - `environment` (Record<string, string>): environment variables inherited or added for the command
  - `shell` (reference: Platform Profile)
- **Relationships**:
  - Produced by task orchestration flows in `ShellExecutor`.
  - Relies on `PlatformDetector.escapeArgument` to populate `escapedArgs`.

## Supporting Concept: Detection Inputs
- **Description**: Source data used to determine the default shell on Windows.
- **Fields**:
  - `vscodeDefaultProfile` (string | null): value of `terminal.integrated.defaultProfile.windows`
  - `vscodeProfiles` (Record<string, Profile>): VS Code profiles map describing custom shells
  - `comspecPath` (string | null): value from `process.env.COMSPEC`
  - `availableExecutables` (string[]): resolved absolute paths checked during detection
- **Relationships**:
  - Evaluated by `PlatformDetector.detectPlatform()` to construct the `Platform Profile` entity.
  - May be logged for diagnostics when shell resolution fails.
