import { describe, it, expect } from 'vitest';
import { createRegistry, builtinRules, builtinRuleIds } from '../registry';

describe('registry', () => {
  it('contains all built-in rules', () => {
    expect(builtinRules.length).toBeGreaterThan(10);
    expect(builtinRuleIds.length).toBe(builtinRules.length);
  });

  it('all built-in rules have unique IDs', () => {
    const ids = new Set(builtinRuleIds);
    expect(ids.size).toBe(builtinRuleIds.length);
  });

  it('recommended preset enables all rules', () => {
    const registry = createRegistry('recommended');
    const enabled = registry.getEnabledRules();
    expect(enabled.length).toBe(builtinRules.length);
  });

  it('off preset disables all rules', () => {
    const registry = createRegistry('off');
    const enabled = registry.getEnabledRules();
    expect(enabled.length).toBe(0);
  });

  it('minimal preset enables only critical rules', () => {
    const registry = createRegistry('minimal');
    const enabled = registry.getEnabledRules();
    expect(enabled.length).toBeLessThan(builtinRules.length);
    expect(enabled.length).toBeGreaterThan(0);
    const ids = enabled.map(e => e.rule.id);
    expect(ids).toContain('contradictory-rules');
    expect(ids).toContain('unsafe-instruction');
    expect(ids).toContain('secrets-in-file');
  });

  it('strict preset increases severity', () => {
    const registry = createRegistry('strict');
    const enabled = registry.getEnabledRules();
    const maxLength = enabled.find(e => e.rule.id === 'max-length');
    expect(maxLength).toBeDefined();
    expect(maxLength!.severity).toBe('error');
  });

  it('per-rule severity overrides work', () => {
    const registry = createRegistry('recommended', {
      'max-length': 'off',
      'min-length': { severity: 'error' },
    });
    const states = registry.getRuleStates();
    expect(states['max-length']).toBe('off');
    expect(states['min-length']).toBe('error');
  });

  it('per-rule options are passed through', () => {
    const registry = createRegistry('recommended', {
      'max-length': { severity: 'error', options: { maxTokens: 3000 } },
    });
    const enabled = registry.getEnabledRules();
    const maxLength = enabled.find(e => e.rule.id === 'max-length');
    expect(maxLength).toBeDefined();
    expect(maxLength!.options).toEqual({ maxTokens: 3000 });
  });

  it('custom rules are included', () => {
    const customRule = {
      id: 'custom-test',
      category: 'structure' as const,
      defaultSeverity: 'warning' as const,
      description: 'Test custom rule.',
      check: () => {},
    };
    const registry = createRegistry('recommended', undefined, [customRule]);
    const enabled = registry.getEnabledRules();
    const found = enabled.find(e => e.rule.id === 'custom-test');
    expect(found).toBeDefined();
  });

  it('getRuleStates returns all rule states', () => {
    const registry = createRegistry('recommended');
    const states = registry.getRuleStates();
    for (const id of builtinRuleIds) {
      expect(states[id]).toBeDefined();
      expect(states[id]).not.toBe('off');
    }
  });

  it('disabled rules are excluded from getEnabledRules', () => {
    const registry = createRegistry('recommended', { 'max-length': 'off' });
    const enabled = registry.getEnabledRules();
    const found = enabled.find(e => e.rule.id === 'max-length');
    expect(found).toBeUndefined();
  });
});
