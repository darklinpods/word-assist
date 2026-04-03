import { useState } from 'react';
import { analyzeLegalText } from '../services/ai';
import { insertSuggestion } from '../utils/office-utils';
import { useAsyncTask } from './useAsyncTask';

export function useAnalysis() {
  const [analysisResult, setAnalysisResult] = useState('');
  const { isLoading, error, run, setError, reset: resetError } = useAsyncTask();

  const analyze = async (text: string) => {
    if (!text) {
      setError('请先获取文档内容。');
      return;
    }
    setAnalysisResult('');
    const result = await run(() => analyzeLegalText(text), { errorPrefix: '分析出错: ' });
    if (result !== null) {
      setAnalysisResult(result);
    }
  };

  const insertToDocument = async () => {
    if (!analysisResult) return;
    await run(() => insertSuggestion(analysisResult), { errorPrefix: '插入建议失败: ' });
  };

  const reset = () => {
    setAnalysisResult('');
    resetError();
  };

  return { analysisResult, isLoading, error, analyze, insertToDocument, reset };
}
