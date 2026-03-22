# ai-rules-lint

Static analysis and linting for AI instruction files.

[![npm version](https://img.shields.io/npm/v/ai-rules-lint.svg)](https://www.npmjs.com/package/ai-rules-lint)
[![npm downloads](https://img.shields.io/npm/dt/ai-rules-lint.svg)](https://www.npmjs.com/package/ai-rules-lint)
[![license](https://img.shields.io/npm/l/ai-rules-lint.svg)](https://github.com/SiluPanda/ai-rules-lint/blob/master/LICENSE)
[![node](https://img.shields.io/node/v/ai-rules-lint.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

`ai-rules-lint` validates the quality of AI instruction files -- `CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `GEMINI.md`, `copilot-instructions.md`, `.windsurfrules`, `.clinerules`, and any custom markdown instruction file. It catches vague instructions, contradictory rules, stale file references, missing sections, unsafe directives, token waste, and structural problems. The package has zero runtime dependencies, runs offline, and completes in milliseconds.

---

## Installation

```bash
npm install ai-rules-lint
```

Or run directly without installing:

```bash
npx ai-rules-lint ./CLAUDE.md
```

## Quick Start

### Programmatic (TypeScript / JavaScript)

```typescript
import { lintContent } from 'ai-rules-lint';

const report = lintContent({
  content: '# My Rules\n\nBe helpful. Follow best practices.',
  format: 'claude-md',
  preset: 'recommended',
});

console.log(report.passed);           // false
console.log(report.summary.errors);   // 0
console.log(report.summary.warnings); // 2
console.log(report.diagnostics);      // detailed findings
```

### CLI

```bash
# Lint a single file
ai-rules-lint ./CLAUDE.md

# Scan a project for all AI instruction files
ai-rules-lint --scan

# Strict preset with JSON output
ai-rules-lint ./CLAUDE.md --preset strict --format json

# Auto-fix whitespace and empty sections
ai-rules-lint ./CLAUDE.md --fix
```

---

## Features

- **28 built-in rules** across 7 categories: length, structure, content quality, references, anti-patterns, format-specific checks, and efficiency.
- **Format auto-detection** for CLAUDE.md, .cursorrules, AGENTS.md, GEMINI.md, copilot-instructions.md, .windsurfrules, and .clinerules.
- **Stale reference detection** -- verifies that file paths, directories, and npm scripts mentioned in instruction files actually exist in the codebase.
- **Contradiction detection** -- flags "Always use TypeScript" paired with "Write JavaScript when possible" and similar conflicts using keyword opposition, a technology contradiction matrix, and behavioral contradiction patterns.
- **Configurable presets** -- `recommended`, `strict`, `minimal`, and `off`, with per-rule severity overrides.
- **Custom rules API** -- define and register your own lint rules with full type safety.
- **Auto-fix** for mechanically fixable issues (redundant whitespace, empty sections, commented-out content).
- **Multiple output formats** -- human-readable terminal output, JSON, and SARIF v2.1.0 for GitHub Code Scanning and CI integration.
- **Inline disable comments** -- suppress rules for specific regions with `<!-- ai-rules-lint-disable -->`.
- **Zero runtime dependencies** -- uses only Node.js built-ins.
- **CLI with deterministic exit codes** -- 0 for pass, 1 for lint errors, 2 for configuration errors.

---

## API Reference

### `lintContent(options): LintReport`

Lint instruction file content provided as a string. Synchronous. No file I/O.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `content` | `string` | Yes | -- | The instruction file content. |
| `format` | `FileFormat` | No | `'custom'` | File format for format-specific rules. |
| `preset` | `PresetName` | No | `'recommended'` | Rule preset to use as the base configuration. |
| `rules` | `Record<string, RuleConfig \| Severity>` | No | `{}` | Per-rule severity overrides. |
| `customRules` | `CustomRuleDefinition[]` | No | `[]` | Custom rules to evaluate alongside built-in rules. |
| `projectRoot` | `string` | No | `undefined` | Project root for stale reference checking. |
| `fix` | `boolean` | No | `false` | Whether to apply auto-fixes and return fixed text. |

**Returns:** `LintReport`

**Example:**

```typescript
import { lintContent } from 'ai-rules-lint';

const report = lintContent({
  content: `
# Project Rules

Be helpful and follow best practices.
Write clean code. Be thorough.
  `,
  format: 'claude-md',
  preset: 'strict',
});

for (const d of report.diagnostics) {
  console.log(`[${d.severity}] ${d.ruleId}: ${d.message} (line ${d.location.startLine})`);
}
```

---

### `lint(options): Promise<LintReport>`

Lint an instruction file from a file path or inline content. Async (reads from disk when given a file path).

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `source` | `LintSource` | Yes | -- | File path string, `{ file: string }`, or `{ content: string; format?: FileFormat }`. |
| `preset` | `PresetName` | No | `'recommended'` | Rule preset. |
| `rules` | `Record<string, RuleConfig \| Severity>` | No | `{}` | Per-rule overrides. |
| `customRules` | `CustomRuleDefinition[]` | No | `[]` | Custom rules. |
| `projectRoot` | `string` | No | auto-detected | Project root for reference checking. |
| `fix` | `boolean` | No | `false` | Apply auto-fixes. |

**Returns:** `Promise<LintReport>`

**Example:**

```typescript
import { lint } from 'ai-rules-lint';

const report = await lint({
  source: './CLAUDE.md',
  preset: 'recommended',
});

console.log(report.summary);
// { total: 6, errors: 2, warnings: 3, infos: 1, fixable: 0 }
```

**Example with auto-fix:**

```typescript
const report = await lint({
  source: './CLAUDE.md',
  preset: 'recommended',
  fix: true,
});

if (report.fixed) {
  console.log('Fixed content available in report.fixed');
  console.log(`${report.summary.fixable} issues auto-fixed`);
}
```

---

### `lintDirectory(options): Promise<LintReport[]>`

Scan a directory for all AI instruction files and lint each one. Checks known file names at the project root and in `.claude/`, `.cursor/`, `.github/` subdirectories.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `directory` | `string` | Yes | -- | Directory path to scan. |
| `preset` | `PresetName` | No | `'recommended'` | Rule preset. |
| `rules` | `Record<string, RuleConfig \| Severity>` | No | `{}` | Per-rule overrides. |
| `customRules` | `CustomRuleDefinition[]` | No | `[]` | Custom rules. |
| `fix` | `boolean` | No | `false` | Apply auto-fixes. |

**Returns:** `Promise<LintReport[]>`

**Example:**

```typescript
import { lintDirectory } from 'ai-rules-lint';

const reports = await lintDirectory({
  directory: '/path/to/project',
  preset: 'recommended',
});

for (const report of reports) {
  if (!report.passed) {
    console.error(
      `${report.filePath}: ${report.summary.errors} errors, ${report.summary.warnings} warnings`
    );
  }
}
```

---

### `createLinter(config): Linter`

Factory function that creates a reusable linter instance with a shared configuration. Useful when linting multiple files with the same rules.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `preset` | `PresetName` | No | `'recommended'` | Rule preset. |
| `rules` | `Record<string, RuleConfig \| Severity>` | No | `{}` | Per-rule overrides. |
| `customRules` | `CustomRuleDefinition[]` | No | `[]` | Custom rules. |

**Returns:** An object with:
- `lint(filePath: string): Promise<LintReport>` -- lint a file using the shared configuration.
- `lintContent(content: string, format?: FileFormat): LintReport` -- lint a string.

**Example:**

```typescript
import { createLinter } from 'ai-rules-lint';

const linter = createLinter({
  preset: 'strict',
  rules: {
    'max-length': { severity: 'error', options: { maxTokens: 3000 } },
    'personality-instruction': 'off',
  },
});

const report1 = await linter.lint('./CLAUDE.md');
const report2 = await linter.lint('./.cursorrules');
```

---

### `createRule(definition): CustomRuleDefinition`

Factory function for creating custom lint rules with type safety.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Unique rule ID (kebab-case). Must not conflict with built-in IDs. |
| `category` | `RuleCategory` | Yes | `'length'` \| `'structure'` \| `'content'` \| `'reference'` \| `'anti-pattern'` \| `'format-specific'` \| `'efficiency'` |
| `defaultSeverity` | `Severity` | Yes | Default severity when no override is configured. |
| `description` | `string` | Yes | Human-readable description of what the rule checks. |
| `check` | `(document: InstructionDocument, context: RuleContext) => void \| Promise<void>` | Yes | The check function that inspects the document and reports diagnostics. |

**Returns:** `CustomRuleDefinition`

**Example:**

```typescript
import { createRule, lintContent } from 'ai-rules-lint';

const requireTeamSection = createRule({
  id: 'require-team-section',
  category: 'structure',
  defaultSeverity: 'warning',
  description: 'Instruction file must include a team/ownership section.',
  check: (document, context) => {
    const hasTeamSection = document.sections.some(
      s => s.title && /team|owner|maintainer|contact/i.test(s.title)
    );
    if (!hasTeamSection) {
      context.report({
        message: 'Instruction file is missing a team/ownership section.',
        location: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
        suggestion: 'Add a section like "## Team" listing the project owners.',
      });
    }
  },
});

const report = lintContent({
  content: '# Rules\n\nUse TypeScript.',
  customRules: [requireTeamSection],
});
```

---

## Built-in Rules

### Length Rules

| Rule ID | Default Severity | Description |
|---------|-----------------|-------------|
| `max-length` | warning | File exceeds configurable max token count (default: 5,000 estimated tokens). |
| `min-length` | info | File is below configurable min token count (default: 50 estimated tokens). |
| `section-length` | info | Individual section exceeds configurable max token count (default: 1,500 estimated tokens). |

### Structure Rules

| Rule ID | Default Severity | Auto-fix | Description |
|---------|-----------------|----------|-------------|
| `missing-sections` | warning | No | Missing expected sections (Project Overview, Coding Conventions, File Structure, Testing). |
| `no-headers` | warning | No | No markdown headers found in the file. |
| `deep-nesting` | info | No | Headers nested deeper than configurable max depth (default: 4). |
| `empty-section` | warning | Yes | Section header with no content before the next header or end of file. |
| `wall-of-text` | info | No | Large unstructured text block exceeding configurable threshold (default: 3,000 chars). |

### Content Quality Rules

| Rule ID | Default Severity | Description |
|---------|-----------------|-------------|
| `vague-instruction` | warning | Vague instructions detected ("be helpful", "follow best practices", "write clean code"). |
| `redundant-instruction` | info | Near-duplicate instructions detected via normalized Jaccard similarity (threshold: 0.85). |
| `contradictory-rules` | error | Contradictory instructions found (always/never pairs, technology conflicts, behavioral contradictions). |
| `unsafe-instruction` | error | Unsafe directives ("no restrictions", "execute any command", "ignore errors", "push without review"). |
| `missing-specificity` | warning | Generic language with vague qualifiers ("appropriate", "proper", "good") lacking concrete detail. |
| `hardcoded-paths` | warning | Absolute user/machine-specific paths (`/Users/`, `/home/`, `C:\Users\`). |

### Reference Rules

| Rule ID | Default Severity | Description |
|---------|-----------------|-------------|
| `stale-reference` | warning | Referenced file or directory does not exist in the project. |
| `nonexistent-command` | info | npm script referenced in a code block is not defined in `package.json`. |

### Anti-Pattern Rules

| Rule ID | Default Severity | Description |
|---------|-----------------|-------------|
| `personality-instruction` | info | Personality traits wasting tokens ("be friendly", "be enthusiastic", "show empathy"). |
| `negative-only` | info | Section has >70% negative instructions without positive guidance. |
| `too-many-rules` | info | File contains more than configurable max instructions (default: 100). |
| `no-examples` | info | Coding conventions present but no code block examples. |
| `todo-placeholder` | warning | TODO, FIXME, XXX, or HACK markers indicating incomplete content. |
| `dated-content` | info | Temporal references ("As of January 2024", "currently", "recently") that may be stale. |

### Format-Specific Rules

| Rule ID | Default Severity | Description |
|---------|-----------------|-------------|
| `claude-md-format` | info | CLAUDE.md missing recommended sections (workflow, coding conventions, project context). |
| `cursorrules-format` | info | .cursorrules using problematic formatting or excessive length. |
| `agents-md-format` | info | AGENTS.md placement or scope boundary issues. |
| `copilot-instructions-format` | info | copilot-instructions.md location or length issues. |

### Efficiency Rules

| Rule ID | Default Severity | Auto-fix | Description |
|---------|-----------------|----------|-------------|
| `redundant-whitespace` | info | Yes | Excessive blank lines, trailing whitespace. |
| `commented-out-content` | info | Yes | HTML comments containing old instructions (not lint directives). |
| `excessive-formatting` | info | No | Bold/italic on entire paragraphs, ASCII art, emoji overuse, deep blockquote nesting. |

---

## Configuration

### Configuration File

`ai-rules-lint` searches for a configuration file in the current directory and ancestor directories:

1. `.ai-rules-lint.json`
2. `.ai-rules-lint.yaml`
3. `.ai-rules-lintrc` (JSON format)
4. `ai-rules-lint` key in `package.json`

Use `--config <path>` to specify an explicit configuration file.

### Configuration File Format

```json
{
  "preset": "recommended",
  "rules": {
    "max-length": {
      "severity": "error",
      "options": {
        "maxTokens": 3000
      }
    },
    "contradictory-rules": "error",
    "personality-instruction": "off",
    "missing-sections": {
      "severity": "warning",
      "options": {
        "expectedSections": [
          { "name": "Project Overview", "keywords": ["overview", "about", "context"] },
          { "name": "Coding Conventions", "keywords": ["conventions", "style", "coding"] },
          { "name": "Testing", "keywords": ["testing", "tests"] }
        ]
      }
    },
    "stale-reference": {
      "severity": "warning",
      "options": {
        "checkFiles": true,
        "checkDirectories": true,
        "checkFunctions": false,
        "ignorePaths": ["node_modules/", "dist/", ".next/"]
      }
    }
  }
}
```

### Shorthand Severity

Rule overrides accept either a severity string or a full `RuleConfig` object:

```json
{
  "rules": {
    "personality-instruction": "off",
    "max-length": { "severity": "error", "options": { "maxTokens": 3000 } }
  }
}
```

### Configuration Precedence

Configuration is resolved in this order (later sources override earlier):

1. Built-in defaults (every rule has a `defaultSeverity`).
2. Preset configuration.
3. Configuration file.
4. CLI `--rule` flags.
5. Programmatic `rules` in `LintOptions`.
6. Inline directives in the instruction file.

### Inline Disable Comments

Suppress specific rules for specific regions of an instruction file:

```markdown
<!-- ai-rules-lint-disable vague-instruction -->
Follow best practices for this section.
<!-- ai-rules-lint-enable vague-instruction -->
```

```markdown
<!-- ai-rules-lint-disable-next-line hardcoded-paths -->
The production server is at /opt/app/current.
```

```markdown
<!-- ai-rules-lint-disable -->
This entire section is excluded from all linting.
<!-- ai-rules-lint-enable -->
```

Disable all inline directives with `"noInlineConfig": true` in the configuration file.

### Custom Rules via Config File

External rule files can be loaded via the `plugins` key:

```json
{
  "preset": "recommended",
  "plugins": ["./lint-rules/company-rules.js"]
}
```

Where `company-rules.js` exports an array of `CustomRuleDefinition` objects:

```javascript
module.exports = [
  {
    id: 'require-team-section',
    category: 'structure',
    defaultSeverity: 'warning',
    description: 'All instruction files must include a team section.',
    check: (document, context) => { /* ... */ },
  },
];
```

---

## Presets

### `recommended` (default)

All rules at their default severities. Balanced for most projects.

### `strict`

All warnings become errors, all info rules become warnings. Use in CI pipelines that require zero tolerance for instruction file quality issues.

### `minimal`

Only critical rules enabled: `contradictory-rules` (error), `unsafe-instruction` (error), `stale-reference` (warning), `empty-section` (warning), `no-headers` (warning). All other rules disabled. Use for incremental adoption.

### `off`

All rules disabled. Use as a base with explicit per-rule overrides when you want full control.

---

## CLI Reference

```
ai-rules-lint [files/globs...] [options]
```

### Positional Arguments

One or more file paths or glob patterns. If no files are specified, auto-discovers AI instruction files in the current directory.

### Options

| Flag | Description |
|------|-------------|
| `--scan` | Scan the directory for all AI instruction files. |
| `--project-root <path>` | Project root for reference checking and file discovery. Default: current directory. |
| `--preset <name>` | Rule preset: `recommended`, `strict`, `minimal`, `off`. Default: `recommended`. |
| `--rule <id:severity>` | Override severity for a rule (repeatable). Example: `--rule max-length:error`. |
| `--config <path>` | Path to a configuration file. |
| `--fix` | Apply auto-fixes and write results back to source files. |
| `--fix-dry-run` | Show what fixes would be applied without modifying files. |
| `--format <format>` | Output format: `human`, `json`, `sarif`. Default: `human`. |
| `--quiet` | Suppress all output except errors and the exit code. |
| `--verbose` | Show all diagnostics including info-severity (hidden by default in human output). |
| `--no-color` | Disable colored terminal output. |
| `--max-warnings <n>` | Exit with code 1 if more than n warnings are found. Default: -1 (unlimited). |
| `--version` | Print version and exit. |
| `--help` | Print help and exit. |

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Passed. No error-severity diagnostics (and warning count under `--max-warnings`). |
| `1` | Failed. Error-severity diagnostics found, or warning count exceeded `--max-warnings`. |
| `2` | Configuration error. Invalid flags, no input files, invalid config file, or file read failure. |

### Environment Variables

| Variable | Equivalent Flag |
|----------|-----------------|
| `AI_RULES_LINT_PRESET` | `--preset` |
| `AI_RULES_LINT_FORMAT` | `--format` |
| `AI_RULES_LINT_CONFIG` | `--config` |
| `AI_RULES_LINT_MAX_WARNINGS` | `--max-warnings` |
| `AI_RULES_LINT_PROJECT_ROOT` | `--project-root` |

Explicit CLI flags override environment variables.

---

## Error Handling

`ai-rules-lint` handles errors predictably:

- **File not found**: Returns exit code 2 (CLI) or throws an error (API) when a specified file does not exist.
- **Invalid configuration**: Returns exit code 2 (CLI) or throws an error (API) when the config file contains invalid JSON/YAML or references unknown options.
- **Binary file input**: Gracefully returns an error rather than attempting to parse binary content.
- **Custom rule errors**: If a custom rule's `check` function throws, the error is caught and reported as a diagnostic without crashing the linter. Remaining rules continue to execute.
- **Empty input**: An empty string or empty file is valid input. Applicable rules (such as `min-length` and `no-headers`) will fire as expected.

---

## Advanced Usage

### CI/CD: GitHub Actions with SARIF

```yaml
name: AI Rules Lint
on: [push, pull_request]

jobs:
  lint-ai-rules:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Lint AI instruction files
        run: npx ai-rules-lint --scan --preset recommended --format sarif > ai-rules-lint.sarif

      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: ai-rules-lint.sarif
```

### CI/CD: GitLab CI

```yaml
lint-ai-rules:
  stage: test
  script:
    - npx ai-rules-lint --scan --preset recommended
  allow_failure: false
```

### Pre-commit Hook

```bash
#!/bin/sh
npx ai-rules-lint --scan --preset recommended --quiet
```

With lint-staged:

```json
{
  "lint-staged": {
    "CLAUDE.md": "ai-rules-lint --preset recommended",
    ".cursorrules": "ai-rules-lint --preset recommended",
    "AGENTS.md": "ai-rules-lint --preset recommended",
    ".github/copilot-instructions.md": "ai-rules-lint --preset recommended"
  }
}
```

### npm Script Integration

```json
{
  "scripts": {
    "lint:ai-rules": "ai-rules-lint --scan --preset recommended",
    "test": "vitest run && npm run lint:ai-rules"
  }
}
```

### Gating on Warning Count

```bash
ai-rules-lint --scan --preset recommended --max-warnings 5
```

Exits with code 1 if more than 5 warnings are found, even if there are zero errors.

---

## Supported Formats

Format is auto-detected from the file name:

| Format ID | File Names | Tool |
|-----------|-----------|------|
| `claude-md` | `CLAUDE.md`, `.claude/CLAUDE.md` | Anthropic Claude Code |
| `cursorrules` | `.cursorrules`, `.cursor/rules/*.mdc` | Cursor |
| `agents-md` | `AGENTS.md`, `.github/AGENTS.md` | Microsoft Copilot |
| `gemini-md` | `GEMINI.md` | Google Gemini CLI |
| `copilot-instructions` | `copilot-instructions.md`, `.github/copilot-instructions.md` | GitHub Copilot |
| `windsurfrules` | `.windsurfrules` | Windsurf (Codeium) |
| `clinerules` | `.clinerules` | Cline |
| `custom` | Any `.md` file | Any |

---

## TypeScript

`ai-rules-lint` is written in TypeScript and ships type declarations. All public types are exported from the package root:

```typescript
import type {
  LintReport,
  LintDiagnostic,
  LintOptions,
  LintContentOptions,
  LintDirectoryOptions,
  LintSummary,
  InstructionDocument,
  Section,
  InstructionStatement,
  Reference,
  FileFormat,
  Severity,
  RuleConfig,
  CustomRuleDefinition,
  RuleContext,
  SourceLocation,
  Fix,
} from 'ai-rules-lint';
```

### Key Type Definitions

```typescript
type FileFormat =
  | 'claude-md'
  | 'cursorrules'
  | 'agents-md'
  | 'gemini-md'
  | 'copilot-instructions'
  | 'windsurfrules'
  | 'clinerules'
  | 'custom';

type Severity = 'error' | 'warning' | 'info' | 'off';

interface LintReport {
  passed: boolean;
  filePath?: string;
  format: FileFormat;
  timestamp: string;
  durationMs: number;
  diagnostics: LintDiagnostic[];
  summary: LintSummary;
  document: InstructionDocument;
  preset: string;
  ruleStates: Record<string, Severity>;
  fixed?: string;
}

interface LintDiagnostic {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  location: SourceLocation;
  message: string;
  suggestion?: string;
  fix?: Fix;
}

interface LintSummary {
  total: number;
  errors: number;
  warnings: number;
  infos: number;
  fixable: number;
}

interface SourceLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

interface InstructionDocument {
  source: string;
  format: FileFormat;
  characterCount: number;
  estimatedTokens: number;
  wordCount: number;
  lineCount: number;
  sections: Section[];
  instructions: InstructionStatement[];
  references: Reference[];
  detectedCategories: string[];
}

interface CustomRuleDefinition {
  id: string;
  category: string;
  defaultSeverity: Severity;
  description: string;
  check: (document: InstructionDocument, context: RuleContext) => void | Promise<void>;
}
```

---

## License

MIT
