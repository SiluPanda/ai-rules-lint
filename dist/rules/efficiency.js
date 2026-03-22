"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.efficiencyRules = exports.excessiveFormatting = exports.commentedOutContent = exports.redundantWhitespace = void 0;
/**
 * redundant-whitespace: excessive blank lines, trailing whitespace.
 */
exports.redundantWhitespace = {
    id: 'redundant-whitespace',
    category: 'efficiency',
    defaultSeverity: 'info',
    description: 'Instruction file contains excessive whitespace.',
    check(document, context) {
        const lines = document.source.split('\n');
        let consecutiveBlank = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Check trailing whitespace
            if (line !== line.trimEnd() && line.trim().length > 0) {
                context.report({
                    message: 'Trailing whitespace detected.',
                    location: {
                        startLine: i + 1,
                        startColumn: line.trimEnd().length + 1,
                        endLine: i + 1,
                        endColumn: line.length + 1,
                    },
                    suggestion: 'Remove trailing whitespace.',
                    fix: {
                        range: {
                            startLine: i + 1,
                            startColumn: 1,
                            endLine: i + 1,
                            endColumn: line.length + 1,
                        },
                        replacement: line.trimEnd(),
                    },
                });
            }
            // Check consecutive blank lines
            if (line.trim() === '') {
                consecutiveBlank++;
                if (consecutiveBlank > 2) {
                    context.report({
                        message: `${consecutiveBlank} consecutive blank lines detected.`,
                        location: {
                            startLine: i + 1,
                            startColumn: 1,
                            endLine: i + 1,
                            endColumn: 1,
                        },
                        suggestion: 'Reduce to a single blank line.',
                        fix: {
                            range: {
                                startLine: i + 1,
                                startColumn: 1,
                                endLine: i + 1,
                                endColumn: 1,
                            },
                            replacement: '',
                        },
                    });
                }
            }
            else {
                consecutiveBlank = 0;
            }
        }
    },
};
/**
 * commented-out-content: HTML comments that are not lint directives.
 */
exports.commentedOutContent = {
    id: 'commented-out-content',
    category: 'efficiency',
    defaultSeverity: 'info',
    description: 'Instruction file contains commented-out content that wastes tokens.',
    check(document, context) {
        const commentRegex = /<!--([\s\S]*?)-->/g;
        const lines = document.source.split('\n');
        let match;
        while ((match = commentRegex.exec(document.source)) !== null) {
            const commentContent = match[1].trim();
            // Skip lint directives
            if (commentContent.startsWith('ai-rules-lint'))
                continue;
            // Find line number
            const beforeComment = document.source.substring(0, match.index);
            const startLine = beforeComment.split('\n').length;
            const commentLines = match[0].split('\n').length;
            // Only flag if the comment is substantial (> 20 chars)
            if (commentContent.length > 20) {
                context.report({
                    message: 'HTML comment contains content that wastes tokens. AI tools read comments as raw text.',
                    location: {
                        startLine,
                        startColumn: 1,
                        endLine: startLine + commentLines - 1,
                        endColumn: (lines[startLine + commentLines - 2] || '').length + 1,
                    },
                    suggestion: 'Remove the comment or uncomment the content.',
                    fix: {
                        range: {
                            startLine,
                            startColumn: 1,
                            endLine: startLine + commentLines - 1,
                            endColumn: (lines[startLine + commentLines - 2] || '').length + 1,
                        },
                        replacement: '',
                    },
                });
            }
        }
    },
};
/**
 * excessive-formatting: heavy markdown formatting that wastes tokens.
 */
exports.excessiveFormatting = {
    id: 'excessive-formatting',
    category: 'efficiency',
    defaultSeverity: 'info',
    description: 'Instruction file uses heavy formatting that wastes tokens.',
    check(document, context) {
        const lines = document.source.split('\n');
        let inCodeBlock = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            if (inCodeBlock)
                continue;
            // Decorative separators
            if (/^[=]{5,}\s*$/.test(line.trim()) || /^[-]{10,}\s*$/.test(line.trim())) {
                context.report({
                    message: 'Decorative separator wastes tokens.',
                    location: {
                        startLine: i + 1,
                        startColumn: 1,
                        endLine: i + 1,
                        endColumn: line.length + 1,
                    },
                    suggestion: 'Use markdown horizontal rules (---) or remove the separator.',
                });
            }
            // Bold/italic on entire lines (more than 80% of content is bold/italic)
            const stripped = line.trim();
            if (stripped.length > 20) {
                const boldContent = stripped.match(/\*\*(.+?)\*\*/g);
                if (boldContent) {
                    const boldLength = boldContent.reduce((sum, b) => sum + b.length - 4, 0);
                    if (boldLength / stripped.length > 0.8) {
                        context.report({
                            message: 'Entire line is bold. Bold formatting wastes tokens without changing AI behavior.',
                            location: {
                                startLine: i + 1,
                                startColumn: 1,
                                endLine: i + 1,
                                endColumn: line.length + 1,
                            },
                            suggestion: 'Remove bold markers (**) for token efficiency.',
                        });
                    }
                }
            }
        }
    },
};
exports.efficiencyRules = [exports.redundantWhitespace, exports.commentedOutContent, exports.excessiveFormatting];
//# sourceMappingURL=efficiency.js.map