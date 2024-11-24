import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { marked } from 'marked';

interface ModalContent {
  title: string;
  content: string;
}

interface MarkdownContent {
  imprint: string;
  privacy: string;
}

export function Footer() {
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  const [markdownContent, setMarkdownContent] = useState<MarkdownContent>({ 
    imprint: '', 
    privacy: '' 
  });

  useEffect(() => {
    const loadMarkdownContent = async () => {
      try {
        const [imprintText, privacyText] = await Promise.all([
          (await import('../content/legal/imprint.md?raw')).default,
          (await import('../content/legal/privacy.md?raw')).default
        ]);

        setMarkdownContent({
          imprint: imprintText || '',
          privacy: privacyText || ''
        });
      } catch (error) {
        console.error('Error loading markdown content:', error);
        setMarkdownContent({
          imprint: 'Failed to load imprint content',
          privacy: 'Failed to load privacy content'
        });
      }
    };

    loadMarkdownContent();
  }, []);

  const showModal = async (type: 'imprint' | 'privacy') => {
    const content = markdownContent[type];
    if (!content) return;

    const parsedContent = await marked.parse(content, {
      gfm: true,
      breaks: true
    });

    setModalContent({
      title: type === 'imprint' ? 'Imprint' : 'Privacy Policy',
      content: parsedContent
    });
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-center space-x-6">
          <button
            onClick={() => void showModal('imprint')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Imprint
          </button>
          <button
            onClick={() => void showModal('privacy')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Privacy Policy
          </button>
        </div>
      </div>
      {modalContent && (
        <Modal
          title={modalContent.title}
          onClose={() => setModalContent(null)}
        >
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: modalContent.content }}
          />
        </Modal>
      )}
    </footer>
  );
}