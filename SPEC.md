# ai-rules-lint -- Specification

## 1. Overview

`ai-rules-lint` is a static analysis tool for AI instruction files. It parses instruction files -- `CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `GEMINI.md`, `copilot-instructions.md`, `.windsurfrules`, `.clinerules`, and any custom markdown instruction file -- into a structured representation, then evaluates them against a configurable set of lint rules. Rules catch overly long instructions, missing sections, contradictory rules, stale references to files or functions that no longer exist in the codebase, anti-patterns like vague or unsafe instructions, redundant directives, poor structure, and token inefficiency. The result is a structured lint report with per-rule diagnostics, severity levels, source locations, fix suggestions, and machine-readable output suitable for CI/CD gating.

The gap this package fills is specific and well-defined. Every major AI coding tool now has its own instruction file format. Anthropic uses `CLAUDE.md` and `.claude/CLAUDE.md`. Cursor uses `.cursorrules`. Microsoft Copilot uses `AGENTS.md`. Google Gemini uses `GEMINI.md`. GitHub Copilot uses `copilot-instructions.md` and `.github/copilot-instructions.md`. Windsurf uses `.windsurfrules`. Cline uses `.clinerules`. Each format stores the same fundamental content -- system instructions, coding conventions, project context, behavioral rules -- but in a tool-specific file. Tools exist for _syncing_ between these formats: `rulesync` converts `.cursorrules` to `CLAUDE.md` and back, `contexthub` manages shared AI context across tools, and `repomix` generates repository context for AI consumption. But nothing validates the _quality_ of the instructions themselves. A `.cursorrules` file that contains 15,000 tokens of contradictory, vague, and outdated instructions will be faithfully synced to `CLAUDE.md` by `rulesync` -- preserving every quality problem. A `CLAUDE.md` that references `src/utils/helpers.ts` (which was deleted three months ago) wastes the AI's attention on a file that no longer exists. An `AGENTS.md` that says both "Always use TypeScript" and "Write code in JavaScript when possible" confuses the AI into unpredictable behavior. No existing tool catches these problems.

The design is modeled on established linting tools. The architecture mirrors ESLint's rule-based engine: a parser transforms the instruction file into an analyzable intermediate representation (the Instruction Document), a rules engine evaluates named, configurable rules against this representation, and formatters render the results for human or machine consumption. Rules are organized into presets (`recommended`, `strict`, `minimal`, `off`). Users can override severity per rule, disable individual rules, add custom rules via a plugin interface, and suppress specific diagnostics with inline comments (`<!-- ai-rules-lint-disable rule-name -->`). Output formats include human-readable terminal output, JSON, and SARIF (Static Analysis Results Interchange Format) for GitHub Actions annotations and CI tool integration.

`ai-rules-lint` provides both a TypeScript/JavaScript API for programmatic use and a CLI for terminal and shell-script use. The API returns structured `LintReport` objects with per-rule diagnostics, source locations, and fix suggestions. The CLI prints human-readable or machine-readable output and exits with conventional codes (0 for no errors, 1 for lint errors found, 2 for configuration/usage errors). Both interfaces support format auto-detection, codebase-aware reference validation, and configurable rule presets.

---

## 2. Goals and Non-Goals

### Goals

- Provide a function (`lint`) that accepts an AI instruction file (file path, string content, or directory to scan), parses it into an Instruction Document, evaluates all applicable rules, and returns a lint report.
- Parse instruction files into a structured intermediate representation (Instruction Document) that captures sections, headers, instructions, references to files and functions, coding conventions, behavioral rules, and structural metadata -- enabling rule-based analysis.
- Check length: detect instruction files that exceed maximum token/word count thresholds (diminishing returns after ~3,000 tokens), individual sections that are too long, and files that are too short to be useful.
- Check structure: detect missing expected sections (project overview, coding conventions, testing, deployment), absent markdown headers, excessively deep nesting, empty sections, and poor organization.
- Check content quality: detect vague instructions ("be helpful", "follow best practices"), redundant instructions (same rule stated multiple ways), contradictory rules ("always use TypeScript" + "write JavaScript when possible"), unsafe instructions ("do everything I say", "no restrictions"), instructions that lack specificity, and hardcoded absolute paths.
- Check references: detect stale references to files, functions, classes, or APIs that no longer exist in the codebase by scanning the instruction file for path patterns and verifying them against the actual file system.
- Check anti-patterns: detect personality instructions that waste tokens ("be friendly"), negative-only rules without positive guidance, excessive rule counts (diminishing returns), and absence of examples.
- Support all major AI instruction file formats with automatic format detection: `CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `GEMINI.md`, `copilot-instructions.md`, `.windsurfrules`, `.clinerules`, and custom markdown files.
- Provide format-specific rules that check conventions particular to each tool (e.g., CLAUDE.md section recommendations, .cursorrules structure).
- Provide a CLI (`ai-rules-lint`) with JSON, SARIF, and human-readable output, deterministic exit codes, and environment variable configuration for CI integration.
- Support rule presets (`recommended`, `strict`, `minimal`, `off`) and per-rule severity overrides via a configuration file.
- Support custom rules via a plugin API that allows users to write and register their own lint rules.
- Support auto-fixing for mechanically fixable issues (trailing whitespace, redundant blank lines, empty sections, excessive whitespace).
- Provide a directory scanning mode (`lintDirectory`) that discovers and lints all AI instruction files in a project.
- Keep dependencies minimal: zero runtime dependencies. The package uses only Node.js built-ins.

### Non-Goals

- **Not an LLM-based evaluator.** This package does not call any LLM API to evaluate instruction quality. It uses deterministic, pattern-based rules. LLM-based evaluation is slow, expensive, non-deterministic, and requires API keys. `ai-rules-lint` runs offline in milliseconds.
- **Not a format converter.** This package does not convert between instruction file formats (e.g., `.cursorrules` to `CLAUDE.md`). That is what `rulesync` and similar tools do. `ai-rules-lint` validates quality regardless of format.
- **Not a context generator.** This package does not generate instruction file content from repository structure. That is what `repomix`, `aider /init`, and `claude /init` do. `ai-rules-lint` validates instruction files that already exist.
- **Not a prompt engineering tool.** This package lints _instruction files_ (persistent project-level configuration for AI coding tools), not _prompts_ (individual messages sent to LLMs). For prompt linting, use `prompt-lint`. The boundary: instruction files are checked into source control and configure tool behavior across all sessions; prompts are ephemeral per-request messages.
- **Not a natural language understanding system.** The parser uses heuristics, regular expressions, and structural analysis -- not NLU models. It will miss subtle semantic issues that require deep language understanding. The rules are designed to catch common, mechanically detectable quality problems.
- **Not a token counter.** While some rules flag token inefficiency and files that exceed recommended lengths, the package provides estimated token counts (characters / 4), not exact model-specific counts. Use `tiktoken` or model-specific tokenizers for precise counts.
- **Not a configuration manager.** This package does not manage, version, or deploy instruction files. It analyzes them and returns a report.

---

## 3. Target Users and Use Cases

### Developers Maintaining AI Instruction Files

Individual developers who create and maintain `CLAUDE.md`, `.cursorrules`, or similar files in their projects. They run `ai-rules-lint` during development to catch quality issues before they affect AI tool behavior -- stale file references, contradictory rules, vague instructions that waste context window. This is the primary audience.

### Teams Standardizing AI Configuration

Engineering teams that want consistent, high-quality AI instruction files across repositories. They enforce organization-wide standards by running `ai-rules-lint` in CI pipelines with a shared configuration file. A centralized `.ai-rules-lint.json` config defines expected sections (project overview, coding conventions, testing strategy), maximum file length, and required specificity levels. New repositories bootstrap from a template, and the linter ensures the template is maintained.

### CI/CD Pipeline Operators

Teams that gate deployments and merges on instruction file quality. The CLI's deterministic exit codes and SARIF output enable integration with GitHub Actions, GitLab CI, and other CI systems. A pipeline step runs `ai-rules-lint` against all AI instruction files in the repository and blocks the pull request if errors are found -- ensuring that a developer adding "just one more rule" to `CLAUDE.md` does not push the file past the recommended length or introduce a contradiction.

### Open-Source Maintainers

Maintainers of open-source projects that include AI instruction files for contributors. They want to ensure that the instruction file stays accurate as the codebase evolves -- file paths in `CLAUDE.md` that point to real files, function names that exist, coding conventions that match the actual project setup.

### AI Tooling Teams

Teams building tools that consume instruction files (editors, IDE extensions, AI coding assistants). They use `ai-rules-lint` to validate instruction files that users provide, surfacing quality warnings in the tool's UI and helping users write better instructions.

---

## 4. Core Concepts

### Instruction File

An instruction file is a text document -- typically markdown -- that configures an AI coding tool's behavior for a specific project. It lives in the project's repository root (or a tool-specific subdirectory) and is read by the AI tool at the start of every session. Instruction files contain project context, coding conventions, behavioral rules, file structure descriptions, testing strategies, deployment procedures, and other guidance that shapes the AI's responses.

Instruction files differ from prompts in scope and lifecycle. A prompt is a single message sent during one interaction. An instruction file is a persistent configuration that applies to every interaction within a project. Instruction files are checked into source control, reviewed in pull requests, and maintained alongside the code they describe. This persistence creates quality challenges that do not apply to ephemeral prompts: instruction files accumulate rules over time, references go stale as code changes, contradictions emerge as different team members add rules independently, and files grow unbounded because no one cleans up outdated instructions.

### Instruction Document

The Instruction Document is the intermediate representation that `ai-rules-lint` produces by parsing an instruction file. It is the analyzed form of the raw text, containing structural and semantic information extracted by the parser.

An Instruction Document contains:

- **Metadata**: source file path, detected format (CLAUDE.md, .cursorrules, etc.), total character count, estimated token count, word count, line count.
- **Sections**: logical divisions identified by markdown headers, with titles, content, nesting depth, and content length.
- **Instructions**: imperative statements and rules extracted from the text -- sentences that tell the AI what to do or how to behave.
- **References**: file paths, function names, class names, and API references mentioned in the instruction file, along with their locations in the text.
- **Conventions**: coding convention statements extracted from the text (language preferences, formatting rules, naming conventions, library preferences).
- **Inline Directives**: `ai-rules-lint` control comments (`<!-- ai-rules-lint-disable -->`, `<!-- ai-rules-lint-enable -->`).

### File Format

A file format identifies which AI tool the instruction file is intended for. Each format has a specific file name, location, and set of conventions. `ai-rules-lint` auto-detects the format from the file name and path, then applies format-specific rules alongside universal rules.

### Lint Rules

A lint rule is a named check that evaluates a specific quality dimension of an Instruction Document. Each rule has:

- **Rule ID**: a unique kebab-case string identifier (e.g., `max-length`, `contradictory-rules`, `stale-reference`).
- **Category**: the quality dimension it addresses (`length`, `structure`, `content`, `reference`, `anti-pattern`, `format-specific`).
- **Default severity**: `error`, `warning`, or `info`.
- **Check function**: the logic that evaluates the Instruction Document and returns zero or more diagnostics.
- **Documentation**: a human-readable explanation of what the rule checks and why it matters.
- **Auto-fix**: an optional function that returns a corrected version of the problematic text.

### Diagnostics

A diagnostic is a single lint finding. It contains:

- **Rule ID**: which rule produced this diagnostic.
- **Severity**: `error`, `warning`, or `info`.
- **Location**: the line/column range within the source text where the issue was found.
- **Message**: a human-readable explanation of the problem.
- **Suggestion**: an optional fix suggestion (human-readable text).
- **Fix**: an optional auto-fix object containing the replacement text and the range to replace.

### Presets

