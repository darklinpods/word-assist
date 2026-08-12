export type GenerationStep =
  | 'idle'
  | 'reading'
  | 'extracting'
  | 'previewing'
  | 'generating'
  | 'completed'
  | 'error';

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  id: string;
  path: string;
  severity: ValidationSeverity;
  message: string;
}

export interface GenerationResult {
  generatedAt: string;
  insertedNewTemplate: boolean;
  existingTemplateDetected: boolean;
}

export interface GenerationTargetStatus {
  exists: boolean;
  message: string;
}

export interface DocumentDefinition<TDraft> {
  id: string;
  title: string;
  description: string;
  extract(sourceText: string): Promise<TDraft>;
  validate(draft: TDraft): ValidationIssue[];
  inspectTarget?(): Promise<GenerationTargetStatus>;
  generate(draft: TDraft): Promise<GenerationResult>;
}
