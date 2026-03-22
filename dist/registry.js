"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builtinRuleIds = exports.builtinRules = void 0;
exports.createRegistry = createRegistry;
const length_1 = require("./rules/length");
const structure_1 = require("./rules/structure");
const content_1 = require("./rules/content");
const references_1 = require("./rules/references");
const security_1 = require("./rules/security");
const efficiency_1 = require("./rules/efficiency");
const anti_pattern_1 = require("./rules/anti-pattern");
/**
 * All built-in rules.
 */
exports.builtinRules = [
    ...length_1.lengthRules,
    ...structure_1.structureRules,
    ...content_1.contentRules,
    ...references_1.referenceRules,
    ...security_1.securityRules,
    ...efficiency_1.efficiencyRules,
    ...anti_pattern_1.antiPatternRules,
];
/**
 * All built-in rule IDs.
 */
exports.builtinRuleIds = exports.builtinRules.map(r => r.id);
const RECOMMENDED_OVERRIDES = {};
// recommended uses default severities
const STRICT_OVERRIDES = {
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
const MINIMAL_ENABLED = new Set([
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
function getPresetSeverity(ruleId, defaultSeverity, preset) {
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
function resolveRuleSeverity(rule, preset, overrides) {
    let severity = getPresetSeverity(rule.id, rule.defaultSeverity, preset);
    if (overrides && overrides[rule.id] !== undefined) {
        const override = overrides[rule.id];
        if (typeof override === 'string') {
            severity = override;
        }
        else if (override.severity !== undefined) {
            severity = override.severity;
        }
    }
    return severity;
}
/**
 * Resolve rule options from overrides.
 */
function resolveRuleOptions(ruleId, overrides) {
    if (!overrides || overrides[ruleId] === undefined)
        return undefined;
    const override = overrides[ruleId];
    if (typeof override === 'string')
        return undefined;
    return override.options;
}
/**
 * Create a rule registry from a preset and overrides.
 */
function createRegistry(preset = 'recommended', overrides, customRules) {
    const allRules = [...exports.builtinRules, ...(customRules || [])];
    const customRuleIds = new Set((customRules || []).map(r => r.id));
    const resolveSeverity = (rule) => {
        // Custom rules are not affected by presets; they use their defaultSeverity
        // unless explicitly overridden.
        if (customRuleIds.has(rule.id)) {
            if (overrides && overrides[rule.id] !== undefined) {
                const override = overrides[rule.id];
                if (typeof override === 'string')
                    return override;
                if (override.severity !== undefined)
                    return override.severity;
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
                if (severity === 'off')
                    return null;
                const options = resolveRuleOptions(rule.id, overrides);
                return { rule, severity: severity, options };
            })
                .filter((entry) => entry !== null);
        },
        getRuleStates() {
            const states = {};
            for (const rule of allRules) {
                states[rule.id] = resolveSeverity(rule);
            }
            return states;
        },
    };
}
//# sourceMappingURL=registry.js.map