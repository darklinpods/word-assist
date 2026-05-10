import { useState } from 'react';
import { extractClaimElementsAsJSON } from '../services/ai';
import { verifyCompensationItem, calculateTotalSummary } from '../utils/compensation-rules';
import { getDefaultStandardsSelection } from '../utils/compensation-calculator';
import { replaceAmountInDocument, replaceAllAmounts } from '../utils/office-utils';
import type { ClaimVerificationResult } from '../utils/compensation-rules';
import { getErrorMessage } from '../utils/error';

export type FixAllStatus = 'idle' | 'loading' | 'done' | 'error';

export function useClaimsVerification() {
  const [verificationResults, setVerificationResults] = useState<ClaimVerificationResult[] | null>(null);
  const [totalSummary, setTotalSummary] = useState<{
    userTotal: number;
    correctTotal: number;
    hasMismatch: boolean;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // 单项修正状态
  const [fixingIndexes, setFixingIndexes] = useState<Set<number>>(new Set());
  const [fixedIndexes, setFixedIndexes] = useState<Set<number>>(new Set());

  // 批量修正状态
  const [fixAllStatus, setFixAllStatus] = useState<FixAllStatus>('idle');
  const [fixAllMessage, setFixAllMessage] = useState('');

  const verify = async (text: string) => {
    if (!text) {
      setError('请先获取文档内容。');
      return;
    }
    try {
      setIsVerifying(true);
      setError('');
      setVerificationResults(null);
      setTotalSummary(null);
      setFixedIndexes(new Set());
      setFixAllStatus('idle');
      setFixAllMessage('');

      const standardsSelection = getDefaultStandardsSelection();
      if (!standardsSelection) {
        throw new Error('未找到赔偿标准数据，请检查 src/data/compensation-standards.json');
      }

      const elements = await extractClaimElementsAsJSON(text);
      const results = elements.map(item => verifyCompensationItem(item, standardsSelection));
      const summary = calculateTotalSummary(results);

      setVerificationResults(results);
      setTotalSummary(summary);
    } catch (err: unknown) {
      setError('金额核对出错: ' + getErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const fixOne = async (res: ClaimVerificationResult, idx: number) => {
    setFixingIndexes(prev => new Set(prev).add(idx));
    try {
      const count = await replaceAmountInDocument(res.user_amount, res.theoretical_amount);
      if (count === 0) {
        setError(`未在文档中找到「${res.type}」的金额 ${res.user_amount}，请确认原文格式或手动修正。`);
      } else {
        setFixedIndexes(prev => new Set(prev).add(idx));
        setError('');
      }
    } catch (err: unknown) {
      setError('写回失败: ' + getErrorMessage(err));
    } finally {
      setFixingIndexes(prev => {
        const s = new Set(prev);
        s.delete(idx);
        return s;
      });
    }
  };

  const fixAll = async () => {
    if (!verificationResults) return;
    const wrongItems = verificationResults
      .map((r, i) => ({ r, i }))
      .filter(({ r, i }) => !r.is_correct && !fixedIndexes.has(i));
    if (wrongItems.length === 0) return;

    setFixAllStatus('loading');
    setFixAllMessage('');
    try {
      const corrections = wrongItems.map(({ r }) => ({
        oldAmount: r.user_amount,
        newAmount: r.theoretical_amount,
        itemType: r.type,
      }));
      const count = await replaceAllAmounts(corrections);
      const newFixed = new Set(fixedIndexes);
      wrongItems.forEach(({ i }) => newFixed.add(i));
      setFixedIndexes(newFixed);
      setFixAllStatus('done');
      setFixAllMessage(
        count > 0
          ? `已修正 ${count} 处金额，新数值已在 Word 文档中标红加粗，请复核。`
          : '未在文档中找到对应金额，请确认原文选中范围是否包含索赔列表。'
      );
    } catch (err: unknown) {
      setFixAllStatus('error');
      setFixAllMessage('批量修正失败: ' + getErrorMessage(err));
    }
  };

  const reset = () => {
    setVerificationResults(null);
    setTotalSummary(null);
    setFixingIndexes(new Set());
    setFixedIndexes(new Set());
    setFixAllStatus('idle');
    setFixAllMessage('');
    setError('');
  };

  return {
    verificationResults,
    totalSummary,
    isVerifying,
    error,
    fixingIndexes,
    fixedIndexes,
    fixAllStatus,
    fixAllMessage,
    verify,
    fixOne,
    fixAll,
    reset,
  };
}
