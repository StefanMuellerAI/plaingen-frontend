import { useEffect, useRef } from 'react';
import EmojiPickerReact from 'emoji-picker-react';
import { EmojiClickData } from 'emoji-picker-react';
import { X } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    onClose();
  };

  return (
    <div ref={pickerRef} className="absolute z-50 mt-2">
      <div className="shadow-lg rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-2 bg-white border-b">
          <span className="text-sm font-medium text-gray-700">Emojis</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close picker"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <EmojiPickerReact 
          onEmojiClick={handleEmojiClick}
          autoFocusSearch={false}
          width={300}
          height={400}
        />
      </div>
    </div>
  );
}