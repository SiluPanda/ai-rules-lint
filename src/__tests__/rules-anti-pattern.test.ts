import { describe, it, expect } from 'vitest';
import { lintContent } from '../linter';

const BASE_RULES = {
  'missing-sections': 'off' as const,
  'no-examples': 'off' as const,
  'no-headers': 'off' as const,
  'min-length': 'off' as const,
};

describe('anti-pattern rules', () => {
  describe('personality-instruction', () => {
    it('flags "be friendly"', () => {
      const content = '# Rules\n\nBe friendly when responding.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
      expect(diags.length).toBe(1);
    });

    it('flags "be polite"', () => {
      const content = '# Rules\n\nBe polite in all responses.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
      expect(diags.length).toBe(1);
    });

    it('flags "show empathy"', () => {
      const content = '# Rules\n\nShow empathy to users.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
      expect(diags.length).toBe(1);
    });

    it('does not flag coding instructions', () => {
      const content = '# Rules\n\nUse TypeScript strict mode.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
      expect(diags.length).toBe(0);
    });

    it('does not flag inside code blocks', () => {
      const content = '# Rules\n\n```\nBe friendly\n```';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'personality-instruction');
      expect(diags.length).toBe(0);
    });
  });

  describe('negative-only', () => {
    it('flags sections with mostly negative instructions', () => {
      const content = [
        '## Variable Rules',
        '',
        "- Don't use var.",
        "- Don't use global variables.",
        "- Avoid mutable state.",
        '- Never reassign parameters.',
      ].join('\n');
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'negative-only');
      expect(diags.length).toBe(1);
    });

    it('does not flag sections with balanced instructions', () => {
      const content = [
        '## Variable Rules',
        '',
        '- Use const by default.',
        '- Use let when reassignment is needed.',
        "- Don't use var.",
        '- Prefer descriptive names.',
      ].join('\n');
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'negative-only');
      expect(diags.length).toBe(0);
    });
  });

  describe('too-many-rules', () => {
    it('flags files with excessive instructions', () => {
      const instructions = Array.from({ length: 110 }, (_, i) => `- Use pattern ${i}.`);
      const content = '# Rules\n\n' + instructions.join('\n');
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'too-many-rules');
      expect(diags.length).toBe(1);
    });

    it('does not flag files with few instructions', () => {
      const content = '# Rules\n\n- Use TypeScript.\n- Always test.\n- Handle errors.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'too-many-rules');
      expect(diags.length).toBe(0);
    });
  });

  describe('no-examples', () => {
    it('flags files with coding instructions but no code blocks', () => {
      const content = '# Rules\n\n- Use named exports for all modules.\n- Format code with prettier.';
      const report = lintContent({
        content,
        rules: { ...BASE_RULES, 'no-examples': 'info' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'no-examples');
      expect(diags.length).toBe(1);
    });

    it('does not flag files with code examples', () => {
      const content = '# Rules\n\n- Use named exports.\n\n```typescript\nexport const foo = 42;\n```';
      const report = lintContent({
        content,
        rules: { ...BASE_RULES, 'no-examples': 'info' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'no-examples');
      expect(diags.length).toBe(0);
    });

    it('does not flag files without coding instructions', () => {
      const content = '# Project\n\nThis is a web application.\nDeploy to AWS.';
      const report = lintContent({
        content,
        rules: { ...BASE_RULES, 'no-examples': 'info' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'no-examples');
      expect(diags.length).toBe(0);
    });
  });

  describe('todo-placeholder', () => {
    it('flags TODO markers', () => {
      const content = '# Rules\n\nTODO: add testing conventions';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
      expect(diags.length).toBe(1);
    });

    it('flags FIXME markers', () => {
      const content = '# Rules\n\nFIXME: update this section';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
      expect(diags.length).toBe(1);
    });

    it('flags XXX markers', () => {
      const content = '# Rules\n\nXXX: this needs work';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
      expect(diags.length).toBe(1);
    });

    it('does not flag normal text', () => {
      const content = '# Rules\n\nUse TypeScript for all source files.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
      expect(diags.length).toBe(0);
    });

    it('does not flag inside code blocks', () => {
      const content = '# Rules\n\n```\n// TODO: implement this\n```';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'todo-placeholder');
      expect(diags.length).toBe(0);
    });
  });

  describe('dated-content', () => {
    it('flags "as of" date references', () => {
      const content = '# Rules\n\nAs of January 2024, we use Node 18.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'dated-content');
      expect(diags.length).toBe(1);
    });

    it('flags "currently migrating"', () => {
      const content = '# Rules\n\nWe are currently migrating to React 19.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'dated-content');
      expect(diags.length).toBe(1);
    });

    it('flags "for now"', () => {
      const content = '# Rules\n\nFor now, we use Express.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'dated-content');
      expect(diags.length).toBe(1);
    });

    it('does not flag timeless statements', () => {
      const content = '# Rules\n\nUse Node.js 20 or later.';
      const report = lintContent({ content, rules: BASE_RULES });
      const diags = report.diagnostics.filter(d => d.ruleId === 'dated-content');
      expect(diags.length).toBe(0);
    });
  });
});
