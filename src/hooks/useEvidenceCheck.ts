import { useState } from 'react';
import { extractEvidenceFromText } from '../services/ai';
import { mergeEvidenceResults } from '../utils/evidence-rules';
import type { EvidenceCheckResult } from '../utils/evidence-rules';
import { useAsyncTask } from './useAsyncTask';

export function useEvidenceCheck() {
  const [evidenceResults, setEvidenceResults] = useState<EvidenceCheckResult[] | null>(null);
  const { isLoading, error, run, setError, reset: resetError } = useAsyncTask();

  const check = async (text: string) => {
    if (!text) {
      setError('请先获取文档内容。');
      return;
    }
    setEvidenceResults(null);
    const rawResults = await run(() => extractEvidenceFromText(text), { errorPrefix: '证据核查出错: ' });
    if (!rawResults) return;
    const merged = mergeEvidenceResults(rawResults);
    setEvidenceResults(merged);
  };

  const reset = () => {
    setEvidenceResults(null);
    resetError();
  };

  return { evidenceResults, isChecking: isLoading, error, check, reset };
}
