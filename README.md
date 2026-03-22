# ai-rules-lint

Static analysis tool for AI instruction files (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `GEMINI.md`, `copilot-instructions.md`, `.windsurfrules`, `.clinerules`, and custom markdown files).

Catches vague instructions, contradictory rules, stale file references, missing sections, unsafe directives, token waste, and more. Zero runtime dependencies. Runs offline in milliseconds.

## Install

```bash
npm install ai-rules-lint
```

## Quick Start

```typescript
import { lintContent } from 'ai-rules-lint';

const report = lintContent({
  content: '# My Rules\n\nBe helpful. Follow best practices.',
  format: 'claude-md',
  preset: 'recommended',
});

console.log(report.passed);          // false
console.log(report.summary.errors);  // 0
console.log(report.summary.warnings); // 2
console.log(report.diagnostics);     // detailed findings
```

## API

### `lintContent(options): LintReport`

Lint instruction file content provided as a string.

```typescript
const report = lintContent({
  content: string,       // The instruction file content
  format?: FileFormat,   // 'claude-md' | 'cursorrules' | 'agents-md' | 'custom' | ...
  preset?: PresetName,   // 'recommended' | 'strict' | 'minimal' | 'off'
  rules?: Record<string, RuleConfig | Severity>,  // Per-rule overrides
  customRules?: CustomRuleDefinition[],
  projectRoot?: string,  // For stale reference checking
});
```

### `lint(options): Promise<LintReport>`

Lint an instruction file from disk.

```typescript
import { lint } from 'ai-rules-lint';

const report = await lint({
  source: './CLAUDE.md',
  preset: 'recommended',
});
```

### `lintDirectory(options): Promise<LintReport[]>`

Scan a directory for all AI instruction files and lint each one.

```typescript
import { lintDirectory } from 'ai-rules-lint';

const reports = await lintDirectory({
  directory: '/path/to/project',
  preset: 'recommended',
});
```

### `createLinter(config)`

Factory function for creating a reusable linter instance.

```typescript
import { createLinter } from 'ai-rules-lint';

const linter = createLinter({
  preset: 'strict',
  rules: {
    'max-length': { severity: 'error', options: { maxTokens: 3000 } },
  },
});

const report = linter.lintContent('# Rules\n...');
```

### `createRule(definition): CustomRuleDefinition`

Create a custom lint rule.

```typescript
import { createRule, lintContent } from 'ai-rules-lint';

const myRule = createRule({
  id: 'require-team-section',
  category: 'structure',
  defaultSeverity: 'warning',
  description: 'Requires a team/ownership section.',
  check(document, context) {
    const has = document.sections.some(s => s.title?.includes('Team'));
    if (!has) {
      context.report({
        message: 'Missing team section.',
        location: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
      });
    }
  },
});

const report = lintContent({
  content: '# Rules\n\nUse TypeScript.',
  customRules: [myRule],
});
```

## Built-in Rules

| Rule ID | Category | Default Severity | Description |
|---|---|---|---|
| `max-length` | length | warning | File exceeds max token count |
| `min-length` | length | info | File is too short to be useful |
| `section-length` | length | info | Section exceeds max token count |
| `missing-sections` | structure | warning | Missing expected sections |
| `no-headers` | structure | warning | No markdown headers found |
| `deep-nesting` | structure | info | Headers nested too deeply |
| `empty-section` | structure | warning | Section has no content |
| `wall-of-text` | structure | info | Large unstructured text block |
| `vague-instruction` | content | warning | Vague instructions detected |
| `redundant-instruction` | content | info | Near-duplicate instructions |
| `contradictory-rules` | content | error | Contradictory instructions |
| `unsafe-instruction` | content | error | Unsafe/dangerous instructions |
| `missing-specificity` | content | warning | Generic language lacking detail |
| `hardcoded-paths` | content | warning | Absolute user-specific paths |
| `stale-reference` | reference | warning | Referenced file does not exist |
| `nonexistent-command` | reference | info | npm script not defined |
| `secrets-in-file` | content | error | API keys or tokens detected |
| `personality-instruction` | anti-pattern | info | Personality traits wasting tokens |
| `negative-only` | anti-pattern | info | Section mostly negative rules |
| `too-many-rules` | anti-pattern | info | Too many instructions |
| `no-examples` | anti-pattern | info | No code examples provided |
| `todo-placeholder` | anti-pattern | warning | TODO/FIXME markers |
| `dated-content` | anti-pattern | info | Temporal references |
| `redundant-whitespace` | efficiency | info | Excessive whitespace |
| `commented-out-content` | efficiency | info | HTML comments wasting tokens |
| `excessive-formatting` | efficiency | info | Heavy formatting wasting tokens |

## Presets

- **`recommended`** (default): All rules at their default severities.
- **`strict`**: All rules at elevated severities (warnings become errors).
- **`minimal`**: Only critical rules (contradictions, unsafe, secrets, stale refs, no headers, max length).
- **`off`**: All built-in rules disabled. Use with custom rules.

## LintReport

```typescript
interface LintReport {
  passed: boolean;          // true if no errors
  format: FileFormat;
  timestamp: string;        // ISO 8601
  durationMs: number;
  diagnostics: LintDiagnostic[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
    fixable: number;
  };
  document: InstructionDocument;  // Parsed representation
  preset: string;
  ruleStates: Record<string, Severity>;
}
```

## Supported Formats

Auto-detected from file name:

- `CLAUDE.md` / `.claude/CLAUDE.md`
- `.cursorrules` / `.cursor/rules/*.mdc`
- `AGENTS.md` / `.github/AGENTS.md`
- `GEMINI.md`
- `copilot-instructions.md` / `.github/copilot-instructions.md`
- `.windsurfrules`
- `.clinerules`
- Any `.md` file (treated as `custom`)

## License

MIT
