/**
 * Recognized AI instruction file formats.
 */
export type FileFormat =
  | 'claude-md'
  | 'cursorrules'
  | 'agents-md'
  | 'gemini-md'
  | 'copilot-instructions'
  | 'windsurfrules'
  | 'clinerules'
  | 'custom';

/**
 * Severity level for a lint rule.
 */
export type Severity = 'error' | 'warning' | 'info' | 'off';

/**
 * Source location within the instruction file.
 */
export interface SourceLocation {
  /** Starting line number (1-based). */
  startLine: number;
  /** Starting column number (1-based). */
  startColumn: number;
  /** Ending line number (1-based). */
  endLine: number;
  /** Ending column number (1-based). */
  endColumn: number;
}

/**
 * An auto-fix replacement.
 */
export interface Fix {
  /** The range in the source text to replace. */
  range: SourceLocation;
  /** The replacement text. */
  replacement: string;
}

/**
 * Rule category.
 */
export type RuleCategory =
  | 'length'
  | 'structure'
  | 'content'
  | 'reference'
  | 'anti-pattern'
  | 'format-specific'
  | 'efficiency';

/**
 * A single lint diagnostic.
 */
export interface LintDiagnostic {
  /** The rule ID that produced this diagnostic. */
  ruleId: string;
  /** Severity of this diagnostic. */
  severity: 'error' | 'warning' | 'info';
  /** Category of the rule. */
  category: RuleCategory;
  /** Source location of the problematic text. */
  location: SourceLocation;
  /** Human-readable description of the problem. */
  message: string;
  /** Optional human-readable fix suggestion. */
  suggestion?: string;
  /** Optional auto-fix. */
  fix?: Fix;
}

/**
 * Summary counts for the lint report.
 */
export interface LintSummary {
  /** Total number of diagnostics. */
  total: number;
  /** Number of error-severity diagnostics. */
  errors: number;
  /** Number of warning-severity diagnostics. */
  warnings: number;
  /** Number of info-severity diagnostics. */
  infos: number;
  /** Number of auto-fixable diagnostics. */
  fixable: number;
}

/**
 * A section parsed from the instruction file.
 */
export interface Section {
  /** Section title (header text). Null for untitled sections. */
  title: string | null;
  /** Header level (1 for #, 2 for ##, etc.). 0 for content before any header. */
  level: number;
  /** Section content (text between this header and the next). */
  content: string;
  /** Source location of the section. */
  location: SourceLocation;
  /** Character count of the content. */
  characterCount: number;
  /** Estimated token count of the content. */
  estimatedTokens: number;
  /** Detected category (if matched against known categories). */
  category?: string;
}

/**
 * An imperative statement extracted from the instruction file.
 */
export interface InstructionStatement {
  /** The instruction text. */
  text: string;
  /** Whether the instruction is negative ("do not", "never", etc.). */
  isNegative: boolean;
  /** Source location. */
  location: SourceLocation;
}

/**
 * A reference to a file, directory, function, class, or command.
 */
export interface Reference {
  /** The referenced path or identifier. */
  value: string;
  /** Type of reference. */
  type: 'file' | 'directory' | 'function' | 'class' | 'command';
  /** Source location. */
  location: SourceLocation;
  /** Whether the reference was verified to exist. */
  exists?: boolean;
}

/**
 * The parsed intermediate representation of an instruction file.
 */
export interface InstructionDocument {
  /** The raw source text. */
  source: string;
  /** Detected file format. */
  format: FileFormat;
  /** Total character count. */
  characterCount: number;
  /** Estimated token count (rough: chars / 4). */
  estimatedTokens: number;
  /** Word count. */
  wordCount: number;
  /** Line count. */
  lineCount: number;
  /** All detected sections. */
  sections: Section[];
  /** All detected instructions (imperative statements). */
  instructions: InstructionStatement[];
  /** All detected file/function/class references. */
  references: Reference[];
  /** Section categories detected. */
  detectedCategories: string[];
}

/**
 * Configuration for a single rule.
 */
export interface RuleConfig {
  /** Override the rule's default severity. 'off' disables the rule. */
  severity?: Severity;
  /** Rule-specific options. */
  options?: Record<string, unknown>;
}

/**
 * Context passed to rule check functions for reporting diagnostics.
 */
export interface RuleContext {
  report(diagnostic: {
    message: string;
    location: SourceLocation;
    suggestion?: string;
    fix?: Fix;
  }): void;
}

/**
 * A lint rule definition.
 */
export interface LintRule {
  /** Unique kebab-case identifier. */
  id: string;
  /** Category. */
  category: RuleCategory;
  /** Default severity. */
  defaultSeverity: Severity;
  /** Human-readable description. */
  description: string;
  /** The check function. */
  check(document: InstructionDocument, context: RuleContext, options?: Record<string, unknown>): void;
}

/**
 * A custom rule definition (same shape as LintRule).
 */
export type CustomRuleDefinition = LintRule;

/**
 * Source for the lint function.
 */
export type LintSource =
  | string
  | { file: string }
  | { content: string; format?: FileFormat };

/**
 * Options for the lint() function.
 */
export interface LintOptions {
  /** The instruction file to lint. File path or content. */
  source: LintSource;
  /** Preset. Default: 'recommended'. */
  preset?: 'recommended' | 'strict' | 'minimal' | 'off';
  /** Per-rule overrides. */
  rules?: Record<string, RuleConfig | Severity>;
  /** Custom rules. */
  customRules?: CustomRuleDefinition[];
  /** Project root for reference checking. */
  projectRoot?: string;
  /** Apply auto-fixes. Default: false. */
  fix?: boolean;
}

/**
 * Options for lintContent().
 */
export interface LintContentOptions {
  /** The instruction file content as a string. */
  content: string;
  /** The file format. Default: 'custom'. */
  format?: FileFormat;
  /** Preset. Default: 'recommended'. */
  preset?: 'recommended' | 'strict' | 'minimal' | 'off';
  /** Per-rule overrides. */
  rules?: Record<string, RuleConfig | Severity>;
  /** Custom rules. */
  customRules?: CustomRuleDefinition[];
  /** Project root for reference checking. */
  projectRoot?: string;
  /** Apply auto-fixes. Default: false. */
  fix?: boolean;
}

/**
 * Options for lintDirectory().
 */
export interface LintDirectoryOptions {
  /** The directory to scan for instruction files. */
  directory: string;
  /** Preset. Default: 'recommended'. */
  preset?: 'recommended' | 'strict' | 'minimal' | 'off';
  /** Per-rule overrides. */
  rules?: Record<string, RuleConfig | Severity>;
  /** Custom rules. */
  customRules?: CustomRuleDefinition[];
  /** Apply auto-fixes. Default: false. */
  fix?: boolean;
}

/**
 * The complete lint report.
 */
export interface LintReport {
  /** Whether the lint passed (no errors). */
  passed: boolean;
  /** The file path of the linted instruction file (if applicable). */
  filePath?: string;
  /** The detected file format. */
  format: FileFormat;
  /** ISO 8601 timestamp. */
  timestamp: string;
  /** Duration in milliseconds. */
  durationMs: number;
  /** All diagnostics. */
  diagnostics: LintDiagnostic[];
  /** Summary counts. */
  summary: LintSummary;
  /** The parsed Instruction Document. */
  document: InstructionDocument;
  /** The preset that was used. */
  preset: string;
  /** Effective rule states. */
  ruleStates: Record<string, Severity>;
  /** Fixed content (if fix was requested). */
  fixed?: string;
}
