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
(0, vitest_1.describe)('security rules', () => {
    (0, vitest_1.describe)('secrets-in-file', () => {
        (0, vitest_1.it)('detects OpenAI API keys', () => {
            const content = '# Config\n\nUse api_key: sk-abcdef1234567890abcdef1234567890.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
            (0, vitest_1.expect)(diags.length).toBe(1);
            (0, vitest_1.expect)(diags[0].severity).toBe('error');
        });
        (0, vitest_1.it)('detects GitHub PATs', () => {
            const content = '# Config\n\nToken: ghp_abcdefghijklmnopqrstuvwxyz1234567890.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('detects AWS access keys', () => {
            const content = '# Config\n\nAKIAABCDEFGHIJKLMNOP is the key.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('detects API key assignments', () => {
            const content = '# Config\n\napi_key = "sk_test_FAKE_KEY_00000000000000"';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('detects Slack tokens', () => {
            const content = '# Config\n\nSlack token: xoxb-1234-5678-abcdefghijklmnop.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
            (0, vitest_1.expect)(diags.length).toBe(1);
        });
        (0, vitest_1.it)('does not flag normal text', () => {
            const content = '# Rules\n\nUse TypeScript. Set up environment variables properly.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
        (0, vitest_1.it)('does not flag short strings', () => {
            const content = '# Rules\n\nThe API returns JSON.';
            const report = (0, linter_1.lintContent)({ content, rules: BASE_RULES });
            const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
            (0, vitest_1.expect)(diags.length).toBe(0);
        });
    });
});
//# sourceMappingURL=rules-security.test.js.map