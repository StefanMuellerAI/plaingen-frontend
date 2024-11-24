import { Copy, MoreHorizontal, ThumbsUp, MessageSquare, Repeat2, Send, Check } from 'lucide-react';
import { InfoIcon } from './InfoIcon';
import { useState, useEffect } from 'react';
import { marked } from 'marked';

interface PreviewProps {
  title: string;
  text: string;
  cta: string;
  disabled?: boolean;
}

export function Preview({ title, text, cta, disabled = false }: PreviewProps) {
  const [copied, setCopied] = useState(false);
  const [helpContent, setHelpContent] = useState('');
  const charCount = title.length + text.length + cta.length;
  const isTextTooLong = charCount > 3000;

  useEffect(() => {
    const loadHelpContent = async () => {
      try {
        const helpText = (await import('../content/help/preview_info.md?raw')).default;
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

  const copyToClipboard = () => {
    const content = `${title}\n\n${text}\n\n${cta}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">3. Post Preview</h2>
        <InfoIcon
          title="Post Preview"
          content={helpContent}
        />
      </div>

      <div className="flex-1 bg-white rounded-lg border border-gray-200 overflow-y-auto">
        {/* Post Header */}
        <div className="p-4 border-b border-[#e8e8e8]">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-semibold">
                SM
              </div>
              <div>
                <h3 className="font-semibold text-[#000000E6] text-[14px] leading-[20px]">StefanAI</h3>
                <p className="text-[#00000099] text-[12px] leading-[16px]">I help you generate and edit plain simple posts for LinkedIn.</p>
                <p className="text-[#00000099] text-[12px] leading-[16px] mt-1">2h • 🌐</p>
              </div>
            </div>
            <button className="text-[#00000099] hover:text-[#000000E6] p-1">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Post Content */}
        <div className="p-4">
          <div className="whitespace-pre-wrap text-[#000000E6] font-[system-ui]">
            {title && <div className="text-[14px] leading-[20px] mb-4">{title}</div>}
            {text && <div className="text-[14px] leading-[20px] mb-4">{text}</div>}
            {cta && <div className="text-[14px] leading-[20px]">{cta}</div>}
          </div>
        </div>

        {/* Post Stats */}
        <div className="px-4 py-2 border-t border-[#e8e8e8]">
          <div className="flex items-center text-[#00000099] text-[12px]">
            <div className="flex items-center">
              <span className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-[#378FE9] border-2 border-white"></div>
                <div className="w-4 h-4 rounded-full bg-[#44B35C] border-2 border-white"></div>
                <div className="w-4 h-4 rounded-full bg-[#7A3E98] border-2 border-white"></div>
              </span>
              <span className="ml-1">47</span>
            </div>
            <div className="flex ml-auto space-x-4">
              <span>12 comments</span>
              <span>3 reposts</span>
            </div>
          </div>
        </div>

        {/* Post Actions */}
        <div className="px-2 py-1 border-t border-[#e8e8e8]">
          <div className="flex items-center justify-between">
            <button className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#00000014] text-[#00000099]">
              <ThumbsUp className="w-[18px] h-[18px]" />
              <span className="text-[14px]">Like</span>
            </button>
            <button className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#00000014] text-[#00000099]">
              <MessageSquare className="w-[18px] h-[18px]" />
              <span className="text-[14px]">Comment</span>
            </button>
            <button className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#00000014] text-[#00000099]">
              <Repeat2 className="w-[18px] h-[18px]" />
              <span className="text-[14px]">Repost</span>
            </button>
            <button className="flex items-center space-x-2 p-3 rounded-lg hover:bg-[#00000014] text-[#00000099]">
              <Send className="w-[18px] h-[18px]" />
              <span className="text-[14px]">Send</span>
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={copyToClipboard}
        disabled={disabled || isTextTooLong || copied}
        className={`mt-4 flex items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 ${
          copied
            ? 'bg-green-500 text-white'
            : disabled || isTextTooLong
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-5 h-5 mr-2" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-5 h-5 mr-2" />
            {isTextTooLong ? 'Text too long' : 'Copy to Clipboard'}
          </>
        )}
      </button>
    </div>
  );
}