import { useState } from 'react';
import { getSelectedText } from '../utils/office-utils';

export function useDocumentReader() {
  const [selectedText, setSelectedText] = useState('');
  const [error, setError] = useState('');

  const readSelection = async () => {
    try {
      setError('');
      const text = await getSelectedText();
      setSelectedText(text);
      if (!text) {
        setError('未选中任何文字。在 Word 文档中选中需要分析的段落再试。');
      }
    } catch (err: any) {
      setError('读取文档失败: ' + err.message);
    }
  };

  const clearError = () => setError('');

  return { selectedText, error, readSelection, clearError, setError };
}
