import { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Smile, Type, Loader2, Eraser } from 'lucide-react';
import { InfoIcon } from './InfoIcon';
import { EmojiPicker } from './EmojiPicker';
import { AsciiPicker } from './AsciiPicker';
import { ContextMenu } from './ContextMenu';
import { marked } from 'marked';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/Modal';
import { useLocation } from 'react-router-dom';

interface EditorProps {
  title: string;
  text: string;
  cta: string;
  disabled: boolean;
  onChange: (data: { title: string; text: string; cta: string }) => void;
}

const BOLD_CHARS: { [key: string]: string } = {
  'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶',
  'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿',
  's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
  'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜',
  'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥',
  'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
  '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
};

const ITALIC_CHARS: { [key: string]: string } = {
  'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪',
  'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳',
  's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻',
  'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐',
  'J': '𝘑', 'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙',
  'S': '𝘚', 'T': '𝘛', 'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡'
};

const REVERSE_BOLD_CHARS: { [key: string]: string } = Object.fromEntries(
  Object.entries(BOLD_CHARS).map(([k, v]) => [v, k])
);

const REVERSE_ITALIC_CHARS: { [key: string]: string } = Object.fromEntries(
  Object.entries(ITALIC_CHARS).map(([k, v]) => [v, k])
);

const POST_LIMIT = 15;

