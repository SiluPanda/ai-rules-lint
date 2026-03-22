# ai-rules-lint — Task Breakdown

This file tracks all implementation tasks derived from SPEC.md. Tasks are grouped into logical phases matching the implementation roadmap.

---

## Phase 0: Project Scaffolding & Setup

- [x] **Set up dev dependencies** — Install `typescript`, `vitest`, and `eslint` as dev dependencies. Verify `npm run build`, `npm run test`, and `npm run lint` scripts work with the current `package.json` configuration. | Status: done
- [ ] **Add CLI bin entry to package.json** — Add `"bin": { "ai-rules-lint": "./dist/cli.js" }` to `package.json` so the CLI is available as `ai-rules-lint` after install. | Status: not_done
- [ ] **Create directory structure** — Create all directories specified in Section 21: `src/parser/`, `src/rules/`, `src/rules/length/`, `src/rules/structure/`, `src/rules/content/`, `src/rules/reference/`, `src/rules/anti-pattern/`, `src/rules/format-specific/`, `src/rules/efficiency/`, `src/config/`, `src/formatters/`, `src/discovery/`, `src/utils/`, `src/__tests__/`, `src/__tests__/parser/`, `src/__tests__/rules/`, `src/__tests__/formatters/`, `src/__tests__/fixtures/`, `src/__tests__/fixtures/configs/`. | Status: not_done
- [ ] **Create test fixtures** — Create static fixture files in `src/__tests__/fixtures/`: `well-written-claude.md`, `poorly-written-claude.md`, `contradictory-rules.md`, `stale-references.md`, `sample.cursorrules`, `sample-agents.md`, `minimal-file.md`, `massive-file.md`, `configs/valid-config.json`, `configs/invalid-config.json`, `configs/strict-override.json`. | Status: not_done

---

## Phase 1: Type Definitions

- [x] **Define FileFormat type** — Create `src/types.ts` with the `FileFormat` union type: `'claude-md' | 'cursorrules' | 'agents-md' | 'gemini-md' | 'copilot-instructions' | 'windsurfrules' | 'clinerules' | 'custom'`. | Status: done
- [x] **Define Severity type** — Add `Severity` type: `'error' | 'warning' | 'info' | 'off'`. | Status: done
- [x] **Define SourceLocation interface** — Add `SourceLocation` with `startLine`, `startColumn`, `endLine`, `endColumn` (all 1-based). | Status: done
- [x] **Define Fix interface** — Add `Fix` with `range: SourceLocation` and `replacement: string`. | Status: done
- [x] **Define LintDiagnostic interface** — Add `LintDiagnostic` with `ruleId`, `severity`, `category`, `location`, `message`, optional `suggestion`, optional `fix`. | Status: done
- [x] **Define LintSummary interface** — Add `LintSummary` with `total`, `errors`, `warnings`, `infos`, `fixable` counts. | Status: done
- [x] **Define LintReport interface** — Add `LintReport` with `passed`, optional `filePath`, `format`, `timestamp`, `durationMs`, `diagnostics`, `summary`, `document`, `preset`, `ruleStates`, optional `fixed`. | Status: done
- [x] **Define InstructionDocument interface** — Add `InstructionDocument` with `source`, `format`, `characterCount`, `estimatedTokens`, `wordCount`, `lineCount`, `sections`, `instructions`, `references`, `detectedCategories`. | Status: done
- [x] **Define Section interface** — Add `Section` with `title` (nullable), `level`, `content`, `location`, `characterCount`, `estimatedTokens`, optional `category`. | Status: done
- [x] **Define InstructionStatement interface** — Add `InstructionStatement` with `text`, `isNegative`, `location`. | Status: done
- [x] **Define Reference interface** — Add `Reference` with `value`, `type` (`'file' | 'directory' | 'function' | 'class' | 'command'`), `location`, optional `exists`. | Status: done
- [x] **Define LintSource type** — Add `LintSource` union: `string | { file: string } | { content: string; format?: FileFormat }`. | Status: done
- [x] **Define RuleConfig interface** — Add `RuleConfig` with optional `severity` and optional `options: Record<string, unknown>`. | Status: done
- [x] **Define LintOptions interface** — Add `LintOptions` with `source`, optional `preset`, optional `rules`, optional `customRules`, optional `projectRoot`, optional `fix`. | Status: done
- [x] **Define LintContentOptions interface** — Add `LintContentOptions` with `content`, optional `format`, optional `preset`, optional `rules`, optional `customRules`, optional `projectRoot`, optional `fix`. | Status: done
- [x] **Define LintDirectoryOptions interface** — Add `LintDirectoryOptions` with `directory`, optional `preset`, optional `rules`, optional `customRules`, optional `fix`. | Status: done
- [x] **Define CustomRuleDefinition interface** — Add `CustomRuleDefinition` with `id`, `category`, `defaultSeverity`, `description`, `check` function. | Status: done
- [x] **Define RuleContext interface** — Add `RuleContext` with `report()` method, `severity`, `projectRoot`, `options`. | Status: done

---

## Phase 2: Utility Modules

- [x] **Implement token estimation utility** — Create `src/utils/token-estimate.ts` with a function that estimates token count as `Math.floor(characterCount / 4)`. | Status: done
- [x] **Implement text normalization utility** — Create `src/utils/text.ts` with functions for: lowercasing, whitespace collapsing, punctuation stripping, synonym substitution (`ensure/make sure/verify`, `do not/never/don't`, `always/must/should always`, `use/utilize/employ`), and Jaccard similarity on word trigrams (default threshold 0.85). | Status: done
- [ ] **Implement ANSI color helpers** — Create `src/utils/ansi.ts` with helper functions for terminal coloring using raw ANSI escape codes. Detect color support via `process.stdout.isTTY` and `NO_COLOR` env variable. No external dependencies (no chalk). | Status: not_done

