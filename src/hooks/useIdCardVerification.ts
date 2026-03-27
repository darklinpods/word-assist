import { useState } from 'react';
import { getDocumentText, locateTextInDocument } from '../utils/office-utils';
import { extractIdCardsFromText, validateIdCard, type IdCardCheckResult } from '../utils/id-card';

export function useIdCardVerification() {
  const [results, setResults] = useState<IdCardCheckResult[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState('');

  const checkDocument = async () => {
    try {
      setIsChecking(true);
      setError('');
      setResults(null);

      const text = await getDocumentText();
      if (!text.trim()) {
        setResults([]);
        setError('文档为空，无法核查身份证号。');
        return;
      }

      const ids = extractIdCardsFromText(text);
      const checked = ids.map(validateIdCard);
      setResults(checked);
    } catch (err: any) {
      setError('身份证核查失败: ' + err.message);
    } finally {
      setIsChecking(false);
    }
  };

  const reset = () => {
    setResults(null);
    setError('');
  };

  const locateInDocument = async (id: string) => {
    try {
      const found = await locateTextInDocument(id);
      if (!found) {
        setError('未在文档中找到该身份证号，请确认原文是否包含该号码。');
      } else {
        setError('');
      }
    } catch (err: any) {
      setError('定位失败: ' + err.message);
    }
  };

  return {
    results,
    isChecking,
    error,
    checkDocument,
    locateInDocument,
    reset,
  };
}