export function Editor({ title, text, cta, disabled = false, onChange }: EditorProps) {
  const { user } = useAuth();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAsciiPicker, setShowAsciiPicker] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [activeField, setActiveField] = useState<'title' | 'text' | 'cta' | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    field: 'title' | 'text' | 'cta' | null;
  }>({
    show: false,
    x: 0,
    y: 0,
    field: null
  });
  const [isTransforming, setIsTransforming] = useState(false);
  const [helpContent, setHelpContent] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const ctaRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const editData = location.state?.postData;
  const isEditing = !!location.state?.postData;

  const [originalValues, setOriginalValues] = useState({ title: '', text: '', cta: '' });
  const [hasChanges, setHasChanges] = useState(false);
  const [savedPostId, setSavedPostId] = useState<string | null>(null);
  const [postCount, setPostCount] = useState<number>(0);

  useEffect(() => {
    const totalCount = title.length + text.length + cta.length;
    setCharCount(totalCount);
  }, [title, text, cta]);

  useEffect(() => {
    const loadHelpContent = async () => {
      try {
        const helpText = (await import('../content/help/editor_info.md?raw')).default;
        const parsedContent = await marked.parse(helpText, {
          gfm: true,
          breaks: true
        });
        setHelpContent(parsedContent);
      } catch (error) {
        console.error('Error loading help content:', error);
        setHelpContent('Failed to load help content');
      }
    };

    loadHelpContent();
  }, []);

  useEffect(() => {
    if (editData) {
      setOriginalValues({
        title: editData.title || '',
        text: editData.text || '',
        cta: editData.cta || ''
      });
    } else {
      setOriginalValues({ title, text, cta });
    }
  }, [editData]);

  useEffect(() => {
    const hasChanged = 
      title !== originalValues.title ||
      text !== originalValues.text ||
      cta !== originalValues.cta;
    
    setHasChanges(hasChanged);
  }, [title, text, cta, originalValues]);

  useEffect(() => {
    const fetchPostCount = async () => {
      if (!user) return;
      
      try {
        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (error) throw error;
        setPostCount(count || 0);
      } catch (error) {
        console.error('Error fetching post count:', error);
      }
    };

    if (user) {
      fetchPostCount();
    }
  }, [user]);

  const getActiveRef = () => {
    switch (activeField) {
      case 'title': return titleRef;
      case 'text': return textRef;
      case 'cta': return ctaRef;
      default: return null;
    }
  };

  const formatText = (type: 'bold' | 'italic') => {
    const activeRef = getActiveRef();
    if (!activeRef?.current) return;

    const field = activeField!;
    const element = activeRef.current;
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const currentText = field === 'title' ? title : field === 'text' ? text : cta;
    const selectedText = currentText.substring(start, end);
    
    if (selectedText) {
      let formattedText = '';
      const charMap = type === 'bold' ? BOLD_CHARS : ITALIC_CHARS;
      
      for (const char of selectedText) {
        formattedText += charMap[char] || char;
      }
      
      const newText = currentText.substring(0, start) + formattedText + currentText.substring(end);
      
      const newData = {
        title: field === 'title' ? newText : title,
        text: field === 'text' ? newText : text,
        cta: field === 'cta' ? newText : cta
      };
      
      onChange(newData);

      setTimeout(() => {
        if (element) {
          element.selectionStart = start;
          element.selectionEnd = start + formattedText.length;
          element.focus();
        }
      }, 0);
    }
  };

  const insertEmoji = (emoji: string) => {
    const activeRef = getActiveRef();
    if (!activeRef?.current) return;

    const field = activeField!;
    const element = activeRef.current;
    const start = element.selectionStart ?? 0;
    const currentText = field === 'title' ? title : field === 'text' ? text : cta;
    
    const newText = currentText.slice(0, start) + emoji + currentText.slice(start);
    
    const newData = {
      title: field === 'title' ? newText : title,
      text: field === 'text' ? newText : text,
      cta: field === 'cta' ? newText : cta
    };
    
    onChange(newData);

    setTimeout(() => {
      if (element) {
        const newPosition = start + emoji.length;
        element.selectionStart = newPosition;
        element.selectionEnd = newPosition;
        element.focus();
      }
    }, 0);
  };

  const handleContextMenu = (e: React.MouseEvent, field: 'title' | 'text' | 'cta') => {
    e.preventDefault();
    
    const activeRef = field === 'title' ? titleRef : field === 'text' ? textRef : field === 'cta' ? ctaRef : null;
    const element = activeRef?.current;
    
    if (element && element.selectionStart !== element.selectionEnd) {
      setContextMenu({
        show: true,
        x: e.pageX,
        y: e.pageY,
        field
      });
    }
  };

  const handleContextMenuOption = async (option: string) => {
    const field = contextMenu.field;
    if (!field) return;
    
    const activeRef = field === 'title' ? titleRef : field === 'text' ? textRef : field === 'cta' ? ctaRef : null;
    const element = activeRef?.current;
    
    if (!element) return;
    
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const currentText = field === 'title' ? title : field === 'text' ? text : cta;
    const selectedText = currentText.substring(start, end);

    if (!selectedText) return;

    setContextMenu({ show: false, x: 0, y: 0, field: null });
    
    setIsTransforming(true);

    try {
      const response = await fetch('/api/transform-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify({
          text: selectedText,
          transformation: option
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const newText = data.transformed_text;

      const updatedText = currentText.substring(0, start) + newText + currentText.substring(end);
      
      onChange({
        title: field === 'title' ? updatedText : title,
        text: field === 'text' ? updatedText : text,
        cta: field === 'cta' ? updatedText : cta
      });

    } catch (error) {
      console.error('Error transforming text:', error);
    } finally {
      setIsTransforming(false);
    }
  };

  const normalizeText = () => {
    const activeRef = getActiveRef();
    if (!activeRef?.current) return;

    const field = activeField!;
    const element = activeRef.current;
    const start = element.selectionStart ?? 0;
    const end = element.selectionEnd ?? 0;
    const currentText = field === 'title' ? title : field === 'text' ? text : cta;
    const selectedText = currentText.substring(start, end);
    
    if (selectedText) {
      let normalizedText = '';
      
      for (const char of selectedText) {
        normalizedText += REVERSE_BOLD_CHARS[char] || REVERSE_ITALIC_CHARS[char] || char;
      }
      
      const newText = currentText.substring(0, start) + normalizedText + currentText.substring(end);
      
      const newData = {
        title: field === 'title' ? newText : title,
        text: field === 'text' ? newText : text,
        cta: field === 'cta' ? newText : cta
      };
      
      onChange(newData);

      setTimeout(() => {
        if (element) {
          element.selectionStart = start;
          element.selectionEnd = start + normalizedText.length;
          element.focus();
        }
      }, 0);
    }
  };

  const handleSave = async () => {
    try {
      if (isEditing || savedPostId) {
        // Update bestehenden Post
        const { error } = await supabase
          .from('posts')
          .upsert([
            {
              id: editData?.id || savedPostId,
              title: title,
              text: text,
              cta: cta,
              user_id: user?.id
            }
          ]);
        if (error) throw error;
      } else {
        // Erstelle neuen Post
        const { data, error } = await supabase
          .from('posts')
          .insert([
            {
              title: title,
              text: text,
              cta: cta,
              user_id: user?.id
            }
          ])
          .select('id')
          .single();
          
        if (error) throw error;
        setSavedPostId(data.id);
      }

      setOriginalValues({ title, text, cta });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post');
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {editData ? 'Edit Post' : '2. Edit Post'}
        </h2>
        <InfoIcon
          title="Post Editor"
          content={helpContent}
        />
      </div>

      <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 rounded-lg relative" ref={toolbarRef}>
        <button
          onClick={() => formatText('bold')}
          disabled={disabled || !activeField}
          className={`p-2 rounded ${disabled || !activeField ? 'text-gray-400' : 'hover:bg-gray-200'}`}
          title="Bold"
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onClick={() => formatText('italic')}
          disabled={disabled || !activeField}
          className={`p-2 rounded ${disabled || !activeField ? 'text-gray-400' : 'hover:bg-gray-200'}`}
          title="Italic"
        >
          <Italic className="w-5 h-5" />
        </button>
        <button
          onClick={normalizeText}
          disabled={disabled || !activeField}
          className={`p-2 rounded ${disabled || !activeField ? 'text-gray-400' : 'hover:bg-gray-200'}`}
          title="Clear Formatting"
        >
          <Eraser className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled || !activeField}
          className={`p-2 rounded ${disabled || !activeField ? 'text-gray-400' : 'hover:bg-gray-200'}`}
          title="Insert Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowAsciiPicker(!showAsciiPicker)}
          disabled={disabled || !activeField}
          className={`p-2 rounded ${disabled || !activeField ? 'text-gray-400' : 'hover:bg-gray-200'}`}
          title="Insert ASCII Character"
        >
          <Type className="w-5 h-5" />
        </button>

        {showEmojiPicker && (
          <EmojiPicker
            onSelect={(emoji) => {
              insertEmoji(emoji);
              setShowEmojiPicker(false);
            }}
            onClose={() => setShowEmojiPicker(false)}
          />
        )}

        {showAsciiPicker && (
          <AsciiPicker
            onSelect={(char) => {
              insertEmoji(char);
              setShowAsciiPicker(false);
            }}
            onClose={() => setShowAsciiPicker(false)}
          />
        )}
      </div>

      <div className="mb-4 flex-shrink-0">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Hook
        </label>
        <textarea
          id="title"
          ref={titleRef}
          value={title}
          onChange={(e) => onChange({ ...{ title: e.target.value, text, cta } })}
          onFocus={() => setActiveField('title')}
          placeholder="Start with a strong hook..."
          disabled={disabled}
          rows={3}
          className={`w-full p-2 border border-gray-200 rounded-lg resize-none ${
            isTransforming ? 'cursor-wait' : ''
          }`}
          onContextMenu={(e) => handleContextMenu(e, 'title')}
        />
      </div>

      <div className="flex-1 mb-4 min-h-0">
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          id="content"
          ref={textRef}
          value={text}
          onChange={(e) => onChange({ ...{ title, text: e.target.value, cta } })}
          onFocus={() => setActiveField('text')}
          placeholder="Write your main content..."
          disabled={disabled}
          className={`w-full h-[calc(100%-1.5rem)] p-2 border border-gray-200 rounded-lg resize-none ${
            isTransforming ? 'cursor-wait' : ''
          }`}
          onContextMenu={(e) => handleContextMenu(e, 'text')}
        />
      </div>

      <div className="mt-auto mb-4 flex-shrink-0">
        <label htmlFor="cta" className="block text-sm font-medium text-gray-700 mb-1">
          CTA
        </label>
        <textarea
          id="cta"
          ref={ctaRef}
          value={cta}
          onChange={(e) => onChange({ ...{ title, text, cta: e.target.value } })}
          onFocus={() => setActiveField('cta')}
          placeholder="Add a call-to-action..."
          disabled={disabled}
          rows={3}
          className={`w-full p-2 border border-gray-200 rounded-lg resize-none ${
            isTransforming ? 'cursor-wait' : ''
          }`}
          onContextMenu={(e) => handleContextMenu(e, 'cta')}
        />
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Characters: {charCount}/3000
        </div>
        {user && (
          <button
            onClick={handleSave}
            disabled={Boolean(
              disabled || 
              ((isEditing || savedPostId) && !hasChanges) ||
              (!isEditing && !savedPostId && postCount >= POST_LIMIT)
            )}
            className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center group relative ${
              disabled || ((isEditing || savedPostId) && !hasChanges) || (!isEditing && !savedPostId && postCount >= POST_LIMIT)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={!isEditing && !savedPostId && postCount >= POST_LIMIT ? 
              `You have reached the maximum limit of ${POST_LIMIT} posts` : ''}
          >
            {isEditing || savedPostId ? 'Update Post' : 'Save Post'}
            {!isEditing && !savedPostId && postCount >= POST_LIMIT && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Maximum limit of {POST_LIMIT} posts reached
              </div>
            )}
          </button>
        )}
      </div>

      {isTransforming && (
        <div className="fixed top-0 left-0 pointer-events-none" style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}>
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      )}

      {contextMenu.show && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onOption={handleContextMenuOption}
          onClose={() => setContextMenu({ show: false, x: 0, y: 0, field: null })}
        />
      )}

      {showSuccessModal && (
        <Modal
          title={isEditing ? "Post Updated" : "Post Saved"}
          onClose={() => setShowSuccessModal(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              {isEditing 
                ? "Your changes have been saved successfully!"
                : "Your post has been saved successfully!"
              } You can find it in your dashboard.
            </p>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}