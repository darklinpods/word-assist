import { useRef, useState } from 'react';
import { extractPartiesFromText } from '../services/ai';
import { getDocumentText } from '../utils/office-utils';
import type { PartyExtraction } from '../types/parties';
import { buildPartyChecks } from '../utils/party-check';
import { useAsyncTask } from './useAsyncTask';

export function usePartyExtraction() {
  const [result, setResult] = useState<PartyExtraction | null>(null);
  const { isLoading, error, run, reset: resetError } = useAsyncTask();
  const inFlightRef = useRef(false);

  const extract = async () => {
    if (inFlightRef.current) return;
    try {
      inFlightRef.current = true;
      setResult(null);
      const text = await run(() => getDocumentText(), { errorPrefix: '当事人提取失败: ' });
      if (text === null) return;
      const parties = await run(() => extractPartiesFromText(text), { errorPrefix: '当事人提取失败: ' });
      if (!parties) return;
      const partyChecks = buildPartyChecks(parties);
      setResult({ ...parties, partyChecks });
    } finally {
      inFlightRef.current = false;
    }
  };

  const reset = () => {
    setResult(null);
    resetError();
  };

  return { result, isExtracting: isLoading, error, extract, reset };
}
