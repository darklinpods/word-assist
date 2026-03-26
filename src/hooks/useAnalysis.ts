import { useState } from 'react';
import { analyzeLegalText } from '../services/ai';
import { insertSuggestion } from '../utils/office-utils';

export function useAnalysis() {
  const [analysisResult, setAnalysisResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async (text: string) => {
    if (!text) {
      setError('请先获取文档内容。');
      return;
    }
    try {
      setIsLoading(true);
      setError('');
      setAnalysisResult('');
      const result = await analyzeLegalText(text);
      setAnalysisResult(result);
    } catch (err: any) {
      setError('分析出错: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const insertToDocument = async () => {
    if (!analysisResult) return;
    try {
      await insertSuggestion(analysisResult);
    } catch (err: any) {
      setError('插入建议失败: ' + err.message);
    }
  };

  const reset = () => {
    setAnalysisResult('');
    setError('');
  };

  return { analysisResult, isLoading, error, analyze, insertToDocument, reset };
}
