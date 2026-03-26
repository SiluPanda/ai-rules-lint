import { describe, it, expect } from 'vitest';
import { lintContent } from '../linter';

const BASE_RULES = {
  'missing-sections': 'off' as const,
  'no-examples': 'off' as const,
  'no-headers': 'off' as const,
  'min-length': 'off' as const,
};

describe('reference rules', () => {
  describe('nonexistent-command', () => {
    it('flags npm run references to scripts not in package.json', () => {
      const content = '# Workflow\n\nRun `npm run foobar` to start.';
      const report = lintContent({
        content,
        rules: { ...BASE_RULES, 'nonexistent-command': 'warning' },
        projectRoot: __dirname,
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'nonexistent-command');
      expect(diags.length).toBe(1);
      expect(diags[0].message).toContain('foobar');
    });

    it('does not flag npm run references inside code blocks', () => {
      const content = [
        '# Workflow',
        '',
        '```bash',
        'npm run build',
        'npm run foobar',
        '```',
      ].join('\n');
      const report = lintContent({
        content,
        rules: { ...BASE_RULES, 'nonexistent-command': 'warning' },
        projectRoot: __dirname,
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'nonexistent-command');
      expect(diags.length).toBe(0);
    });

    it('resumes flagging after code block ends', () => {
      const content = [
        '# Workflow',
        '',
        '```bash',
        'npm run foobar',
        '```',
        '',
        'Then run npm run doesnotexist to finish.',
      ].join('\n');
      const report = lintContent({
        content,
        rules: { ...BASE_RULES, 'nonexistent-command': 'warning' },
        projectRoot: __dirname,
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'nonexistent-command');
      expect(diags.length).toBe(1);
      expect(diags[0].message).toContain('doesnotexist');
    });
  });
});
