# Implementation Plan: Shell Task Pipe Extension

**Branch**: `001-shell-task-pipe` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-shell-task-pipe/spec.md`

## Summary

Building a VSCode extension that allows developers to run arbitrary shell commands and pipe their outputs directly to the current cursor position in the editor. The extension reads task configurations from a JSON file in the .vscode folder, dynamically creates VSCode commands for each task, and handles configuration errors through standard logging. Key focus on cross-platform compatibility, descriptive UI elements, and comprehensive documentation including marketplace listing.

## Technical Context

**Language/Version**: TypeScript 5.x with Node.js 18+ (VSCode extension standard)  
**Primary Dependencies**: VSCode Extension API, Node.js child_process, chokidar for file watching, JSON schema validation  
**Storage**: JSON configuration files in .vscode folder, VSCode workspace settings for extension configuration  
**Testing**: Jest for unit tests, VSCode Test Runner for integration tests, end-to-end testing with VSCode Extension Test Runner  
**Target Platform**: Cross-platform VSCode extension (Windows, macOS, Linux) with platform-specific shell handling  
**Project Type**: VSCode extension with dynamic command registration and file system integration  
**Performance Goals**: <200ms command registration, <3s task execution feedback, <500ms configuration validation  
**Constraints**: VSCode Extension API limitations, security sandbox restrictions, cross-platform shell compatibility  
**Scale/Scope**: Support 50+ concurrent task definitions, handle configuration files up to 1MB, support all VSCode-compatible platforms

## Constitution Check

*✅ GATE: All constitutional principles satisfied*

**✅ I. Cross-Platform Compatibility**: Extension designed for Windows/macOS/Linux with platform-specific shell handling (cmd.exe, bash, zsh). All UI text and documentation will be platform-agnostic.

**✅ II. Documentation-First**: Comprehensive documentation planned including marketplace readme, user guide, API documentation, troubleshooting guide, and inline code documentation.

**✅ III. Specification-Driven Development**: Complete specification exists with user scenarios, functional requirements, and success criteria before implementation begins.

**✅ IV. Test-First Development**: TDD approach planned with unit tests, integration tests, and end-to-end tests written before implementation. Red-Green-Refactor cycle for all components.

**✅ V. User Story-Driven Features**: Feature decomposed into 3 independent user stories (P1: Execute Shell Task, P2: Dynamic Configuration, P3: Error Handling) enabling incremental delivery.

**Additional Requirements**:
- **Descriptive UI Text**: All UI elements must include descriptive, accessible text for commands, error messages, and user feedback
- **Marketplace Documentation**: Comprehensive README.md for VS Code Marketplace listing with features, installation, usage examples, and troubleshooting

## Project Structure

### Documentation (this feature)

```text
specs/001-shell-task-pipe/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (VSCode extension research)
├── data-model.md        # Phase 1 output (task configuration schema)
├── quickstart.md        # Phase 1 output (user setup guide)
├── contracts/           # Phase 1 output (VSCode API interfaces)
│   ├── task-config.json # JSON schema for task configuration
│   ├── commands.md      # Command API definitions
│   └── events.md        # Extension event handling
├── README.md            # Marketplace listing documentation
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (VSCode Extension)

```text
src/
├── extension.ts         # Main extension entry point
├── commands/           # Command registration and execution
│   ├── taskExecutor.ts
│   ├── commandRegistry.ts
│   └── commandPalette.ts
├── config/             # Configuration management
│   ├── taskConfig.ts
│   ├── fileWatcher.ts
│   ├── validator.ts
│   └── schema.json
├── shell/              # Cross-platform shell execution
│   ├── shellExecutor.ts
│   ├── platformDetector.ts
│   └── outputProcessor.ts
├── editor/             # Editor integration
│   ├── cursorManager.ts
│   ├── textInsertion.ts
│   └── selectionHandler.ts
├── ui/                 # User interface components
│   ├── errorDisplay.ts
│   ├── statusBar.ts
│   └── notifications.ts
├── utils/              # Shared utilities
│   ├── logger.ts
│   ├── pathResolver.ts
│   └── errorHandler.ts
└── types/              # TypeScript type definitions
    ├── taskTypes.ts
    ├── configTypes.ts
    └── extensionTypes.ts

tests/
├── unit/               # Unit tests for individual components
│   ├── commands/
│   ├── config/
│   ├── shell/
│   └── editor/
├── integration/        # Integration tests for component interactions
│   ├── configToCommand.test.ts
│   ├── shellToEditor.test.ts
│   └── errorHandling.test.ts
└── e2e/                # End-to-end tests with VSCode
    ├── basicWorkflow.test.ts
    ├── configChanges.test.ts
    └── errorScenarios.test.ts

docs/
├── README.md           # Marketplace listing (user-facing)
├── CONTRIBUTING.md     # Development guidelines
├── API.md              # Extension API documentation
├── TROUBLESHOOTING.md  # Common issues and solutions
└── examples/           # Usage examples and templates
    ├── basic-config.json
    ├── advanced-config.json
    └── platform-specific.json

.vscode/
├── launch.json         # Debug configuration
├── tasks.json          # Build and test tasks
└── settings.json       # Development workspace settings

package.json            # Extension manifest and dependencies
tsconfig.json          # TypeScript configuration
jest.config.js         # Testing configuration
.vscodeignore         # Extension packaging exclusions
CHANGELOG.md          # Version history
LICENSE.md            # Extension license
```

**Structure Decision**: Selected VSCode extension structure with clear separation of concerns: commands, configuration, shell execution, editor integration, and UI components. This enables independent development and testing of each user story while maintaining cross-platform compatibility and comprehensive documentation requirements.

## UI Requirements

**Descriptive Text Standards**: All user-facing elements must include clear, descriptive text to ensure accessibility and usability:

- **Command Palette Entries**: Each task command must display with descriptive name and brief explanation (e.g., "Shell Task: Generate UUID - Inserts a new UUID at cursor position")
- **Error Messages**: All validation and execution errors must provide specific, actionable feedback (e.g., "Task 'git-status' failed: Git is not installed or not found in PATH")
- **Status Updates**: Progress indicators and completion messages must be informative (e.g., "Executing shell task 'build-docs'..." → "Task completed: 47 lines inserted")
- **Configuration Validation**: Schema validation errors must identify specific fields and expected formats
- **Output Panel Messages**: All logging must use consistent, descriptive format with timestamps and context

## Documentation Deliverables

**Marketplace README Requirements**: Comprehensive marketplace listing documentation must include:

- **Feature Overview**: Clear description of extension capabilities with screenshots
- **Installation Guide**: Step-by-step setup instructions with prerequisites
- **Quick Start**: Basic usage examples with sample task configurations
- **Configuration Reference**: Complete JSON schema documentation with examples
- **Platform Support**: Detailed cross-platform compatibility information
- **Troubleshooting**: Common issues, solutions, and debugging guidance
- **Examples Gallery**: Real-world use cases and configuration templates
- **Performance Notes**: Expected execution times and resource usage
- **Security Considerations**: Shell execution safety and workspace trust requirements

## Complexity Tracking

*No constitutional violations - all principles satisfied by design.*
