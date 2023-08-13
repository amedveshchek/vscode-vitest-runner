export type TestCaseType = 'describe' | 'test' | 'it';

export interface TestCase {
    type: TestCaseType;
    fileName: string;
    start: number;
    end: number;
    text: string;
    parentTexts: string[];
}
