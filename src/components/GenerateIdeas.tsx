import { useState, useEffect } from 'react';
import { InfoIcon } from './InfoIcon';
import { Wand2, Loader2 } from 'lucide-react';
import { marked } from 'marked';

interface Post {
  titel: string;
  text: string;
  cta: string;
}

interface ApiResponse {
  posts: Post[];
}

interface GenerateIdeasProps {
  onSelectSuggestion: (suggestion: { title: string; text: string; cta: string }) => void;
  onSkipIdeaGeneration: () => void;
}

const COUNTRIES = [
  { code: 'DE', flag: '🇩🇪' },
  { code: 'US', flag: '🇺🇸' },
  { code: 'FR', flag: '🇫🇷' },
  { code: 'ES', flag: '🇪🇸' },
  { code: 'IT', flag: '🇮🇹' }
];

const MOODS = [
  'Inspiring',
  'Provocative',
  'Practical',
  'Storytelling',
  'Analytical'
];

const MAX_RETRIES = 3;
const TIMEOUT_DURATION = 240000; // 240 seconds
const INITIAL_BACKOFF = 1000; // 1 second
const MAX_BACKOFF = 8000;    // 8 seconds

export function GenerateIdeas({ onSelectSuggestion, onSkipIdeaGeneration }: GenerateIdeasProps) {
  const [topic, setTopic] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [selectedAddress, setSelectedAddress] = useState('formally');
  const [selectedMood, setSelectedMood] = useState('Inspiring');
  const [selectedPerspective, setSelectedPerspective] = useState('me');
  const [suggestions, setSuggestions] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpContent, setHelpContent] = useState('');

  useEffect(() => {
    const loadHelpContent = async () => {
      try {
        const helpText = (await import('../content/help/generate_ideas_info.md?raw')).default;
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

  const generateIdeas = async () => {
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setSuggestions([]);
    setError(null);

    const apiKey = import.meta.env.VITE_API_KEY;
    let currentTry = 0;
    let backoffTime = INITIAL_BACKOFF;

    while (currentTry < MAX_RETRIES) {
      try {
        const payload = { 
          topic, 
          language: selectedCountry,
          address: selectedAddress,
          mood: selectedMood,
          perspective: selectedPerspective
        };
        
        const headers = {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

        const response = await fetch('/api/task/research_task', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 502) {
            backoffTime = Math.min(backoffTime * 2, MAX_BACKOFF);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            currentTry++;
            continue;
          }
          
          const errorText = await response.text();
          console.error('Error response:', errorText);
          
          switch (response.status) {
            case 401:
              throw new Error('API-Schlüssel ungültig. Bitte überprüfen Sie Ihre Einstellungen.');
            case 403:
              throw new Error('Keine Berechtigung. Bitte überprüfen Sie Ihre Berechtigungen.');
            case 429:
              throw new Error('Zu viele Anfragen. Bitte warten Sie einen Moment.');
            case 502:
              throw new Error('API temporär nicht erreichbar. Bitte versuchen Sie es in wenigen Minuten erneut.');
            case 500:
            case 503:
              throw new Error('Der Server ist derzeit überlastet. Bitte versuchen Sie es später erneut.');
            default:
              throw new Error(`Fehler ${response.status}: ${errorText || 'Unbekannter Fehler'}`);
          }
        }

        const data = await response.json() as ApiResponse;
        setSuggestions(data.posts);
        break;
      } catch (error: unknown) {
        console.error('Request failed:', error);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            setError('Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.');
          } else {
            setError(`${error.message} (Versuch ${currentTry + 1} von ${MAX_RETRIES})`);
          }
        }

        currentTry++;
        if (currentTry < MAX_RETRIES) {
          backoffTime = Math.min(backoffTime * 2, MAX_BACKOFF);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    setIsLoading(false);
  };

  // Zeige den "Without Idea" Link nur wenn keine Vorschläge vorhanden sind
  const showSkipButton = suggestions.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">1. Generate Ideas</h2>
        <InfoIcon
          title="Generate Ideas"
          content={helpContent}
        />
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="w-[52px]">
            <select
              id="language"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full h-[42px] px-2 border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 4px center',
                backgroundSize: '16px',
                paddingRight: '24px'
              }}
            >
              {COUNTRIES.map(({ code, flag }) => (
                <option key={code} value={code}>
                  {flag}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter your topic..."
              className="w-full h-[42px] px-3 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              className="w-full h-[42px] px-3 border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '16px',
                paddingRight: '32px'
              }}
            >
              <option value="formally">Formally</option>
              <option value="informally">Informally</option>
            </select>
          </div>

          <div className="flex-1">
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="w-full h-[42px] px-3 border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '16px',
                paddingRight: '32px'
              }}
            >
              {MOODS.map(mood => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <select
              value={selectedPerspective}
              onChange={(e) => setSelectedPerspective(e.target.value)}
              className="w-full h-[42px] px-3 border border-gray-200 rounded-lg bg-white appearance-none cursor-pointer"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '16px',
                paddingRight: '32px'
              }}
            >
              <option value="me">Me</option>
              <option value="us">Us</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={generateIdeas}
          disabled={!topic.trim() || isLoading}
          className={`w-full p-3 rounded-lg flex items-center justify-center space-x-2 ${
            !topic.trim() || isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating...(this might take up to 2 minutes)</span>
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              <span>Generate Ideas</span>
            </>
          )}
        </button>

        {/* "Without Idea" Link wird nur angezeigt, wenn keine Vorschläge vorhanden sind */}
        {showSkipButton && (
          <div className="text-center">
            <button
              onClick={onSkipIdeaGeneration}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Without Idea
            </button>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSelectSuggestion({
                  title: suggestion.titel,
                  text: suggestion.text,
                  cta: suggestion.cta
                })}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-medium">{suggestion.titel}</h3>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}