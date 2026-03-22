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
exports.lint = lint;
exports.lintContent = lintContent;
exports.lintDirectory = lintDirectory;
exports.createLinter = createLinter;
exports.createRule = createRule;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const parser_1 = require("./parser");
const registry_1 = require("./registry");
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
function severityOrder(severity) {
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
function sortDiagnostics(diagnostics) {
    return diagnostics.sort((a, b) => {
        const sevDiff = severityOrder(a.severity) - severityOrder(b.severity);
        if (sevDiff !== 0)
            return sevDiff;
        const lineDiff = a.location.startLine - b.location.startLine;
        if (lineDiff !== 0)
            return lineDiff;
        return a.location.startColumn - b.location.startColumn;
    });
}
/**
 * Resolve the source to content and format.
 */
function resolveSource(source) {
    if (typeof source === 'string') {
        const content = fs.readFileSync(source, 'utf-8');
        const format = (0, parser_1.detectFormat)(source);
        return { content, format, filePath: path.resolve(source) };
    }
    if ('file' in source) {
        const content = fs.readFileSync(source.file, 'utf-8');
        const format = (0, parser_1.detectFormat)(source.file);
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
function runLint(content, format, preset, ruleOverrides, customRules, projectRoot) {
    const document = (0, parser_1.parse)(content, format);
    const registry = (0, registry_1.createRegistry)(preset, ruleOverrides, customRules);
    const enabledRules = registry.getEnabledRules();
    const ruleStates = registry.getRuleStates();
    const diagnostics = [];
    for (const { rule, severity, options } of enabledRules) {
        const ruleContext = {
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
        try {
            rule.check(document, ruleContext, Object.keys(mergedOptions).length > 0 ? mergedOptions : undefined);
        }
        catch (err) {
            diagnostics.push({
                ruleId: rule.id,
                severity: 'warning',
                category: rule.category,
                location: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 },
                message: `Rule "${rule.id}" threw an error: ${err instanceof Error ? err.message : String(err)}`,
            });
        }
    }
    return { diagnostics: sortDiagnostics(diagnostics), ruleStates };
}
/**
 * Build a LintReport from diagnostics and metadata.
 */
function buildReport(diagnostics, ruleStates, content, format, preset, filePath, startTime) {
    const document = (0, parser_1.parse)(content, format);
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
async function lint(options) {
    const startTime = Date.now();
    const { content, format, filePath } = resolveSource(options.source);
    const preset = options.preset ?? 'recommended';
    let projectRoot = options.projectRoot;
    if (!projectRoot && filePath) {
        projectRoot = path.dirname(filePath);
    }
    const { diagnostics, ruleStates } = runLint(content, format, preset, options.rules, options.customRules, projectRoot);
    return buildReport(diagnostics, ruleStates, content, format, preset, filePath, startTime);
}
/**
 * Lint instruction file content provided as a string.
 */
function lintContent(options) {
    const startTime = Date.now();
    const format = options.format ?? 'custom';
    const preset = options.preset ?? 'recommended';
    const { diagnostics, ruleStates } = runLint(options.content, format, preset, options.rules, options.customRules, options.projectRoot);
    return buildReport(diagnostics, ruleStates, options.content, format, preset, undefined, startTime);
}
/**
 * Scan a directory for AI instruction files and lint each one.
 */
async function lintDirectory(options) {
    const reports = [];
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
function createLinter(config) {
    const preset = config.preset ?? 'recommended';
    return {
        async lint(source, projectRoot) {
            return lint({
                source,
                preset,
                rules: config.rules,
                customRules: config.customRules,
                projectRoot,
            });
        },
        lintContent(content, format) {
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
function createRule(definition) {
    return definition;
}
//# sourceMappingURL=linter.js.map