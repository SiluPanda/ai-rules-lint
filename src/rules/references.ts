import * as fs from 'node:fs';
import * as path from 'node:path';
import { LintRule } from '../types';

/**
 * stale-reference: detects file path references that don't exist.
 */
export const staleReference: LintRule = {
  id: 'stale-reference',
  category: 'reference',
  defaultSeverity: 'warning',
  description: 'Instruction file references files or directories that do not exist.',
  check(document, context, options) {
    const projectRoot = (options?.projectRoot as string) ?? undefined;
    const checkFiles = (options?.checkFiles as boolean) ?? true;
    const checkDirectories = (options?.checkDirectories as boolean) ?? true;
    const ignorePaths = (options?.ignorePaths as string[]) ?? ['node_modules/', 'dist/', 'build/'];

    if (!projectRoot) return; // Cannot check without project root

    for (const ref of document.references) {
      if (ref.type !== 'file' && ref.type !== 'directory') continue;
      if (ref.type === 'file' && !checkFiles) continue;
      if (ref.type === 'directory' && !checkDirectories) continue;

      // Check ignore patterns
      const shouldIgnore = ignorePaths.some(p => ref.value.startsWith(p) || ref.value.includes(`/${p}`));
      if (shouldIgnore) continue;

      // Skip example/placeholder paths
      if (/^(?:example|your-project|path\/to|\.\.\.)\//i.test(ref.value)) continue;

      const resolvedPath = path.resolve(projectRoot, ref.value);
      try {
        if (!fs.existsSync(resolvedPath)) {
          ref.exists = false;
          context.report({
            message: `Referenced ${ref.type} "${ref.value}" does not exist.`,
            location: ref.location,
            suggestion: 'Update the reference to point to an existing file or remove it.',
          });
        } else {
          ref.exists = true;
        }
      } catch {
        // Skip if we can't check (permissions, etc.)
      }
    }
  },
};

/**
 * nonexistent-command: detects npm script references that don't exist in package.json.
 */
export const nonexistentCommand: LintRule = {
  id: 'nonexistent-command',
  category: 'reference',
  defaultSeverity: 'info',
  description: 'Instruction file references npm scripts that are not defined in package.json.',
  check(document, context, options) {
    const projectRoot = (options?.projectRoot as string) ?? undefined;
    if (!projectRoot) return;

    // Read package.json scripts
    let scripts: Record<string, string> = {};
    try {
      const pkgPath = path.join(projectRoot, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgContent);
        scripts = pkg.scripts || {};
      }
    } catch {
      return; // Can't read package.json
    }

    const lines = document.source.split('\n');
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      if (inCodeBlock) continue;

      // Look for npm run <script> references
      const npmRunMatches = line.matchAll(/npm\s+run\s+([\w:.-]+)/g);
      for (const match of npmRunMatches) {
        const scriptName = match[1];
        if (!(scriptName in scripts)) {
          context.report({
            message: `npm script "${scriptName}" is referenced but not defined in package.json.`,
            location: {
              startLine: i + 1,
              startColumn: (match.index ?? 0) + 1,
              endLine: i + 1,
              endColumn: (match.index ?? 0) + match[0].length + 1,
            },
            suggestion: `Add "${scriptName}" to the scripts section of package.json, or update the reference.`,
          });
        }
      }
    }
  },
};

export const referenceRules: LintRule[] = [staleReference, nonexistentCommand];
