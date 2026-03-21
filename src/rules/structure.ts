import { LintRule } from '../types';

/**
 * missing-sections: instruction file is missing expected sections.
 */
export const missingSections: LintRule = {
  id: 'missing-sections',
  category: 'structure',
  defaultSeverity: 'warning',
  description: 'Instruction file is missing expected sections.',
  check(document, context, options) {
    const expectedSections = (options?.expectedSections as Array<{ name: string; keywords: string[] }>) ?? [
      { name: 'Project Overview', keywords: ['overview', 'about', 'context', 'introduction', 'project', 'architecture'] },
      { name: 'Coding Conventions', keywords: ['conventions', 'style', 'coding', 'formatting', 'standards', 'guidelines'] },
      { name: 'File Structure', keywords: ['structure', 'layout', 'directories', 'files', 'organization'] },
      { name: 'Testing', keywords: ['testing', 'tests', 'test', 'verification'] },
    ];

    for (const expected of expectedSections) {
      const found = document.sections.some(section => {
        if (!section.title) return false;
        const lower = section.title.toLowerCase();
        return expected.keywords.some(kw => lower.includes(kw));
      });
      if (!found) {
        context.report({
          message: `Missing expected section: "${expected.name}".`,
          location: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
          suggestion: `Add a section with a heading matching one of: ${expected.keywords.join(', ')}.`,
        });
      }
    }
  },
};

/**
 * no-headers: instruction file contains no markdown headers.
 */
export const noHeaders: LintRule = {
  id: 'no-headers',
  category: 'structure',
  defaultSeverity: 'warning',
  description: 'Instruction file contains no markdown headers.',
  check(document, context) {
    const hasHeaders = document.sections.some(s => s.level > 0);
    if (!hasHeaders) {
      context.report({
        message: 'File contains no markdown headers. The entire file is unstructured text.',
        location: { startLine: 1, startColumn: 1, endLine: document.lineCount, endColumn: 1 },
        suggestion: 'Add markdown headers (## Section Name) to organize the content.',
      });
    }
  },
};

/**
 * deep-nesting: instruction file uses excessively deep header nesting.
 */
export const deepNesting: LintRule = {
  id: 'deep-nesting',
  category: 'structure',
  defaultSeverity: 'info',
  description: 'Instruction file uses excessively deep header nesting.',
  check(document, context, options) {
    const maxDepth = (options?.maxDepth as number) ?? 4;
    for (const section of document.sections) {
      if (section.level > maxDepth) {
        context.report({
          message: `Header "${section.title || '(untitled)'}" is nested ${section.level} levels deep, exceeding the maximum of ${maxDepth}.`,
          location: section.location,
          suggestion: 'Restructure the document to use fewer nesting levels.',
        });
      }
    }
  },
};

/**
 * empty-section: a section contains no content.
 */
export const emptySection: LintRule = {
  id: 'empty-section',
  category: 'structure',
  defaultSeverity: 'warning',
  description: 'A section contains no content.',
  check(document, context) {
    for (const section of document.sections) {
      if (section.level > 0 && section.content.trim() === '') {
        context.report({
          message: `Section "${section.title || '(untitled)'}" is empty.`,
          location: section.location,
          suggestion: 'Add content to the section or remove the empty heading.',
          fix: {
            range: section.location,
            replacement: '',
          },
        });
      }
    }
  },
};

/**
 * wall-of-text: a section has too much unstructured text.
 */
export const wallOfText: LintRule = {
  id: 'wall-of-text',
  category: 'structure',
  defaultSeverity: 'info',
  description: 'A section contains a large block of unstructured text.',
  check(document, context, options) {
    const maxLength = (options?.maxLength as number) ?? 3000;
    for (const section of document.sections) {
      if (section.content.trim().length === 0) continue;
      // Check for paragraphs without structural breaks
      const contentLines = section.content.split('\n');
      let consecutiveChars = 0;
      let blockStartLine = section.location.startLine;

      for (let i = 0; i < contentLines.length; i++) {
        const line = contentLines[i].trim();
        // Structural breaks: blank lines, headers, lists, code blocks, horizontal rules
        const isBreak = line === '' ||
          line.startsWith('#') ||
          line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ ') ||
          /^\d+\.\s/.test(line) ||
          line.startsWith('```') ||
          line.startsWith('---') || line.startsWith('***') || line.startsWith('___');

        if (isBreak) {
          consecutiveChars = 0;
          blockStartLine = section.location.startLine + i + 1;
        } else {
          consecutiveChars += line.length;
          if (consecutiveChars > maxLength) {
            context.report({
              message: `Section "${section.title || '(untitled)'}" contains a block of ${consecutiveChars}+ characters without structural breaks.`,
              location: {
                startLine: blockStartLine,
                startColumn: 1,
                endLine: section.location.startLine + i,
                endColumn: line.length + 1,
              },
              suggestion: 'Break the text into bullet points, numbered steps, or subsections.',
            });
            break;
          }
        }
      }
    }
  },
};

export const structureRules: LintRule[] = [missingSections, noHeaders, deepNesting, emptySection, wallOfText];
