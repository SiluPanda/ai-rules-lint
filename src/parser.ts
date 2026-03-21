import {
  FileFormat,
  InstructionDocument,
  InstructionStatement,
  Reference,
  Section,
} from './types';

/**
 * Section category keyword mapping.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Project Overview': ['overview', 'about', 'context', 'introduction', 'project', 'architecture', 'description', 'purpose'],
  'Coding Conventions': ['conventions', 'style', 'coding', 'formatting', 'standards', 'guidelines', 'code style', 'rules'],
  'File Structure': ['structure', 'layout', 'directories', 'files', 'organization', 'project structure'],
  'Testing': ['testing', 'tests', 'test', 'verification', 'quality', 'qa'],
  'Deployment': ['deployment', 'deploy', 'release', 'publishing', 'ci', 'cd', 'pipeline'],
  'Workflow': ['workflow', 'process', 'how to', 'steps', 'procedure', 'contributing'],
  'Dependencies': ['dependencies', 'packages', 'libraries', 'tools', 'requirements'],
  'Error Handling': ['errors', 'error handling', 'exceptions', 'debugging'],
  'Security': ['security', 'auth', 'authentication', 'authorization', 'secrets'],
  'Performance': ['performance', 'optimization', 'speed', 'caching'],
};

/**
 * File extensions recognized for file references.
 */
const FILE_EXTENSIONS = new Set([
  '.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.rb', '.java',
  '.yml', '.yaml', '.json', '.toml', '.md', '.css', '.scss', '.html',
  '.sql', '.sh', '.env', '.config', '.xml', '.mjs', '.cjs',
]);

/**
 * Detect file format from file name/path.
 */
export function detectFormat(filePath: string): FileFormat {
  const normalized = filePath.replace(/\\/g, '/');
  const basename = normalized.split('/').pop() || '';

  if (basename === 'CLAUDE.md' || normalized.includes('.claude/CLAUDE.md')) return 'claude-md';
  if (basename === '.cursorrules' || normalized.includes('.cursor/rules/')) return 'cursorrules';
  if (basename === 'AGENTS.md' || normalized.includes('.github/AGENTS.md')) return 'agents-md';
  if (basename === 'GEMINI.md') return 'gemini-md';
  if (basename === 'copilot-instructions.md' || normalized.includes('.github/copilot-instructions.md')) return 'copilot-instructions';
  if (basename === '.windsurfrules') return 'windsurfrules';
  if (basename === '.clinerules') return 'clinerules';
  return 'custom';
}

/**
 * Categorize a section based on its heading text.
 */
function categorizeSection(title: string): string | undefined {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  return undefined;
}

/**
 * Imperative verb patterns for detecting instructions.
 */
const IMPERATIVE_STARTERS = /^(?:use|always|never|make sure|ensure|do not|don't|write|run|check|follow|avoid|prefer|include|exclude|enable|disable|set|add|remove|create|delete|keep|maintain|handle|implement|configure|install|deploy|test|verify|validate|document|update|import|export|call|return|throw|catch|log|print|format|indent|name|define|declare|assign|extend|override|specify|require|allow|prevent|limit|restrict|accept|reject|apply|enforce|adopt|support|provide|build|compile|bundle|optimize|minimize|maximize|ignore|skip|suppress|warn|error|debug|commit|push|pull|merge|rebase|branch|checkout|reset|revert|tag|release|publish|submit|review|approve|deny|request|send|receive|fetch|get|post|put|patch|head|connect|listen|serve|start|stop|restart)\b/i;

const MODAL_PATTERN = /\b(?:must|should|shall|need to|have to|ought to)\b/i;

/**
 * Check if a sentence is negative.
 */
function isNegativeInstruction(text: string): boolean {
  return /^(?:do not|don't|never|avoid|no |cannot|can't|should not|shouldn't|must not|mustn't)\b/i.test(text.trim())
    || /\b(?:do not|don't|never|avoid)\b/i.test(text);
}

/**
 * Extract instructions from text content.
 */
function extractInstructions(text: string, baseLineOffset: number): InstructionStatement[] {
  const instructions: InstructionStatement[] = [];
  const lines = text.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Skip header lines and empty lines
    if (line.trim().startsWith('#') || line.trim() === '') continue;

    // Strip list markers
    const stripped = line.trim().replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '');
    if (!stripped) continue;

    // Check for imperative patterns
    if (IMPERATIVE_STARTERS.test(stripped) || MODAL_PATTERN.test(stripped)) {
      instructions.push({
        text: stripped,
        isNegative: isNegativeInstruction(stripped),
        location: {
          startLine: baseLineOffset + i + 1,
          startColumn: 1,
          endLine: baseLineOffset + i + 1,
          endColumn: line.length + 1,
        },
      });
    }
  }

  return instructions;
}

/**
 * Extract file/directory references from text content.
 */
