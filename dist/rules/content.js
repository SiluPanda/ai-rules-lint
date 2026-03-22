"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRules = exports.hardcodedPaths = exports.missingSpecificity = exports.unsafeInstruction = exports.contradictoryRules = exports.redundantInstruction = exports.vagueInstruction = void 0;
/**
 * Vague instruction patterns.
 */
const VAGUE_PATTERNS = [
    { pattern: /\bbe helpful\b/i, example: 'be helpful' },
    { pattern: /\bbe as helpful as possible\b/i, example: 'be as helpful as possible' },
    { pattern: /\bfollow best practices\b/i, example: 'follow best practices' },
    { pattern: /\bwrite clean code\b/i, example: 'write clean code' },
    { pattern: /\bbe concise\b/i, example: 'be concise' },
    { pattern: /\bbe thorough\b/i, example: 'be thorough' },
    { pattern: /\bdo your best\b/i, example: 'do your best' },
    { pattern: /\bbe accurate\b/i, example: 'be accurate' },
    { pattern: /\bbe professional\b/i, example: 'be professional' },
    { pattern: /\buse common sense\b/i, example: 'use common sense' },
    { pattern: /\bbe smart about it\b/i, example: 'be smart about it' },
    { pattern: /\buse good judgment\b/i, example: 'use good judgment' },
    { pattern: /\bwrite high-quality code\b/i, example: 'write high-quality code' },
    { pattern: /\bfollow the conventions\b/i, example: 'follow the conventions' },
    { pattern: /\bkeep things simple\b/i, example: 'keep things simple' },
    { pattern: /\bbe efficient\b/i, example: 'be efficient' },
];
/**
 * vague-instruction: detects vague, unhelpful instructions.
 */
exports.vagueInstruction = {
    id: 'vague-instruction',
    category: 'content',
    defaultSeverity: 'warning',
    description: 'Instruction file contains vague instructions that provide no actionable guidance.',
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
            for (const { pattern, example } of VAGUE_PATTERNS) {
                if (pattern.test(line)) {
                    context.report({
                        message: `Vague instruction detected: "${example}". This provides no actionable guidance.`,
                        location: {
                            startLine: i + 1,
                            startColumn: 1,
                            endLine: i + 1,
                            endColumn: line.length + 1,
                        },
                        suggestion: 'Replace with a specific, verifiable instruction.',
                    });
                }
            }
        }
    },
};
/**
 * Normalize text for redundancy comparison.
 */
function normalizeForComparison(text) {
    let normalized = text.toLowerCase();
    normalized = normalized.replace(/\s+/g, ' ').trim();
    normalized = normalized.replace(/[^\w\s]/g, '');
    // Synonym substitution
    normalized = normalized.replace(/\b(?:ensure|make sure|verify)\b/g, 'ensure');
    normalized = normalized.replace(/\b(?:do not|never|don't)\b/g, 'never');
    normalized = normalized.replace(/\b(?:always|must|should always)\b/g, 'always');
    normalized = normalized.replace(/\b(?:utilize|employ)\b/g, 'use');
    return normalized;
}
/**
 * Compute word trigram Jaccard similarity.
 */
function trigramSimilarity(a, b) {
    const wordsA = a.split(/\s+/);
    const wordsB = b.split(/\s+/);
    const trigramsA = new Set();
    const trigramsB = new Set();
    for (let i = 0; i <= wordsA.length - 3; i++) {
        trigramsA.add(wordsA.slice(i, i + 3).join(' '));
    }
    for (let i = 0; i <= wordsB.length - 3; i++) {
        trigramsB.add(wordsB.slice(i, i + 3).join(' '));
    }
    if (trigramsA.size === 0 && trigramsB.size === 0) {
        // For very short strings, fall back to word overlap
        return wordOverlap(a, b);
    }
    if (trigramsA.size === 0 || trigramsB.size === 0) {
        // One is too short for trigrams, use word overlap
        return wordOverlap(a, b);
    }
    let intersection = 0;
    for (const t of trigramsA) {
        if (trigramsB.has(t))
            intersection++;
    }
    const union = trigramsA.size + trigramsB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}
/**
 * Compute word-level Jaccard overlap.
 */
function wordOverlap(a, b) {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 0));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 0));
    if (wordsA.size === 0 && wordsB.size === 0)
        return 1.0;
    if (wordsA.size === 0 || wordsB.size === 0)
        return 0;
    let intersection = 0;
    for (const w of wordsA) {
        if (wordsB.has(w))
            intersection++;
    }
    const union = wordsA.size + wordsB.size - intersection;
    return union === 0 ? 0 : intersection / union;
}
/**
 * Check if two subjects share a key content word (for contradiction detection).
 * More lenient than trigram similarity -- useful for short phrases like "Redux".
 */
