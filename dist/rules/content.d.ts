import { LintRule } from '../types';
/**
 * vague-instruction: detects vague, unhelpful instructions.
 */
export declare const vagueInstruction: LintRule;
/**
 * redundant-instruction: detects near-duplicate instructions.
 */
export declare const redundantInstruction: LintRule;
/**
 * contradictory-rules: detects contradictory instructions.
 */
export declare const contradictoryRules: LintRule;
/**
 * unsafe-instruction: detects instructions that could lead to dangerous behavior.
 */
export declare const unsafeInstruction: LintRule;
/**
 * missing-specificity: instructions use generic language.
 */
export declare const missingSpecificity: LintRule;
/**
 * hardcoded-paths: detects absolute user/machine-specific paths.
 */
export declare const hardcodedPaths: LintRule;
export declare const contentRules: LintRule[];
//# sourceMappingURL=content.d.ts.map