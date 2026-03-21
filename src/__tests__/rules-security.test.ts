import { describe, it, expect } from 'vitest';
import { lintContent } from '../linter';

const BASE_RULES = {
  'missing-sections': 'off' as const,
  'no-examples': 'off' as const,
  'no-headers': 'off' as const,
  'min-length': 'off' as const,
};

describe('security rules', () => {
  describe('secrets-in-file', () => {
    it('detects OpenAI API keys', () => {
      const content = '# Config\n\nUse api_key: sk-abcdef1234567890abcdef1234567890.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
      expect(diags.length).toBe(1);
      expect(diags[0].severity).toBe('error');
    });

    it('detects GitHub PATs', () => {
      const content = '# Config\n\nToken: ghp_abcdefghijklmnopqrstuvwxyz1234567890.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
      expect(diags.length).toBe(1);
    });

    it('detects AWS access keys', () => {
      const content = '# Config\n\nAKIAABCDEFGHIJKLMNOP is the key.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
      expect(diags.length).toBe(1);
    });

    it('detects API key assignments', () => {
      const content = '# Config\n\napi_key = "sk_test_FAKE_KEY_00000000000000"';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
      expect(diags.length).toBe(1);
    });

    it('detects Slack tokens', () => {
      const content = '# Config\n\nSlack token: xoxb-1234-5678-abcdefghijklmnop.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
      expect(diags.length).toBe(1);
    });

    it('does not flag normal text', () => {
      const content = '# Rules\n\nUse TypeScript. Set up environment variables properly.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
      expect(diags.length).toBe(0);
    });

    it('does not flag short strings', () => {
      const content = '# Rules\n\nThe API returns JSON.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'secrets-in-file');
      expect(diags.length).toBe(0);
    });
  });
});