function subjectsContradict(a, b) {
    // Filter out common stop words AND common verbs that appear in instruction subjects
    const stopWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'that', 'this', 'it', 'its', 'my', 'your', 'their', 'our', 'all', 'any', 'each', 'every', 'some', 'new', 'old', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'as', 'if', 'than', 'but', 'not', 'no', 'nor', 'only', 'own', 'same', 'so', 'too', 'very', 'just', 'also', 'about',
        // Common verbs that appear after always/never/use/avoid but are not meaningful subjects
        'use', 'write', 'make', 'create', 'add', 'put', 'set', 'get', 'run', 'using', 'code', 'possible', 'management', 'when']);
    const contentWordsA = a.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
    const contentWordsB = b.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
    if (contentWordsA.length === 0 || contentWordsB.length === 0)
        return false;
    // Check if a meaningful content word appears in both
    const setB = new Set(contentWordsB);
    let sharedCount = 0;
    for (const word of contentWordsA) {
        if (setB.has(word))
            sharedCount++;
    }
    // Require at least one shared content word AND the shared words must be a significant
    // portion of the shorter subject
    if (sharedCount === 0)
        return false;
    const minLen = Math.min(contentWordsA.length, contentWordsB.length);
    return sharedCount / minLen >= 0.5;
}
/**
 * redundant-instruction: detects near-duplicate instructions.
 */
exports.redundantInstruction = {
    id: 'redundant-instruction',
    category: 'content',
    defaultSeverity: 'info',
    description: 'The instruction file contains near-duplicate instructions.',
    check(document, context, options) {
        const threshold = options?.threshold ?? 0.6;
        const instructions = document.instructions;
        const reported = new Set();
        for (let i = 0; i < instructions.length; i++) {
            if (reported.has(i))
                continue;
            const normA = normalizeForComparison(instructions[i].text);
            for (let j = i + 1; j < instructions.length; j++) {
                if (reported.has(j))
                    continue;
                const normB = normalizeForComparison(instructions[j].text);
                const tSim = trigramSimilarity(normA, normB);
                const wSim = wordOverlap(normA, normB);
                // Use the higher of trigram and word overlap similarity
                const similarity = normA === normB ? 1.0 : Math.max(tSim, wSim);
                if (similarity >= threshold) {
                    reported.add(j);
                    context.report({
                        message: `Redundant instruction found. Line ${instructions[j].location.startLine} is similar to line ${instructions[i].location.startLine}.`,
                        location: instructions[j].location,
                        suggestion: 'Remove the duplicate instruction.',
                    });
                }
            }
        }
    },
};
/**
 * contradictory-rules: detects contradictory instructions.
 */
