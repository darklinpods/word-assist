import { useState } from 'react';
import { extractPartiesFromText } from '../services/ai';
import { getDocumentText } from '../utils/office-utils';
import type { PartyExtraction } from '../types/parties';
import { buildPartyChecks } from '../utils/party-check';

export function usePartyExtraction() {
  const [result, setResult] = useState<PartyExtraction | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');

  const extract = async () => {
    try {
      setIsExtracting(true);
      setError('');
      setResult(null);
      const text = await getDocumentText();
      const parties = await extractPartiesFromText(text);
      const partyChecks = buildPartyChecks(parties);
      setResult({ ...parties, partyChecks });
    } catch (err: any) {
      setError('当事人提取失败: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError('');
  };

  return { result, isExtracting, error, extract, reset };
}
