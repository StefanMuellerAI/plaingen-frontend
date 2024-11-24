import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GenerateIdeas } from './components/GenerateIdeas';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';

function App() {
  const [postData, setPostData] = useState({
    title: '',
    text: '',
    cta: ''
  });
  const [isPostSelected, setIsPostSelected] = useState(false);

  const handleSuggestionSelect = (suggestion: { title: string; text: string; cta: string }) => {
    setPostData({
      ...postData,
      title: suggestion.title,
      text: suggestion.text,
      cta: suggestion.cta
    });
    setIsPostSelected(true);
  };

  const handleSkipIdeaGeneration = () => {
    setIsPostSelected(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col mb-[100px]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1 min-h-0">
          <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
            <GenerateIdeas 
              onSelectSuggestion={handleSuggestionSelect}
              onSkipIdeaGeneration={handleSkipIdeaGeneration}
            />
          </div>
          
          <div className={`bg-white rounded-lg shadow-sm p-6 ${!isPostSelected ? 'opacity-50 pointer-events-none' : ''}`}>
            <Editor
              title={postData.title}
              text={postData.text}
              cta={postData.cta}
              onChange={setPostData}
              disabled={!isPostSelected}
            />
          </div>
          
          <div className={`bg-white rounded-lg shadow-sm p-6 ${!isPostSelected ? 'opacity-50 pointer-events-none' : ''}`}>
            <Preview
              title={postData.title}
              text={postData.text}
              cta={postData.cta}
              disabled={!isPostSelected}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;