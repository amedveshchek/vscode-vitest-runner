import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import { TestCase } from './types';

function getNodeProjectRootPath(filePath: string): string {
    let fileDir = path.dirname(filePath);
    let rootPath = fileDir;
    let backHops = [];
    const packageJsonFile = () => path.join(rootPath, 'package.json')

    let i = 0;
    const maxBackHops = 20;
    while (i < maxBackHops && !fs.existsSync(packageJsonFile())) {
        backHops.push('..');
        rootPath = path.join(fileDir, ...backHops);
        i++;
    }
    if (i >= maxBackHops) {
        throw Error(`can't find the root of the project for filePath=${filePath}, last tried rootPath=${rootPath}`);
    }

    return path.resolve(rootPath);
}

function getTestCasePatternRegexp(testCase: TestCase): string {
    const caseNamePath = [...testCase.parentTexts, testCase.text].join(' ');
    if (testCase.type === 'describe') {
        return `^ ${caseNamePath} `;
    } else if (testCase.type === 'it' || testCase.type === 'test') {
        return `^ ${caseNamePath}$`;
    } else {
        throw new Error(`Unknown test case type '${testCase.type}`);
    }
}

function buildDebugConfig(props: {
    testCase: TestCase,
    noDebug?: boolean,          // https://microsoft.github.io/debug-adapter-protocol//specification.html
    notJustMyCode?: boolean,    // https://code.visualstudio.com/docs/python/debugging#_justmycode
    preLaunchTask?: string,     // https://code.visualstudio.com/docs/editor/debugging#_launchjson-attributes
}): vscode.DebugConfiguration {
    const cwd = getNodeProjectRootPath(props.testCase.fileName);

    const justMyCode = !(props.notJustMyCode ?? false);
    const testNamePattern = getTestCasePatternRegexp(props.testCase);

    // https://vitest.dev/guide/debugging.html
    return {
        "type": "pwa-node",
        "request": "launch",
        "name": "Vitest Typescript",
        "autoAttachChildProcesses": true,
        "skipFiles": [
            "<node_internals>/**",
            "**/node_modules/**"
        ],
        "cwd": cwd,
        "runtimeExecutable": "npx",
        "program": `${cwd}/node_modules/vitest/vitest.mjs`,
        "args": [
            "run",
            "--root", cwd,
            "--testNamePattern", testNamePattern,
            props.testCase.fileName,
        ],
        "smartStep": true,
        // Environment variables passed to the program.
        "env": {
            "NODE_ENV": "development"
        },
        // Use JavaScript source maps (if they exist).
        "sourceMaps": true,
        "resolveSourceMapLocations": [
            `${cwd}/**`,
            `!${cwd}/**/node_modules/**`,
        ],
        "outDir": `${cwd}`,
        "console": "integratedTerminal",
        "noDebug": props.noDebug ?? false,
        "justMyCode": justMyCode,
        "stopOnEntry": false,
        // "preLaunchTask": `tsc: build -p ${cwd}/tsconfig.json`,   // ingore, as it's not always configured
        // "outFiles": [                                            // autodetected
        //     `${cwd}/dist/**/*.js`,
        //     `${cwd}/dist/**/*.js.map`,
        // ],
    }
}

export function runInTerminal(testCase: TestCase) {
    const config = buildDebugConfig({
        testCase: testCase,
        noDebug: true,
    });
    vscode.debug.startDebugging(undefined, config);
}

export function debugInTermial(testCase: TestCase) {
    const config = buildDebugConfig({
        testCase: testCase,
    });
    vscode.debug.startDebugging(undefined, config);
}