exports.contradictoryRules = {
    id: 'contradictory-rules',
    category: 'content',
    defaultSeverity: 'error',
    description: 'The instruction file contains contradictory rules.',
    check(document, context) {
        const instructions = document.instructions;
        // Check always/never contradictions
        for (let i = 0; i < instructions.length; i++) {
            const textA = instructions[i].text.toLowerCase();
            for (let j = i + 1; j < instructions.length; j++) {
                const textB = instructions[j].text.toLowerCase();
                // "Always X" + "Never X" or "Do not X"
                const alwaysMatch = textA.match(/\b(?:always)\s+(.+)/);
                const neverMatch = textB.match(/\b(?:never|do not|don't)\s+(.+)/);
                if (alwaysMatch && neverMatch) {
                    const subjectA = alwaysMatch[1].replace(/[^\w\s]/g, '').trim();
                    const subjectB = neverMatch[1].replace(/[^\w\s]/g, '').trim();
                    if (subjectA && subjectB && subjectsContradict(subjectA, subjectB)) {
                        context.report({
                            message: `Contradictory rules: "${instructions[i].text}" conflicts with "${instructions[j].text}".`,
                            location: instructions[j].location,
                            suggestion: 'Resolve the contradiction by removing or reconciling one of the instructions.',
                        });
                        continue;
                    }
                }
                // Reverse: "Never X" + "Always X"
                const neverMatchA = textA.match(/\b(?:never|do not|don't)\s+(.+)/);
                const alwaysMatchB = textB.match(/\b(?:always)\s+(.+)/);
                if (neverMatchA && alwaysMatchB) {
                    const subjectA = neverMatchA[1].replace(/[^\w\s]/g, '').trim();
                    const subjectB = alwaysMatchB[1].replace(/[^\w\s]/g, '').trim();
                    if (subjectA && subjectB && subjectsContradict(subjectA, subjectB)) {
                        context.report({
                            message: `Contradictory rules: "${instructions[i].text}" conflicts with "${instructions[j].text}".`,
                            location: instructions[j].location,
                            suggestion: 'Resolve the contradiction by removing or reconciling one of the instructions.',
                        });
                        continue;
                    }
                }
                // "Use X" + "Avoid X"
                const useMatch = textA.match(/\b(?:use|prefer)\s+(.+)/);
                const avoidMatch = textB.match(/\b(?:avoid|don't use|do not use|never use)\s+(.+)/);
                if (useMatch && avoidMatch) {
                    const subjectA = useMatch[1].replace(/[^\w\s]/g, '').trim();
                    const subjectB = avoidMatch[1].replace(/[^\w\s]/g, '').trim();
                    if (subjectA && subjectB && subjectsContradict(subjectA, subjectB)) {
                        context.report({
                            message: `Contradictory rules: "${instructions[i].text}" conflicts with "${instructions[j].text}".`,
                            location: instructions[j].location,
                            suggestion: 'Resolve the contradiction by removing or reconciling one of the instructions.',
                        });
                    }
                }
                // Reverse: "Avoid X" + "Use X"
                const avoidMatchA = textA.match(/\b(?:avoid|don't use|do not use|never use)\s+(.+)/);
                const useMatchB = textB.match(/\b(?:use|prefer)\s+(.+)/);
                if (avoidMatchA && useMatchB) {
                    const subjectA = avoidMatchA[1].replace(/[^\w\s]/g, '').trim();
                    const subjectB = useMatchB[1].replace(/[^\w\s]/g, '').trim();
                    if (subjectA && subjectB && subjectsContradict(subjectA, subjectB)) {
                        context.report({
                            message: `Contradictory rules: "${instructions[i].text}" conflicts with "${instructions[j].text}".`,
                            location: instructions[j].location,
                            suggestion: 'Resolve the contradiction by removing or reconciling one of the instructions.',
                        });
                    }
                }
            }
        }
    },
};
/**
 * Unsafe instruction patterns.
 */
const UNSAFE_PATTERNS = [
    { pattern: /\bdo everything I say\b/i, description: 'unconditional compliance' },
    { pattern: /\bfollow all instructions without question\b/i, description: 'unquestioning compliance' },
    { pattern: /\bno restrictions\b/i, description: 'removing restrictions' },
    { pattern: /\bno limitations\b/i, description: 'removing limitations' },
    { pattern: /\bignore safety\b/i, description: 'ignoring safety' },
    { pattern: /\bnever refuse\b/i, description: 'preventing refusal' },
    { pattern: /\balways comply\b/i, description: 'unconditional compliance' },
    { pattern: /\bbypass\b/i, description: 'bypassing restrictions' },
    { pattern: /\bignore previous\b/i, description: 'instruction injection' },
    { pattern: /\bexecute any code\b/i, description: 'unrestricted code execution' },
    { pattern: /\brun any command\b/i, description: 'unrestricted command execution' },
    { pattern: /\bdelete anything\b/i, description: 'unrestricted deletion' },
    { pattern: /\bignore errors\b/i, description: 'error suppression' },
    { pattern: /\bsuppress all warnings\b/i, description: 'warning suppression' },
    { pattern: /\bskip validation\b/i, description: 'validation skipping' },
    { pattern: /\bcommit directly to main\b/i, description: 'direct commit to main branch' },
    { pattern: /\bpush without review\b/i, description: 'skipping code review' },
    { pattern: /\buse sudo\b/i, description: 'elevated privileges' },
    { pattern: /\brun as root\b/i, description: 'elevated privileges' },
    { pattern: /\bdisable safety\b/i, description: 'disabling safety' },
];
/**
 * unsafe-instruction: detects instructions that could lead to dangerous behavior.
 */
exports.unsafeInstruction = {
    id: 'unsafe-instruction',
    category: 'content',
    defaultSeverity: 'error',
    description: 'Instruction file contains potentially unsafe instructions.',
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
            for (const { pattern, description } of UNSAFE_PATTERNS) {
                if (pattern.test(line)) {
                    context.report({
                        message: `Unsafe instruction detected (${description}): "${line.trim()}".`,
                        location: {
                            startLine: i + 1,
                            startColumn: 1,
                            endLine: i + 1,
                            endColumn: line.length + 1,
                        },
                        suggestion: 'Scope authority explicitly instead of granting blanket permissions.',
                    });
                }
            }
        }
    },
};
/**
 * missing-specificity: instructions use generic language.
 */
exports.missingSpecificity = {
    id: 'missing-specificity',
    category: 'content',
    defaultSeverity: 'warning',
    description: 'Instructions use generic language where specifics would be more effective.',
    check(document, context) {
        const vagueQualifiers = /\b(?:appropriate|proper|good|right|standard|correct)\b/i;
        const directiveVerbs = /\b(?:use|follow|handle|write|apply|ensure)\b/i;
        for (const instruction of document.instructions) {
            if (directiveVerbs.test(instruction.text) && vagueQualifiers.test(instruction.text)) {
                context.report({
                    message: `Instruction lacks specificity: "${instruction.text}". Use concrete guidance instead of vague qualifiers.`,
                    location: instruction.location,
                    suggestion: 'Replace vague qualifiers like "appropriate" or "proper" with specific details.',
                });
            }
        }
    },
};
/**
 * hardcoded-paths: detects absolute user/machine-specific paths.
 */
exports.hardcodedPaths = {
    id: 'hardcoded-paths',
    category: 'content',
    defaultSeverity: 'warning',
    description: 'Instruction file contains hardcoded absolute paths.',
    check(document, context) {
        const lines = document.source.split('\n');
        const pathPatterns = [
            /(?:\/Users\/\w+)/,
            /(?:\/home\/\w+)/,
            /(?:C:\\Users\\)/i,
            /(?:C:\\Documents)/i,
        ];
        let inCodeBlock = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                continue;
            }
            if (inCodeBlock)
                continue;
            for (const pattern of pathPatterns) {
                if (pattern.test(line)) {
                    context.report({
                        message: `Hardcoded absolute path detected: "${line.trim()}".`,
                        location: {
                            startLine: i + 1,
                            startColumn: 1,
                            endLine: i + 1,
                            endColumn: line.length + 1,
                        },
                        suggestion: 'Use relative paths or describe the location instead.',
                    });
                    break; // One diagnostic per line
                }
            }
        }
    },
};
exports.contentRules = [
    exports.vagueInstruction,
    exports.redundantInstruction,
    exports.contradictoryRules,
    exports.unsafeInstruction,
    exports.missingSpecificity,
    exports.hardcodedPaths,
];
//# sourceMappingURL=content.js.map