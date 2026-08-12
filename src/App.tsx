import { useState } from 'react';

import AiSetup from './components/AiSetup';
import Header from './components/Header';
import DocumentGeneratorView from './document-generator/DocumentGeneratorView';
import { getAiConfigStatus } from './services/ai-config';

type View = 'generator' | 'setup';

export default function App() {
  const [isAiConfigured, setIsAiConfigured] = useState(() => getAiConfigStatus().configured);
  const [view, setView] = useState<View>(() => isAiConfigured ? 'generator' : 'setup');

  const handleConfigured = () => {
    setIsAiConfigured(true);
    setView('generator');
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--color-surface)]">
      <Header
        onOpenAiSetup={() => setView('setup')}
        showSettings={isAiConfigured && view !== 'setup'}
      />
      {view === 'setup' ? (
        <AiSetup
          canCancel={isAiConfigured}
          onCancel={() => setView('generator')}
          onConfigured={handleConfigured}
        />
      ) : (
        <DocumentGeneratorView />
      )}
    </div>
  );
}