---

## Phase 3: Parser

- [x] **Implement format detector** — Create `src/parser/format-detector.ts`. Auto-detect format from file name/path: exact name match against format registry (case-sensitive), directory context (`.claude/`, `.cursor/`, `.github/`), fallback to `custom` for `.md`/`.mdc` extensions or unrecognized files. Support all 7 format IDs plus `custom`. | Status: done
- [x] **Implement section parser** — Create `src/parser/section-parser.ts`. Parse both ATX-style (`#` through `######`) and setext-style (underlined with `===` or `---`) headers. For each section, record title, level, content, location (line/column range), character count, estimated token count. Handle files with no headers (single unnamed section). | Status: done
- [x] **Implement section categorization** — Within the section parser, categorize sections by matching header text (case-insensitive substring match) against keyword sets for: Project Overview, Coding Conventions, File Structure, Testing, Deployment, Workflow, Dependencies, Error Handling, Security, Performance. | Status: done
- [x] **Implement instruction extractor** — Create `src/parser/instruction-extractor.ts`. Extract imperative statements from the document: sentences starting with verbs (`Use`, `Always`, `Never`, `Make sure`, `Ensure`, `Do not`, `Write`, `Run`, `Check`) or containing modal directives (`must`, `should`, `shall`). Mark each as negative if it contains negation (`don't`, `never`, `do not`, `avoid`). Record source locations. | Status: done
- [x] **Implement reference extractor** — Create `src/parser/reference-extractor.ts`. Extract file path references (inline code paths with extensions, bare paths matching `src/`, `lib/`, `app/`, `./`, paths in code blocks), directory references, function/class name references (backtick-quoted identifiers after keywords like `function`, `class`, `method`, `call`, `use`), and command references from code blocks. Exclude URLs, example paths, and paths in `node_modules/`, `dist/`, `build/`, `.git/`. | Status: done
- [x] **Implement document builder** — Create `src/parser/document-builder.ts`. Assemble an `InstructionDocument` from the parsed sections, instructions, references, and metadata (character count, estimated tokens, word count, line count, detected categories). | Status: done
- [x] **Implement parser entry point** — Create `src/parser/index.ts`. Orchestrate format detection, section parsing, instruction extraction, reference extraction, and document building. Accept raw text and optional file path, return `InstructionDocument`. | Status: done

---

## Phase 4: Configuration System

- [x] **Implement preset definitions** — Create `src/config/presets.ts`. Define all four presets (`recommended`, `strict`, `minimal`, `off`) with exact rule-to-severity mappings per Section 12. `recommended` = default severities, `strict` = all warnings become errors and all info becomes warnings, `minimal` = only 5 critical rules enabled, `off` = all rules disabled. | Status: done
- [ ] **Implement config file loading** — Create `src/config/index.ts`. Search for config files in order: `.ai-rules-lint.json`, `.ai-rules-lint.yaml`, `.ai-rules-lintrc` (JSON), `ai-rules-lint` key in `package.json`. Support `--config` override. Parse JSON configs. Implement minimal inline YAML parser for simple key-value, nested objects, and arrays (no external YAML dependency). | Status: not_done
- [ ] **Implement configuration precedence resolution** — Resolve config in order: built-in defaults, preset, config file, CLI `--rule` flags, programmatic `rules` in `LintOptions`, inline directives. Later sources override earlier ones. Expand shorthand severity strings into full `RuleConfig` objects. | Status: not_done
- [ ] **Implement inline directive parsing** — Create `src/config/inline-directives.ts`. Parse `<!-- ai-rules-lint-disable [rule-name] -->`, `<!-- ai-rules-lint-enable [rule-name] -->`, and `<!-- ai-rules-lint-disable-next-line [rule-name] -->` comments. Track disabled ranges per rule. Support `noInlineConfig` option to ignore all inline directives. | Status: not_done
- [ ] **Implement plugin loading from config** — Support `"plugins": ["./path/to/rules.js"]` in config files. Load external files that export arrays of `CustomRuleDefinition` objects. Validate that custom rule IDs do not conflict with built-in rule IDs. | Status: not_done

---

## Phase 5: Rule Engine

- [x] **Implement createRule factory** — Create `src/rules/create-rule.ts`. Factory function that accepts a `CustomRuleDefinition`-like object and returns a validated rule object. Ensure type safety for the `check` function signature. | Status: done
- [x] **Implement rule runner** — Create `src/rules/rule-runner.ts`. Accept an `InstructionDocument`, a list of rules (built-in + custom), and effective configuration. For each enabled rule, create a `RuleContext`, invoke the rule's `check` function, collect diagnostics. Filter diagnostics against inline directive disabled ranges. Sort diagnostics by severity (errors first) then by location. | Status: done
- [x] **Implement rule registry** — Create `src/rules/index.ts`. Import and register all built-in rules. Export the complete rule list for the rule runner. | Status: done

---

## Phase 6: Built-in Rules — Length

- [x] **Implement max-length rule** — Create `src/rules/length/max-length.ts`. Check if estimated token count exceeds configurable `maxTokens` (default: 5000). Default severity: `warning`. No auto-fix. | Status: done
- [x] **Implement min-length rule** — Create `src/rules/length/min-length.ts`. Check if estimated token count is below configurable `minTokens` (default: 50). Default severity: `info`. No auto-fix. | Status: done
- [x] **Implement section-length rule** — Create `src/rules/length/section-length.ts`. Check if any individual section exceeds configurable `maxTokens` (default: 1500). Default severity: `info`. No auto-fix. | Status: done

---

## Phase 7: Built-in Rules — Structure

