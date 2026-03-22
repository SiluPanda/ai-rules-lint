"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const parser_1 = require("../parser");
(0, vitest_1.describe)('detectFormat', () => {
    (0, vitest_1.it)('detects CLAUDE.md format', () => {
        (0, vitest_1.expect)((0, parser_1.detectFormat)('CLAUDE.md')).toBe('claude-md');
        (0, vitest_1.expect)((0, parser_1.detectFormat)('/project/CLAUDE.md')).toBe('claude-md');
        (0, vitest_1.expect)((0, parser_1.detectFormat)('.claude/CLAUDE.md')).toBe('claude-md');
    });
    (0, vitest_1.it)('detects .cursorrules format', () => {
        (0, vitest_1.expect)((0, parser_1.detectFormat)('.cursorrules')).toBe('cursorrules');
        (0, vitest_1.expect)((0, parser_1.detectFormat)('/project/.cursorrules')).toBe('cursorrules');
        (0, vitest_1.expect)((0, parser_1.detectFormat)('.cursor/rules/foo.mdc')).toBe('cursorrules');
    });
    (0, vitest_1.it)('detects AGENTS.md format', () => {
        (0, vitest_1.expect)((0, parser_1.detectFormat)('AGENTS.md')).toBe('agents-md');
        (0, vitest_1.expect)((0, parser_1.detectFormat)('.github/AGENTS.md')).toBe('agents-md');
    });
    (0, vitest_1.it)('detects GEMINI.md format', () => {
        (0, vitest_1.expect)((0, parser_1.detectFormat)('GEMINI.md')).toBe('gemini-md');
    });
    (0, vitest_1.it)('detects copilot-instructions.md format', () => {
        (0, vitest_1.expect)((0, parser_1.detectFormat)('copilot-instructions.md')).toBe('copilot-instructions');
        (0, vitest_1.expect)((0, parser_1.detectFormat)('.github/copilot-instructions.md')).toBe('copilot-instructions');
    });
    (0, vitest_1.it)('detects .windsurfrules format', () => {
        (0, vitest_1.expect)((0, parser_1.detectFormat)('.windsurfrules')).toBe('windsurfrules');
    });
    (0, vitest_1.it)('detects .clinerules format', () => {
        (0, vitest_1.expect)((0, parser_1.detectFormat)('.clinerules')).toBe('clinerules');
    });
    (0, vitest_1.it)('defaults to custom for unknown files', () => {
        (0, vitest_1.expect)((0, parser_1.detectFormat)('README.md')).toBe('custom');
        (0, vitest_1.expect)((0, parser_1.detectFormat)('rules.md')).toBe('custom');
        (0, vitest_1.expect)((0, parser_1.detectFormat)('config.json')).toBe('custom');
    });
});
(0, vitest_1.describe)('parse', () => {
    (0, vitest_1.it)('parses basic metadata', () => {
        const content = '# My Rules\n\nUse TypeScript.\nAlways test.';
        const doc = (0, parser_1.parse)(content, 'custom');
        (0, vitest_1.expect)(doc.source).toBe(content);
        (0, vitest_1.expect)(doc.format).toBe('custom');
        (0, vitest_1.expect)(doc.characterCount).toBe(content.length);
        (0, vitest_1.expect)(doc.estimatedTokens).toBe(Math.ceil(content.length / 4));
        (0, vitest_1.expect)(doc.lineCount).toBe(4);
        (0, vitest_1.expect)(doc.wordCount).toBeGreaterThan(0);
    });
    (0, vitest_1.it)('parses ATX-style headers into sections', () => {
        const content = '# Title\n\nSome intro.\n\n## Section A\n\nContent A.\n\n## Section B\n\nContent B.';
        const doc = (0, parser_1.parse)(content, 'custom');
        (0, vitest_1.expect)(doc.sections.length).toBeGreaterThanOrEqual(2);
        const sectionA = doc.sections.find(s => s.title === 'Section A');
        (0, vitest_1.expect)(sectionA).toBeDefined();
        (0, vitest_1.expect)(sectionA.level).toBe(2);
        const sectionB = doc.sections.find(s => s.title === 'Section B');
        (0, vitest_1.expect)(sectionB).toBeDefined();
    });
    (0, vitest_1.it)('parses setext-style headers', () => {
        const content = 'Title\n=====\n\nContent.\n\nSubtitle\n--------\n\nMore content.';
        const doc = (0, parser_1.parse)(content, 'custom');
        const titleSection = doc.sections.find(s => s.title === 'Title');
        (0, vitest_1.expect)(titleSection).toBeDefined();
        (0, vitest_1.expect)(titleSection.level).toBe(1);
        const subtitleSection = doc.sections.find(s => s.title === 'Subtitle');
        (0, vitest_1.expect)(subtitleSection).toBeDefined();
        (0, vitest_1.expect)(subtitleSection.level).toBe(2);
    });
    (0, vitest_1.it)('handles files with no headers', () => {
        const content = 'Just some plain text without any headers.';
        const doc = (0, parser_1.parse)(content, 'custom');
        (0, vitest_1.expect)(doc.sections.length).toBe(1);
        (0, vitest_1.expect)(doc.sections[0].title).toBeNull();
        (0, vitest_1.expect)(doc.sections[0].level).toBe(0);
    });
    (0, vitest_1.it)('extracts imperative instructions', () => {
        const content = '# Rules\n\n- Use TypeScript for all code.\n- Never use var.\n- Always test your code.';
        const doc = (0, parser_1.parse)(content, 'custom');
        (0, vitest_1.expect)(doc.instructions.length).toBeGreaterThanOrEqual(3);
        const useTs = doc.instructions.find(i => i.text.includes('Use TypeScript'));
        (0, vitest_1.expect)(useTs).toBeDefined();
        (0, vitest_1.expect)(useTs.isNegative).toBe(false);
        const neverVar = doc.instructions.find(i => i.text.includes('Never use var'));
        (0, vitest_1.expect)(neverVar).toBeDefined();
        (0, vitest_1.expect)(neverVar.isNegative).toBe(true);
    });
    (0, vitest_1.it)('extracts instructions from numbered lists', () => {
        const content = '# Steps\n\n1. Run npm install.\n2. Check the output.\n3. Verify results.';
        const doc = (0, parser_1.parse)(content, 'custom');
        (0, vitest_1.expect)(doc.instructions.length).toBeGreaterThanOrEqual(2);
    });
    (0, vitest_1.it)('skips code blocks when extracting instructions', () => {
        const content = '# Rules\n\n```bash\nnpm run test\n```\n\nAlways run tests.';
        const doc = (0, parser_1.parse)(content, 'custom');
        const npmInstruction = doc.instructions.find(i => i.text === 'npm run test');
        (0, vitest_1.expect)(npmInstruction).toBeUndefined();
        const alwaysTest = doc.instructions.find(i => i.text.includes('Always run tests'));
        (0, vitest_1.expect)(alwaysTest).toBeDefined();
    });
    (0, vitest_1.it)('identifies negative instructions', () => {
        const content = '# Rules\n\n- Do not use eval.\n- Avoid global variables.\n- Never commit directly.';
        const doc = (0, parser_1.parse)(content, 'custom');
        for (const inst of doc.instructions) {
            (0, vitest_1.expect)(inst.isNegative).toBe(true);
        }
    });
    (0, vitest_1.it)('extracts file references from inline code', () => {
        const content = '# Files\n\nCheck `src/index.ts` and `config/database.yml`.';
        const doc = (0, parser_1.parse)(content, 'custom');
        const srcRef = doc.references.find(r => r.value === 'src/index.ts');
        (0, vitest_1.expect)(srcRef).toBeDefined();
        (0, vitest_1.expect)(srcRef.type).toBe('file');
        const configRef = doc.references.find(r => r.value === 'config/database.yml');
        (0, vitest_1.expect)(configRef).toBeDefined();
    });
    (0, vitest_1.it)('extracts directory references', () => {
        const content = '# Dirs\n\nSee `src/components/` for components.';
        const doc = (0, parser_1.parse)(content, 'custom');
        const dirRef = doc.references.find(r => r.value === 'src/components/');
        (0, vitest_1.expect)(dirRef).toBeDefined();
        (0, vitest_1.expect)(dirRef.type).toBe('directory');
    });
    (0, vitest_1.it)('does not extract URLs as file references', () => {
        const content = '# Links\n\nSee https://example.com/path/to/file.ts for details.';
        const doc = (0, parser_1.parse)(content, 'custom');
        const urlRef = doc.references.find(r => r.value.includes('example.com'));
        (0, vitest_1.expect)(urlRef).toBeUndefined();
    });
    (0, vitest_1.it)('categorizes sections by keywords', () => {
        const content = '## Project Overview\n\nAbout the project.\n\n## Coding Style\n\nUse TypeScript.\n\n## Testing\n\nRun tests.';
        const doc = (0, parser_1.parse)(content, 'custom');
        (0, vitest_1.expect)(doc.detectedCategories).toContain('Project Overview');
        (0, vitest_1.expect)(doc.detectedCategories).toContain('Coding Conventions');
        (0, vitest_1.expect)(doc.detectedCategories).toContain('Testing');
    });
    (0, vitest_1.it)('counts words correctly', () => {
        const content = 'Hello world. This is a test.';
        const doc = (0, parser_1.parse)(content, 'custom');
        (0, vitest_1.expect)(doc.wordCount).toBe(6);
    });
    (0, vitest_1.it)('estimates tokens as chars/4', () => {
        const content = 'a'.repeat(400);
        const doc = (0, parser_1.parse)(content, 'custom');
        (0, vitest_1.expect)(doc.estimatedTokens).toBe(100);
    });
    (0, vitest_1.it)('handles empty content', () => {
        const doc = (0, parser_1.parse)('', 'custom');
        (0, vitest_1.expect)(doc.lineCount).toBe(1);
        (0, vitest_1.expect)(doc.sections.length).toBe(1);
        (0, vitest_1.expect)(doc.instructions.length).toBe(0);
    });
    (0, vitest_1.it)('detects modal instructions', () => {
        const content = '# Rules\n\nYou must use TypeScript.\nYou should write tests.';
        const doc = (0, parser_1.parse)(content, 'custom');
        (0, vitest_1.expect)(doc.instructions.length).toBeGreaterThanOrEqual(2);
    });
    (0, vitest_1.it)('skips example/placeholder paths', () => {
        const content = 'See `example/something.ts` and `path/to/file.ts`.';
        const doc = (0, parser_1.parse)(content, 'custom');
        const exampleRef = doc.references.find(r => r.value.startsWith('example/'));
        (0, vitest_1.expect)(exampleRef).toBeUndefined();
    });
});
//# sourceMappingURL=parser.test.js.map