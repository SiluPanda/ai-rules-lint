import { FileFormat, InstructionDocument } from './types';
/**
 * Detect file format from file name/path.
 */
export declare function detectFormat(filePath: string): FileFormat;
/**
 * Parse an instruction file into an InstructionDocument.
 */
export declare function parse(content: string, format: FileFormat): InstructionDocument;
//# sourceMappingURL=parser.d.ts.map