"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lengthRules = exports.sectionLength = exports.minLength = exports.maxLength = void 0;
/**
 * max-length: instruction file exceeds maximum token count.
 */
exports.maxLength = {
    id: 'max-length',
    category: 'length',
    defaultSeverity: 'warning',
    description: 'Instruction file exceeds the recommended maximum token count.',
    check(document, context, options) {
        const maxTokens = options?.maxTokens ?? 5000;
        if (document.estimatedTokens > maxTokens) {
            context.report({
                message: `File is ~${document.estimatedTokens} estimated tokens, exceeding the recommended maximum of ${maxTokens}. Long instruction files have diminishing returns.`,
                location: {
                    startLine: 1,
                    startColumn: 1,
                    endLine: document.lineCount,
                    endColumn: 1,
                },
                suggestion: `Consider trimming the file to under ${maxTokens} tokens. Remove redundant, vague, or low-impact instructions.`,
            });
        }
    },
};
/**
 * min-length: instruction file is too short to be useful.
 */
exports.minLength = {
    id: 'min-length',
    category: 'length',
    defaultSeverity: 'info',
    description: 'Instruction file is too short to provide useful guidance.',
    check(document, context, options) {
        const minTokens = options?.minTokens ?? 50;
        if (document.estimatedTokens < minTokens) {
            context.report({
                message: `File is ~${document.estimatedTokens} estimated tokens, below the minimum of ${minTokens}. The file may be a placeholder.`,
                location: {
                    startLine: 1,
                    startColumn: 1,
                    endLine: document.lineCount,
                    endColumn: 1,
                },
                suggestion: 'Add meaningful project context, coding conventions, and workflow instructions.',
            });
        }
    },
};
/**
 * section-length: an individual section exceeds maximum token count.
 */
exports.sectionLength = {
    id: 'section-length',
    category: 'length',
    defaultSeverity: 'info',
    description: 'A section exceeds the recommended maximum token count.',
    check(document, context, options) {
        const maxTokens = options?.maxTokens ?? 1500;
        for (const section of document.sections) {
            if (section.estimatedTokens > maxTokens) {
                context.report({
                    message: `Section "${section.title || '(untitled)'}" is ~${section.estimatedTokens} estimated tokens, exceeding the recommended maximum of ${maxTokens}.`,
                    location: section.location,
                    suggestion: 'Break the section into focused subsections.',
                });
            }
        }
    },
};
exports.lengthRules = [exports.maxLength, exports.minLength, exports.sectionLength];
//# sourceMappingURL=length.js.map