- [x] **Implement missing-sections rule** — Create `src/rules/structure/missing-sections.ts`. Check for expected sections using keyword matching against section headers. Configurable `expectedSections` array with `name` and `keywords` fields. Defaults: Project Overview, Coding Conventions, File Structure, Testing. Default severity: `warning`. No auto-fix. | Status: done
- [x] **Implement no-headers rule** — Create `src/rules/structure/no-headers.ts`. Check if the instruction file contains zero markdown headers. Default severity: `warning`. No auto-fix. | Status: done
- [x] **Implement deep-nesting rule** — Create `src/rules/structure/deep-nesting.ts`. Check if any header exceeds configurable `maxDepth` (default: 4, meaning `####` is deepest allowed). Default severity: `info`. No auto-fix. | Status: done
- [x] **Implement empty-section rule** — Create `src/rules/structure/empty-section.ts`. Check for sections (headers) immediately followed by another header or end-of-file with no content (only whitespace). Default severity: `warning`. Auto-fix: remove empty header and surrounding whitespace. | Status: done
- [x] **Implement wall-of-text rule** — Create `src/rules/structure/wall-of-text.ts`. Check for sections or file content with more than configurable `maxLength` (default: 3000) consecutive characters without structural breaks (sub-headers, bullet points, numbered lists, blank lines, horizontal rules, code blocks). Default severity: `info`. No auto-fix. | Status: done

---

## Phase 8: Built-in Rules — Content Quality

