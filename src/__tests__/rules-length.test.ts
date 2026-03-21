import { describe, it, expect } from 'vitest';
import { lintContent } from '../linter';

describe('length rules', () => {
  describe('max-length', () => {
    it('flags files exceeding max token count', () => {
      const content = 'a'.repeat(25000); // ~6250 tokens > 5000 default
      const report = lintContent({
        content,
        preset: 'recommended',
        rules: { 'min-length': 'off', 'no-headers': 'off', 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const maxLengthDiags = report.diagnostics.filter(d => d.ruleId === 'max-length');
      expect(maxLengthDiags.length).toBe(1);
      expect(maxLengthDiags[0].severity).toBe('warning');
    });

    it('does not flag files under max token count', () => {
      const content = '# Rules\n\n' + 'Some instruction. '.repeat(50);
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const maxLengthDiags = report.diagnostics.filter(d => d.ruleId === 'max-length');
      expect(maxLengthDiags.length).toBe(0);
    });

    it('respects custom maxTokens option', () => {
      const content = 'a'.repeat(500); // ~125 tokens
      const report = lintContent({
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
      expect(diags.length).toBe(1);
      expect(diags[0].severity).toBe('error');
    });
  });

  describe('min-length', () => {
    it('flags files below min token count', () => {
      const content = 'Short.';
      const report = lintContent({
        content,
        rules: { 'no-headers': 'off', 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'min-length');
      expect(diags.length).toBe(1);
    });

    it('does not flag files above min token count', () => {
      const content = '# Rules\n\n' + 'This is a meaningful instruction for the AI tool. '.repeat(20);
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'min-length');
      expect(diags.length).toBe(0);
    });
  });

  describe('section-length', () => {
    it('flags sections exceeding max token count', () => {
      const content = '## Long Section\n\n' + 'a'.repeat(8000);
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off', 'wall-of-text': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'section-length');
      expect(diags.length).toBe(1);
    });

    it('does not flag short sections', () => {
      const content = '## Short Section\n\nJust a few words.';
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'section-length');
      expect(diags.length).toBe(0);
    });
  });
});
