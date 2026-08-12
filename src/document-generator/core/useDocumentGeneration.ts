import { useCallback, useMemo, useRef, useState } from 'react';

import { getDocumentText } from '../../utils/office/environment';
import { getErrorMessage } from '../../utils/error';
import type {
  DocumentDefinition,
  GenerationResult,
  GenerationStep,
  GenerationTargetStatus,
} from './types';

type ConfirmAction = (status: GenerationTargetStatus) => boolean | Promise<boolean>;

export function useDocumentGeneration<TDraft>(definition: DocumentDefinition<TDraft>) {
  const [step, setStep] = useState<GenerationStep>('idle');
  const [sourceText, setSourceText] = useState('');
  const [draft, setDraft] = useState<TDraft | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState('');
  const inFlightRef = useRef(false);

  const issues = useMemo(() => (draft ? definition.validate(draft) : []), [definition, draft]);

  const extract = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setError('');
    setResult(null);
    setDraft(null);

    try {
      setStep('reading');
      const text = (await getDocumentText()).trim();
      if (!text) throw new Error('当前 Word 文档没有可提取的正文内容。');
      setSourceText(text);

      setStep('extracting');
      const nextDraft = await definition.extract(text);
      setDraft(nextDraft);
      setStep('previewing');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setStep('error');
    } finally {
      inFlightRef.current = false;
    }
  }, [definition]);

  const generate = useCallback(async (confirmExisting: ConfirmAction) => {
    if (!draft || inFlightRef.current) return;
    inFlightRef.current = true;
    setError('');

    try {
      if (definition.inspectTarget) {
        const targetStatus = await definition.inspectTarget();
        if (targetStatus.exists && !(await confirmExisting(targetStatus))) return;
      }

      setStep('generating');
      const nextResult = await definition.generate(draft);
      setResult(nextResult);
      setStep('completed');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setStep('error');
    } finally {
      inFlightRef.current = false;
    }
  }, [definition, draft]);

  const reset = useCallback(() => {
    if (inFlightRef.current) return;
    setStep('idle');
    setSourceText('');
    setDraft(null);
    setResult(null);
    setError('');
  }, []);

  return {
    step,
    sourceText,
    draft,
    issues,
    result,
    error,
    extract,
    generate,
    reset,
  };
}