A preset is a named collection of rule configurations (which rules are enabled and at what severity). Presets allow users to adopt a curated set of rules without configuring each one individually. Built-in presets are `recommended` (balanced defaults), `strict` (everything at highest severity), `minimal` (only critical checks), and `off` (all rules disabled, for use as a base with explicit overrides).

---

## 5. Supported File Formats

### Format Registry

| Format ID | File Names | Tool | Notes |
|---|---|---|---|
| `claude-md` | `CLAUDE.md`, `.claude/CLAUDE.md` | Anthropic Claude Code | Markdown. Supports hierarchical project instructions (workspace, project, user). |
| `cursorrules` | `.cursorrules`, `.cursor/rules/*.mdc` | Cursor | Markdown or MDC format. Often freeform instructions. |
| `agents-md` | `AGENTS.md`, `.github/AGENTS.md` | Microsoft Copilot Coding Agent | Markdown. Directory-scoped instructions for Copilot agents. |
| `gemini-md` | `GEMINI.md` | Google Gemini CLI | Markdown. Project-level instructions for Gemini CLI. |
| `copilot-instructions` | `copilot-instructions.md`, `.github/copilot-instructions.md` | GitHub Copilot | Markdown. Repository-level instructions for Copilot. |
| `windsurfrules` | `.windsurfrules` | Windsurf (Codeium) | Markdown. Global and project-level rules. |
| `clinerules` | `.clinerules` | Cline (VS Code extension) | Markdown. Project-level instructions. |
| `custom` | Any `.md` file specified explicitly | Any | Treated as generic AI instruction markdown. Universal rules apply; format-specific rules do not. |

### Format Auto-Detection

When a file is provided to `ai-rules-lint`, the format is detected from the file name:

1. Exact file name match against the format registry (case-sensitive).
2. If the file is inside `.claude/`, `.cursor/`, or `.github/`, the directory context is used for detection.
3. If no match is found and the file has a `.md` or `.mdc` extension, it is treated as `custom` format.
4. If the file has no recognized extension, it is treated as `custom` format and parsed as plain text.

The detected format determines which format-specific rules apply. Universal rules (length, structure, content quality, references, anti-patterns) apply to all formats.

### Format-Specific Expectations

Each format has different conventional section structures:

**CLAUDE.md**: typically includes project overview, workflow instructions, coding conventions, file structure, testing strategy, and behavioral rules. Often uses numbered sections and markdown headers.

**.cursorrules**: typically a flat list of instructions and conventions without deep section hierarchy. May use headers or simple paragraphs.

**AGENTS.md**: typically includes task scope, coding conventions, and behavioral boundaries for autonomous agents. May be directory-scoped (different `AGENTS.md` files in different directories).

**copilot-instructions.md**: typically includes coding style, framework preferences, and response formatting guidance.

---

## 6. Built-in Rules

### 6.1 Length Rules

#### `max-length`

**What it checks**: The instruction file exceeds a configurable maximum token count (default: 5,000 estimated tokens, roughly 20,000 characters). Estimated tokens are calculated as character count divided by 4.

**Why it matters**: AI instruction files consume context window space on every interaction. A 10,000-token instruction file leaves significantly less room for the actual conversation, code context, and model output. Research and practitioner experience consistently show diminishing returns beyond approximately 3,000 tokens -- additional instructions get less attention, and critical rules buried deep in the file may be ignored. Teams that let instruction files grow unbounded typically find that the AI follows the first few hundred tokens and treats the rest as noise.

**Default severity**: `warning`

**Configuration**:
```json
{
  "max-length": {
    "severity": "warning",
    "options": {
      "maxTokens": 5000
    }
  }
}
```

**Auto-fix**: No. Reducing length requires human judgment about which instructions to keep, consolidate, or remove.

---

#### `min-length`

**What it checks**: The instruction file contains fewer than a configurable minimum token count (default: 50 estimated tokens, roughly 200 characters). This threshold catches files that are effectively empty or contain only a placeholder.

**Why it matters**: An instruction file that says only "Follow best practices" or "You are a helpful assistant" provides no project-specific guidance. The file exists but adds no value. Either the file should be populated with meaningful instructions or it should not exist.

**Default severity**: `info`

**Configuration**:
```json
{
  "min-length": {
    "severity": "info",
    "options": {
      "minTokens": 50
    }
  }
}
```

**Auto-fix**: No.

---

#### `section-length`

**What it checks**: An individual section (identified by a markdown header) exceeds a configurable maximum token count (default: 1,500 estimated tokens, roughly 6,000 characters).

**Why it matters**: Even if the overall file is within the recommended length, a single section that dominates the file creates an imbalanced document. A 4,000-token "Coding Conventions" section buried inside a 5,000-token file means everything else gets 1,000 tokens combined. Long sections are also harder for both humans and AI to parse. Breaking a long section into focused subsections improves readability and AI comprehension.

**Default severity**: `info`

**Configuration**:
```json
{
  "section-length": {
    "severity": "info",
    "options": {
      "maxTokens": 1500
    }
  }
}
```

**Auto-fix**: No. Restructuring sections requires understanding the content.

---

### 6.2 Structure Rules

#### `missing-sections`

**What it checks**: The instruction file is missing expected sections. Expected sections vary by format and are configurable. Defaults:

- **Project Overview / Context**: A section explaining what the project is, its purpose, and its architecture. Keywords: "overview", "about", "context", "introduction", "project", "architecture".
- **Coding Conventions**: A section defining code style, language preferences, and formatting rules. Keywords: "conventions", "style", "coding", "formatting", "standards", "guidelines".
- **File Structure**: A section describing the project's directory layout. Keywords: "structure", "layout", "directories", "files", "organization".
- **Testing**: A section describing how to run tests and testing expectations. Keywords: "testing", "tests", "test", "verification".

The rule uses keyword matching against section headers to detect whether each expected section is present. A header like "## Coding Standards" matches the "Coding Conventions" expectation.