function extractReferences(text: string, baseLineOffset: number): Reference[] {
  const references: Reference[] = [];
  const lines = text.split('\n');
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = baseLineOffset + i + 1;

    // Skip URLs
    const lineWithoutUrls = line.replace(/https?:\/\/[^\s)]+/g, '');

    // Find inline code references
    const backtickMatches = lineWithoutUrls.matchAll(/`([^`]+)`/g);
    for (const match of backtickMatches) {
      const ref = match[1].trim();
      const colStart = (match.index ?? 0) + 2; // after backtick

      // Check if it looks like a file path
      if (isFilePath(ref)) {
        const key = `file:${ref}:${lineNum}`;
        if (!seen.has(key)) {
          seen.add(key);
          references.push({
            value: ref,
            type: ref.endsWith('/') ? 'directory' : 'file',
            location: {
              startLine: lineNum,
              startColumn: colStart,
              endLine: lineNum,
              endColumn: colStart + ref.length,
            },
          });
        }
      }
    }

    // Find bare paths outside of code blocks (common path patterns)
    const barePathMatches = lineWithoutUrls.matchAll(
      /(?:^|\s)((?:\.\/|src\/|lib\/|app\/|test\/|tests\/|config\/|scripts\/)[^\s,;:)]+)/g
    );
    for (const match of barePathMatches) {
      const ref = match[1].trim();
      const colStart = (match.index ?? 0) + (match[0].length - match[1].length) + 1;

      // Avoid duplicates from backtick matches
      const key = `file:${ref}:${lineNum}`;
      if (!seen.has(key)) {
        seen.add(key);
        references.push({
          value: ref,
          type: ref.endsWith('/') ? 'directory' : 'file',
          location: {
            startLine: lineNum,
            startColumn: colStart,
            endLine: lineNum,
            endColumn: colStart + ref.length,
          },
        });
      }
    }
  }

  return references;
}

/**
 * Check if a string looks like a file path.
 */
function isFilePath(value: string): boolean {
  // Must contain a slash or have a recognizable extension
  if (value.includes('/') || value.includes('\\')) {
    // Skip example/placeholder paths
    if (/^(?:example|your-project|path\/to)\//i.test(value)) return false;
    // Skip node_modules, dist, build, .git
    if (/^(?:node_modules|dist|build|\.git)\//i.test(value)) return false;
    return true;
  }
  // Check for file extension
  const lastDot = value.lastIndexOf('.');
  if (lastDot > 0) {
    const ext = value.slice(lastDot);
    return FILE_EXTENSIONS.has(ext);
  }
  return false;
}

/**
 * Parse an instruction file into an InstructionDocument.
 */
export function parse(content: string, format: FileFormat): InstructionDocument {
  const lines = content.split('\n');
  const sections: Section[] = [];
  const allInstructions: InstructionStatement[] = [];
  const allReferences: Reference[] = [];
  const detectedCategories: string[] = [];

  // Parse sections by headers
  let currentSectionStart = 0;
  let currentTitle: string | null = null;
  let currentLevel = 0;
  let currentContentStart = 0;

  const finalizeSection = (endLine: number): void => {
    const sectionLines = lines.slice(currentContentStart, endLine);
    const sectionContent = sectionLines.join('\n');
    const trimmedContent = sectionContent.trim();

    const section: Section = {
      title: currentTitle,
      level: currentLevel,
      content: sectionContent,
      location: {
        startLine: currentSectionStart + 1,
        startColumn: 1,
        endLine: endLine,
        endColumn: (lines[endLine - 1] || '').length + 1,
      },
      characterCount: trimmedContent.length,
      estimatedTokens: Math.ceil(trimmedContent.length / 4),
    };

    if (currentTitle) {
      const category = categorizeSection(currentTitle);
      if (category) {
        section.category = category;
        if (!detectedCategories.includes(category)) {
          detectedCategories.push(category);
        }
      }
    }

    sections.push(section);

    // Extract instructions and references from section content
    const instructions = extractInstructions(sectionContent, currentContentStart);
    allInstructions.push(...instructions);
    const refs = extractReferences(sectionContent, currentContentStart);
    allReferences.push(...refs);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);

    // Check for setext-style headers
    let setextLevel = 0;
    let setextTitle: string | null = null;
    if (i > 0 && /^={2,}\s*$/.test(line) && lines[i - 1].trim() !== '') {
      setextLevel = 1;
      setextTitle = lines[i - 1].trim();
    } else if (i > 0 && /^-{2,}\s*$/.test(line) && lines[i - 1].trim() !== '' && !lines[i - 1].trim().startsWith('#')) {
      setextLevel = 2;
      setextTitle = lines[i - 1].trim();
    }

    if (headerMatch || setextLevel > 0) {
      // Finalize previous section
      if (i > 0 || currentContentStart > 0) {
        const adjustedEnd = setextLevel > 0 ? i - 1 : i;
        if (adjustedEnd > currentContentStart || sections.length === 0) {
          finalizeSection(adjustedEnd);
        }
      }

      if (headerMatch) {
        currentLevel = headerMatch[1].length;
        currentTitle = headerMatch[2].trim();
        currentSectionStart = i;
        currentContentStart = i + 1;
      } else {
        currentLevel = setextLevel;
        currentTitle = setextTitle;
        currentSectionStart = i - 1;
        currentContentStart = i + 1;
      }
    }
  }

  // Finalize last section
  finalizeSection(lines.length);

  // If no sections were created, create one for the whole document
  if (sections.length === 0) {
    const section: Section = {
      title: null,
      level: 0,
      content: content,
      location: {
        startLine: 1,
        startColumn: 1,
        endLine: lines.length,
        endColumn: (lines[lines.length - 1] || '').length + 1,
      },
      characterCount: content.trim().length,
      estimatedTokens: Math.ceil(content.trim().length / 4),
    };
    sections.push(section);
  }

  const words = content.trim().split(/\s+/).filter(w => w.length > 0);

  return {
    source: content,
    format,
    characterCount: content.length,
    estimatedTokens: Math.ceil(content.length / 4),
    wordCount: words.length,
    lineCount: lines.length,
    sections,
    instructions: allInstructions,
    references: allReferences,
    detectedCategories,
  };
}
