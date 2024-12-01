import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Settings as SettingsIcon, LineChart, Layout } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Posts from './dashboard/Posts';
import Settings from './dashboard/Settings';
import Insights from './dashboard/Insights';
import Templates from './dashboard/Templates';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('posts');

  // Synchronisiere activeTab mit der aktuellen URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'settings') {
      setActiveTab('settings');
    }
  }, [location]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'settings') {
      navigate('/dashboard/settings');
    } else {
      navigate('/dashboard');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'posts':
        return <Posts />;
      case 'insights':
        return <Insights />;
      case 'templates':
        return <Templates />;
      case 'settings':
        return <Settings />;
      default:
        return <Posts />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-2" />
            Dashboard
          </h2>
        </div>
        <nav className="mt-4">
          <button
            onClick={() => handleTabChange('posts')}
            className={`w-full flex items-center px-4 py-2 text-sm ${
              activeTab === 'posts'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5 mr-2" />
            Posts
          </button>
          <button
            onClick={() => handleTabChange('insights')}
            className={`w-full flex items-center px-4 py-2 text-sm ${
              activeTab === 'insights'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LineChart className="w-5 h-5 mr-2" />
            Insights
          </button>
          <button
            onClick={() => handleTabChange('templates')}
            className={`w-full flex items-center px-4 py-2 text-sm ${
              activeTab === 'templates'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Layout className="w-5 h-5 mr-2" />
            Templates
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`w-full flex items-center px-4 py-2 text-sm ${
              activeTab === 'settings'
                ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SettingsIcon className="w-5 h-5 mr-2" />
            Settings
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}