import { LintRule } from '../types';

/**
 * Patterns that look like secrets/API keys.
 */
const SECRET_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /\b(?:sk-[a-zA-Z0-9]{20,})\b/, type: 'OpenAI API key' },
  { pattern: /\b(?:sk-ant-[a-zA-Z0-9]{20,})\b/, type: 'Anthropic API key' },
  { pattern: /\b(?:ghp_[a-zA-Z0-9]{36,})\b/, type: 'GitHub personal access token' },
  { pattern: /\b(?:gho_[a-zA-Z0-9]{36,})\b/, type: 'GitHub OAuth token' },
  { pattern: /\b(?:github_pat_[a-zA-Z0-9_]{20,})\b/, type: 'GitHub fine-grained PAT' },
  { pattern: /\b(?:glpat-[a-zA-Z0-9_-]{20,})\b/, type: 'GitLab personal access token' },
  { pattern: /\b(?:xoxb-[a-zA-Z0-9-]+)\b/, type: 'Slack bot token' },
  { pattern: /\b(?:xoxp-[a-zA-Z0-9-]+)\b/, type: 'Slack user token' },
  { pattern: /\b(?:AKIA[A-Z0-9]{16})\b/, type: 'AWS access key' },
  { pattern: /(?:(?:api[_-]?key|apikey|api[_-]?token|secret[_-]?key|access[_-]?token|auth[_-]?token|private[_-]?key)\s*[:=]\s*["']?[a-zA-Z0-9_\-/.]{20,})/i, type: 'API key/token assignment' },
  { pattern: /\b(?:eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,})\b/, type: 'JWT token' },
];

/**
 * secrets-in-file: detects API keys, tokens, and secrets in instruction files.
 */
export const secretsInFile: LintRule = {
  id: 'secrets-in-file',
  category: 'content',
  defaultSeverity: 'error',
  description: 'Instruction file may contain API keys, tokens, or secrets.',
  check(document, context) {
    const lines = document.source.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const { pattern, type } of SECRET_PATTERNS) {
        if (pattern.test(line)) {
          context.report({
            message: `Possible ${type} detected in instruction file. Secrets should not be stored in instruction files.`,
            location: {
              startLine: i + 1,
              startColumn: 1,
              endLine: i + 1,
              endColumn: line.length + 1,
            },
            suggestion: 'Remove the secret and use environment variables or a secrets manager instead.',
          });
          break; // One diagnostic per line
        }
      }
    }
  },
};

export const securityRules: LintRule[] = [secretsInFile];
