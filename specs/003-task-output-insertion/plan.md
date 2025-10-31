# Implementation Plan: Task Output Insertion and Command Consolidation

**Branch**: `003-task-output-insertion` | **Date**: October 29, 2025 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-task-output-insertion/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Primary requirement: Modify TaskPicker to collect task execution output and insert it into the active editor at cursor position or replace selected text, rather than only executing tasks. Additionally, consolidate duplicate command handling logic across commandHandler, quickCommands, and taskPickerCommands into a unified command registry system.

Technical approach: Extend existing TaskPicker with output collection capabilities, implement binary data detection and file saving, integrate with existing TextInsertion services, and refactor command registration to eliminate duplication while preserving all functionality.

## Technical Context

**Language/Version**: TypeScript 5.x (VS Code Extension requirement)  
**Primary Dependencies**: VS Code Extension API, JSONSchema validation, File System Watchers  
**Storage**: File system for configuration files, temporary files for binary data  
**Testing**: Jest for unit testing, VS Code extension testing framework  
**Target Platform**: VS Code Extension (Windows, macOS, Linux)
**Project Type**: VS Code Extension (single project structure)  
**Performance Goals**: Task execution with output insertion within 2 seconds, maintain <10% startup time impact  
**Constraints**: Must work within VS Code extension sandbox, cross-platform compatibility required  
**Scale/Scope**: Individual developer workflow enhancement, typical shell command outputs (<1MB)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Cross-Platform Compatibility**: TypeScript and VS Code Extension API work across Windows, macOS, and Linux  
✅ **Documentation-First**: Feature specification complete with user scenarios and acceptance criteria  
✅ **Specification-Driven Development**: Complete specification exists with measurable success criteria  
✅ **Test-First Development**: Tests will be written for all new functionality before implementation  
✅ **User Story-Driven Features**: Three prioritized user stories with independent value delivery

**Gate Status**: PASSED - All constitutional requirements satisfied

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── extension.ts              # Main extension entry point
├── commands/
│   ├── commandHandler.ts     # Unified command registry (refactored)
│   ├── quickCommands.ts      # Quick command handlers (to be consolidated)
│   └── taskPickerCommands.ts # Task picker handlers (to be consolidated)
├── ui/
│   └── taskPicker.ts         # Task picker UI (to be enhanced)
├── shell/
│   ├── shellExecutor.ts      # Task execution engine
│   └── outputProcessor.ts   # Output processing and binary detection
├── editor/
│   ├── cursorManager.ts      # Editor cursor management
│   └── textInsertion.ts      # Text insertion services
├── types/
│   ├── taskTypes.ts          # Task-related type definitions
│   └── extensionTypes.ts     # Extension-specific types
└── utils/
    ├── logger.ts             # Logging utilities
    ├── errorHandler.ts       # Error handling
    └── pathUtils.ts          # Path utilities

tests/
├── unit/
│   ├── commands/             # Command handler tests
│   ├── ui/                   # UI component tests
│   ├── shell/                # Shell execution tests
│   └── editor/               # Editor integration tests
├── integration/
│   └── shellToEditor.test.ts # End-to-end workflow tests
└── e2e/
    └── basicWorkflow.test.ts # Complete user scenarios
```

**Structure Decision**: VS Code Extension architecture with existing modular structure preserved. Command consolidation will happen within the commands/ directory while maintaining separation of concerns across other modules.

## Phase 0: Research & Technical Decisions

All technical context is clear from the existing codebase analysis. No research phase needed as:

- TypeScript and VS Code Extension patterns are well-established
- Existing codebase provides clear integration points
- Binary data handling approach is straightforward
- Command consolidation strategy is evident from current duplication

**Output**: ✅ [research.md](./research.md) - Documents technical decisions and implementation patterns

## Phase 1: Design & Contracts

**Prerequisites**: ✅ research.md complete

### Data Model Design
✅ **Completed**: [data-model.md](./data-model.md)
- TaskExecutionResult with output collection capabilities
- OutputInsertionContext for editor state tracking  
- CommandRegistry for unified command management
- InsertionMode enumeration for output placement options

### API Contracts
✅ **Completed**: [contracts/task-execution-api.md](./contracts/task-execution-api.md)
- ITaskExecutor interface for enhanced task execution
- IOutputProcessor interface for binary detection and processing
- ICommandRegistry interface for unified command management
- IOutputInsertion interface for editor integration
- Complete error types and event definitions

### Documentation
✅ **Completed**: [quickstart.md](./quickstart.md)
- User workflow documentation
- Configuration options reference  
- Developer integration guide
- Troubleshooting and migration notes

### Agent Context Update
✅ **Completed**: GitHub Copilot context updated with:
- TypeScript 5.x (VS Code Extension requirement)
- VS Code Extension API, JSONSchema validation, File System Watchers
- File system storage for configuration and temporary files

**Phase 1 Output**: All design artifacts completed

## Constitution Check (Post-Design)

✅ **Cross-Platform Compatibility**: Design maintains cross-platform support through VS Code Extension API  
✅ **Documentation-First**: Complete documentation created before implementation  
✅ **Specification-Driven Development**: All design follows specification requirements  
✅ **Test-First Development**: Testing strategy documented in contracts and quickstart  
✅ **User Story-Driven Features**: Design supports all three prioritized user stories

**Gate Status**: PASSED - All constitutional requirements maintained through design phase
