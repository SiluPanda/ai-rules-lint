import { LintRule } from '../types';
/**
 * personality-instruction: detects personality/emotional directives.
 */
export declare const personalityInstruction: LintRule;
/**
 * negative-only: a section consists primarily of negative instructions.
 */
export declare const negativeOnly: LintRule;
/**
 * too-many-rules: excessive number of instructions.
 */
export declare const tooManyRules: LintRule;
/**
 * no-examples: instruction file has coding conventions but no code examples.
 */
export declare const noExamples: LintRule;
/**
 * todo-placeholder: detects TODO/FIXME/XXX placeholders.
 */
export declare const todoPlaceholder: LintRule;
/**
 * dated-content: detects temporal references that may be stale.
 */
export declare const datedContent: LintRule;
export declare const antiPatternRules: LintRule[];
//# sourceMappingURL=anti-pattern.d.ts.map