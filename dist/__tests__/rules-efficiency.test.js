"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const linter_1 = require("../linter");
const BASE_RULES = {
    'missing-sections': 'off',
    'no-examples': 'off',
    'no-headers': 'off',
    'min-length': 'off',
};
(0, vitest_1.describe)('efficiency rules', () => {
    (0, vitest_1.describe)('redundant-whitespace', () => {
        (0, vitest_1.it)('flags trailing whitespace', () => {
            const content = '# Rules\n\nUse TypeScript.   \nAlways test.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'redundant-whitespace');
            (0, vitest_1.expect)(diags.length).toBeGreaterThanOrEqual(1);
            (0, vitest_1.expect)(diags[0].fix).toBeDefined();
        });
        (0, vitest_1.it)('flags excessive consecutive blank lines', () => {
            const content = '# Rules\n\n\n\n\nUse TypeScript.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'redundant-whitespace');
            (0, vitest_1.expect)(diags.length).toBeGreaterThanOrEqual(1);
        });
        (0, vitest_1.it)('does not flag normal spacing', () => {
            const content = '# Rules\n\nUse TypeScript.\n\nAlways test.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'redundant-whitespace');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('commented-out-content', () => {
        (0, vitest_1.it)('flags substantial HTML comments', () => {
            const content = '# Rules\n\n<!-- This is an old instruction that should be removed from the file entirely -->\n\nUse TypeScript.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'commented-out-content');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag lint directives', () => {
            const content = '# Rules\n\n<!-- ai-rules-lint-disable vague-instruction -->\n\nUse TypeScript.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'commented-out-content');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
        (0, vitest_1.it)('does not flag short comments', () => {
            const content = '# Rules\n\n<!-- TODO -->\n\nUse TypeScript.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'commented-out-content');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('excessive-formatting', () => {
        (0, vitest_1.it)('flags decorative separators', () => {
            const content = '# Rules\n\n==========\n\nUse TypeScript.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'excessive-formatting');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('flags fully bold lines', () => {
            const content = '# Rules\n\n**This entire line is bold and should not be because it wastes tokens unnecessarily**\n\nUse TypeScript.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'excessive-formatting');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag normal text', () => {
            const content = '# Rules\n\nUse TypeScript with **strict** mode enabled.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'excessive-formatting');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
});
//# sourceMappingURL=rules-efficiency.test.js.map