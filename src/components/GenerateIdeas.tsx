import { useState, useEffect, useRef } from 'react';
import { InfoIcon } from './InfoIcon';
import { Wand2, Loader2 } from 'lucide-react';
import { marked } from 'marked';
import { useCredits } from '../contexts/CreditsContext';
import { useAuth } from '../contexts/AuthContext';
import { FreeUsageTracker } from '../lib/freeUsageTracker';
import { Link } from 'react-router-dom';
import { Modal } from '../components/Modal';

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
const TIMEOUT_DURATION = 30000;
const INITIAL_BACKOFF = 1000;
const MAX_BACKOFF = 5000;

export function GenerateIdeas({ onSelectSuggestion, onSkipIdeaGeneration }: GenerateIdeasProps) {
  const { user } = useAuth();
  const { credits, useCredit } = useCredits();
  const [remainingFreeGenerations, setRemainingFreeGenerations] = useState<number | null>(null);
  const [topic, setTopic] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(user?.user_metadata?.preferred_language || 'DE');
  const [selectedAddress, setSelectedAddress] = useState('formally');
  const [selectedMood, setSelectedMood] = useState('Inspiring');
  const [selectedPerspective, setSelectedPerspective] = useState('me');
  const [suggestions, setSuggestions] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpContent, setHelpContent] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showNoCreditModal, setShowNoCreditModal] = useState(false);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

  useEffect(() => {
    if (user?.user_metadata?.preferred_language) {
      setSelectedCountry(user.user_metadata.preferred_language);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      checkFreeUsageLimit();
    }
  }, [user]);

  const checkFreeUsageLimit = async () => {
    const canGenerate = await FreeUsageTracker.canGenerate();
    setHasReachedLimit(!canGenerate);
    if (!canGenerate) {
      const remaining = await FreeUsageTracker.getRemainingGenerations();
      setRemainingFreeGenerations(remaining);
    }
  };

  const generateIdeas = async () => {
    if (!topic.trim()) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    setSuggestions([]);
    setError(null);

    let retries = 0;
    let delay = INITIAL_BACKOFF;

    try {
      if (user) {
        if (credits === 0) {
          setError('You have no credits remaining. Please upgrade your plan to continue.');
          return;
        }
      } else {
        const canGenerate = await FreeUsageTracker.canGenerate();
        if (!canGenerate) {
          setError('Daily limit reached. Sign up for more generations.');
          return;
        }
      }

      while (retries < MAX_RETRIES) {
        abortControllerRef.current = new AbortController();
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, TIMEOUT_DURATION);

        try {
          const requestData = {
            topic: topic,
            language: selectedCountry,
            address: selectedAddress,
            mood: selectedMood,
            perspective: selectedPerspective
          };

          const response = await fetch(import.meta.env.VITE_RESEARCH_TASK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': import.meta.env.VITE_API_KEY,
            },
            body: JSON.stringify(requestData),
            signal: abortControllerRef.current.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data: ApiResponse = await response.json();
            
            if (abortControllerRef.current?.signal.aborted) {
              return;
            }

            if (!data.posts || data.posts.length !== 5) {
              throw new Error('Invalid response format');
            }

            const validPosts = data.posts.every(post => 
              post.titel && 
              post.text && 
              post.cta &&
              typeof post.titel === 'string' &&
              typeof post.text === 'string' &&
              typeof post.cta === 'string'
            );

            if (!validPosts) {
              throw new Error('Invalid post data');
            }

            if (!abortControllerRef.current?.signal.aborted) {
              if (user) {
                const creditUsed = await useCredit();
                if (!creditUsed) {
                  throw new Error('Failed to use credit');
                }
              } else {
                await FreeUsageTracker.incrementUsage();
                const remaining = await FreeUsageTracker.getRemainingGenerations();
                setRemainingFreeGenerations(remaining);
              }

              setSuggestions(data.posts);
            }
            return;
          }

          const errorData = await response.json().catch(() => null);
          console.error('Server response:', errorData);
          throw new Error(`API request failed: ${response.status}`);

        } catch (error) {
          clearTimeout(timeoutId);

          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              return;
            } else {
              console.error('Request failed:', error.message);
            }
          }

          retries++;
          
          if (retries === MAX_RETRIES) {
            throw new Error('Max retries reached');
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * 2, MAX_BACKOFF);
        }
      }
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      console.error('Error generating ideas:', error);
      
      if (error instanceof Error) {
        switch (error.message) {
          case 'Max retries reached':
            setError('Service temporarily unavailable. Please try again later.');
            break;
          case 'Invalid response format':
            setError('Received invalid response. Please try again.');
            break;
          case 'Invalid post data':
            setError('Received invalid post data. Please try again.');
            break;
          default:
            setError('Failed to generate ideas. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    if (user) {
      if (credits && credits > 0) {
        await generateIdeas();
      } else {
        setShowNoCreditModal(true);
      }
    } else {
      const canGenerate = await FreeUsageTracker.canGenerate();
      if (canGenerate) {
        await generateIdeas();
      } else {
        setHasReachedLimit(true);
      }
    }
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

        {hasReachedLimit && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
            Daily limit reached. Sign up for more generations.
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!topic.trim() || isLoading || hasReachedLimit}
          className={`w-full p-3 rounded-lg flex items-center justify-center space-x-2 ${
            !topic.trim() || isLoading || hasReachedLimit
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

        {showSkipButton && (
          <>
            <div className="text-right">
              <button
                onClick={onSkipIdeaGeneration}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Without Idea &gt;&gt;&gt;
              </button>
            </div>
            <hr className="my-2 border-gray-200" />
          </>
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

        {!user && remainingFreeGenerations !== null && (
          <div className="mt-2 text-sm text-gray-600">
            {remainingFreeGenerations} free generations remaining today
            {remainingFreeGenerations < 3 && (
              <div className="mt-1 text-blue-600">
                <Link to="/register">Sign up for 125 generations per month →</Link>
              </div>
            )}
          </div>
        )}
      </div>

      {showLimitModal && (
        <Modal
          title="Daily Limit Reached"
          onClose={() => setShowLimitModal(false)}
        >
          <div className="space-y-4">
            <p>
              You've reached your daily limit of 10 free generations.
              Sign up now to unlock:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>125 generations per month</li>
              <li>Save and organize your posts</li>
              <li>Advanced AI features</li>
            </ul>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowLimitModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Maybe later
              </button>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sign up now
              </Link>
            </div>
          </div>
        </Modal>
      )}

      {showNoCreditModal && (
        <Modal
          title="No Credits Remaining"
          onClose={() => setShowNoCreditModal(false)}
        >
          <div className="space-y-4">
            <p>
              You have no credits remaining. New credits will be added at the start of next month.
            </p>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowNoCreditModal(false)}
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