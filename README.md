# vscode-vitest-runner-X

Run your test case by vitest.

This is a fork of the [original extension](https://github.com/kwai-explore/vscode-vitest-runner/), which didn't work for me. And looking at how many other forks out there trying to make it work, I figured that I can make my own effort.

So, the fixes include:
- the main fix is to make the extension to execute the tests according to [the Vitest's official documentation](https://vitest.dev/guide/debugging.html)
- to make it work for monorepos - detecting the project root by locating `package.json` file.

![preview](https://github.com/amedveshchek/vscode-vitest-runner/blob/main/docs/preview.png?raw=true)
