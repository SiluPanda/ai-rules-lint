import { LintRule, Severity, RuleConfig, CustomRuleDefinition } from './types';
/**
 * All built-in rules.
 */
export declare const builtinRules: LintRule[];
/**
 * All built-in rule IDs.
 */
export declare const builtinRuleIds: string[];
/**
 * Preset configurations.
 */
export type PresetName = 'recommended' | 'strict' | 'minimal' | 'off';
/**
 * Represents a configured set of rules ready for execution.
 */
export interface RuleRegistry {
    /** Get all enabled rules with their effective severity and options. */
    getEnabledRules(): Array<{
        rule: LintRule;
        severity: Exclude<Severity, 'off'>;
        options?: Record<string, unknown>;
    }>;
    /** Get the effective severity for each rule. */
    getRuleStates(): Record<string, Severity>;
}
/**
 * Create a rule registry from a preset and overrides.
 */
export declare function createRegistry(preset?: PresetName, overrides?: Record<string, RuleConfig | Severity>, customRules?: CustomRuleDefinition[]): RuleRegistry;
//# sourceMappingURL=registry.d.ts.map