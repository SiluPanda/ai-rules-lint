import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  FileFormat,
  LintDiagnostic,
  LintReport,
  LintOptions,
  LintContentOptions,
  LintDirectoryOptions,
  LintSource,
  RuleContext,
  Severity,
  CustomRuleDefinition,
  RuleConfig,
} from './types';
import { parse, detectFormat } from './parser';
import { createRegistry, PresetName } from './registry';

/**
 * Known AI instruction file names and patterns.
 */
const KNOWN_FILE_NAMES = [
  'CLAUDE.md',
  '.cursorrules',
  'AGENTS.md',
  'GEMINI.md',
  'copilot-instructions.md',
  '.windsurfrules',
  '.clinerules',
];

const KNOWN_SUBDIRECTORY_FILES = [
  '.claude/CLAUDE.md',
  '.github/AGENTS.md',
  '.github/copilot-instructions.md',
];

/**
 * Severity sort order: errors first, then warnings, then info.
 */
function severityOrder(severity: string): number {
  switch (severity) {
    case 'error': return 0;
    case 'warning': return 1;
    case 'info': return 2;
    default: return 3;
  }
}

/**
 * Sort diagnostics by severity (errors first), then by location.
 */
function sortDiagnostics(diagnostics: LintDiagnostic[]): LintDiagnostic[] {
  return diagnostics.sort((a, b) => {
    const sevDiff = severityOrder(a.severity) - severityOrder(b.severity);
    if (sevDiff !== 0) return sevDiff;
    const lineDiff = a.location.startLine - b.location.startLine;
    if (lineDiff !== 0) return lineDiff;
    return a.location.startColumn - b.location.startColumn;
  });
}

/**
 * Resolve the source to content and format.
 */
function resolveSource(source: LintSource): { content: string; format: FileFormat; filePath?: string } {
  if (typeof source === 'string') {
    const content = fs.readFileSync(source, 'utf-8');
    const format = detectFormat(source);
    return { content, format, filePath: path.resolve(source) };
  }

  if ('file' in source) {
    const content = fs.readFileSync(source.file, 'utf-8');
    const format = detectFormat(source.file);
    return { content, format, filePath: path.resolve(source.file) };
  }

  return {
    content: source.content,
    format: source.format ?? 'custom',
  };
}

/**
 * Run lint on content with the given configuration.
 */
function runLint(
  content: string,
  format: FileFormat,
  preset: PresetName,
  ruleOverrides?: Record<string, RuleConfig | Severity>,
  customRules?: CustomRuleDefinition[],
  projectRoot?: string,
): { diagnostics: LintDiagnostic[]; ruleStates: Record<string, Severity> } {
  const document = parse(content, format);
  const registry = createRegistry(preset, ruleOverrides, customRules);
  const enabledRules = registry.getEnabledRules();
  const ruleStates = registry.getRuleStates();
  const diagnostics: LintDiagnostic[] = [];

  for (const { rule, severity, options } of enabledRules) {
    const ruleContext: RuleContext = {
      report(diagnostic) {
        diagnostics.push({
          ruleId: rule.id,
          severity,
          category: rule.category,
          location: diagnostic.location,
          message: diagnostic.message,
          suggestion: diagnostic.suggestion,
          fix: diagnostic.fix,
        });
      },
    };

    // Merge projectRoot into options for reference rules
    const mergedOptions = { ...options };
    if (projectRoot) {
      mergedOptions.projectRoot = projectRoot;
    }

    rule.check(document, ruleContext, Object.keys(mergedOptions).length > 0 ? mergedOptions : undefined);
  }

  return { diagnostics: sortDiagnostics(diagnostics), ruleStates };
}

/**
 * Build a LintReport from diagnostics and metadata.
 */
function buildReport(
  diagnostics: LintDiagnostic[],
  ruleStates: Record<string, Severity>,
  content: string,
  format: FileFormat,
  preset: string,
  filePath?: string,
  startTime?: number,
): LintReport {
  const document = parse(content, format);
  const errors = diagnostics.filter(d => d.severity === 'error').length;
  const warnings = diagnostics.filter(d => d.severity === 'warning').length;
  const infos = diagnostics.filter(d => d.severity === 'info').length;
  const fixable = diagnostics.filter(d => d.fix !== undefined).length;

  return {
    passed: errors === 0,
    filePath,
    format,
    timestamp: new Date().toISOString(),
    durationMs: startTime ? Date.now() - startTime : 0,
    diagnostics,
    summary: {
      total: diagnostics.length,
      errors,
      warnings,
      infos,
      fixable,
    },
    document,
    preset,
    ruleStates,
  };
}

/**
 * Lint an AI instruction file.
 */
export async function lint(options: LintOptions): Promise<LintReport> {
  const startTime = Date.now();
  const { content, format, filePath } = resolveSource(options.source);
  const preset = options.preset ?? 'recommended';

  let projectRoot = options.projectRoot;
  if (!projectRoot && filePath) {
    projectRoot = path.dirname(filePath);
  }

  const { diagnostics, ruleStates } = runLint(
    content,
    format,
    preset,
    options.rules,
    options.customRules,
    projectRoot,
  );

  return buildReport(diagnostics, ruleStates, content, format, preset, filePath, startTime);
}

/**
 * Lint instruction file content provided as a string.
 */
export function lintContent(options: LintContentOptions): LintReport {
  const startTime = Date.now();
  const format = options.format ?? 'custom';
  const preset = options.preset ?? 'recommended';

  const { diagnostics, ruleStates } = runLint(
    options.content,
    format,
    preset,
    options.rules,
    options.customRules,
    options.projectRoot,
  );

  return buildReport(diagnostics, ruleStates, options.content, format, preset, undefined, startTime);
}

/**
 * Scan a directory for AI instruction files and lint each one.
 */
export async function lintDirectory(options: LintDirectoryOptions): Promise<LintReport[]> {
  const reports: LintReport[] = [];
  const directory = path.resolve(options.directory);
  const preset = options.preset ?? 'recommended';

  // Check for known file names in the root
  for (const fileName of KNOWN_FILE_NAMES) {
    const filePath = path.join(directory, fileName);
    if (fs.existsSync(filePath)) {
      const report = await lint({
        source: filePath,
        preset,
        rules: options.rules,
        customRules: options.customRules,
        fix: options.fix,
        projectRoot: directory,
      });
      reports.push(report);
    }
  }

  // Check for known subdirectory files
  for (const subFile of KNOWN_SUBDIRECTORY_FILES) {
    const filePath = path.join(directory, subFile);
    if (fs.existsSync(filePath)) {
      const report = await lint({
        source: filePath,
        preset,
        rules: options.rules,
        customRules: options.customRules,
        fix: options.fix,
        projectRoot: directory,
      });
      reports.push(report);
    }
  }

  return reports;
}

/**
 * Factory function to create a configured linter for reuse.
 */
export function createLinter(config: {
  preset?: PresetName;
  rules?: Record<string, RuleConfig | Severity>;
  customRules?: CustomRuleDefinition[];
}) {
  const preset = config.preset ?? 'recommended';

  return {
    async lint(source: LintSource, projectRoot?: string): Promise<LintReport> {
      return lint({
        source,
        preset,
        rules: config.rules,
        customRules: config.customRules,
        projectRoot,
      });
    },

    lintContent(content: string, format?: FileFormat): LintReport {
      return lintContent({
        content,
        format,
        preset,
        rules: config.rules,
        customRules: config.customRules,
      });
    },
  };
}

/**
 * Factory for creating custom rules with type safety.
 */
export function createRule(definition: CustomRuleDefinition): CustomRuleDefinition {
  return definition;
}
