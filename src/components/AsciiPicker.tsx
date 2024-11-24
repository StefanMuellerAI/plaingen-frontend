import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface AsciiPickerProps {
  onSelect: (char: string) => void;
  onClose: () => void;
}

const ASCII_CATEGORIES = {
  arrows: {
    title: 'Arrows',
    chars: ['→', '←', '↑', '↓', '⇒', '⇐', '⇑', '⇓', '►', '◄', '▲', '▼']
  },
  dividers: {
    title: 'Dividers',
    chars: ['•', '|', '┃', '│', '║', '▌', '▐', '━', '═', '─', '┅', '┈', '┉', '⚊', '⚋']
  }
};

export function AsciiPicker({ onSelect, onClose }: AsciiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      ref={pickerRef}
      className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 w-[320px]"
    >
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <span className="text-sm font-medium text-gray-700">ASCII Characters</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close picker"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {Object.entries(ASCII_CATEGORIES).map(([key, category]) => (
          <div key={key}>
            <h3 className="text-xs font-medium text-gray-500 mb-2">{category.title}</h3>
            <div className="grid grid-cols-8 gap-1">
              {category.chars.map((char) => (
                <button
                  key={char}
                  onClick={() => {
                    onSelect(char);
                    onClose();
                  }}
                  className="flex items-center justify-center p-2 text-lg hover:bg-gray-100 rounded transition-colors"
                  title={`Insert ${char}`}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}