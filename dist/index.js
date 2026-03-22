"use strict";
// ai-rules-lint - Linter and validator for AI instruction files
Object.defineProperty(exports, "__esModule", { value: true });
exports.builtinRuleIds = exports.builtinRules = exports.createRegistry = exports.detectFormat = exports.parse = exports.createRule = exports.createLinter = exports.lintDirectory = exports.lintContent = exports.lint = void 0;
// Main API
var linter_1 = require("./linter");
Object.defineProperty(exports, "lint", { enumerable: true, get: function () { return linter_1.lint; } });
Object.defineProperty(exports, "lintContent", { enumerable: true, get: function () { return linter_1.lintContent; } });
Object.defineProperty(exports, "lintDirectory", { enumerable: true, get: function () { return linter_1.lintDirectory; } });
Object.defineProperty(exports, "createLinter", { enumerable: true, get: function () { return linter_1.createLinter; } });
Object.defineProperty(exports, "createRule", { enumerable: true, get: function () { return linter_1.createRule; } });
// Parser
var parser_1 = require("./parser");
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return parser_1.parse; } });
Object.defineProperty(exports, "detectFormat", { enumerable: true, get: function () { return parser_1.detectFormat; } });
// Registry
var registry_1 = require("./registry");
Object.defineProperty(exports, "createRegistry", { enumerable: true, get: function () { return registry_1.createRegistry; } });
Object.defineProperty(exports, "builtinRules", { enumerable: true, get: function () { return registry_1.builtinRules; } });
Object.defineProperty(exports, "builtinRuleIds", { enumerable: true, get: function () { return registry_1.builtinRuleIds; } });
//# sourceMappingURL=index.js.map