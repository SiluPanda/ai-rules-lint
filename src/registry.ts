import { LintRule, Severity, RuleConfig, CustomRuleDefinition } from './types';
import { lengthRules } from './rules/length';
import { structureRules } from './rules/structure';
import { contentRules } from './rules/content';
import { referenceRules } from './rules/references';
import { securityRules } from './rules/security';
import { efficiencyRules } from './rules/efficiency';
import { antiPatternRules } from './rules/anti-pattern';

/**
 * All built-in rules.
 */
export const builtinRules: LintRule[] = [
  ...lengthRules,
  ...structureRules,
  ...contentRules,
  ...referenceRules,
  ...securityRules,
  ...efficiencyRules,
  ...antiPatternRules,
];

/**
 * All built-in rule IDs.
 */
export const builtinRuleIds: string[] = builtinRules.map(r => r.id);

/**
 * Preset configurations.
 */
export type PresetName = 'recommended' | 'strict' | 'minimal' | 'off';

const RECOMMENDED_OVERRIDES: Record<string, Severity> = {};
// recommended uses default severities

const STRICT_OVERRIDES: Record<string, Severity> = {
  'max-length': 'error',
  'min-length': 'warning',
  'section-length': 'warning',
  'missing-sections': 'error',
  'no-headers': 'error',
  'deep-nesting': 'warning',
  'empty-section': 'error',
  'wall-of-text': 'warning',
  'vague-instruction': 'error',
  'redundant-instruction': 'warning',
  'contradictory-rules': 'error',
  'unsafe-instruction': 'error',
  'missing-specificity': 'error',
  'hardcoded-paths': 'error',
  'stale-reference': 'error',
  'nonexistent-command': 'warning',
  'personality-instruction': 'warning',
  'negative-only': 'warning',
  'too-many-rules': 'warning',
  'no-examples': 'warning',
  'todo-placeholder': 'error',
  'dated-content': 'warning',
  'secrets-in-file': 'error',
  'redundant-whitespace': 'warning',
  'commented-out-content': 'warning',
  'excessive-formatting': 'warning',
};

const MINIMAL_ENABLED: Set<string> = new Set([
  'contradictory-rules',
  'unsafe-instruction',
  'secrets-in-file',
  'stale-reference',
  'no-headers',
  'max-length',
]);

/**
 * Get the effective severity for a rule under a preset.
 */
function getPresetSeverity(ruleId: string, defaultSeverity: Severity, preset: PresetName): Severity {
  switch (preset) {
    case 'off':
      return 'off';
    case 'minimal':
      return MINIMAL_ENABLED.has(ruleId) ? defaultSeverity : 'off';
    case 'strict':
      return STRICT_OVERRIDES[ruleId] ?? defaultSeverity;
    case 'recommended':
    default:
      return RECOMMENDED_OVERRIDES[ruleId] ?? defaultSeverity;
  }
}

/**
 * Resolve the effective severity for a rule, considering preset + overrides.
 */
function resolveRuleSeverity(
  rule: LintRule,
  preset: PresetName,
  overrides: Record<string, RuleConfig | Severity> | undefined,
): Severity {
  let severity = getPresetSeverity(rule.id, rule.defaultSeverity, preset);

  if (overrides && overrides[rule.id] !== undefined) {
    const override = overrides[rule.id];
    if (typeof override === 'string') {
      severity = override;
    } else if (override.severity !== undefined) {
      severity = override.severity;
    }
  }

  return severity;
}

/**
 * Resolve rule options from overrides.
 */
function resolveRuleOptions(
  ruleId: string,
  overrides: Record<string, RuleConfig | Severity> | undefined,
): Record<string, unknown> | undefined {
  if (!overrides || overrides[ruleId] === undefined) return undefined;
  const override = overrides[ruleId];
  if (typeof override === 'string') return undefined;
  return override.options;
}

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
export function createRegistry(
  preset: PresetName = 'recommended',
  overrides?: Record<string, RuleConfig | Severity>,
  customRules?: CustomRuleDefinition[],
): RuleRegistry {
  const allRules = [...builtinRules, ...(customRules || [])];
  const customRuleIds = new Set((customRules || []).map(r => r.id));

  const resolveSeverity = (rule: LintRule): Severity => {
    // Custom rules are not affected by presets; they use their defaultSeverity
    // unless explicitly overridden.
    if (customRuleIds.has(rule.id)) {
      if (overrides && overrides[rule.id] !== undefined) {
        const override = overrides[rule.id];
        if (typeof override === 'string') return override;
        if (override.severity !== undefined) return override.severity;
      }
      return rule.defaultSeverity;
    }
    return resolveRuleSeverity(rule, preset, overrides);
  };

  return {
    getEnabledRules() {
      return allRules
        .map(rule => {
          const severity = resolveSeverity(rule);
          if (severity === 'off') return null;
          const options = resolveRuleOptions(rule.id, overrides);
          return { rule, severity: severity as Exclude<Severity, 'off'>, options };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
    },

    getRuleStates() {
      const states: Record<string, Severity> = {};
      for (const rule of allRules) {
        states[rule.id] = resolveSeverity(rule);
      }
      return states;
    },
  };
}
