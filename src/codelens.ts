import type * as ts from 'typescript';
import * as vscode from 'vscode';
import { TestCase, TestCaseType } from './types';
import { flatMap } from './utils';
import { RunVitestCommand, DebugVitestCommand } from './vscode';

const caseText = new Set(['it', 'describe', 'test']);

function tryGetVitestTestCase(
    typescript: typeof ts,
    node: ts.Node,
    file: ts.SourceFile,
    fileName: string,
    parentTexts: string[],
): TestCase | undefined {
    if (!typescript.isCallExpression(node)) {
        return undefined;
    }

    const callExpression = node as ts.CallExpression;

    if (!typescript.isIdentifier(callExpression.expression)) {
        return undefined;
    }

    if (!caseText.has(callExpression.expression.text)) {
        return undefined;
    }

    const args = callExpression.arguments;
    if (args.length < 2) {
        return undefined;
    }

    const [testName, body] = args;
    if (
        !typescript.isStringLiteralLike(testName) ||
        !typescript.isFunctionLike(body)
    ) {
        return undefined;
    }

    return {
        type: callExpression.expression.text as TestCaseType,
        fileName: fileName,
        start: testName.getStart(file),
        end: testName.getEnd(),
        text: testName.text,
        parentTexts: parentTexts,
    };
}

export class CodeLensProvider implements vscode.CodeLensProvider {
    constructor(private typescript: typeof ts) {}

    provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeLens[]> {
        const ts = this.typescript;

        const text = document.getText();
        const sourceFile = ts.createSourceFile(
            'dummy',
            text,
            ts.ScriptTarget.Latest
        );

        const testCases: TestCase[] = [];
        visitor(sourceFile, []);

        return flatMap(testCases, x => {
            const start = document.positionAt(x.start);
            const end = document.positionAt(x.end);

            return [
                new vscode.CodeLens(
                    new vscode.Range(start, end),
                    new RunVitestCommand(x)
                ),
                new vscode.CodeLens(
                    new vscode.Range(start, end),
                    new DebugVitestCommand(x)
                )
            ];
        });

        function visitor(node: ts.Node, parentTexts: string[]) {
            if (token.isCancellationRequested) {
                return;
            }

            const testCase = tryGetVitestTestCase(ts, node, sourceFile, document.fileName, parentTexts);
            if (testCase) {
                const deeperParentTexts = Object.assign([], parentTexts); // copy array
                deeperParentTexts.push(testCase.text);

                testCases.push(testCase);
                ts.forEachChild(node, (node: ts.Node) => visitor(node, deeperParentTexts));
            } else {
                ts.forEachChild(node, (node: ts.Node) => visitor(node, parentTexts));
            }
        }
    }
}