- [x] **Implement vague-instruction rule** — Create `src/rules/content/vague-instruction.ts`. Detect vague patterns: "be helpful", "follow best practices", "write clean code", "be concise", "be thorough", "do your best", "be accurate", "be professional", "use common sense", "be smart about it", "use good judgment", "write high-quality code", "follow the conventions", "keep things simple", "be efficient". Default severity: `warning`. No auto-fix. | Status: done
- [x] **Implement redundant-instruction rule** — Create `src/rules/content/redundant-instruction.ts`. Detect near-duplicate instructions using normalized comparison: lowercase, collapse whitespace, strip punctuation, synonym substitution, then Jaccard similarity on word trigrams (threshold: 0.85). Default severity: `info`. No auto-fix. | Status: done
- [x] **Implement contradictory-rules rule** — Create `src/rules/content/contradictory-rules.ts`. Detect contradictions via: always/never keyword pairs with same subject, use/avoid pairs with same technology, technology contradiction matrix (TypeScript/JavaScript, React/Vue/Angular/Svelte, Redux/MobX/Zustand/Jotai, Jest/Mocha/Vitest, npm/yarn/pnpm, tabs/spaces, single/double quotes, semicolons/no-semicolons, CommonJS/ESM), and behavioral contradictions (concise/thorough, ask/don't-ask, minimal-comments/comment-extensively, small-commits/all-at-once). Default severity: `error`. No auto-fix. | Status: done
- [x] **Implement unsafe-instruction rule** — Create `src/rules/content/unsafe-instruction.ts`. Detect unsafe patterns: "do everything I say", "follow all instructions without question", "no restrictions", "no limitations", "ignore safety", "never refuse", "always comply", "bypass/override/circumvent" safety, "execute any code", "run any command", "delete anything", "modify any file", "ignore errors", "suppress all warnings", "skip validation", "commit directly to main", "push without review", "use sudo", "run as root". Default severity: `error`. No auto-fix. | Status: done
- [x] **Implement missing-specificity rule** — Create `src/rules/content/missing-specificity.ts`. Detect instructions with directive verbs (`use`, `follow`, `handle`, `write`) combined with vague qualifiers (`appropriate`, `proper`, `good`, `right`, `standard`, `correct`) without concrete specification in the same or following sentence. Default severity: `warning`. No auto-fix. | Status: done
- [x] **Implement hardcoded-paths rule** — Create `src/rules/content/hardcoded-paths.ts`. Detect absolute user/machine-specific paths: `/Users/`, `/home/`, `C:\Users\`, `C:\Documents`, `.local`, `.config` with absolute prefixes, `/opt/`, `/var/`, `/tmp/` as project paths. Do not flag relative paths or standard project paths (`src/`, `./config/`). Default severity: `warning`. No auto-fix. | Status: done

---

## Phase 9: Built-in Rules — Reference

- [x] **Implement stale-reference rule** — Create `src/rules/reference/stale-reference.ts`. For each file/directory reference in the document, resolve relative to project root (auto-detected or configured), check existence with `node:fs.existsSync`. Configurable `checkFiles` (default: true), `checkDirectories` (default: true), `checkFunctions` (default: false), `ignorePaths` (default: `["node_modules/", "dist/", "build/"]`). Exclude URLs, example/placeholder paths. Default severity: `warning`. No auto-fix. | Status: done
- [ ] **Implement function/class reference checking** — Within stale-reference or as opt-in extension: when `checkFunctions` is enabled, search `.ts`, `.js`, `.py` source files in `src/`, `lib/`, `app/` for matching export names. Best-effort heuristic search. | Status: not_done
- [x] **Implement nonexistent-command rule** — Create `src/rules/reference/nonexistent-command.ts`. Scan fenced code blocks with `bash`, `sh`, `shell`, or no language tag. Check `npm run <script>` and `npx <package>` references against nearest `package.json` scripts field. Flag custom npm scripts that are referenced but not defined. Default severity: `info`. No auto-fix. | Status: done

---

## Phase 10: Built-in Rules — Anti-Pattern

- [x] **Implement personality-instruction rule** — Create `src/rules/anti-pattern/personality-instruction.ts`. Detect personality/emotional directives: "be friendly", "be warm", "be enthusiastic", "show excitement", "be patient", "be understanding", "be confident", "be assertive", "maintain a professional tone", "be polite", "be courteous", "show empathy", "be cheerful". Default severity: `info`. No auto-fix. | Status: done
- [x] **Implement negative-only rule** — Create `src/rules/anti-pattern/negative-only.ts`. Check if a section or the entire file has more than configurable percentage (default: 70%) of negative instructions ("don't", "never", "do not", "avoid") without corresponding positive guidance. Default severity: `info`. No auto-fix. | Status: done
- [x] **Implement too-many-rules rule** — Create `src/rules/anti-pattern/too-many-rules.ts`. Count distinct imperative instructions. Flag if count exceeds configurable `maxRules` (default: 100). Default severity: `info`. No auto-fix. | Status: done
- [x] **Implement no-examples rule** — Create `src/rules/anti-pattern/no-examples.ts`. Check if file contains coding conventions or output format specs but zero code blocks (fenced blocks with language tags) as examples. Default severity: `info`. No auto-fix. | Status: done
- [x] **Implement todo-placeholder rule** — Create `src/rules/anti-pattern/todo-placeholder.ts`. Detect TODO, FIXME, XXX, HACK, and placeholder markers indicating incomplete content. Default severity: `warning`. No auto-fix. | Status: done
- [x] **Implement dated-content rule** — Create `src/rules/anti-pattern/dated-content.ts`. Detect explicit dates ("As of January 2024", "Updated March 2023", "Since Q3 2023"), temporal references ("recently", "currently", "at the moment", "for now"), and potentially outdated version references. Default severity: `info`. No auto-fix. | Status: done

---

## Phase 11: Built-in Rules — Format-Specific

- [ ] **Implement claude-md-format rule** — Create `src/rules/format-specific/claude-md-format.ts`. Check CLAUDE.md for: workflow/process section, coding conventions section, project context section, recommended header structure (top-level `#`), Goals/Non-Goals section, backtick usage for inline code. Default severity: `info`. No auto-fix. | Status: not_done
- [ ] **Implement cursorrules-format rule** — Create `src/rules/format-specific/cursorrules-format.ts`. Check .cursorrules for: excessive length (lower threshold than CLAUDE.md), formatting Cursor may not parse well (HTML tags, complex nested lists), missing opening statement. Default severity: `info`. No auto-fix. | Status: not_done
- [ ] **Implement agents-md-format rule** — Create `src/rules/format-specific/agents-md-format.ts`. Check AGENTS.md for: correct directory placement, scope boundaries, no duplication from parent AGENTS.md. Default severity: `info`. No auto-fix. | Status: not_done
- [ ] **Implement copilot-instructions-format rule** — Create `src/rules/format-specific/copilot-instructions-format.ts`. Check copilot-instructions.md for: `.github/` location, length limits, effective formatting. Default severity: `info`. No auto-fix. | Status: not_done

---

## Phase 12: Built-in Rules — Efficiency

- [x] **Implement redundant-whitespace rule** — Create `src/rules/efficiency/redundant-whitespace.ts`. Detect more than two consecutive blank lines, trailing whitespace on lines, lines containing only spaces/tabs. Default severity: `info`. Auto-fix: collapse multiple blank lines to single, remove trailing whitespace. | Status: done
- [x] **Implement commented-out-content rule** — Create `src/rules/efficiency/commented-out-content.ts`. Detect HTML comments (`<!-- ... -->`) that contain old instructions rather than lint directives. Default severity: `info`. Auto-fix: remove HTML comments that are not `ai-rules-lint` inline directives. | Status: done
- [x] **Implement excessive-formatting rule** — Create `src/rules/efficiency/excessive-formatting.ts`. Detect bold/italic on entire paragraphs, decorative elements (ASCII art, repeated separators `=====`/`-----`, emoji-heavy sections), nested blockquotes beyond 2 levels. Default severity: `info`. No auto-fix. | Status: done

---

## Phase 13: Auto-Fix System

- [ ] **Implement fix application engine** — Within the lint pipeline, implement fix application: collect all `Fix` objects from diagnostics, sort by range (smallest first for conflict resolution, then reverse offset order for application), apply non-overlapping replacements in reverse order to avoid offset invalidation. Return fixed text in `report.fixed` when `fix: true`. | Status: not_done
- [ ] **Implement fix conflict resolution** — When multiple fixes have overlapping ranges, apply the first (smallest range) and skip conflicting ones. Keep skipped diagnostics in the report as unfixed. | Status: not_done
- [ ] **Implement --fix-dry-run output** — Generate a unified diff showing what auto-fixes would be applied without modifying files. Output to stdout. | Status: not_done

---

## Phase 14: Core Lint Functions

- [x] **Implement lint() function** — Create `src/lint.ts`. Accept `LintOptions`, resolve source (file path or content), read file if path, detect format, parse into `InstructionDocument`, load config, resolve effective rule states, run rule engine, build `LintReport` with timing, optionally apply fixes. Export as primary API. | Status: done
- [x] **Implement lintContent() function** — Create `src/lint-content.ts`. Accept `LintContentOptions` (string content, no file I/O), parse, evaluate, return `LintReport`. Synchronous where possible. | Status: done
- [x] **Implement lintDirectory() function** — Create `src/lint-directory.ts`. Accept `LintDirectoryOptions`, discover AI instruction files in the directory (check known file names at root and in `.claude/`, `.cursor/`, `.github/`), lint each discovered file, return array of `LintReport`. | Status: done
- [x] **Implement createLinter() factory** — Create `src/create-linter.ts`. Accept configuration once (preset, rules, custom rules), return a linter object with `lint(filePath)` method that reuses the configuration across multiple files. | Status: done

---

## Phase 15: File Discovery

- [x] **Implement file discoverer** — Create `src/discovery/file-discoverer.ts`. Check for known instruction file names at project root and in known subdirectories: `CLAUDE.md`, `.claude/CLAUDE.md`, `.cursorrules`, `.cursor/rules/*.mdc`, `AGENTS.md`, `.github/AGENTS.md`, `GEMINI.md`, `copilot-instructions.md`, `.github/copilot-instructions.md`, `.windsurfrules`, `.clinerules`. Constant-time operation (check ~15 specific paths), not recursive traversal. | Status: done

---

## Phase 16: Formatters

- [ ] **Implement human formatter** — Create `src/formatters/human.ts`. Produce colored terminal output with severity badges (`ERROR`, `WARN`, `INFO`), rule IDs, line numbers, messages, and summary line. Hide info-severity diagnostics by default (shown with `--verbose`). Use ANSI helpers for coloring. Respect `--no-color` flag. | Status: not_done
- [ ] **Implement JSON formatter** — Create `src/formatters/json.ts`. Output the complete `LintReport` as pretty-printed JSON to stdout. | Status: not_done
- [ ] **Implement SARIF formatter** — Create `src/formatters/sarif.ts`. Output SARIF v2.1.0 document. Map: `ruleId` to `result.ruleId`, severity `error`/`warning` directly, `info` to `note`, `message` to `result.message.text`, `location` to `result.locations[0].physicalLocation`, `suggestion` to `result.fixes[0].description.text`. Include rule metadata in `run.tool.driver.rules[]`. | Status: not_done
- [ ] **Implement formatter factory** — Create `src/formatters/index.ts`. Accept format name (`human`, `json`, `sarif`), return the appropriate formatter function. | Status: not_done

---

## Phase 17: CLI

- [ ] **Implement CLI argument parsing** — Create `src/cli.ts`. Use `node:util.parseArgs` (Node.js 18+) for flag parsing. Support all flags from Section 14: positional file/glob args, `--scan`, `--project-root`, `--preset`, `--rule` (repeatable), `--config`, `--fix`, `--fix-dry-run`, `--format`, `--quiet`, `--verbose`, `--no-color`, `--max-warnings`, `--version`, `--help`. | Status: not_done
- [ ] **Implement CLI environment variable fallback** — Read `AI_RULES_LINT_PRESET`, `AI_RULES_LINT_FORMAT`, `AI_RULES_LINT_CONFIG`, `AI_RULES_LINT_MAX_WARNINGS`, `AI_RULES_LINT_PROJECT_ROOT` from environment. Explicit CLI flags override env vars. | Status: not_done
- [ ] **Implement CLI auto-discovery mode** — When no files are specified and `--scan` is not set, auto-discover AI instruction files in the current directory. When `--scan` is set, use `lintDirectory()` for comprehensive scanning. | Status: not_done
- [ ] **Implement CLI exit codes** — Exit 0 for no errors (and warnings under `--max-warnings` threshold), exit 1 for errors found or warning count exceeded, exit 2 for configuration/usage errors (invalid flags, no input files, invalid config, file read failure). | Status: not_done
- [ ] **Implement CLI --fix behavior** — When `--fix` is specified, write fixed content back to source files in place, then re-run linter to report remaining unfixable diagnostics. | Status: not_done
- [ ] **Implement CLI --help output** — Print usage information matching the spec's command/flag documentation. | Status: not_done
- [ ] **Implement CLI --version output** — Print package version from `package.json` and exit. | Status: not_done
- [ ] **Implement CLI --quiet mode** — Suppress all output except the exit code. Overrides `--format`. | Status: not_done
- [ ] **Implement CLI glob pattern support** — Accept glob patterns as positional arguments. Implement pattern matching using `node:fs` directory reading (no external glob library). | Status: not_done
- [ ] **Add shebang to cli.ts** — Add `#!/usr/bin/env node` shebang at top of `src/cli.ts` for direct execution. | Status: not_done

---

## Phase 18: Public API Exports

- [x] **Wire up index.ts exports** — Update `src/index.ts` to export: `lint`, `lintContent`, `lintDirectory`, `createLinter`, `createRule`, and all public type definitions (`LintReport`, `LintDiagnostic`, `LintOptions`, `LintContentOptions`, `LintDirectoryOptions`, `InstructionDocument`, `FileFormat`, `Severity`, `RuleConfig`, `CustomRuleDefinition`, `RuleContext`, `SourceLocation`, `Fix`, `LintSummary`, `Section`, `InstructionStatement`, `Reference`). | Status: done

---

## Phase 19: Unit Tests — Parser

- [x] **Test section parser — basic headers** — Test ATX-style headers (`#` through `######`). Verify title, level, content, location extraction for a file with multiple sections. | Status: done
- [x] **Test section parser — setext headers** — Test setext-style headers (underlined with `===` and `---`). Verify they are treated as level 1 and 2 respectively. | Status: done
- [x] **Test section parser — no headers** — Test a file with no headers. Verify the entire file is treated as a single unnamed section. | Status: done
- [ ] **Test section parser — only headers** — Test a file with only headers and no body content. | Status: not_done
- [ ] **Test section parser — deeply nested** — Test a file with 6 levels of header nesting. | Status: not_done
- [x] **Test section parser — empty input** — Test empty string input. | Status: done
- [x] **Test section parser — section categorization** — Test keyword matching against all 10 category keyword sets. Verify case-insensitive substring matching. | Status: done
- [x] **Test instruction extractor — imperative verbs** — Test extraction of sentences starting with `Use`, `Always`, `Never`, `Make sure`, `Ensure`, `Do not`, `Write`, `Run`, `Check`. | Status: done
- [x] **Test instruction extractor — modal directives** — Test extraction of sentences containing `must`, `should`, `shall`. | Status: done
- [x] **Test instruction extractor — negative detection** — Test that instructions with `don't`, `never`, `do not`, `avoid` are marked `isNegative: true`. | Status: done
- [x] **Test reference extractor — inline code paths** — Test extraction of file paths inside backticks with recognized extensions. | Status: done
- [ ] **Test reference extractor — bare paths** — Test extraction of paths matching `src/`, `lib/`, `app/`, `test/`, `config/`, `./` patterns. | Status: not_done
- [ ] **Test reference extractor — paths in code blocks** — Test extraction of paths inside fenced code blocks. | Status: not_done
- [x] **Test reference extractor — URL exclusion** — Test that paths inside URLs are not extracted. | Status: done
- [x] **Test reference extractor — example path exclusion** — Test that `example/`, `your-project/`, `path/to/` paths are excluded. | Status: done
- [ ] **Test reference extractor — command extraction** — Test extraction of `npm run`, `npx` commands from code blocks. | Status: not_done
- [x] **Test format detector — all formats** — Test each known file name maps to its correct format. Test directory-context detection (`.claude/CLAUDE.md`, `.github/copilot-instructions.md`). Test fallback to `custom` for `.md` files and unrecognized extensions. | Status: done

---

## Phase 20: Unit Tests — Rules

- [x] **Test max-length — pass** — File under threshold produces zero diagnostics. | Status: done
- [x] **Test max-length — fail** — File over threshold produces one diagnostic with correct severity, ruleId, message. | Status: done
- [ ] **Test max-length — at threshold** — File at exactly the threshold. Verify boundary behavior. | Status: not_done
- [x] **Test max-length — custom options** — Override `maxTokens` and verify the custom threshold is used. | Status: done
- [x] **Test min-length — pass** — File above minimum produces zero diagnostics. | Status: done
- [x] **Test min-length — fail** — File below minimum produces one diagnostic. | Status: done
- [x] **Test section-length — pass** — All sections under threshold. | Status: done
- [x] **Test section-length — fail** — One section over threshold. Verify diagnostic references the correct section. | Status: done
- [x] **Test missing-sections — pass** — File with all expected sections present. | Status: done
- [x] **Test missing-sections — fail** — File missing some expected sections. Verify diagnostic lists missing sections. | Status: done
- [ ] **Test missing-sections — custom expected sections** — Override `expectedSections` and verify custom keywords work. | Status: not_done
- [x] **Test no-headers — pass** — File with headers produces zero diagnostics. | Status: done
- [x] **Test no-headers — fail** — File with no headers produces one diagnostic. | Status: done
- [x] **Test deep-nesting — pass** — File with headers up to level 4. | Status: done
- [x] **Test deep-nesting — fail** — File with `#####` header. Verify diagnostic. | Status: done
- [x] **Test empty-section — pass** — All sections have content. | Status: done
- [x] **Test empty-section — fail** — Header followed immediately by another header. | Status: done
- [ ] **Test empty-section — auto-fix** — Verify fix removes empty header and surrounding whitespace correctly. | Status: not_done
- [x] **Test wall-of-text — pass** — Text with structural breaks under threshold. | Status: done
- [x] **Test wall-of-text — fail** — Dense text block exceeding threshold. | Status: done
- [x] **Test vague-instruction — pass** — File with specific instructions. | Status: done
- [x] **Test vague-instruction — fail** — File with "follow best practices", "be helpful", etc. Verify each pattern is detected. | Status: done
- [x] **Test redundant-instruction — pass** — File with no duplicate instructions. | Status: done
- [x] **Test redundant-instruction — fail** — File with near-duplicate instructions detected via normalized comparison. | Status: done
- [x] **Test contradictory-rules — pass** — File with non-contradictory instructions. | Status: done
- [x] **Test contradictory-rules — always/never pair** — "Always use X" + "Never use X" detected. | Status: done
- [x] **Test contradictory-rules — use/avoid pair** — "Use X" + "Avoid X" detected. | Status: done
- [ ] **Test contradictory-rules — technology matrix** — "Use React" + "Use Vue" detected. | Status: not_done
- [ ] **Test contradictory-rules — behavioral contradictions** — "Be concise" + "Be thorough" detected. | Status: not_done
- [ ] **Test contradictory-rules — near-contradictions that should not fire** — Verify false positive avoidance for nuanced instructions. | Status: not_done
- [x] **Test unsafe-instruction — pass** — File with safe instructions. | Status: done
- [x] **Test unsafe-instruction — fail** — File with unsafe patterns. Verify each pattern is detected. | Status: done
- [x] **Test missing-specificity — pass** — Specific instructions with concrete guidance. | Status: done
- [x] **Test missing-specificity — fail** — Instructions with vague qualifiers ("appropriate", "proper"). | Status: done
- [x] **Test hardcoded-paths — pass** — File with only relative/project paths. | Status: done
- [x] **Test hardcoded-paths — fail** — File with `/Users/alice/...`, `/home/bob/...`, `C:\Users\...` paths. | Status: done
- [ ] **Test stale-reference — pass** — References to files that exist. Requires temp directory fixture. | Status: not_done
- [ ] **Test stale-reference — fail** — References to files that do not exist. | Status: not_done
- [ ] **Test stale-reference — ignore patterns** — Verify `ignorePaths` config excludes specified paths. | Status: not_done
- [ ] **Test stale-reference — paths with spaces/special chars** — Edge case for file paths containing spaces or special characters. | Status: not_done
- [ ] **Test nonexistent-command — pass** — npm scripts that exist in package.json. | Status: not_done
- [ ] **Test nonexistent-command — fail** — npm scripts referenced but not defined. | Status: not_done
- [x] **Test personality-instruction — pass** — File with no personality instructions. | Status: done
- [x] **Test personality-instruction — fail** — File with "be friendly", "be enthusiastic", etc. | Status: done
- [x] **Test negative-only — pass** — Section with balanced positive/negative instructions. | Status: done
- [x] **Test negative-only — fail** — Section with >70% negative instructions. | Status: done
- [x] **Test too-many-rules — pass** — File with fewer than 100 instructions. | Status: done
- [x] **Test too-many-rules — fail** — File with more than 100 instructions. | Status: done
- [x] **Test no-examples — pass** — File with coding conventions and code block examples. | Status: done
- [x] **Test no-examples — fail** — File with coding conventions but no code blocks. | Status: done
- [x] **Test todo-placeholder — pass** — File with no TODO/FIXME markers. | Status: done
- [x] **Test todo-placeholder — fail** — File with TODO, FIXME, XXX, HACK markers. | Status: done
- [x] **Test dated-content — pass** — File with no temporal language. | Status: done
- [x] **Test dated-content — fail** — File with "As of January 2024", "currently", "recently". | Status: done
- [ ] **Test claude-md-format — pass** — Well-structured CLAUDE.md. | Status: not_done
- [ ] **Test claude-md-format — fail** — CLAUDE.md missing recommended sections. | Status: not_done
- [ ] **Test cursorrules-format** — Test .cursorrules-specific checks. | Status: not_done
- [ ] **Test agents-md-format** — Test AGENTS.md-specific checks. | Status: not_done
- [ ] **Test copilot-instructions-format** — Test copilot-instructions.md-specific checks. | Status: not_done
- [x] **Test redundant-whitespace — pass** — File with no excessive whitespace. | Status: done
- [x] **Test redundant-whitespace — fail** — File with triple blank lines and trailing spaces. | Status: done
- [ ] **Test redundant-whitespace — auto-fix** — Verify fix collapses blank lines and removes trailing whitespace. | Status: not_done
- [x] **Test commented-out-content — pass** — File with no HTML comments or only lint directives. | Status: done
- [x] **Test commented-out-content — fail** — File with HTML comments containing old instructions. | Status: done
- [ ] **Test commented-out-content — auto-fix** — Verify fix removes non-directive HTML comments. | Status: not_done
- [x] **Test excessive-formatting — pass** — File with reasonable formatting. | Status: done
- [x] **Test excessive-formatting — fail** — File with bolded paragraphs, ASCII art, emoji overuse. | Status: done

---

## Phase 21: Unit Tests — Configuration & Presets

- [x] **Test preset definitions** — Verify each preset (`recommended`, `strict`, `minimal`, `off`) maps all rule IDs to their expected severity values per Section 12. | Status: done
- [ ] **Test config file parsing — valid JSON** — Parse a valid `.ai-rules-lint.json` config file. Verify rule overrides are applied. | Status: not_done
- [ ] **Test config file parsing — invalid JSON** — Attempt to parse malformed JSON. Verify graceful error. | Status: not_done
- [ ] **Test config file parsing — YAML** — Parse a valid `.ai-rules-lint.yaml` config file. | Status: not_done
- [ ] **Test config file parsing — package.json key** — Extract config from `ai-rules-lint` key in `package.json`. | Status: not_done
- [x] **Test config precedence** — Verify later sources override earlier: defaults < preset < config file < programmatic rules. | Status: done
- [x] **Test shorthand severity expansion** — Verify `"rule-id": "off"` expands to `{ severity: "off" }`. | Status: done
- [ ] **Test config with unknown rule IDs** — Verify graceful handling of unknown rule IDs in config. | Status: not_done
- [ ] **Test inline directive parsing** — Verify `<!-- ai-rules-lint-disable rule-name -->` correctly creates disabled ranges. | Status: not_done
- [ ] **Test inline directive — disable-next-line** — Verify `<!-- ai-rules-lint-disable-next-line rule-name -->` suppresses diagnostics on the next line only. | Status: not_done
- [ ] **Test inline directive — disable all** — Verify `<!-- ai-rules-lint-disable -->` (no rule name) disables all rules in the range. | Status: not_done
- [ ] **Test noInlineConfig option** — Verify that `noInlineConfig: true` ignores all inline directives. | Status: not_done

---

## Phase 22: Unit Tests — Formatters

- [ ] **Test human formatter output** — Verify formatted output includes severity badges, rule IDs, line numbers, messages, and summary for a known report. | Status: not_done
- [ ] **Test human formatter — verbose mode** — Verify info-severity diagnostics are included when verbose is true. | Status: not_done
- [ ] **Test human formatter — no-color mode** — Verify no ANSI escape codes in output when `--no-color`. | Status: not_done
- [ ] **Test JSON formatter output** — Verify output is valid JSON matching the `LintReport` structure. | Status: not_done
- [ ] **Test SARIF formatter output** — Verify output is valid SARIF v2.1.0 with correct field mappings: `ruleId`, `level`, `message.text`, `locations`, `fixes`. | Status: not_done
- [ ] **Test SARIF formatter — severity mapping** — Verify `info` maps to `note`, `error` and `warning` map directly. | Status: not_done

---

## Phase 23: Unit Tests — Core Functions

- [ ] **Test lint() — file path input** — Lint a fixture file by path. Verify report structure. | Status: not_done
- [ ] **Test lint() — content input** — Lint inline content via `{ content: "...", format: "claude-md" }`. | Status: not_done
- [ ] **Test lint() — with fix option** — Verify `report.fixed` contains fixed text when `fix: true`. | Status: not_done
- [x] **Test lintContent() — basic** — Lint a string. Verify diagnostics. | Status: done
- [x] **Test lintContent() — format detection** — Verify format is used when provided, defaults to `custom` when not. | Status: done
- [ ] **Test lintDirectory() — discovers files** — Create temp dir with multiple instruction files. Verify all are found and linted. | Status: not_done
- [x] **Test createLinter() — reuse config** — Create linter, lint two files, verify same config is used. | Status: done
- [x] **Test createRule() — custom rule** — Create a custom rule, register it, verify it runs and produces diagnostics. | Status: done

---

## Phase 24: Unit Tests — CLI

- [ ] **Test CLI argument parsing** — Verify all flags are parsed correctly from argv. | Status: not_done
- [ ] **Test CLI exit code 0** — No errors, verify exit 0. | Status: not_done
- [ ] **Test CLI exit code 1** — Errors found, verify exit 1. | Status: not_done
- [ ] **Test CLI exit code 2** — Invalid config, verify exit 2. | Status: not_done
- [ ] **Test CLI --max-warnings** — Verify exit 1 when warning count exceeds threshold. | Status: not_done
- [ ] **Test CLI environment variable fallback** — Set env vars, verify they are used when flags are absent. | Status: not_done
- [ ] **Test CLI --rule flag** — Verify `--rule max-length:error` overrides severity. | Status: not_done

---

## Phase 25: Integration Tests

- [ ] **Integration test — well-written file** — Lint `well-written-claude.md` with `recommended` preset. Assert zero errors and zero warnings. | Status: not_done
- [ ] **Integration test — poorly-written file** — Lint `poorly-written-claude.md`. Assert expected diagnostics for vague instructions, contradictions, stale references, excessive length, missing sections, personality instructions. | Status: not_done
- [ ] **Integration test — stale reference with temp directory** — Create temp project with specific files, write instruction file referencing existing and non-existing files. Verify `stale-reference` fires only for non-existing files. | Status: not_done
- [ ] **Integration test — format-specific rule scoping** — Lint `.cursorrules` file. Verify `cursorrules-format` fires but `claude-md-format` does not. | Status: not_done
- [ ] **Integration test — auto-fix round-trip** — Apply fixes, re-lint fixed output. Assert fixed issues no longer produce diagnostics and unfixed issues remain. | Status: not_done
- [ ] **Integration test — directory scanning** — Create temp project with `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`. Run `lintDirectory()`, verify all files discovered and linted. | Status: not_done
- [ ] **Integration test — CLI end-to-end** — Run CLI binary against test fixtures. Verify exit codes, stdout output, stderr output for human, JSON, and SARIF formats. | Status: not_done
- [ ] **Integration test — custom rule registration** — Register a custom rule via `customRules` option. Lint a file. Verify custom rule diagnostics appear in report. | Status: not_done
- [ ] **Integration test — inline directives** — Lint a file with `<!-- ai-rules-lint-disable -->` regions. Verify diagnostics inside disabled regions are suppressed. | Status: not_done

---

## Phase 26: Edge Case Tests

- [ ] **Edge case — empty file** — Lint empty string and empty file. Verify graceful handling. | Status: not_done
- [ ] **Edge case — whitespace-only file** — Lint file containing only spaces/newlines. | Status: not_done
- [ ] **Edge case — single header, no content** — Lint file with only `# Title` and nothing else. | Status: not_done
- [ ] **Edge case — large file performance** — Lint a file exceeding 1 MB. Verify it completes in reasonable time (performance test). | Status: not_done
- [ ] **Edge case — binary file input** — Attempt to lint a binary file. Verify graceful error handling. | Status: not_done
- [ ] **Edge case — unrecognized file name** — Lint a file with no recognized instruction file name. Verify `custom` format. | Status: not_done
- [ ] **Edge case — no project root markers** — Lint in a directory with no `package.json` or `.git`. Verify project root detection fallback. | Status: not_done
- [ ] **Edge case — inline disable all rules** — Lint a file with `<!-- ai-rules-lint-disable -->` wrapping entire content. Verify zero diagnostics. | Status: not_done
- [ ] **Edge case — custom rule throws** — Register a custom rule whose `check` function throws. Verify graceful error handling (report error, do not crash). | Status: not_done
- [ ] **Edge case — config with invalid YAML** — Attempt to load malformed YAML config. Verify graceful error. | Status: not_done
- [ ] **Edge case — glob matching zero files** — Run CLI with a glob pattern that matches nothing. Verify exit code 2 and appropriate error message. | Status: not_done

---

## Phase 27: Documentation

- [ ] **Write README.md** — Create comprehensive README with: overview, installation, quick start, CLI usage, API usage examples (`lint`, `lintContent`, `lintDirectory`, `createLinter`, `createRule`), rule catalog with all 28 rules (ID, category, severity, description), preset descriptions, configuration guide (config file format, precedence, inline directives), auto-fix documentation, SARIF/CI integration examples (GitHub Actions, GitLab CI, pre-commit hooks), custom rules guide, and environment variable reference. | Status: not_done
- [ ] **Create example config file** — Create `.ai-rules-lint.json` at project root as an example config and for self-linting the project's own instruction files. | Status: not_done

---

## Phase 28: Build & Publish Preparation

- [ ] **Verify TypeScript compilation** — Run `npm run build` and ensure all source files compile without errors. Verify `dist/` output includes `.js`, `.d.ts`, and `.js.map` files. | Status: not_done
- [ ] **Verify test suite passes** — Run `npm run test` and ensure all tests pass. | Status: not_done
- [ ] **Verify lint passes** — Run `npm run lint` and ensure the project's own source code passes ESLint. | Status: not_done
- [ ] **Bump version** — Bump `package.json` version appropriately before publishing. | Status: not_done
- [ ] **Verify package.json metadata** — Ensure `name`, `version`, `description`, `main`, `types`, `bin`, `files`, `keywords`, `author`, `license`, `engines`, `publishConfig` are all correct. Add relevant keywords: `ai`, `lint`, `linter`, `claude`, `cursor`, `copilot`, `instruction-files`, `ai-rules`, `static-analysis`. | Status: not_done
- [x] **Verify zero runtime dependencies** — Confirm `dependencies` field in `package.json` is empty or absent. All functionality uses only Node.js built-ins. | Status: done
- [ ] **Test npx invocation** — Build the package, then test that `npx ai-rules-lint --help` and `npx ai-rules-lint ./CLAUDE.md` work correctly. | Status: not_done
