import { describe, it, expect } from 'vitest';
import { lintContent } from '../linter';

const BASE_RULES = {
  'missing-sections': 'off' as const,
  'no-examples': 'off' as const,
  'no-headers': 'off' as const,
  'min-length': 'off' as const,
};

describe('efficiency rules', () => {
  describe('redundant-whitespace', () => {
    it('flags trailing whitespace', () => {
      const content = '# Rules\n\nUse TypeScript.   \nAlways test.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'redundant-whitespace');
      expect(diags.length).toBeGreaterThanOrEqual(1);
      expect(diags[0].fix).toBeDefined();
    });

    it('flags excessive consecutive blank lines', () => {
      const content = '# Rules\n\n\n\n\nUse TypeScript.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'redundant-whitespace');
      expect(diags.length).toBeGreaterThanOrEqual(1);
    });

    it('does not flag normal spacing', () => {
      const content = '# Rules\n\nUse TypeScript.\n\nAlways test.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'redundant-whitespace');
      expect(diags.length).toBe(0);
    });
  });

  describe('commented-out-content', () => {
    it('flags substantial HTML comments', () => {
      const content = '# Rules\n\n<!-- This is an old instruction that should be removed from the file entirely -->\n\nUse TypeScript.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'commented-out-content');
      expect(diags.length).toBe(1);
    });

    it('does not flag lint directives', () => {
      const content = '# Rules\n\n<!-- ai-rules-lint-disable vague-instruction -->\n\nUse TypeScript.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'commented-out-content');
      expect(diags.length).toBe(0);
    });

    it('does not flag short comments', () => {
      const content = '# Rules\n\n<!-- TODO -->\n\nUse TypeScript.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'commented-out-content');
      expect(diags.length).toBe(0);
    });
  });

  describe('excessive-formatting', () => {
    it('flags decorative separators', () => {
      const content = '# Rules\n\n==========\n\nUse TypeScript.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'excessive-formatting');
      expect(diags.length).toBe(1);
    });

    it('flags fully bold lines', () => {
      const content = '# Rules\n\n**This entire line is bold and should not be because it wastes tokens unnecessarily**\n\nUse TypeScript.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'excessive-formatting');
      expect(diags.length).toBe(1);
    });

    it('does not flag normal text', () => {
      const content = '# Rules\n\nUse TypeScript with **strict** mode enabled.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'excessive-formatting');
      expect(diags.length).toBe(0);
    });
  });
});
