import { describe, it, expect } from 'vitest';
import { lintContent } from '../linter';

describe('structure rules', () => {
  describe('missing-sections', () => {
    it('flags missing expected sections', () => {
      const content = '# My Project\n\nSome content only.';
      const report = lintContent({ content, rules: { 'no-examples': 'off' } });
      const diags = report.diagnostics.filter(d => d.ruleId === 'missing-sections');
      expect(diags.length).toBeGreaterThan(0);
    });

    it('does not flag when expected sections are present', () => {
      const content = [
        '# Project Overview',
        'About the project.',
        '',
        '## Coding Conventions',
        'Use TypeScript.',
        '',
        '## File Structure',
        'src/ contains source.',
        '',
        '## Testing',
        'Run npm test.',
      ].join('\n');
      const report = lintContent({ content, rules: { 'no-examples': 'off' } });
      const diags = report.diagnostics.filter(d => d.ruleId === 'missing-sections');
      expect(diags.length).toBe(0);
    });

    it('matches sections by keyword variations', () => {
      const content = [
        '## About This App',
        'It does things.',
        '',
        '## Code Style Guidelines',
        'Use camelCase.',
        '',
        '## Directory Layout',
        'Standard layout.',
        '',
        '## Test Verification',
        'Run tests.',
      ].join('\n');
      const report = lintContent({ content, rules: { 'no-examples': 'off' } });
      const diags = report.diagnostics.filter(d => d.ruleId === 'missing-sections');
      expect(diags.length).toBe(0);
    });
  });

  describe('no-headers', () => {
    it('flags files without headers', () => {
      const content = 'Just plain text without any markdown headers at all. Use TypeScript. Always test.';
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'no-headers');
      expect(diags.length).toBe(1);
    });

    it('does not flag files with headers', () => {
      const content = '# My Rules\n\nSome content.';
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'no-headers');
      expect(diags.length).toBe(0);
    });
  });

  describe('deep-nesting', () => {
    it('flags headers deeper than maxDepth', () => {
      const content = '##### Very Deep Header\n\nContent.';
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'deep-nesting');
      expect(diags.length).toBe(1);
    });

    it('does not flag headers within maxDepth', () => {
      const content = '### Level 3\n\nContent.';
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'deep-nesting');
      expect(diags.length).toBe(0);
    });
  });

  describe('empty-section', () => {
    it('flags sections with no content', () => {
      const content = '## Testing\n\n## Deployment\n\nSome content.';
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'empty-section');
      expect(diags.length).toBe(1);
      expect(diags[0].fix).toBeDefined();
    });

    it('does not flag sections with content', () => {
      const content = '## Testing\n\nRun npm test.\n\n## Deployment\n\nDeploy with Docker.';
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'empty-section');
      expect(diags.length).toBe(0);
    });
  });

  describe('wall-of-text', () => {
    it('flags large blocks without structural breaks', () => {
      const longParagraph = 'This is a sentence. '.repeat(200); // ~4000 chars
      const content = '## Section\n\n' + longParagraph;
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'wall-of-text');
      expect(diags.length).toBe(1);
    });

    it('does not flag well-structured content', () => {
      const content = '## Section\n\n- Point 1.\n- Point 2.\n- Point 3.\n\nAnother paragraph.\n\n- More points.';
      const report = lintContent({
        content,
        rules: { 'missing-sections': 'off', 'no-examples': 'off' },
      });
      const diags = report.diagnostics.filter(d => d.ruleId === 'wall-of-text');
      expect(diags.length).toBe(0);
    });
  });
});
