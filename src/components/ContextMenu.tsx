interface ContextMenuProps {
  x: number;
  y: number;
  onOption: (option: string) => void;
  onClose: () => void;
}

export function ContextMenu({ x, y, onOption, onClose }: ContextMenuProps) {
  return (
    <>
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div 
        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48"
        style={{ 
          left: `${x}px`, 
          top: `${y}px`,
          zIndex: 1000
        }}
      >
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
          onClick={() => onOption('shorten')}
        >
          Verkürzen
        </button>
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
          onClick={() => onOption('extend')}
        >
          Verlängern
        </button>
        <button
          className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
          onClick={() => onOption('rephrase')}
        >
          Umformulieren
        </button>
      </div>
    </>
  );
} 