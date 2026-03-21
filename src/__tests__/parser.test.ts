import { describe, it, expect } from 'vitest';
import { parse, detectFormat } from '../parser';

describe('detectFormat', () => {
  it('detects CLAUDE.md format', () => {
    expect(detectFormat('CLAUDE.md')).toBe('claude-md');
    expect(detectFormat('/project/CLAUDE.md')).toBe('claude-md');
    expect(detectFormat('.claude/CLAUDE.md')).toBe('claude-md');
  });

  it('detects .cursorrules format', () => {
    expect(detectFormat('.cursorrules')).toBe('cursorrules');
    expect(detectFormat('/project/.cursorrules')).toBe('cursorrules');
    expect(detectFormat('.cursor/rules/foo.mdc')).toBe('cursorrules');
  });

  it('detects AGENTS.md format', () => {
    expect(detectFormat('AGENTS.md')).toBe('agents-md');
    expect(detectFormat('.github/AGENTS.md')).toBe('agents-md');
  });

  it('detects GEMINI.md format', () => {
    expect(detectFormat('GEMINI.md')).toBe('gemini-md');
  });

  it('detects copilot-instructions.md format', () => {
    expect(detectFormat('copilot-instructions.md')).toBe('copilot-instructions');
    expect(detectFormat('.github/copilot-instructions.md')).toBe('copilot-instructions');
  });

  it('detects .windsurfrules format', () => {
    expect(detectFormat('.windsurfrules')).toBe('windsurfrules');
  });

  it('detects .clinerules format', () => {
    expect(detectFormat('.clinerules')).toBe('clinerules');
  });

  it('defaults to custom for unknown files', () => {
    expect(detectFormat('README.md')).toBe('custom');
    expect(detectFormat('rules.md')).toBe('custom');
    expect(detectFormat('config.json')).toBe('custom');
  });
});

