"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const linter_1 = require("../linter");
(0, vitest_1.describe)('length rules', () => {
    (0, vitest_1.describe)('max-length', () => {
        (0, vitest_1.it)('flags files exceeding max token count', () => {
            const content = 'a'.repeat(25000); // ~6250 tokens > 5000 default
            const report = (0, linter_1.lintContent)({
                content,
                preset: 'recommended',
                rules: { 'min-length': 'off', 'no-headers': 'off', 'missing-sections': 'off', 'no-examples': 'off' },
            });
            const maxLengthDiags = report.diagnostics.filter(d => d.ruleId === 'max-length');
            (0, vitest_1.expect)(maxLengthDiags.length).toBe(1);
            (0, vitest_1.expect)(maxLengthDiags[0].severity).toBe('warning');
        });
        (0, vitest_1.it)('does not flag files under max token count', () => {
            const content = '# Rules\n\n' + 'Some instruction. '.repeat(50);
            const report = (0, linter_1.lintContent)({
                content,
                rules: { 'missing-sections': 'off', 'no-examples': 'off' },
            });
            const maxLengthDiags = report.diagnostics.filter(d => d.ruleId === 'max-length');
            (0, vitest_1.expect)(maxLengthDiags.length).toBe(0);
        });
        (0, vitest_1.it)('respects custom maxTokens option', () => {
            const content = 'a'.repeat(500); // ~125 tokens
            const report = (0, linter_1.lintContent)({
                content,
                rules: {
                    'max-length': { severity: 'error', options: { maxTokens: 100 } },
                    'min-length': 'off',
                    'no-headers': 'off',
                    'missing-sections': 'off',
                    'no-examples': 'off',
                },
            });
            const diags = report.diagnostics.filter(d => d.ruleId === 'max-length');
            (0, vitest_1.expect)(diags.length).toBe(1);
            (0, vitest_1.expect)(diags[0].severity).toBe('error');
        });
    });
    (0, vitest_1.describe)('min-length', () => {
        (0, vitest_1.it)('flags files below min token count', () => {
            const content = 'Short.';
            const report = (0, linter_1.lintContent)({
                content,
                rules: { 'no-headers': 'off', 'missing-sections': 'off', 'no-examples': 'off' },
            });
            const diags = report.diagnostics.filter(d => d.ruleId === 'min-length');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag files above min token count', () => {
            const content = '# Rules\n\n' + 'This is a meaningful instruction for the AI tool. '.repeat(20);
            const report = (0, linter_1.lintContent)({
                content,
                rules: { 'missing-sections': 'off', 'no-examples': 'off' },
            });
            const diags = report.diagnostics.filter(d => d.ruleId === 'min-length');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('section-length', () => {
        (0, vitest_1.it)('flags sections exceeding max token count', () => {
            const content = '## Long Section\n\n' + 'a'.repeat(8000);
            const report = (0, linter_1.lintContent)({
                content,
                rules: { 'missing-sections': 'off', 'no-examples': 'off', 'wall-of-text': 'off' },
            });
            const diags = report.diagnostics.filter(d => d.ruleId === 'section-length');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag short sections', () => {
            const content = '## Short Section\n\nJust a few words.';
            const report = (0, linter_1.lintContent)({
                content,
                rules: { 'missing-sections': 'off', 'no-examples': 'off' },
            });
            const diags = report.diagnostics.filter(d => d.ruleId === 'section-length');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
});
//# sourceMappingURL=rules-length.test.js.map