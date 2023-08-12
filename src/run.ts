import * as fs from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';

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

function getTestCasePatternRegexp(testCaseName: string): string {
    return ` ${testCaseName}($| )`; // TODO: make it better, determine what is the real test case name in vitest.mjs
}

function buildDebugConfig(props: {
    testCaseName: string,
    filename: string,
    noDebug?: boolean,          // https://microsoft.github.io/debug-adapter-protocol//specification.html
    notJustMyCode?: boolean,    // https://code.visualstudio.com/docs/python/debugging#_justmycode
    preLaunchTask?: string,     // https://code.visualstudio.com/docs/editor/debugging#_launchjson-attributes
}): vscode.DebugConfiguration {
    const cwd = getNodeProjectRootPath(props.filename);

    const justMyCode = !(props.notJustMyCode ?? false);

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
            "--testNamePattern", getTestCasePatternRegexp(props.testCaseName),
            props.filename,
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

export function runInTerminal(testCaseName: string, filename: string) {
    const config = buildDebugConfig({
        testCaseName: testCaseName,
        filename: filename,
        noDebug: true,
    });
    vscode.debug.startDebugging(undefined, config);
}

export function debugInTermial(testCaseName: string, filename: string) {
    const config = buildDebugConfig({
        testCaseName: testCaseName,
        filename: filename,
    });
    vscode.debug.startDebugging(undefined, config);
}
