"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceRules = exports.nonexistentCommand = exports.staleReference = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
/**
 * stale-reference: detects file path references that don't exist.
 */
exports.staleReference = {
    id: 'stale-reference',
    category: 'reference',
    defaultSeverity: 'warning',
    description: 'Instruction file references files or directories that do not exist.',
    check(document, context, options) {
        const projectRoot = options?.projectRoot ?? undefined;
        const checkFiles = options?.checkFiles ?? true;
        const checkDirectories = options?.checkDirectories ?? true;
        const ignorePaths = options?.ignorePaths ?? ['node_modules/', 'dist/', 'build/'];
        if (!projectRoot)
            return; // Cannot check without project root
        for (const ref of document.references) {
            if (ref.type !== 'file' && ref.type !== 'directory')
                continue;
            if (ref.type === 'file' && !checkFiles)
                continue;
            if (ref.type === 'directory' && !checkDirectories)
                continue;
            // Check ignore patterns
            const shouldIgnore = ignorePaths.some(p => ref.value.startsWith(p) || ref.value.includes(`/${p}`));
            if (shouldIgnore)
                continue;
            // Skip example/placeholder paths
            if (/^(?:example|your-project|path\/to|\.\.\.)\//i.test(ref.value))
                continue;
            const resolvedPath = path.resolve(projectRoot, ref.value);
            try {
                if (!fs.existsSync(resolvedPath)) {
                    ref.exists = false;
                    context.report({
                        message: `Referenced ${ref.type} "${ref.value}" does not exist.`,
                        location: ref.location,
                        suggestion: 'Update the reference to point to an existing file or remove it.',
                    });
                }
                else {
                    ref.exists = true;
                }
            }
            catch {
                // Skip if we can't check (permissions, etc.)
            }
        }
    },
};
/**
 * nonexistent-command: detects npm script references that don't exist in package.json.
 */
exports.nonexistentCommand = {
    id: 'nonexistent-command',
    category: 'reference',
    defaultSeverity: 'info',
    description: 'Instruction file references npm scripts that are not defined in package.json.',
    check(document, context, options) {
        const projectRoot = options?.projectRoot ?? undefined;
        if (!projectRoot)
            return;
        // Read package.json scripts
        let scripts = {};
        try {
            const pkgPath = path.join(projectRoot, 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
                const pkg = JSON.parse(pkgContent);
                scripts = pkg.scripts || {};
            }
        }
        catch {
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
exports.referenceRules = [exports.staleReference, exports.nonexistentCommand];
//# sourceMappingURL=references.js.map