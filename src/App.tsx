import { useState } from 'react';

import Header from './components/Header';
import { useCompensationCalculator } from './hooks/useCompensationCalculator';
import CalculatorView from './views/CalculatorView';
import MainWorkflow from './views/MainWorkflow';

type View = 'main' | 'calculator';

export default function App() {
  const [view, setView] = useState<View>('main');
  const calculator = useCompensationCalculator();

  return (
    <div className="h-screen flex flex-col font-sans bg-gray-50">
      <Header />
      {view === 'calculator' ? (
        <CalculatorView calculator={calculator} onBack={() => setView('main')} />
      ) : (
        <MainWorkflow onOpenCalculator={() => setView('calculator')} />
      )}
    </div>
  );
}
