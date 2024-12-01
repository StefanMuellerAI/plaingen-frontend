import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { GenerateIdeas } from './components/GenerateIdeas';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { CreditsProvider } from './contexts/CreditsContext';
import Settings from './pages/dashboard/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CreditsProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<MainEditor />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route 
                path="dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              >
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </CreditsProvider>
      </AuthProvider>
    </Router>
  );
}

function MainEditor() {
  const [postData, setPostData] = useState({
    title: '',
    text: '',
    cta: ''
  });
  const [isPostSelected, setIsPostSelected] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const editData = location.state?.postData;
    if (editData) {
      setPostData({
        title: editData.title || '',
        text: editData.text || '',
        cta: editData.cta || ''
      });
      setIsPostSelected(true);
    }
  }, [location.state]);

  const handleSuggestionSelect = (suggestion: { title: string; text: string; cta: string }) => {
    setPostData({
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
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

export default App;