**Why it matters**: Instruction files that omit foundational context force the AI to guess about the project. Without a project overview, the AI does not know what the code does. Without coding conventions, it uses its own defaults (which may not match the project's style). Without file structure information, it navigates the codebase blindly. Missing sections are the most common quality problem in instruction files -- developers add rules ("always use TypeScript") without providing context ("this is a React web application using Next.js").

**Default severity**: `warning`

**Configuration**:
```json
{
  "missing-sections": {
    "severity": "warning",
    "options": {
      "expectedSections": [
        {
          "name": "Project Overview",
          "keywords": ["overview", "about", "context", "introduction", "project", "architecture"]
        },
        {
          "name": "Coding Conventions",
          "keywords": ["conventions", "style", "coding", "formatting", "standards", "guidelines"]
        },
        {
          "name": "File Structure",
          "keywords": ["structure", "layout", "directories", "files", "organization"]
        },
        {
          "name": "Testing",
          "keywords": ["testing", "tests", "test", "verification"]
        }
      ]
    }
  }
}
```

**Auto-fix**: No. Section content requires human authoring.

---

#### `no-headers`

**What it checks**: The instruction file contains no markdown headers (`#`, `##`, `###`, etc.). The entire file is a wall of unstructured text.

**Why it matters**: Headers provide structure that both humans and AI use to navigate the document. Without headers, the instruction file is a monolithic block where instructions run together without logical grouping. AI tools use headers to understand the document's organization and locate relevant sections. A file with no headers forces the AI to process every instruction linearly, with no structural cues about what each section covers.

**Default severity**: `warning`

**Auto-fix**: No. Adding headers requires understanding the content's logical structure.

---

#### `deep-nesting`

**What it checks**: The instruction file uses markdown headers nested deeper than a configurable maximum level (default: 4, meaning `####` is the deepest allowed). A file with `#####` or `######` headers triggers this rule.

**Why it matters**: Excessive nesting creates a complex document hierarchy that is hard to navigate and hard for AI to parse. Most instruction files need only 2-3 levels: a top-level header for major sections and subheaders for detailed topics. Deeper nesting usually indicates that a section should be restructured or that the file is trying to do too much.

**Default severity**: `info`

**Configuration**:
```json
{
  "deep-nesting": {
    "severity": "info",
    "options": {
      "maxDepth": 4
    }
  }
}
```

**Auto-fix**: No.

---

#### `empty-section`

**What it checks**: A section (identified by a markdown header) contains no content, or contains only whitespace. An "empty section" is a header immediately followed by another header (at the same or higher level) or by the end of the file, with nothing in between except blank lines.

**Why it matters**: Empty sections are typically placeholders that were never filled in, indicating an incomplete instruction file. An empty `## Testing` section suggests testing guidance was intended but never written. Empty sections waste tokens (the header text costs tokens but provides no value) and create a false sense of completeness.

**Default severity**: `warning`

**Good example**:
```markdown
## Testing

Run tests with `npm test`. Write new tests for new behavior.
All tests must pass before committing.
```

**Bad example**:
```markdown
## Testing

## Deployment
```

**Auto-fix**: Yes. Removes the empty section header and surrounding whitespace.

---

#### `wall-of-text`

**What it checks**: A section or the entire file contains more than a configurable number of consecutive characters (default: 3,000) with no structural breaks -- no sub-headers, no bullet points, no numbered lists, no blank lines, no horizontal rules, and no code blocks.

**Why it matters**: Dense, unstructured text blocks are harder for both AI and humans to parse and follow. Breaking instructions into bullet points, numbered steps, or subsections improves comprehension and compliance. AI tools attend more reliably to structured content than to prose paragraphs.

**Default severity**: `info`

**Configuration**:
```json
{
  "wall-of-text": {
    "severity": "info",
    "options": {
      "maxLength": 3000
    }
  }
}
```

**Auto-fix**: No. Restructuring prose requires understanding the content.

---

### 6.3 Content Quality Rules

#### `vague-instruction`

**What it checks**: The instruction file contains vague, unhelpful instructions that provide no actionable guidance. Detected patterns include:

- "be helpful" / "be as helpful as possible"
- "follow best practices" (without defining which practices)
- "write clean code" (without defining what "clean" means)
- "be concise" (without specifying what conciseness means)
- "be thorough"
- "do your best"
- "be accurate"
- "be professional"
- "use common sense"
- "be smart about it"
- "use good judgment"
- "write high-quality code"
- "follow the conventions" (without specifying which conventions)
- "keep things simple"
- "be efficient"

**Why it matters**: Vague instructions waste tokens without improving AI behavior. "Follow best practices" tells the AI nothing it does not already know from training. Every instruction should be specific enough that a human reader could verify whether the AI's output complies. "Follow best practices" is unverifiable; "Use TypeScript strict mode, handle all error cases with explicit try/catch, and document public functions with JSDoc" is verifiable.

**Default severity**: `warning`

**Good example**:
```markdown
## Coding Conventions

- Use TypeScript with strict mode enabled.
- Handle errors with explicit try/catch blocks. Never swallow errors silently.
- Document all public functions with JSDoc including @param and @returns.
- Use named exports, not default exports.
```

**Bad example**:
```markdown
## Coding Conventions

Follow best practices. Write clean, high-quality code. Be thorough and efficient.
```

**Auto-fix**: No. Replacing vague instructions requires understanding the project's actual conventions.

---

#### `redundant-instruction`

**What it checks**: The same instruction appears multiple times in the file, either verbatim or with minor wording variations. The rule uses normalized comparison (lowercased, whitespace-collapsed, common synonym substitution) to detect near-duplicates.

Normalization steps:
1. Convert to lowercase.
2. Collapse whitespace (multiple spaces, tabs, newlines become a single space).
3. Strip punctuation.
4. Substitute common synonyms: "ensure" / "make sure" / "verify", "do not" / "never" / "don't", "always" / "must" / "should always", "use" / "utilize" / "employ".
5. Compare normalized strings using a similarity threshold (default: 0.85 Jaccard similarity on word trigrams).

**Why it matters**: Redundant instructions waste tokens and create maintenance burden. If an instruction is later updated, only one copy may be changed, creating a contradiction. Instruction files accumulate redundancy over time as different team members add rules without reading the entire file. A single clear instruction is better than three restatements scattered across different sections.

**Default severity**: `info`

**Good example**:
```markdown
## Error Handling

Handle all errors with explicit try/catch blocks. Log the error and re-throw
with context.
```

**Bad example**:
```markdown
## Error Handling

Always handle errors properly with try/catch.

## General Rules

Make sure to catch all errors using try/catch blocks.

## Important

Never forget to handle errors. Use try/catch for all error handling.
```

**Auto-fix**: No. The user must choose which copy to keep and reconcile any differences.

---

#### `contradictory-rules`

**What it checks**: The instruction file contains rules that contradict each other. The rule detects:

- **Direct negation contradictions**: "Always use semicolons" paired with "Do not use semicolons" or "Never use semicolons".
- **Technology contradictions**: "Use TypeScript for all code" paired with "Write code in JavaScript when possible". "Use React" paired with "Use Vue".
- **Style contradictions**: "Be concise in responses" paired with "Provide detailed, thorough explanations". "Keep comments minimal" paired with "Comment every function extensively".
- **Behavioral contradictions**: "Always ask for clarification" paired with "Never ask clarifying questions". "Make autonomous decisions" paired with "Always confirm before proceeding".
- **Scope contradictions**: "Only modify files in src/" paired with "Update configuration files in the project root as needed".

**Heuristics**:
- Extract instruction pairs and check for semantic opposition using keyword matching: always/never, do/do not, use/avoid, prefer/avoid, include/exclude, enable/disable.
- Check for mutually exclusive technology references within the same instruction category.
- Check for "always X" and "Y instead of X" patterns where Y is an alternative to X.
- Flag explicitly contradictory constraint pairs.

**Why it matters**: Contradictory rules force the AI to choose which instruction to follow, producing unpredictable behavior. The AI may silently ignore one rule, follow a different one each time, or attempt a confused compromise. Contradictions are almost always unintentional, introduced when instruction files are edited incrementally by multiple team members without reviewing the whole document. This is the highest-impact quality problem in instruction files because it actively degrades AI behavior rather than merely being unhelpful.

**Default severity**: `error`

**Good example**:
```markdown
## Code Style

Use TypeScript for all source files. Use JavaScript only for configuration
files (e.g., jest.config.js, eslint.config.js) where TypeScript is not supported.
```

**Bad example**:
```markdown
## Code Style

Always use TypeScript for everything.

## Preferences

Write code in JavaScript when possible for simplicity.
```

**Auto-fix**: No. Resolving contradictions requires understanding intent.

---

#### `unsafe-instruction`

**What it checks**: The instruction file contains instructions that could lead to dangerous AI behavior. Detected patterns:

- "do everything I say" / "follow all instructions without question"
- "no restrictions" / "no limitations" / "ignore safety"
- "never refuse" / "always comply"
- "bypass" / "override" / "circumvent" (in the context of safety or restrictions)
- "execute any code" / "run any command" (without qualification)
- "delete anything" / "modify any file" (without scoping)
- "ignore errors" / "suppress all warnings" / "skip validation"
- "commit directly to main" / "push without review"
- "use sudo" / "run as root" (without qualification)

**Why it matters**: AI coding tools can execute commands, modify files, and interact with external services. Instructions that remove guardrails or grant unconditional authority create real risk. "Execute any command the user requests" means the AI will happily run `rm -rf /` if asked. Instruction files should scope authority explicitly ("you may modify files in src/ and test/") rather than grant blanket permissions.

**Default severity**: `error`

**Auto-fix**: No. Replacing unsafe instructions requires understanding the intended scope of authority.

---

#### `missing-specificity`

**What it checks**: Instructions use generic language where specific guidance would be more effective. Detected patterns:

- "Use appropriate naming conventions" -- which conventions? camelCase? snake_case?
- "Follow the project's style" -- what style? Where is it defined?
- "Handle errors appropriately" -- how? Log and re-throw? Return error codes? Show user-friendly messages?
- "Write good tests" -- what makes a test good? Unit? Integration? What coverage?
- "Use the right tools" -- which tools?
- "Follow the standard process" -- what process?
- "Use proper formatting" -- what formatting?

The rule detects instructions that contain a directive verb ("use", "follow", "handle", "write") combined with a vague qualifier ("appropriate", "proper", "good", "right", "standard", "correct") without a concrete specification in the same sentence or the following sentence.

**Why it matters**: Unspecific instructions force the AI to guess, and different AI models or sessions will guess differently. "Handle errors appropriately" produces inconsistent behavior. "Catch errors with try/catch, log the error message and stack trace using the project's logger, then re-throw the error" produces consistent behavior. Specificity is the difference between an instruction that shapes behavior and one that merely occupies context window space.

**Default severity**: `warning`

**Auto-fix**: No.

---

#### `hardcoded-paths`

**What it checks**: The instruction file contains absolute file paths that are user-specific or machine-specific:

- Paths starting with `/Users/`, `/home/`, `C:\Users\`, `C:\Documents`.
- Paths containing user-specific directories (`.local`, `.config` with absolute prefixes).
- Paths containing environment-specific directories (`/opt/`, `/var/`, `/tmp/` when used as project paths).

Relative paths and paths within standard project structures (e.g., `src/`, `./config/`) are not flagged.

**Why it matters**: Instruction files are shared via version control. An absolute path like `/Users/alice/projects/myapp/src/utils.ts` is meaningless to any developer who is not Alice on Alice's machine. Other team members and CI environments will have different paths. Use relative paths or describe the location ("the utils module in src/").

**Default severity**: `warning`

**Auto-fix**: No. Path correction requires understanding the intended reference.

---

### 6.4 Reference Rules

#### `stale-reference`

**What it checks**: The instruction file mentions file paths, directory paths, function names, or class names that do not exist in the current codebase. The rule:

1. Scans the instruction file for patterns that look like file references:
   - Paths with extensions: `src/utils/helpers.ts`, `config/database.yml`
   - Paths in code blocks or inline code: `` `src/index.ts` ``
   - Paths after keywords like "file", "module", "in", "at", "see": "see `src/config.ts`"
   - Directory references: `src/components/`, `lib/`
2. For each detected file reference, checks whether the file or directory exists relative to the project root (the directory containing the instruction file, or the nearest directory with a `package.json`, `.git`, or other project root indicator).
3. Scans for function and class name references in contexts that suggest they are codebase references (inside backticks, after "function", "class", "method", "call", "use", "import"):
   - `` Use the `calculateTotal` function ``
   - "Call `DatabaseManager.connect()` to initialize"
4. For function/class references, performs a best-effort search in common source directories (`src/`, `lib/`, `app/`) for matching identifiers.

**Why it matters**: Stale references are the silent rot of instruction files. A `CLAUDE.md` that says "The main entry point is `src/server.ts`" when the file was renamed to `src/app.ts` three months ago sends the AI on a wild goose chase. The AI trusts the instruction file and wastes time looking for a file that does not exist, or worse, makes incorrect assumptions based on outdated information. Stale references accumulate as codebases evolve -- files are renamed, functions are refactored, modules are reorganized -- but instruction files are rarely updated to match.

**Default severity**: `warning` (not error, because some references may be intentionally abstract or refer to files that will be created).

**Configuration**:
```json
{
  "stale-reference": {
    "severity": "warning",
    "options": {
      "projectRoot": ".",
      "checkFiles": true,
      "checkDirectories": true,
      "checkFunctions": false,
      "ignorePaths": ["node_modules/", "dist/", "build/"]
    }
  }
}
```

**Auto-fix**: No. Fixing stale references requires knowing what the reference should point to.

---

#### `nonexistent-command`

**What it checks**: The instruction file references shell commands in code blocks or inline code that do not exist as npm scripts, common CLI tools, or executable files. The rule:

1. Scans fenced code blocks with `bash`, `sh`, `shell`, or no language tag for command invocations.
2. Checks `npm run <script>` / `npx <package>` references against the nearest `package.json`'s `scripts` field.
3. Flags custom npm scripts that are referenced but not defined (e.g., the instruction file says "run `npm run lint:fix`" but `package.json` has no `lint:fix` script).

**Why it matters**: Instruction files often include workflow commands ("Run `npm run test:e2e` before committing"). If the npm script was renamed or removed, the AI will suggest a command that fails, or worse, will attempt to run it and generate confusing error output. Validating command references catches this before it wastes time.

**Default severity**: `info`

**Auto-fix**: No.

---

### 6.5 Anti-Pattern Rules

#### `personality-instruction`

**What it checks**: The instruction file includes personality traits or emotional directives that waste tokens without affecting code quality. Detected patterns:

- "Be friendly" / "Be warm and approachable"
- "Be enthusiastic" / "Show excitement"
- "Be patient" / "Be understanding"
- "Be confident" / "Be assertive"
- "Maintain a professional tone"
- "Be polite" / "Be courteous"
- "Show empathy"
- "Be cheerful"

**Why it matters**: AI instruction files configure coding behavior, not chatbot personality. "Be friendly" in a `.cursorrules` file costs tokens on every interaction but does not change whether the AI writes correct TypeScript. Coding-focused instruction files should contain coding-focused rules. Personality instructions belong in chatbot system prompts, not in developer tool configuration.

**Default severity**: `info`

**Auto-fix**: No. The instruction may be intentional in some contexts.

---

#### `negative-only`

**What it checks**: A section or the entire file consists primarily of negative instructions ("don't", "never", "do not", "avoid") without corresponding positive guidance. The rule fires when more than a configurable percentage (default: 70%) of instructions in a section are negative.

**Why it matters**: Negative-only instructions tell the AI what _not_ to do but leave the space of acceptable behavior undefined. "Don't use var" is less effective than "Use `const` by default, `let` when reassignment is needed." AI tools follow positive instructions more reliably than negative ones because positive instructions narrow the output space to a specific behavior, while negative instructions only exclude one option from an infinite space. A section full of "never do X" instructions often signals rules that were added reactively (the AI did X once, so someone added "never do X") without thinking about what the AI _should_ do instead.

**Default severity**: `info`

**Good example**:
```markdown
## Variable Declarations

Use `const` by default for all variable declarations. Use `let` only when
the variable must be reassigned. Never use `var`.
```

**Bad example**:
```markdown
## Variable Declarations

Don't use var.
Don't use let unless absolutely necessary.
Don't declare variables without a type.
Don't use any.
```

**Auto-fix**: No. Adding positive guidance requires understanding intent.

---

#### `too-many-rules`

**What it checks**: The instruction file contains more than a configurable maximum number of distinct imperative instructions (default: 100). Instructions are counted by detecting imperative sentences -- sentences starting with verbs ("Use", "Always", "Never", "Make sure", "Ensure", "Do not", "Write", "Run", "Check") or containing modal directives ("must", "should", "shall").

**Why it matters**: Diminishing returns set in quickly. An AI tool that receives 150 distinct rules will not follow all of them reliably. Empirically, instruction-following degrades as the number of instructions increases -- the AI attends most strongly to instructions near the beginning and end of the file and may lose track of rules in the middle. A focused set of 20-30 high-impact rules outperforms a comprehensive list of 150 micro-rules. Excessive rule counts also signal that the instruction file is trying to encode the entire codebase's knowledge instead of providing high-level guidance.

**Default severity**: `info`

**Configuration**:
```json
{
  "too-many-rules": {
    "severity": "info",
    "options": {
      "maxRules": 100
    }
  }
}
```

**Auto-fix**: No.

---

#### `no-examples`

**What it checks**: The instruction file contains coding conventions or output format specifications but includes zero examples demonstrating the expected style. The rule fires when the file contains instructions about code formatting, naming, structure, or output format but has no code blocks (fenced blocks with language tags) serving as examples.

**Why it matters**: Examples are the most effective way to communicate expectations to AI tools. "Use early returns" is good; "Use early returns" followed by a code block showing the before/after pattern is significantly better. AI tools learn from examples more reliably than from prose descriptions. Instruction files without examples force the AI to interpret rules abstractly, which leads to inconsistent application.

**Default severity**: `info`

**Auto-fix**: No. Examples require human authoring.

---

#### `todo-placeholder`

**What it checks**: The instruction file contains TODO, FIXME, XXX, HACK, or placeholder markers that indicate incomplete content.

**Why it matters**: Placeholder markers in instruction files indicate sections that were never completed. A `CLAUDE.md` with "TODO: add testing conventions" is missing guidance that someone intended to write. These placeholders clutter the file and may confuse the AI (which might interpret "TODO: add testing conventions" as an instruction to add testing conventions to whatever code it is working on, rather than recognizing it as a note to the human maintainer).

**Default severity**: `warning`

**Auto-fix**: No.

---

#### `dated-content`

**What it checks**: The instruction file contains explicit date references or temporal language that may indicate stale content:

- Explicit dates: "As of January 2024", "Updated March 2023", "Since Q3 2023"
- Temporal references: "recently", "currently", "at the moment", "for now" (when used as qualifiers for technical decisions: "We are currently using React 17" may be outdated)
- Version references with dates: "Node.js 18 (current LTS)" when a newer LTS is available

**Why it matters**: Temporal language in instruction files is a maintenance debt signal. "We are currently migrating from Redux to Zustand" may have been written a year ago, and the migration may be complete. "As of January 2024, we use Node 18" becomes misleading when Node 22 is the current LTS. Instruction files should state timeless facts ("Use Node.js 20 or later") rather than time-bound observations.

**Default severity**: `info`

**Auto-fix**: No.

---

### 6.6 Format-Specific Rules

#### `claude-md-format`

**What it checks**: A `CLAUDE.md` file is missing sections that Anthropic's Claude Code documentation recommends:

- A workflow or process section (how to make changes, commit, test).
- A coding conventions section.
- Project context (what the project is, its tech stack).

Also checks:
- Whether the file uses the recommended header structure (top-level `#` headers for major sections).
- Whether the file includes a "Goals" or "Non-Goals" section to scope AI behavior.
- Whether inline code references use backticks (`` ` ``) for clarity.

**Why it matters**: Claude Code reads `CLAUDE.md` at session start and uses its content to shape every interaction. Following Anthropic's recommended structure ensures the file is parsed and utilized optimally by the tool. A `CLAUDE.md` that lacks project context forces Claude to infer what the project does, which wastes the first several interactions on orientation.

**Default severity**: `info`

**Auto-fix**: No.

---

#### `cursorrules-format`

**What it checks**: A `.cursorrules` file:

- Is excessively long (Cursor reads the entire file into context; recommended maximum is lower than for CLAUDE.md due to Cursor's context management).
- Uses formatting that Cursor may not parse well (e.g., HTML tags, complex nested lists).
- Lacks an opening statement establishing the AI's role or the project's context.

**Why it matters**: Cursor's handling of `.cursorrules` differs from Claude Code's handling of `CLAUDE.md`. Cursor injects the rules file content directly into the system prompt, so format and length constraints are different. Rules specific to how Cursor processes instruction files help users optimize for that tool.

**Default severity**: `info`

**Auto-fix**: No.

---

#### `agents-md-format`

**What it checks**: An `AGENTS.md` file:

- Is placed in the correct directory location (project root or a specific subdirectory, per Microsoft Copilot conventions).
- Includes scope boundaries that define what the agent is and is not allowed to modify.
- Does not duplicate instructions that should be in the parent directory's `AGENTS.md`.

**Why it matters**: Microsoft Copilot uses `AGENTS.md` files with directory-scoped inheritance. A `AGENTS.md` in `src/components/` inherits from the root `AGENTS.md`. Misunderstanding this hierarchy leads to duplicated or contradictory instructions across levels.

**Default severity**: `info`

**Auto-fix**: No.

---

#### `copilot-instructions-format`

**What it checks**: A `copilot-instructions.md` file:

- Is located in `.github/` (the standard location for GitHub Copilot).
- Does not exceed GitHub Copilot's documented instruction length limits.
- Uses language and formatting that GitHub Copilot processes effectively.

**Default severity**: `info`

**Auto-fix**: No.

---

### 6.7 Efficiency Rules

#### `redundant-whitespace`

**What it checks**: The instruction file contains excessive whitespace: more than two consecutive blank lines, trailing whitespace on lines, or lines containing only spaces/tabs.

**Why it matters**: Whitespace tokens are wasted context window space. Three blank lines convey no more separation than one. Trailing spaces are invisible and serve no purpose. In token-limited instruction files, redundant whitespace reduces the space available for useful content.

**Default severity**: `info`

**Auto-fix**: Yes. Collapses multiple blank lines to a single blank line. Removes trailing whitespace from all lines.

---

#### `commented-out-content`

**What it checks**: The instruction file contains HTML comments (`<!-- ... -->`) or markdown-style commented-out sections that appear to contain old instructions rather than lint directives.

**Why it matters**: Commented-out instructions in AI instruction files still cost tokens. Unlike source code, where comments are stripped by compilers, instruction files are read raw by AI tools. An HTML comment containing 500 characters of old instructions wastes 125 tokens on every interaction. If the content is not needed, remove it. If it is needed, uncomment it.

**Default severity**: `info`

**Auto-fix**: Yes. Removes HTML comments that are not `ai-rules-lint` inline directives.

---

#### `excessive-formatting`

**What it checks**: The instruction file uses heavy markdown formatting (bold, italic, strikethrough, nested blockquotes) in ways that waste tokens without aiding comprehension. Specific checks:

- Bold/italic on entire paragraphs (a bolded paragraph is no more emphatic than a non-bolded one to an AI).
- Decorative elements: ASCII art, repeated separator characters (`==========`, `----------`), emoji-heavy sections.
- Nested blockquotes beyond 2 levels.

**Why it matters**: AI instruction files are consumed by AI tools, not rendered in a browser. Bold text costs extra tokens (the `**` markers) without changing how the AI processes the instruction. Decorative elements like ASCII art cost significant tokens with zero informational value. The file should be as information-dense as possible.

**Default severity**: `info`

**Auto-fix**: No. Some formatting may be intentional for human readability.

---

### 6.8 Rule Summary Table

| Rule ID | Category | Default Severity | Auto-fix |
|---|---|---|---|
| `max-length` | length | warning | No |
| `min-length` | length | info | No |
| `section-length` | length | info | No |
| `missing-sections` | structure | warning | No |
| `no-headers` | structure | warning | No |
| `deep-nesting` | structure | info | No |
| `empty-section` | structure | warning | Yes |
| `wall-of-text` | structure | info | No |
| `vague-instruction` | content | warning | No |
| `redundant-instruction` | content | info | No |
| `contradictory-rules` | content | error | No |
| `unsafe-instruction` | content | error | No |
| `missing-specificity` | content | warning | No |
| `hardcoded-paths` | content | warning | No |
| `stale-reference` | reference | warning | No |
| `nonexistent-command` | reference | info | No |
| `personality-instruction` | anti-pattern | info | No |
| `negative-only` | anti-pattern | info | No |
| `too-many-rules` | anti-pattern | info | No |
| `no-examples` | anti-pattern | info | No |
| `todo-placeholder` | anti-pattern | warning | No |
| `dated-content` | anti-pattern | info | No |
| `claude-md-format` | format-specific | info | No |
| `cursorrules-format` | format-specific | info | No |
| `agents-md-format` | format-specific | info | No |
| `copilot-instructions-format` | format-specific | info | No |
| `redundant-whitespace` | efficiency | info | Yes |
| `commented-out-content` | efficiency | info | Yes |
| `excessive-formatting` | efficiency | info | No |

---

## 7. Section Detection

### Markdown Header Parsing

The parser identifies sections by scanning for markdown ATX-style headers (`# H1`, `## H2`, `### H3`, etc.). Each header starts a new section that extends until the next header of the same or higher level, or the end of the file.

For each section, the parser records:
- **Title**: the header text (without the `#` markers).
- **Level**: the nesting depth (1 for `#`, 2 for `##`, etc.).
- **Content**: all text between this header and the next header at the same or higher level.
- **Location**: line/column range in the source file.
- **Character count and estimated token count** of the section content.

### Section Categorization

Detected sections are categorized by matching header text against keyword sets:

| Category | Keywords |
|---|---|
| Project Overview | overview, about, context, introduction, project, architecture, description, purpose |
| Coding Conventions | conventions, style, coding, formatting, standards, guidelines, code style, rules |
| File Structure | structure, layout, directories, files, organization, project structure |
| Testing | testing, tests, test, verification, quality, QA |
| Deployment | deployment, deploy, release, publishing, CI, CD, pipeline |
| Workflow | workflow, process, how to, steps, procedure, contributing |
| Dependencies | dependencies, packages, libraries, tools, requirements |
| Error Handling | errors, error handling, exceptions, debugging |
| Security | security, auth, authentication, authorization, secrets |
| Performance | performance, optimization, speed, caching |

Categorization is case-insensitive and uses substring matching: a header "## Code Style Guidelines" matches both "style" and "guidelines", categorizing it as "Coding Conventions".

### Setext-Style Headers

The parser also detects setext-style headers (underlined with `===` or `---`):

```markdown
Project Overview
================

Coding Conventions
------------------
```

These are treated identically to ATX-style headers at levels 1 and 2 respectively.

### Files Without Headers

If the file contains no headers, the entire file is treated as a single unnamed section. The `no-headers` rule flags this condition.

---

## 8. Stale Reference Detection

### File Path Scanning

The parser extracts file path references from the instruction file using these patterns:

1. **Inline code paths**: text inside backticks that looks like a file path (contains `/` or `\` and ends with a recognized extension: `.ts`, `.js`, `.tsx`, `.jsx`, `.py`, `.go`, `.rs`, `.rb`, `.java`, `.yml`, `.yaml`, `.json`, `.toml`, `.md`, `.css`, `.scss`, `.html`, `.sql`, `.sh`, `.env`, `.config`, `.xml`).
2. **Bare paths**: text matching common path patterns (`src/...`, `lib/...`, `app/...`, `test/...`, `config/...`, `./...`) outside of code blocks, when preceded by whitespace or at the start of a line.
3. **Paths in code blocks**: paths inside fenced code blocks that appear as arguments to commands (`cd src/components`, `cat config/database.yml`, `import from './utils'`).

### File Existence Checking

For each extracted path, the parser:

1. Resolves the path relative to the project root (detected as the directory containing the instruction file, or the nearest ancestor with `.git`, `package.json`, or similar project root markers).
2. Checks whether the resolved path exists as a file or directory using `node:fs.existsSync`.
3. If the path does not exist, records it as a stale reference.

### Function and Class Name Scanning

The parser extracts function and class name references using these patterns:

1. **Backtick-quoted identifiers**: text inside backticks that looks like an identifier (matches `[A-Z][a-zA-Z0-9]*` for class names, `[a-z][a-zA-Z0-9]*` for function names, or `ClassName.methodName`).
2. **After reference keywords**: identifiers following "function", "class", "method", "the `...` function/class/method", "call `...`", "use `...`".

Function/class reference checking is opt-in (disabled by default) because it requires scanning source files and is inherently heuristic. When enabled, the parser searches `.ts`, `.js`, `.py`, and other source files in common directories for matching export names.

### Exclusions

The following are excluded from stale reference detection:

- Paths inside URLs (`https://example.com/path/to/file`).
- Paths that are clearly example/placeholder paths (`example/`, `your-project/`, `path/to/`).
- Paths in `node_modules/`, `dist/`, `build/`, `.git/`, and other generated/dependency directories.
- Paths that match configured ignore patterns.

---

## 9. Contradiction Detection

### Keyword-Based Detection

The primary contradiction detection mechanism uses keyword opposition. The parser extracts imperative instructions from the document and compares them pairwise:

**Always/Never pairs**: Two instructions that use "always" and "never" (or "do not", "don't") with the same subject are flagged.
- "Always use semicolons" + "Never use semicolons" = contradiction
- "Always use TypeScript" + "Don't use TypeScript" = contradiction

**Use/Avoid pairs**: Two instructions that use "use" and "avoid" (or "prefer" and "avoid") with the same technology or pattern.
- "Use Redux for state management" + "Avoid Redux" = contradiction
- "Prefer class components" + "Avoid class components" = contradiction

### Technology Contradiction Matrix

The parser maintains a list of known mutually exclusive technology pairs:

| Technology A | Technology B | Context |
|---|---|---|
| TypeScript | JavaScript (as primary) | Language choice |
| React | Vue, Angular, Svelte | UI framework |
| Redux | MobX, Zustand, Jotai | State management |
| Jest | Mocha, Vitest (when "use X exclusively") | Test framework |
| npm | yarn, pnpm (when "use X exclusively") | Package manager |
| tabs | spaces (when "use X for indentation") | Formatting |
| single quotes | double quotes (when "use X for strings") | String style |
| semicolons | no semicolons | Statement termination |
| CommonJS | ESM (when "use X module system") | Module system |

When the instruction file contains positive instructions for both sides of a pair ("Use React" and "Use Vue for components"), the rule flags it as a potential contradiction.

### Behavioral Contradiction Detection

The parser checks for contradictions in behavioral instructions:

- "Be concise" / "Keep responses short" + "Be thorough" / "Provide detailed explanations" / "Be comprehensive"
- "Ask for clarification when unclear" + "Never ask clarifying questions" / "Make autonomous decisions"
- "Minimal comments in code" + "Comment extensively" / "Document every function"
- "Create small, focused commits" + "Commit all changes at once"

### Limitations

Contradiction detection is heuristic, not semantic. It will miss subtle contradictions that require deep language understanding ("Prioritize performance" + "Always use the most readable approach even if slower" is a contradiction, but the parser cannot reliably detect it). The rule is designed to catch common, obvious contradictions with high precision, accepting lower recall. All contradiction detections are flagged for human review -- the rule does not claim certainty, it surfaces potential conflicts.

---

## 10. API Surface

### Installation

```bash
npm install ai-rules-lint
```

### No Runtime Dependencies

`ai-rules-lint` has zero runtime dependencies. It uses only Node.js built-ins (`node:fs`, `node:fs/promises`, `node:path`, `node:util`, `node:process`). The parser, rules engine, and formatters are all self-contained.

### Main Export: `lint`

The primary API is a function that accepts an instruction file path or content string, parses it into an Instruction Document, evaluates all applicable rules, and returns a lint report.

```typescript
import { lint } from 'ai-rules-lint';

const report = await lint({
  source: './CLAUDE.md',
  preset: 'recommended',
});

console.log(report.summary.errors);   // 0
console.log(report.summary.warnings); // 3
console.log(report.diagnostics);      // individual findings
```

### Export: `lintContent`

Lint instruction file content provided as a string, without reading from disk. Useful for editor integrations and testing.

```typescript
import { lintContent } from 'ai-rules-lint';

const report = lintContent({
  content: '# My Rules\n\nBe helpful. Follow best practices.',
  format: 'claude-md',
  preset: 'recommended',
});
```

### Export: `lintDirectory`

Scan a directory for all AI instruction files, lint each one, and return an array of reports. The function searches for all known file names (CLAUDE.md, .cursorrules, AGENTS.md, etc.) recursively or at the project root, depending on the format's convention.

```typescript
import { lintDirectory } from 'ai-rules-lint';

const reports = await lintDirectory({
  directory: '/path/to/project',
  preset: 'recommended',
});

for (const report of reports) {
  console.log(`${report.filePath}: ${report.summary.errors} errors`);
}
```

### Export: `createLinter`

Factory function that creates a configured linter instance for reuse across multiple files. Useful when linting many files with the same configuration.

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

### Export: `createRule`

Factory function for creating custom lint rules with type safety.

```typescript
import { createRule } from 'ai-rules-lint';

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
```

### Type Definitions

```typescript
// ── Source Input ─────────────────────────────────────────────────────

/**
 * Source for the lint function. Accepts a file path string or explicit object.
 */
type LintSource =
  | string                 // File path to an instruction file
  | { file: string }       // Explicit file path
  | { content: string; format?: FileFormat };  // Inline content

/** Recognized AI instruction file formats. */
type FileFormat =
  | 'claude-md'
  | 'cursorrules'
  | 'agents-md'
  | 'gemini-md'
  | 'copilot-instructions'
  | 'windsurfrules'
  | 'clinerules'
  | 'custom';

// ── Lint Options ─────────────────────────────────────────────────────

/** Severity level for a lint rule. */
type Severity = 'error' | 'warning' | 'info' | 'off';

/** Configuration for a single rule. */
interface RuleConfig {
  /** Override the rule's default severity. 'off' disables the rule. */
  severity?: Severity;

  /** Rule-specific options. */
  options?: Record<string, unknown>;
}

/** Options for the lint() function. */
interface LintOptions {
  /** The instruction file to lint. File path or content. */
  source: LintSource;

  /**
   * Preset to use as the base configuration.
   * Default: 'recommended'.
   */
  preset?: 'recommended' | 'strict' | 'minimal' | 'off';

  /**
   * Per-rule overrides. Keys are rule IDs.
   * These override the preset's settings for the specified rules.
   */
  rules?: Record<string, RuleConfig | Severity>;

  /**
   * Custom rules to register. Evaluated alongside built-in rules.
   */
  customRules?: CustomRuleDefinition[];

  /**
   * Project root directory for stale reference checking.
   * Default: auto-detected from the instruction file's location.
   */
  projectRoot?: string;

  /**
   * Whether to apply auto-fixes and return the fixed text.
   * Default: false.
   */
  fix?: boolean;
}

/** Options for lintContent(). */
interface LintContentOptions {
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

/** Options for lintDirectory(). */
interface LintDirectoryOptions {
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

// ── Lint Report ──────────────────────────────────────────────────────

/** Source location within the instruction file. */
interface SourceLocation {
  /** Starting line number (1-based). */
  startLine: number;

  /** Starting column number (1-based). */
  startColumn: number;

  /** Ending line number (1-based). */
  endLine: number;

  /** Ending column number (1-based). */
  endColumn: number;
}

/** An auto-fix replacement. */
interface Fix {
  /** The range in the source text to replace. */
  range: SourceLocation;

  /** The replacement text. */
  replacement: string;
}

/** A single lint diagnostic. */
interface LintDiagnostic {
  /** The rule ID that produced this diagnostic. */
  ruleId: string;

  /** Severity of this diagnostic. */
  severity: 'error' | 'warning' | 'info';

  /** Category of the rule. */
  category: 'length' | 'structure' | 'content' | 'reference' | 'anti-pattern'
    | 'format-specific' | 'efficiency';

  /** Source location of the problematic text. */
  location: SourceLocation;

  /** Human-readable description of the problem. */
  message: string;

  /** Optional human-readable fix suggestion. */
  suggestion?: string;

  /** Optional auto-fix. Present only for rules that support auto-fixing. */
  fix?: Fix;
}

/** Summary counts for the lint report. */
interface LintSummary {
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

/** The complete lint report returned by lint(). */
interface LintReport {
  /** Whether the lint passed (no errors). Warnings and infos do not cause failure. */
  passed: boolean;

  /** The file path of the linted instruction file (if applicable). */
  filePath?: string;

  /** The detected file format. */
  format: FileFormat;

  /** ISO 8601 timestamp of when the analysis was performed. */
  timestamp: string;

  /** Total wall-clock time for the lint analysis, in milliseconds. */
  durationMs: number;

  /** All diagnostics, sorted by severity (errors first) then by location. */
  diagnostics: LintDiagnostic[];

  /** Summary counts. */
  summary: LintSummary;

  /** The parsed Instruction Document (for programmatic inspection). */
  document: InstructionDocument;

  /** The preset that was used. */
  preset: string;

  /** Which rules were enabled and their effective severity. */
  ruleStates: Record<string, Severity>;

  /**
   * The fixed file content, if `fix: true` was specified and fixes were applied.
   * Undefined if `fix` was false or no fixes were applicable.
   */
  fixed?: string;
}

// ── Instruction Document ─────────────────────────────────────────────

/** The parsed intermediate representation of an instruction file. */
interface InstructionDocument {
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

interface Section {
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

interface InstructionStatement {
  /** The instruction text. */
  text: string;

  /** Whether the instruction is negative ("do not", "never", etc.). */
  isNegative: boolean;

  /** Source location. */
  location: SourceLocation;
}

interface Reference {
  /** The referenced path or identifier. */
  value: string;

  /** Type of reference. */
  type: 'file' | 'directory' | 'function' | 'class' | 'command';

  /** Source location. */
  location: SourceLocation;

  /** Whether the reference was verified to exist. */
  exists?: boolean;
}
```

### Example: Lint a CLAUDE.md

```typescript
import { lint } from 'ai-rules-lint';

const report = await lint({
  source: './CLAUDE.md',
  preset: 'recommended',
});

// report.diagnostics:
// - contradictory-rules: "Always use TypeScript" contradicts "Write JavaScript
//     when possible" at line 42.
// - stale-reference: File `src/utils/helpers.ts` referenced at line 15 does
//     not exist.
// - vague-instruction: "Follow best practices" at line 8 is vague.
// - max-length: File contains ~7,200 estimated tokens (exceeds 5,000 threshold).
```

### Example: Lint Content Inline

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

// report.diagnostics:
// - vague-instruction: "Be helpful and follow best practices" (line 4)
// - vague-instruction: "Write clean code" (line 5)
// - vague-instruction: "Be thorough" (line 5)
// - missing-sections: Missing expected sections: Coding Conventions, Testing
// - min-length: File is too short (estimated 15 tokens, minimum 50)
```

### Example: Scan a Whole Project

```typescript
import { lintDirectory } from 'ai-rules-lint';

const reports = await lintDirectory({
  directory: '/path/to/project',
  preset: 'recommended',
});

for (const report of reports) {
  if (!report.passed) {
    console.error(`${report.filePath}: ${report.summary.errors} errors, ${report.summary.warnings} warnings`);
  }
}
```

### Example: Lint with Auto-Fix

```typescript
import { lint } from 'ai-rules-lint';

const report = await lint({
  source: './CLAUDE.md',
  preset: 'recommended',
  fix: true,
});

if (report.fixed) {
  console.log('Fixed content:');
  console.log(report.fixed);
  console.log(`${report.summary.fixable} issues auto-fixed`);
}
```

---

## 11. Configuration

### Configuration File

`ai-rules-lint` searches for a configuration file in the current directory and ancestor directories, using the first one found:

1. `.ai-rules-lint.json`
2. `.ai-rules-lint.yaml`
3. `.ai-rules-lintrc` (JSON format)
4. `ai-rules-lint` key in `package.json`

The `--config` flag overrides auto-detection.

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
          {
            "name": "Project Overview",
            "keywords": ["overview", "about", "context", "project"]
          },
          {
            "name": "Coding Conventions",
            "keywords": ["conventions", "style", "coding"]
          },
          {
            "name": "Testing",
            "keywords": ["testing", "tests"]
          },
          {
            "name": "Deployment",
            "keywords": ["deployment", "deploy", "release"]
          }
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

### Configuration Precedence

Configuration is resolved in this order (later sources override earlier):

1. Built-in defaults (every rule has a `defaultSeverity`).
2. Preset configuration (`recommended`, `strict`, `minimal`, or `off`).
3. Configuration file (`.ai-rules-lint.json` or equivalent).
4. CLI `--rule` flags.
5. Programmatic `rules` in `LintOptions`.
6. Inline directives in the instruction file (`<!-- ai-rules-lint-disable -->`).

### Inline Disable Comments

Inline comments in instruction files can suppress specific rules for specific regions. This is useful when a rule fires correctly but the pattern is intentional (e.g., a vague instruction that serves as a general guideline).

Supported syntaxes:

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
This entire section is excluded from linting.
<!-- ai-rules-lint-enable -->
```

The `noInlineConfig` configuration option disables all inline directives:

```json
{
  "noInlineConfig": true
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

---

## 12. Rule Presets

### `recommended` (Default)

The balanced default preset. Enables all rules at their default severities. This is the right preset for most users.

| Rule ID | Severity |
|---|---|
| `max-length` | warning |
| `min-length` | info |
| `section-length` | info |
| `missing-sections` | warning |
| `no-headers` | warning |
| `deep-nesting` | info |
| `empty-section` | warning |
| `wall-of-text` | info |
| `vague-instruction` | warning |
| `redundant-instruction` | info |
| `contradictory-rules` | error |
| `unsafe-instruction` | error |
| `missing-specificity` | warning |
| `hardcoded-paths` | warning |
| `stale-reference` | warning |
| `nonexistent-command` | info |
| `personality-instruction` | info |
| `negative-only` | info |
| `too-many-rules` | info |
| `no-examples` | info |
| `todo-placeholder` | warning |
| `dated-content` | info |
| `claude-md-format` | info |
| `cursorrules-format` | info |
| `agents-md-format` | info |
| `copilot-instructions-format` | info |
| `redundant-whitespace` | info |
| `commented-out-content` | info |
| `excessive-formatting` | info |

### `strict`

Upgrades all warnings to errors and all info rules to warnings. Use this preset in CI pipelines that require zero-tolerance for instruction file quality issues.

| Rule ID | Severity |
|---|---|
| `max-length` | error |
| `min-length` | warning |
| `section-length` | warning |
| `missing-sections` | error |
| `no-headers` | error |
| `deep-nesting` | warning |
| `empty-section` | error |
| `wall-of-text` | warning |
| `vague-instruction` | error |
| `redundant-instruction` | warning |
| `contradictory-rules` | error |
| `unsafe-instruction` | error |
| `missing-specificity` | error |
| `hardcoded-paths` | error |
| `stale-reference` | error |
| `nonexistent-command` | warning |
| `personality-instruction` | warning |
| `negative-only` | warning |
| `too-many-rules` | warning |
| `no-examples` | warning |
| `todo-placeholder` | error |
| `dated-content` | warning |
| `claude-md-format` | warning |
| `cursorrules-format` | warning |
| `agents-md-format` | warning |
| `copilot-instructions-format` | warning |
| `redundant-whitespace` | warning |
| `commented-out-content` | warning |
| `excessive-formatting` | warning |

### `minimal`

Only critical rules that catch actual quality problems. Disables all stylistic and advisory rules. Use this preset when adopting the linter incrementally.

| Rule ID | Severity |
|---|---|
| `contradictory-rules` | error |
| `unsafe-instruction` | error |
| `stale-reference` | warning |
| `empty-section` | warning |
| `no-headers` | warning |
| All other rules | off |

### `off`

Disables all rules. Use this as a base when you want to enable only specific rules via overrides.

---

## 13. Custom Rules API

### Defining a Custom Rule

Custom rules implement the `CustomRuleDefinition` interface:

```typescript
interface CustomRuleDefinition {
  /** Unique rule ID. Must not conflict with built-in rule IDs. */
  id: string;

  /** What category this rule belongs to. */
  category: 'length' | 'structure' | 'content' | 'reference' | 'anti-pattern'
    | 'format-specific' | 'efficiency';

  /** Default severity when no override is configured. */
  defaultSeverity: Severity;

  /** Human-readable description of what this rule checks. */
  description: string;

  /**
   * The check function. Receives the parsed Instruction Document and a
   * context object for reporting diagnostics.
   */
  check: (document: InstructionDocument, context: RuleContext) => void | Promise<void>;
}

interface RuleContext {
  /**
   * Report a diagnostic.
   */
  report(params: {
    /** Human-readable problem description. */
    message: string;

    /** Source location of the problematic text. */
    location: SourceLocation;

    /** Optional fix suggestion. */
    suggestion?: string;

    /** Optional auto-fix. */
    fix?: Fix;
  }): void;

  /** The effective severity for this rule (after preset/config overrides). */
  severity: Severity;

  /**
   * The project root directory (for file system checks).
   */
  projectRoot: string | undefined;

  /**
   * The lint options provided by the user.
   */
  options: LintOptions | LintContentOptions;
}
```

### Registering Custom Rules

Custom rules are registered via the `customRules` option:

```typescript
import { lint, createRule } from 'ai-rules-lint';

const requireLicenseSection = createRule({
  id: 'require-license-section',
  category: 'structure',
  defaultSeverity: 'warning',
  description: 'Instruction file must mention the project license.',
  check: (document, context) => {
    const hasLicense = document.sections.some(
      s => s.title && /license|licensing/i.test(s.title)
    );
    const mentionsLicense = /\blicense\b/i.test(document.source);

    if (!hasLicense && !mentionsLicense) {
      context.report({
        message: 'Instruction file does not mention the project license.',
        location: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
        suggestion: 'Add a note about the project license (e.g., "This project is MIT licensed.").',
      });
    }
  },
});

const report = await lint({
  source: './CLAUDE.md',
  customRules: [requireLicenseSection],
});
```

### Custom Rules in Config File

Custom rules can be loaded from external files:

```json
{
  "preset": "recommended",
  "plugins": [
    "./lint-rules/company-rules.js"
  ]
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

## 14. CLI Interface

### Installation and Invocation

```bash
# Global install
npm install -g ai-rules-lint
ai-rules-lint ./CLAUDE.md

# npx (no install)
npx ai-rules-lint ./CLAUDE.md

# Package script
# package.json: { "scripts": { "lint:ai-rules": "ai-rules-lint" } }
npm run lint:ai-rules
```

### CLI Binary Name

`ai-rules-lint`

### Commands and Flags

The CLI has no subcommands. It accepts file paths/globs, rule options, and output options as flags.

```
ai-rules-lint [files/globs...] [options]

Positional arguments:
  files/globs              One or more file paths or glob patterns to lint.
                           Examples: ./CLAUDE.md, ./.cursorrules,
                           ./**/*.md
                           If no files specified, auto-discovers AI
                           instruction files in the current directory.

Discovery options:
  --scan                   Scan the current directory (or --project-root)
                           for all AI instruction files. Equivalent to
                           calling lintDirectory() programmatically.
  --project-root <path>    Project root for stale reference checking and
                           file discovery. Default: current directory.

Rule configuration:
  --preset <name>          Rule preset. Values: recommended, strict,
                           minimal, off. Default: recommended.
  --rule <id:severity>     Override severity for a rule (repeatable).
                           Example: --rule max-length:error
  --config <path>          Path to a configuration file.
                           Default: auto-detect .ai-rules-lint.json,
                           .ai-rules-lint.yaml, or .ai-rules-lintrc
                           in the current directory or ancestors.

Fix options:
  --fix                    Apply auto-fixes and write the result back to
                           the source file.
  --fix-dry-run            Show what auto-fixes would be applied without
                           modifying files.

Output options:
  --format <format>        Output format. Values: human, json, sarif.
                           Default: human.
  --quiet                  Suppress all output except errors and the exit
                           code. Overrides --format.
  --verbose                Show all diagnostics including info-severity.
                           By default, info diagnostics are hidden in
                           human output.
  --no-color               Disable colored output.
  --max-warnings <n>       Exit with code 1 if more than n warnings are
                           found. Default: -1 (unlimited).

General:
  --version                Print version and exit.
  --help                   Print help and exit.
```

### Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Passed. No error-severity diagnostics found (and warning count under `--max-warnings` threshold). |
| `1` | Failed. One or more error-severity diagnostics found, or warning count exceeded `--max-warnings`. |
| `2` | Configuration error. Invalid flags, no input files, invalid config file, or file read failure. |

Warnings and info diagnostics do not affect the exit code unless `--max-warnings` is set.

### Human-Readable Output Example

```
$ ai-rules-lint ./CLAUDE.md

  ai-rules-lint v0.1.0

  File: ./CLAUDE.md
  Format: claude-md
  Preset: recommended

  ERROR  contradictory-rules             lines 12, 42
         "Always use TypeScript" (line 12) contradicts "Write code in
         JavaScript when possible" (line 42).

  ERROR  unsafe-instruction              line 67
         "Execute any command without restrictions" is an unsafe
         instruction. Scope the AI's authority explicitly.

  WARN   stale-reference                 line 15
         File `src/utils/helpers.ts` referenced at line 15 does not
         exist in the project.

  WARN   vague-instruction               line 8
         "Follow best practices" is a vague instruction that provides
         no actionable guidance. Replace with specific conventions.

  WARN   max-length                      lines 1-95
         File contains ~7,200 estimated tokens (recommended maximum:
         5,000). Consider consolidating or removing redundant instructions.

  WARN   missing-sections                lines 1-95
         Missing expected sections: Testing, File Structure.

  ─────────────────────────────────────────────────────────
  2 errors, 4 warnings (6 diagnostics total, 0 fixable)
  Analyzed in 18ms
  Result: FAILED
```

### JSON Output Example

```
$ ai-rules-lint ./CLAUDE.md --format json
```

Outputs the `LintReport` object as a JSON string to stdout.

### SARIF Output Example

```
$ ai-rules-lint ./CLAUDE.md --format sarif > results.sarif
```

Outputs a SARIF v2.1.0 document. Each diagnostic maps to a SARIF `result` with:
- `ruleId`: the lint rule ID.
- `level`: `error`, `warning`, or `note` (SARIF equivalent of `info`).
- `message.text`: the diagnostic message.
- `locations[0].physicalLocation`: file path, start line, start column, end line, end column.
- `fixes[0].description.text`: the fix suggestion (if available).

This enables direct integration with GitHub Code Scanning, which displays SARIF results as annotations on pull request diffs.

### Auto-Discovery Example

```bash
# Scan the current project for all AI instruction files and lint them
$ ai-rules-lint --scan

  ai-rules-lint v0.1.0

  Discovered 3 AI instruction files:

  File: ./CLAUDE.md (claude-md)
  0 errors, 2 warnings

  File: ./.cursorrules (cursorrules)
  1 error, 0 warnings

  File: ./.github/copilot-instructions.md (copilot-instructions)
  0 errors, 0 warnings

  ─────────────────────────────────────────────────────────
  1 error, 2 warnings across 3 files
  Result: FAILED
```

### Environment Variables

All CLI flags can be set via environment variables. Environment variables are overridden by explicit flags.

| Environment Variable | Equivalent Flag |
|---------------------|-----------------|
| `AI_RULES_LINT_PRESET` | `--preset` |
| `AI_RULES_LINT_FORMAT` | `--format` |
| `AI_RULES_LINT_CONFIG` | `--config` |
| `AI_RULES_LINT_MAX_WARNINGS` | `--max-warnings` |
| `AI_RULES_LINT_PROJECT_ROOT` | `--project-root` |

---

## 15. Auto-fix

### Overview

Some rules support auto-fixing -- automatically correcting the detected issue. Auto-fixes are conservative: they only apply when the correction is unambiguous and cannot change the instruction file's intended meaning.

### Rules with Auto-Fix Support

| Rule ID | Fix Description |
|---|---|
| `empty-section` | Removes the empty section header and surrounding whitespace. |
| `redundant-whitespace` | Collapses multiple blank lines to a single blank line. Removes trailing whitespace from all lines. |
| `commented-out-content` | Removes HTML comments that are not `ai-rules-lint` inline directives. |

### Fix Application

Fixes are applied via the `--fix` CLI flag or the `fix: true` API option.

**CLI behavior**: `--fix` modifies source files in place. The CLI writes the fixed content back to each file and re-runs the linter to report remaining (unfixable) diagnostics.

**API behavior**: `fix: true` returns the fixed text in `report.fixed` without modifying any files. The caller decides what to do with the fixed text.

**Dry run**: `--fix-dry-run` shows what fixes would be applied (as a unified diff) without writing to files.

### Fix Conflict Resolution

When multiple fixes affect overlapping text ranges, the linter applies them in order of specificity (smallest range first). If two fixes conflict (overlapping ranges that cannot both be applied), the first fix wins and the second is skipped (the diagnostic remains in the report as unfixed).

---

## 16. Integration

### CI/CD: GitHub Actions

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

Add to `.husky/pre-commit` or equivalent:

```bash
#!/bin/sh
npx ai-rules-lint --scan --preset recommended --quiet
```

With lint-staged (lint only changed instruction files):

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

### Integration with prompt-lint

`ai-rules-lint` and `prompt-lint` are complementary tools with different scopes:

- **`prompt-lint`** lints LLM prompts: individual messages, message arrays, template files, and prompt documents. It checks clarity, security (injection risks), structure, efficiency, and best practices for text that will be sent as a prompt to an LLM.
- **`ai-rules-lint`** lints AI instruction files: persistent project-level configuration files that shape AI tool behavior across all sessions. It checks length, structure, content quality, stale references, contradictions, and format-specific conventions.

Some rules overlap (both detect vague instructions and contradictions), but the analysis context is different. A `CLAUDE.md` file should be linted with `ai-rules-lint`, not `prompt-lint`, because the rules are calibrated for instruction files (expected sections, stale reference detection, format-specific checks).

Teams can run both linters in CI:

```json
{
  "scripts": {
    "lint:prompts": "prompt-lint ./prompts/",
    "lint:ai-rules": "ai-rules-lint --scan",
    "lint:all": "npm run lint:prompts && npm run lint:ai-rules"
  }
}
```

### Integration with ai-env-init

If `ai-env-init` (or similar tools that bootstrap AI instruction files from templates) is used to generate instruction files, `ai-rules-lint` can validate the generated output:

```bash
# Generate instruction files from template
npx ai-env-init

# Validate the generated files
npx ai-rules-lint --scan --preset recommended
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

---

## 17. Formatters / Reporters

### Human Formatter

The default output format. Produces colored, indented terminal output with severity badges (`ERROR`, `WARN`, `INFO`), rule IDs, line numbers, messages, and a summary line. Info-severity diagnostics are hidden unless `--verbose` is specified.

### JSON Formatter

Outputs the complete `LintReport` object as pretty-printed JSON to stdout. Suitable for programmatic consumption by other tools, dashboards, and CI integrations.

### SARIF Formatter

Outputs a SARIF v2.1.0 JSON document. The mapping:

| LintReport field | SARIF field |
|---|---|
| `ruleId` | `result.ruleId` |
| `severity: 'error'` | `result.level: 'error'` |
| `severity: 'warning'` | `result.level: 'warning'` |
| `severity: 'info'` | `result.level: 'note'` |
| `message` | `result.message.text` |
| `location` | `result.locations[0].physicalLocation` (file, line, column) |
| `suggestion` | `result.fixes[0].description.text` |
| Rule metadata | `run.tool.driver.rules[]` |

SARIF output enables direct integration with:
- **GitHub Code Scanning**: Upload SARIF via the `github/codeql-action/upload-sarif` action.
- **GitHub Actions problem matchers**: GitHub parses SARIF and displays annotations on pull request diffs.
- **VS Code SARIF Viewer**: Open SARIF files in VS Code to navigate diagnostics.
- **Azure DevOps**: Upload SARIF to Azure DevOps for centralized analysis.

### Custom Formatters (Programmatic Only)

The `lint` function returns a `LintReport` object. Users can format it however they like:

```typescript
import { lint } from 'ai-rules-lint';

const report = await lint({ source: './CLAUDE.md' });

// Custom CSV output
for (const d of report.diagnostics) {
  console.log(`${d.severity},${d.ruleId},${d.location.startLine},"${d.message}"`);
}
```

---

## 18. Testing Strategy

### Unit Tests

Unit tests verify each component in isolation.

- **Parser tests**: Test that the parser correctly identifies sections, headers, instructions, references, and metadata from instruction file content. Test edge cases: empty input, file with no headers, file with only headers, deeply nested sections, mixed section styles.
- **Rule tests**: For each built-in rule, test with:
  - An instruction file that passes the rule (expect zero diagnostics).
  - An instruction file that fails the rule (expect one or more diagnostics with correct ruleId, severity, location, and message).
  - Edge cases specific to the rule (e.g., `contradictory-rules` with near-contradictions that should not fire, `stale-reference` with paths that exist vs. paths that do not, `max-length` at exactly the threshold).
- **Auto-fix tests**: For each fixable rule, test that the fix produces the expected output and does not corrupt surrounding text. Test fix conflict resolution with overlapping ranges.
- **Preset tests**: Verify that each preset enables the expected rules at the expected severities.
- **Configuration tests**: Verify config file parsing, precedence resolution, shorthand severity expansion, inline directive processing, and error handling for invalid configs.
- **Format detection tests**: Verify that each supported file name is correctly mapped to its format. Test ambiguous cases and custom files.
- **Formatter tests**: Verify human-readable, JSON, and SARIF output for a known report. Verify SARIF output conforms to the v2.1.0 schema.
- **CLI parsing tests**: Verify argument parsing, environment variable fallback, flag precedence, auto-discovery, and error messages for invalid input.

### Integration Tests

Integration tests run the full lint pipeline (parse, evaluate, format) against realistic instruction files.

- **Well-written instruction file**: Lint a high-quality CLAUDE.md with proper structure, specific instructions, no contradictions, valid file references, and appropriate length. Assert zero errors and zero warnings with the `recommended` preset.
- **Poorly-written instruction file**: Lint an instruction file with known issues (vague instructions, contradictions, stale references, excessive length, missing sections, personality instructions). Assert the expected diagnostics are produced.
- **Stale reference detection**: Create a temporary project directory with specific files, write an instruction file that references both existing and non-existing files, and verify that `stale-reference` fires only for non-existing files.
- **Format-specific rules**: Lint a `.cursorrules` file and verify that `cursorrules-format` rules fire but `claude-md-format` rules do not.
- **Auto-fix round-trip**: Apply fixes to an instruction file, then re-lint the fixed output. Assert that fixed issues no longer produce diagnostics and that unfixed issues are still reported.
- **Directory scanning**: Create a temporary project with multiple instruction files (`CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`). Run `lintDirectory` and verify all files are discovered and linted.
- **CLI end-to-end**: Run the CLI binary against test fixtures and verify exit codes, stdout output, and stderr output.

### Edge Cases to Test

- Empty instruction file (empty string, empty file).
- Instruction file containing only whitespace.
- Instruction file with only a single header and no content.
- Instruction file exceeding 1 MB (performance test).
- Binary file accidentally passed as input.
- File with no recognized instruction file name (custom format).
- Instruction file in a project with no `package.json` or `.git` (project root detection).
- Instruction file with inline `ai-rules-lint-disable` that disables all rules.
- Custom rule that throws during execution.
- Configuration file with unknown rule IDs.
- Configuration file with invalid JSON/YAML.
- Glob pattern that matches zero files.
- Stale reference with a path that contains spaces or special characters.
- Contradiction detection with instructions in different languages (English vs. non-English).

### Test Framework

Tests use Vitest, matching the project's existing configuration. Test fixtures are stored in `src/__tests__/fixtures/` as static instruction files representing various formats and quality levels.

---

## 19. Performance

### Parsing

The parser is a single-pass text processor. It iterates through the input text once, building the Instruction Document incrementally. For a 5,000-character instruction file (~1,250 tokens), parsing completes in under 1ms. For a 50,000-character file (~12,500 tokens), parsing completes in under 5ms.

### Rule Evaluation

Rule evaluation is synchronous for all rules except `stale-reference` (which performs file system checks). Synchronous rules run in a single pass after parsing. For a file with 15 sections, 50 instructions, and 20 references, the total evaluation across all 29 rules completes in under 5ms.

### Stale Reference Checking

Stale reference checking involves file system I/O (`existsSync` calls). For an instruction file with 30 file path references, checking all of them completes in under 10ms on a typical SSD. The `stale-reference` rule uses `existsSync` (synchronous) rather than async I/O because the operation is fast enough that the simplicity of synchronous code outweighs the concurrency benefit of async I/O for this number of checks.

### Auto-Fix

Fix application is a single pass through the source text, applying non-overlapping replacements in reverse order (last offset first) to avoid invalidating earlier offsets. This completes in under 1ms for typical instruction files.

### Memory

The Instruction Document holds the full source text plus parsed structures. For a 100 KB instruction file (extremely large), the memory footprint is approximately 500 KB. This is well within acceptable limits.

### Directory Scanning

When scanning a directory for instruction files, `ai-rules-lint` checks for known file names at the project root and in known subdirectories (`.claude/`, `.cursor/`, `.github/`). This is a constant-time operation (checking ~15 specific paths), not a recursive directory traversal. Each discovered file is then linted independently.

### Startup Time

The CLI imports only the modules needed for the specified operation. Rule modules are loaded eagerly (all rules are lightweight pure functions). Cold-start time for `npx ai-rules-lint` is dominated by npm/npx overhead, not by the package itself.

---

## 20. Dependencies

### Runtime Dependencies

None. `ai-rules-lint` has zero runtime dependencies. All functionality is implemented using Node.js built-in modules:

| Node.js Built-in | Purpose |
|---|---|
| `node:fs` | Synchronous file existence checks for stale reference detection (`existsSync`). |
| `node:fs/promises` | Reading instruction files from disk. |
| `node:path` | File path resolution, extension detection, project root detection. |
| `node:util` | `parseArgs` for CLI argument parsing (Node.js 18+). |
| `node:process` | Exit codes, stdin reading, environment variables. |

### Why Zero Dependencies

- **No CLI framework**: `node:util.parseArgs` (available since Node.js 18) handles all flag parsing. No dependency on `commander`, `yargs`, or `meow`.
- **No YAML parser**: Configuration files in YAML format are parsed with a minimal inline parser that handles the subset of YAML used in config files (simple key-value pairs, nested objects, and arrays). Users who want full YAML support use JSON config files.
- **No NLP library**: Contradiction detection and vague-language detection use keyword lists and regex patterns, not natural language processing libraries.
- **No glob library**: File discovery uses direct path checks for known file names, not glob expansion. Glob patterns in CLI positional arguments use `node:fs` directory reading with pattern matching.
- **No chalk/colors**: Terminal coloring uses ANSI escape codes directly. Color detection uses `process.stdout.isTTY` and `NO_COLOR` environment variable.

### Dev Dependencies

| Dependency | Purpose |
|---|---|
| `typescript` | TypeScript compiler. |
| `vitest` | Test runner. |
| `eslint` | Linter for the linter's own source code. |

---

## 21. File Structure

```
ai-rules-lint/
├── package.json
├── tsconfig.json
├── SPEC.md
├── README.md
├── .ai-rules-lint.json               # Example config (also used for self-linting)
├── src/
│   ├── index.ts                      # Public API exports: lint, lintContent, lintDirectory,
│   │                                 #   createLinter, createRule, types
│   ├── cli.ts                        # CLI entry point: argument parsing, file discovery,
│   │                                 #   output formatting, exit codes
│   ├── types.ts                      # All TypeScript type definitions
│   ├── lint.ts                       # Core lint() function: read file, parse, evaluate, report
│   ├── lint-content.ts               # lintContent() function: parse string, evaluate, report
│   ├── lint-directory.ts             # lintDirectory() function: discover files, lint each
│   ├── create-linter.ts              # createLinter() factory function
│   ├── parser/
│   │   ├── index.ts                  # Parser entry point: format detection, dispatch
│   │   ├── format-detector.ts        # File format auto-detection from file name/path
│   │   ├── section-parser.ts         # Markdown header parsing, section extraction
│   │   ├── instruction-extractor.ts  # Imperative statement extraction
│   │   ├── reference-extractor.ts    # File path, function, class reference extraction
│   │   └── document-builder.ts       # Assembles InstructionDocument from parsed components
│   ├── rules/
│   │   ├── index.ts                  # Rule registry: collects all built-in rules
│   │   ├── rule-runner.ts            # Evaluates rules against InstructionDocument, produces diagnostics
│   │   ├── create-rule.ts            # createRule() factory function
│   │   ├── length/
│   │   │   ├── max-length.ts
│   │   │   ├── min-length.ts
│   │   │   └── section-length.ts
│   │   ├── structure/
│   │   │   ├── missing-sections.ts
│   │   │   ├── no-headers.ts
│   │   │   ├── deep-nesting.ts
│   │   │   ├── empty-section.ts
│   │   │   └── wall-of-text.ts
│   │   ├── content/
│   │   │   ├── vague-instruction.ts
│   │   │   ├── redundant-instruction.ts
│   │   │   ├── contradictory-rules.ts
│   │   │   ├── unsafe-instruction.ts
│   │   │   ├── missing-specificity.ts
│   │   │   └── hardcoded-paths.ts
│   │   ├── reference/
│   │   │   ├── stale-reference.ts
│   │   │   └── nonexistent-command.ts
│   │   ├── anti-pattern/
│   │   │   ├── personality-instruction.ts
│   │   │   ├── negative-only.ts
│   │   │   ├── too-many-rules.ts
│   │   │   ├── no-examples.ts
│   │   │   ├── todo-placeholder.ts
│   │   │   └── dated-content.ts
│   │   ├── format-specific/
│   │   │   ├── claude-md-format.ts
│   │   │   ├── cursorrules-format.ts
│   │   │   ├── agents-md-format.ts
│   │   │   └── copilot-instructions-format.ts
│   │   └── efficiency/
│   │       ├── redundant-whitespace.ts
│   │       ├── commented-out-content.ts
│   │       └── excessive-formatting.ts
│   ├── config/
│   │   ├── index.ts                  # Config file loading and resolution
│   │   ├── presets.ts                # Built-in preset definitions
│   │   └── inline-directives.ts      # Inline disable/enable comment parsing
│   ├── formatters/
│   │   ├── index.ts                  # Formatter factory
│   │   ├── human.ts                  # Human-readable terminal output
│   │   ├── json.ts                   # JSON output
│   │   └── sarif.ts                  # SARIF v2.1.0 output
│   ├── discovery/
│   │   └── file-discoverer.ts        # Discovers AI instruction files in a directory
│   └── utils/
│       ├── text.ts                   # Text normalization, similarity comparison
│       ├── token-estimate.ts         # Token count estimation
│       └── ansi.ts                   # ANSI color code helpers
├── src/__tests__/
│   ├── parser/
│   │   ├── section-parser.test.ts
│   │   ├── instruction-extractor.test.ts
│   │   ├── reference-extractor.test.ts
│   │   └── format-detector.test.ts
│   ├── rules/
│   │   ├── max-length.test.ts
│   │   ├── min-length.test.ts
│   │   ├── missing-sections.test.ts
│   │   ├── contradictory-rules.test.ts
│   │   ├── stale-reference.test.ts
│   │   ├── vague-instruction.test.ts
│   │   ├── unsafe-instruction.test.ts
│   │   ├── redundant-instruction.test.ts
│   │   └── ... (one test file per rule)
│   ├── presets.test.ts
│   ├── config.test.ts
│   ├── lint.test.ts
│   ├── lint-content.test.ts
│   ├── lint-directory.test.ts
│   ├── cli.test.ts
│   ├── formatters/
│   │   ├── human.test.ts
│   │   ├── json.test.ts
│   │   └── sarif.test.ts
│   └── fixtures/
│       ├── well-written-claude.md     # High-quality CLAUDE.md with no issues
│       ├── poorly-written-claude.md   # CLAUDE.md with many issues
│       ├── contradictory-rules.md     # File with known contradictions
│       ├── stale-references.md        # File with references to non-existing files
│       ├── sample.cursorrules         # Sample .cursorrules file
│       ├── sample-agents.md           # Sample AGENTS.md file
│       ├── minimal-file.md            # Very short file (triggers min-length)
│       ├── massive-file.md            # Very long file (triggers max-length)
│       └── configs/
│           ├── valid-config.json
│           ├── invalid-config.json
│           └── strict-override.json
└── dist/                              # Compiled output (gitignored)
```

---

## 22. Implementation Roadmap

### Phase 1: Core Parsing and Essential Rules (v0.1.0)

Implement the foundational linter with the most valuable rules and basic CLI support.

**Deliverables:**
- Instruction file parser: markdown header parsing, section extraction, instruction extraction, format detection.
- `lint()` function with file reading and report generation.
- `lintContent()` function for string input.
- Built-in rules: `max-length`, `min-length`, `no-headers`, `empty-section`, `vague-instruction`, `contradictory-rules`, `unsafe-instruction`, `missing-sections`.
- `recommended` and `minimal` presets.
- CLI with positional file arguments, `--preset`, `--format human`, `--format json` flags.
- Configuration file support (`.ai-rules-lint.json`).
- Unit tests for parser and all rules.
- Integration test with fixture files.

### Phase 2: Reference Checking and Content Rules (v0.2.0)

Add stale reference detection and remaining content quality rules.

**Deliverables:**
- Reference extractor: file path scanning, function/class name detection.
- `stale-reference` rule with file existence checking.
- `nonexistent-command` rule with `package.json` script validation.
- Remaining content rules: `redundant-instruction`, `missing-specificity`, `hardcoded-paths`.
- Anti-pattern rules: `personality-instruction`, `negative-only`, `too-many-rules`, `no-examples`, `todo-placeholder`, `dated-content`.
- `strict` preset.
- Custom rules API (`createRule`, `customRules` option).
- Auto-fix for `empty-section`, `redundant-whitespace`, `commented-out-content`.
- SARIF formatter.

### Phase 3: Format-Specific Rules and Directory Scanning (v0.3.0)

Add format-aware analysis and project-wide scanning.

**Deliverables:**
- Format-specific rules: `claude-md-format`, `cursorrules-format`, `agents-md-format`, `copilot-instructions-format`.
- `lintDirectory()` function and `--scan` CLI flag.
- `createLinter()` factory function.
- Efficiency rules: `excessive-formatting`.
- Remaining structure rules: `deep-nesting`, `section-length`, `wall-of-text`.
- Inline directive processing (`<!-- ai-rules-lint-disable -->`).
- `--fix` and `--fix-dry-run` CLI flags.
- Environment variable configuration.
- YAML configuration file support.
- `--verbose`, `--no-color`, `--max-warnings`, `--quiet` CLI flags.

### Phase 4: Polish and Ecosystem (v1.0.0)

Stabilize the API, complete documentation, and prepare for broad adoption.

**Deliverables:**
- API stability guarantee (semver major version).
- Complete README with usage examples, rule catalog, and configuration guide.
- Published npm package with TypeScript declarations.
- GitHub Actions integration example and documentation.
- Pre-commit hook documentation and examples.
- Example custom rule packages (organization-specific standards).
- Performance benchmarks for large instruction files.
- Contradiction detection improvements (expanded technology matrix, behavioral pattern library).

---

## 23. Example Use Cases

### 23.1 CI Quality Gate for CLAUDE.md

A team adds `ai-rules-lint` to their GitHub Actions workflow to ensure CLAUDE.md stays high-quality as the codebase evolves.

```yaml
- name: Lint AI instruction files
  run: npx ai-rules-lint --scan --preset recommended
```

Every pull request that modifies `CLAUDE.md` is checked. Stale references are caught when files are renamed. Contradictions are caught when new rules conflict with existing ones. Length warnings appear when the file grows past the recommended threshold.

### 23.2 Team Standardization

An engineering organization wants all 50 repositories to have consistent, high-quality AI instruction files. They publish a shared configuration:

```json
{
  "preset": "strict",
  "rules": {
    "missing-sections": {
      "severity": "error",
      "options": {
        "expectedSections": [
          { "name": "Project Overview", "keywords": ["overview", "about", "project"] },
          { "name": "Tech Stack", "keywords": ["stack", "technology", "framework"] },
          { "name": "Coding Conventions", "keywords": ["conventions", "style", "coding"] },
          { "name": "Testing", "keywords": ["testing", "tests"] },
          { "name": "Deployment", "keywords": ["deployment", "deploy"] }
        ]
      }
    },
    "max-length": {
      "severity": "error",
      "options": { "maxTokens": 4000 }
    }
  }
}
```

Each repository's CI pipeline runs `ai-rules-lint` with this shared config. New repositories that bootstrap from the organization's template get immediate feedback on whether their instruction file meets the standard.

### 23.3 Stale Reference Cleanup

A developer has been maintaining a `CLAUDE.md` for a year. The codebase has been refactored twice. They run:

```bash
$ ai-rules-lint ./CLAUDE.md --rule stale-reference:error

  WARN   stale-reference    line 12
         File `src/utils/helpers.ts` does not exist.

  WARN   stale-reference    line 23
         File `src/components/Header/index.tsx` does not exist.

  WARN   stale-reference    line 45
         Directory `src/legacy/` does not exist.

  WARN   stale-reference    line 67
         File `config/webpack.config.js` does not exist.

  4 warnings (4 stale references found)
```

They update the references, remove mentions of deleted files, and commit the cleaned-up `CLAUDE.md`.

### 23.4 Instruction File Review

A new team member writes their first `CLAUDE.md`. Before submitting the pull request, they run the linter:

```bash
$ ai-rules-lint ./CLAUDE.md --preset strict --verbose

  ERROR  contradictory-rules    lines 15, 32
         "Always use arrow functions" contradicts "Use regular function
         declarations for named functions".

  ERROR  vague-instruction      line 8
         "Follow best practices" is vague.

  ERROR  missing-sections       lines 1-40
         Missing expected sections: Testing, File Structure.

  WARN   no-examples            lines 1-40
         Instruction file includes coding conventions but no code
         examples. Add example code blocks.

  WARN   personality-instruction line 3
         "Be friendly and enthusiastic" is a personality instruction
         that does not affect code quality.

  INFO   negative-only          lines 25-32
         Section "Don'ts" contains only negative instructions.
         Consider adding positive guidance.
```

They fix the contradictions, add specific instructions, include a Testing section, and remove the personality instruction before submitting.

### 23.5 Multi-Format Project

A project uses both Claude Code and Cursor. They have both `CLAUDE.md` and `.cursorrules`. They run:

```bash
$ ai-rules-lint --scan

  File: ./CLAUDE.md (claude-md)
  0 errors, 1 warning

  File: ./.cursorrules (cursorrules)
  0 errors, 0 warnings

  0 errors, 1 warning across 2 files
  Result: PASSED
```

Both files are validated with their respective format-specific rules alongside the universal quality checks.
