// Jest setup file for VSCode extension testing

export {}; // Make this an external module

declare global {
  namespace NodeJS {
    interface Global {
      vscode: any;
    }
  }
}

// This file will be used to set up mocks for VSCode APIs in tests
// Individual test files will import and configure specific mocks as needed