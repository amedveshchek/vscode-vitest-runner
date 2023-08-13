import * as vscode from 'vscode';
import { debugInTermial, runInTerminal } from './run';
import { TestCase } from './types';

export class RunVitestCommand implements vscode.Command {
    static ID = 'vitest.runTest';
    title = 'Run(Vitest)';
    command = RunVitestCommand.ID;
    arguments?: [TestCase];

    constructor(textCase: TestCase) {
        this.arguments = [textCase];
    }
}

export class DebugVitestCommand implements vscode.Command {
    static ID = 'vitest.debugTest';
    title = 'Debug(Vitest)';
    command = DebugVitestCommand.ID;
    arguments?: [TestCase];

    constructor(textCase: TestCase) {
        this.arguments = [textCase];
    }
}

vscode.commands.registerCommand(
    RunVitestCommand.ID,
    (textCase: TestCase) => {
        runInTerminal(textCase);
    }
);

vscode.commands.registerCommand(
    DebugVitestCommand.ID,
    (textCase: TestCase) => {
        debugInTermial(textCase);
    }
);
