"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const registry_1 = require("../registry");
(0, vitest_1.describe)('registry', () => {
    (0, vitest_1.it)('contains all built-in rules', () => {
        (0, vitest_1.expect)(registry_1.builtinRules.length).toBeGreaterThan(10);
        (0, vitest_1.expect)(registry_1.builtinRuleIds.length).toBe(registry_1.builtinRules.length);
    });
    (0, vitest_1.it)('all built-in rules have unique IDs', () => {
        const ids = new Set(registry_1.builtinRuleIds);
        (0, vitest_1.expect)(ids.size).toBe(registry_1.builtinRuleIds.length);
    });
    (0, vitest_1.it)('recommended preset enables all rules', () => {
        const registry = (0, registry_1.createRegistry)('recommended');
        const enabled = registry.getEnabledRules();
        (0, vitest_1.expect)(enabled.length).toBe(registry_1.builtinRules.length);
    });
    (0, vitest_1.it)('off preset disables all rules', () => {
        const registry = (0, registry_1.createRegistry)('off');
        const enabled = registry.getEnabledRules();
        (0, vitest_1.expect)(enabled.length).toBe(0);
    });
    (0, vitest_1.it)('minimal preset enables only critical rules', () => {
        const registry = (0, registry_1.createRegistry)('minimal');
        const enabled = registry.getEnabledRules();
        (0, vitest_1.expect)(enabled.length).toBeLessThan(registry_1.builtinRules.length);
        (0, vitest_1.expect)(enabled.length).toBeGreaterThan(0);
        const ids = enabled.map(e => e.rule.id);
        (0, vitest_1.expect)(ids).toContain('contradictory-rules');
        (0, vitest_1.expect)(ids).toContain('unsafe-instruction');
        (0, vitest_1.expect)(ids).toContain('secrets-in-file');
    });
    (0, vitest_1.it)('strict preset increases severity', () => {
        const registry = (0, registry_1.createRegistry)('strict');
        const enabled = registry.getEnabledRules();
        const maxLength = enabled.find(e => e.rule.id === 'max-length');
        (0, vitest_1.expect)(maxLength).toBeDefined();
        (0, vitest_1.expect)(maxLength.severity).toBe('error');
    });
    (0, vitest_1.it)('per-rule severity overrides work', () => {
        const registry = (0, registry_1.createRegistry)('recommended', {
            'max-length': 'off',
            'min-length': { severity: 'error' },
        });
        const states = registry.getRuleStates();
        (0, vitest_1.expect)(states['max-length']).toBe('off');
        (0, vitest_1.expect)(states['min-length']).toBe('error');
    });
    (0, vitest_1.it)('per-rule options are passed through', () => {
        const registry = (0, registry_1.createRegistry)('recommended', {
            'max-length': { severity: 'error', options: { maxTokens: 3000 } },
        });
        const enabled = registry.getEnabledRules();
        const maxLength = enabled.find(e => e.rule.id === 'max-length');
        (0, vitest_1.expect)(maxLength).toBeDefined();
        (0, vitest_1.expect)(maxLength.options).toEqual({ maxTokens: 3000 });
    });
    (0, vitest_1.it)('custom rules are included', () => {
        const customRule = {
            id: 'custom-test',
            category: 'structure',
            defaultSeverity: 'warning',
            description: 'Test custom rule.',
            check: () => { },
        };
        const registry = (0, registry_1.createRegistry)('recommended', undefined, [customRule]);
        const enabled = registry.getEnabledRules();
        const found = enabled.find(e => e.rule.id === 'custom-test');
        (0, vitest_1.expect)(found).toBeDefined();
    });
    (0, vitest_1.it)('getRuleStates returns all rule states', () => {
        const registry = (0, registry_1.createRegistry)('recommended');
        const states = registry.getRuleStates();
        for (const id of registry_1.builtinRuleIds) {
            (0, vitest_1.expect)(states[id]).toBeDefined();
            (0, vitest_1.expect)(states[id]).not.toBe('off');
        }
    });
    (0, vitest_1.it)('disabled rules are excluded from getEnabledRules', () => {
        const registry = (0, registry_1.createRegistry)('recommended', { 'max-length': 'off' });
        const enabled = registry.getEnabledRules();
        const found = enabled.find(e => e.rule.id === 'max-length');
        (0, vitest_1.expect)(found).toBeUndefined();
    });
});
//# sourceMappingURL=registry.test.js.map