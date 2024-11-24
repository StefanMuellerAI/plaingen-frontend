import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Modal } from './Modal';

interface InfoIconProps {
  title: string;
  content: string;
}

export function InfoIcon({ title, content }: InfoIconProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        title="What happens here?"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
      {showModal && (
        <Modal title={title} onClose={() => setShowModal(false)}>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </Modal>
      )}
    </>
  );
}