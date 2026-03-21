import { LintRule } from '../types';

/**
 * personality-instruction: detects personality/emotional directives.
 */
export const personalityInstruction: LintRule = {
  id: 'personality-instruction',
  category: 'anti-pattern',
  defaultSeverity: 'info',
  description: 'Instruction file contains personality instructions that waste tokens.',
  check(document, context) {
    const patterns: Array<{ pattern: RegExp; example: string }> = [
      { pattern: /\bbe friendly\b/i, example: 'be friendly' },
      { pattern: /\bbe warm\b/i, example: 'be warm' },
      { pattern: /\bbe enthusiastic\b/i, example: 'be enthusiastic' },
      { pattern: /\bshow excitement\b/i, example: 'show excitement' },
      { pattern: /\bbe patient\b/i, example: 'be patient' },
      { pattern: /\bbe understanding\b/i, example: 'be understanding' },
      { pattern: /\bbe confident\b/i, example: 'be confident' },
      { pattern: /\bbe assertive\b/i, example: 'be assertive' },
      { pattern: /\bmaintain a professional tone\b/i, example: 'maintain a professional tone' },
      { pattern: /\bbe polite\b/i, example: 'be polite' },
      { pattern: /\bbe courteous\b/i, example: 'be courteous' },
      { pattern: /\bshow empathy\b/i, example: 'show empathy' },
      { pattern: /\bbe cheerful\b/i, example: 'be cheerful' },
    ];

    const lines = document.source.split('\n');
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      for (const { pattern, example } of patterns) {
        if (pattern.test(line)) {
          context.report({
            message: `Personality instruction detected: "${example}". This wastes tokens without affecting code quality.`,
            location: {
              startLine: i + 1,
              startColumn: 1,
              endLine: i + 1,
              endColumn: line.length + 1,
            },
            suggestion: 'Remove personality instructions from coding-focused instruction files.',
          });
        }
      }
    }
  },
};

/**
 * negative-only: a section consists primarily of negative instructions.
 */
export const negativeOnly: LintRule = {
  id: 'negative-only',
  category: 'anti-pattern',
  defaultSeverity: 'info',
  description: 'A section consists primarily of negative instructions without positive guidance.',
  check(document, context, options) {
    const threshold = (options?.threshold as number) ?? 0.7;

    for (const section of document.sections) {
      if (section.level === 0) continue;
      // Get instructions in this section
      const sectionInstructions = document.instructions.filter(inst =>
        inst.location.startLine >= section.location.startLine &&
        inst.location.startLine <= section.location.endLine
      );

      if (sectionInstructions.length < 3) continue; // Need enough instructions to judge

      const negativeCount = sectionInstructions.filter(inst => inst.isNegative).length;
      const ratio = negativeCount / sectionInstructions.length;

      if (ratio >= threshold) {
        context.report({
          message: `Section "${section.title || '(untitled)'}" is ${Math.round(ratio * 100)}% negative instructions. Add positive guidance.`,
          location: section.location,
          suggestion: 'For each "don\'t do X", add "do Y instead".',
        });
      }
    }
  },
};

/**
 * too-many-rules: excessive number of instructions.
 */
export const tooManyRules: LintRule = {
  id: 'too-many-rules',
  category: 'anti-pattern',
  defaultSeverity: 'info',
  description: 'Instruction file contains too many rules for effective AI compliance.',
  check(document, context, options) {
    const maxRules = (options?.maxRules as number) ?? 100;
    if (document.instructions.length > maxRules) {
      context.report({
        message: `File contains ${document.instructions.length} instructions, exceeding the recommended maximum of ${maxRules}. AI tools follow fewer rules more reliably.`,
        location: { startLine: 1, startColumn: 1, endLine: document.lineCount, endColumn: 1 },
        suggestion: 'Consolidate or prioritize the most important rules.',
      });
    }
  },
};

/**
 * no-examples: instruction file has coding conventions but no code examples.
 */
export const noExamples: LintRule = {
  id: 'no-examples',
  category: 'anti-pattern',
  defaultSeverity: 'info',
  description: 'Instruction file has coding conventions but no code examples.',
  check(document, context) {
    // Check if the file has coding-related instructions
    const hasCodingInstructions = document.instructions.some(inst =>
      /\b(?:code|function|variable|class|import|export|format|indent|naming|style|type|interface)\b/i.test(inst.text)
    );

    if (!hasCodingInstructions) return;

    // Check for fenced code blocks with language tags
    const hasCodeExamples = /```(?:typescript|javascript|ts|js|python|py|go|rust|java|ruby|sh|bash|css|html|json|yaml|toml|sql|jsx|tsx)\b/i.test(document.source);

    if (!hasCodeExamples) {
      context.report({
        message: 'File contains coding conventions but no code examples. AI tools learn more effectively from examples.',
        location: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
        suggestion: 'Add code blocks demonstrating expected patterns.',
      });
    }
  },
};

/**
 * todo-placeholder: detects TODO/FIXME/XXX placeholders.
 */
export const todoPlaceholder: LintRule = {
  id: 'todo-placeholder',
  category: 'anti-pattern',
  defaultSeverity: 'warning',
  description: 'Instruction file contains placeholder markers indicating incomplete content.',
  check(document, context) {
    const lines = document.source.split('\n');
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      if (/\b(?:TODO|FIXME|XXX|HACK)\b/.test(line)) {
        context.report({
          message: `Placeholder marker found: "${line.trim()}". This indicates incomplete content.`,
          location: {
            startLine: i + 1,
            startColumn: 1,
            endLine: i + 1,
            endColumn: line.length + 1,
          },
          suggestion: 'Complete the placeholder content or remove it.',
        });
      }
    }
  },
};

/**
 * dated-content: detects temporal references that may be stale.
 */
export const datedContent: LintRule = {
  id: 'dated-content',
  category: 'anti-pattern',
  defaultSeverity: 'info',
  description: 'Instruction file contains dated or temporal references that may be stale.',
  check(document, context) {
    const patterns: Array<{ pattern: RegExp; description: string }> = [
      { pattern: /\bas of (?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i, description: 'explicit date reference' },
      { pattern: /\bupdated (?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/i, description: 'update date reference' },
      { pattern: /\bsince Q[1-4]\s+\d{4}/i, description: 'quarterly date reference' },
      { pattern: /\bcurrently migrating\b/i, description: 'temporal migration status' },
      { pattern: /\bwe are currently using\b/i, description: 'temporal technology reference' },
      { pattern: /\bfor now\b/i, description: 'temporal qualifier' },
      { pattern: /\bat the moment\b/i, description: 'temporal qualifier' },
    ];

    const lines = document.source.split('\n');
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      for (const { pattern, description } of patterns) {
        if (pattern.test(line)) {
          context.report({
            message: `Dated content detected (${description}): "${line.trim()}". This may be stale.`,
            location: {
              startLine: i + 1,
              startColumn: 1,
              endLine: i + 1,
              endColumn: line.length + 1,
            },
            suggestion: 'Use timeless statements instead of date-bound observations.',
          });
          break;
        }
      }
    }
  },
};

export const antiPatternRules: LintRule[] = [
  personalityInstruction,
  negativeOnly,
  tooManyRules,
  noExamples,
  todoPlaceholder,
  datedContent,
];
