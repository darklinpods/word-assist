import { useState } from 'react';

import AiSetup from './components/AiSetup';
import Header from './components/Header';
import { useCompensationCalculator } from './hooks/useCompensationCalculator';
import { getAiConfigStatus } from './services/ai-config';
import CalculatorView from './views/CalculatorView';
import MainWorkflow from './views/MainWorkflow';

type View = 'main' | 'calculator' | 'setup';

export default function App() {
  const [isAiConfigured, setIsAiConfigured] = useState(() => getAiConfigStatus().configured);
  const [view, setView] = useState<View>(() => isAiConfigured ? 'main' : 'setup');
  const calculator = useCompensationCalculator();

  const handleConfigured = () => {
    setIsAiConfigured(true);
    setView('main');
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
          onCancel={() => setView('main')}
          onConfigured={handleConfigured}
        />
      ) : view === 'calculator' ? (
        <CalculatorView calculator={calculator} onBack={() => setView('main')} />
      ) : (
        <MainWorkflow onOpenCalculator={() => setView('calculator')} />
      )}
    </div>
  );
}
