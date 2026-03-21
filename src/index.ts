// ai-rules-lint - Linter and validator for AI instruction files

// Main API
export { lint, lintContent, lintDirectory, createLinter, createRule } from './linter';

// Parser
export { parse, detectFormat } from './parser';

// Registry
export { createRegistry, builtinRules, builtinRuleIds } from './registry';
export type { PresetName, RuleRegistry } from './registry';

// Types
export type {
  FileFormat,
  Severity,
  SourceLocation,
  Fix,
  RuleCategory,
  LintDiagnostic,
  LintSummary,
  LintReport,
  LintRule,
  LintOptions,
  LintContentOptions,
  LintDirectoryOptions,
  LintSource,
  RuleConfig,
  RuleContext,
  CustomRuleDefinition,
  InstructionDocument,
  Section,
  InstructionStatement,
  Reference,
} from './types';
