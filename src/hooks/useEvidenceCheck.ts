import { useState } from 'react';
import { extractEvidenceFromText } from '../services/ai';
import { mergeEvidenceResults } from '../utils/evidence-rules';
import type { EvidenceCheckResult } from '../utils/evidence-rules';

export function useEvidenceCheck() {
  const [evidenceResults, setEvidenceResults] = useState<EvidenceCheckResult[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  const check = async (text: string) => {
    if (!text) {
      setError('请先获取文档内容。');
      return;
    }
    try {
      setIsChecking(true);
      setError('');
      setEvidenceResults(null);
      const rawResults = await extractEvidenceFromText(text);
      const merged = mergeEvidenceResults(rawResults);
      setEvidenceResults(merged);
    } catch (err: any) {
      setError('证据核查出错: ' + err.message);
    } finally {
      setIsChecking(false);
    }
  };

  const reset = () => {
    setEvidenceResults(null);
    setError('');
  };

  return { evidenceResults, isChecking, error, check, reset };
}