describe('parse', () => {
  it('parses basic metadata', () => {
    const content = '# My Rules\n\nUse TypeScript.\nAlways test.';
    const doc = parse(content, 'custom');
    expect(doc.source).toBe(content);
    expect(doc.format).toBe('custom');
    expect(doc.characterCount).toBe(content.length);
    expect(doc.estimatedTokens).toBe(Math.ceil(content.length / 4));
    expect(doc.lineCount).toBe(4);
    expect(doc.wordCount).toBeGreaterThan(0);
  });

  it('parses ATX-style headers into sections', () => {
    const content = '# Title\n\nSome intro.\n\n## Section A\n\nContent A.\n\n## Section B\n\nContent B.';
    const doc = parse(content, 'custom');
    expect(doc.sections.length).toBeGreaterThanOrEqual(2);
    const sectionA = doc.sections.find(s => s.title === 'Section A');
    expect(sectionA).toBeDefined();
    expect(sectionA!.level).toBe(2);
    const sectionB = doc.sections.find(s => s.title === 'Section B');
    expect(sectionB).toBeDefined();
  });

  it('parses setext-style headers', () => {
    const content = 'Title\n=====\n\nContent.\n\nSubtitle\n--------\n\nMore content.';
    const doc = parse(content, 'custom');
    const titleSection = doc.sections.find(s => s.title === 'Title');
    expect(titleSection).toBeDefined();
    expect(titleSection!.level).toBe(1);
    const subtitleSection = doc.sections.find(s => s.title === 'Subtitle');
    expect(subtitleSection).toBeDefined();
    expect(subtitleSection!.level).toBe(2);
  });

  it('handles files with no headers', () => {
    const content = 'Just some plain text without any headers.';
    const doc = parse(content, 'custom');
    expect(doc.sections.length).toBe(1);
    expect(doc.sections[0].title).toBeNull();
    expect(doc.sections[0].level).toBe(0);
  });

  it('extracts imperative instructions', () => {
    const content = '# Rules\n\n- Use TypeScript for all code.\n- Never use var.\n- Always test your code.';
    const doc = parse(content, 'custom');
    expect(doc.instructions.length).toBeGreaterThanOrEqual(3);
    const useTs = doc.instructions.find(i => i.text.includes('Use TypeScript'));
    expect(useTs).toBeDefined();
    expect(useTs!.isNegative).toBe(false);
    const neverVar = doc.instructions.find(i => i.text.includes('Never use var'));
    expect(neverVar).toBeDefined();
    expect(neverVar!.isNegative).toBe(true);
  });

  it('extracts instructions from numbered lists', () => {
    const content = '# Steps\n\n1. Run npm install.\n2. Check the output.\n3. Verify results.';
    const doc = parse(content, 'custom');
    expect(doc.instructions.length).toBeGreaterThanOrEqual(2);
  });

  it('skips code blocks when extracting instructions', () => {
    const content = '# Rules\n\n```bash\nnpm run test\n```\n\nAlways run tests.';
    const doc = parse(content, 'custom');
    const npmInstruction = doc.instructions.find(i => i.text === 'npm run test');
    expect(npmInstruction).toBeUndefined();
    const alwaysTest = doc.instructions.find(i => i.text.includes('Always run tests'));
    expect(alwaysTest).toBeDefined();
  });

  it('identifies negative instructions', () => {
    const content = '# Rules\n\n- Do not use eval.\n- Avoid global variables.\n- Never commit directly.';
    const doc = parse(content, 'custom');
    for (const inst of doc.instructions) {
      expect(inst.isNegative).toBe(true);
    }
  });

  it('extracts file references from inline code', () => {
    const content = '# Files\n\nCheck `src/index.ts` and `config/database.yml`.';
    const doc = parse(content, 'custom');
    const srcRef = doc.references.find(r => r.value === 'src/index.ts');
    expect(srcRef).toBeDefined();
    expect(srcRef!.type).toBe('file');
    const configRef = doc.references.find(r => r.value === 'config/database.yml');
    expect(configRef).toBeDefined();
  });

  it('extracts directory references', () => {
    const content = '# Dirs\n\nSee `src/components/` for components.';
    const doc = parse(content, 'custom');
    const dirRef = doc.references.find(r => r.value === 'src/components/');
    expect(dirRef).toBeDefined();
    expect(dirRef!.type).toBe('directory');
  });

  it('does not extract URLs as file references', () => {
    const content = '# Links\n\nSee https://example.com/path/to/file.ts for details.';
    const doc = parse(content, 'custom');
    const urlRef = doc.references.find(r => r.value.includes('example.com'));
    expect(urlRef).toBeUndefined();
  });

  it('categorizes sections by keywords', () => {
    const content = '## Project Overview\n\nAbout the project.\n\n## Coding Style\n\nUse TypeScript.\n\n## Testing\n\nRun tests.';
    const doc = parse(content, 'custom');
    expect(doc.detectedCategories).toContain('Project Overview');
    expect(doc.detectedCategories).toContain('Coding Conventions');
    expect(doc.detectedCategories).toContain('Testing');
  });

  it('counts words correctly', () => {
    const content = 'Hello world. This is a test.';
    const doc = parse(content, 'custom');
    expect(doc.wordCount).toBe(6);
  });

  it('estimates tokens as chars/4', () => {
    const content = 'a'.repeat(400);
    const doc = parse(content, 'custom');
    expect(doc.estimatedTokens).toBe(100);
  });

  it('handles empty content', () => {
    const doc = parse('', 'custom');
    expect(doc.lineCount).toBe(1);
    expect(doc.sections.length).toBe(1);
    expect(doc.instructions.length).toBe(0);
  });

  it('detects modal instructions', () => {
    const content = '# Rules\n\nYou must use TypeScript.\nYou should write tests.';
    const doc = parse(content, 'custom');
    expect(doc.instructions.length).toBeGreaterThanOrEqual(2);
  });

  it('skips example/placeholder paths', () => {
    const content = 'See `example/something.ts` and `path/to/file.ts`.';
    const doc = parse(content, 'custom');
    const exampleRef = doc.references.find(r => r.value.startsWith('example/'));
    expect(exampleRef).toBeUndefined();
  });
});
