import { Megaphone } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-90 animate-gradient"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
        <div className="flex items-center justify-center">
          <Megaphone className="h-8 w-8 text-white drop-shadow-glow mr-2" />
          <h1 className="text-2xl font-semibold text-white drop-shadow-glow">
            EasierGen by StefanAI
            <sup className="ml-1 text-xs font-medium text-white drop-shadow-glow">BETA</sup>
          </h1>
        </div>
      </div>
    </header>
  );
}