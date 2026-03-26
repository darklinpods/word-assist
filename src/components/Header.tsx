import { Wand2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full bg-slate-800 text-white p-4 shadow-md flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Wand2 className="w-5 h-5 text-indigo-400" />
        <h1 className="text-lg font-bold tracking-wide">诉状智能助手</h1>
      </div>
    </header>
  );
}
