# ai-rules-lint

Static analysis tool for AI instruction files (CLAUDE.md, .cursorrules, AGENTS.md, GEMINI.md, copilot-instructions.md, .windsurfrules, .clinerules).

## Install

```bash
npm install ai-rules-lint
```

## Quick Start

```typescript
import { lint } from 'ai-rules-lint';

const result = lint(`
# System Instructions
Be good and do your best.
Always use TypeScript.
Never use TypeScript.
`);

console.log(result.diagnostics);
// [{ ruleId: 'vague-instruction', message: '...' },
//  { ruleId: 'contradictory-rules', message: '...' }]
console.log(result.score); // 0-100
```

## API

### `lint(content, options?): LintResult`
### `lintFile(path, options?): LintResult`
### `createLinter(options): Linter`

## Built-in Rules

- **length**: max-file-length, max-section-length, min-content
- **structure**: missing-heading, empty-section, duplicate-heading
- **content**: vague-instruction, contradictory-rules, redundant-directive
- **security**: unsafe-instruction, secrets-in-file
- **efficiency**: token-waste, excessive-examples

## License

MIT
