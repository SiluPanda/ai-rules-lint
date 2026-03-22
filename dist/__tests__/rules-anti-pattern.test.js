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
(0, vitest_1.describe)('anti-pattern rules', () => {
    (0, vitest_1.describe)('personality-instruction', () => {
        (0, vitest_1.it)('flags "be friendly"', () => {
            const content = '# Rules\n\nBe friendly when responding.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('flags "be polite"', () => {
            const content = '# Rules\n\nBe polite in all responses.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('flags "show empathy"', () => {
            const content = '# Rules\n\nShow empathy to users.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag coding instructions', () => {
            const content = '# Rules\n\nUse TypeScript strict mode.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
        (0, vitest_1.it)('does not flag inside code blocks', () => {
            const content = '# Rules\n\n```\nBe friendly\n```';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('negative-only', () => {
        (0, vitest_1.it)('flags sections with mostly negative instructions', () => {
            const content = [
                '## Variable Rules',
                '',
                "- Don't use var.",
                "- Don't use global variables.",
                "- Avoid mutable state.",
                '- Never reassign parameters.',
            ].join('\n');
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'negative-only');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag sections with balanced instructions', () => {
            const content = [
                '## Variable Rules',
                '',
                '- Use const by default.',
                '- Use let when reassignment is needed.',
                "- Don't use var.",
                '- Prefer descriptive names.',
            ].join('\n');
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'negative-only');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('too-many-rules', () => {
        (0, vitest_1.it)('flags files with excessive instructions', () => {
            const instructions = Array.from({ length: 110 }, (_, i) => `- Use pattern ${i}.`);
            const content = '# Rules\n\n' + instructions.join('\n');
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'too-many-rules');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag files with few instructions', () => {
            const content = '# Rules\n\n- Use TypeScript.\n- Always test.\n- Handle errors.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'too-many-rules');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('no-examples', () => {
        (0, vitest_1.it)('flags files with coding instructions but no code blocks', () => {
            const content = '# Rules\n\n- Use named exports for all modules.\n- Format code with prettier.';
            const report = (0, linter_1.lintContent)({
                content,
                rules: { ...BASE_RULES, 'no-examples': 'info' },
            });
            const diags = report.diagnostics.filter(d => d.ruleId === 'no-examples');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag files with code examples', () => {
            const content = '# Rules\n\n- Use named exports.\n\n```typescript\nexport const foo = 42;\n```';
            const report = (0, linter_1.lintContent)({
                content,
                rules: { ...BASE_RULES, 'no-examples': 'info' },
            });
            const diags = report.diagnostics.filter(d => d.ruleId === 'no-examples');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
        (0, vitest_1.it)('does not flag files without coding instructions', () => {
            const content = '# Project\n\nThis is a web application.\nDeploy to AWS.';
            const report = (0, linter_1.lintContent)({
                content,
                rules: { ...BASE_RULES, 'no-examples': 'info' },
            });
            const diags = report.diagnostics.filter(d => d.ruleId === 'no-examples');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('todo-placeholder', () => {
        (0, vitest_1.it)('flags TODO markers', () => {
            const content = '# Rules\n\nTODO: add testing conventions';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('flags FIXME markers', () => {
            const content = '# Rules\n\nFIXME: update this section';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('flags XXX markers', () => {
            const content = '# Rules\n\nXXX: this needs work';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag normal text', () => {
            const content = '# Rules\n\nUse TypeScript for all source files.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
        (0, vitest_1.it)('does not flag inside code blocks', () => {
            const content = '# Rules\n\n```\n// TODO: implement this\n```';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
    (0, vitest_1.describe)('dated-content', () => {
        (0, vitest_1.it)('flags "as of" date references', () => {
            const content = '# Rules\n\nAs of January 2024, we use Node 18.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'dated-content');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('flags "currently migrating"', () => {
            const content = '# Rules\n\nWe are currently migrating to React 19.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'dated-content');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('flags "for now"', () => {
            const content = '# Rules\n\nFor now, we use Express.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'dated-content');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag timeless statements', () => {
            const content = '# Rules\n\nUse Node.js 20 or later.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'dated-content');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
});
//# sourceMappingURL=rules-anti-pattern.test.js.map