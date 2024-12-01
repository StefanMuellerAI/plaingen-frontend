import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, Edit, Search, ArrowUpDown, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/Modal';

interface Post {
  id: string;
  title: string;
  text: string;
  cta: string;
  created_at: string;
  user_id: string;
}

const POST_LIMIT = 15;

export default function Posts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    postId: string | null;
    postTitle: string;
  }>({
    isOpen: false,
    postId: null,
    postTitle: ''
  });

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      setPosts((prevPosts) => prevPosts.filter(post => post.id !== postId));
      setDeleteModal({ isOpen: false, postId: null, postTitle: '' });
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEdit = (post: Post) => {
    navigate('/', {
      state: {
        postData: {
          title: post.title,
          text: post.text,
          cta: post.cta,
          id: post.id
        },
        activateEditor: true
      }
    });
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const toggleExpand = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  const filteredAndSortedPosts = posts
    .filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const comparison = a.title.localeCompare(b.title);
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Your Posts</h1>
        <div className="text-sm text-gray-600">
          {posts.length} / {POST_LIMIT} posts used
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          <div className="px-6 py-3 bg-gray-50 flex items-center">
            <button
              onClick={toggleSort}
              className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Title
              <ArrowUpDown className="ml-2 w-4 h-4" />
            </button>
          </div>

          {filteredAndSortedPosts.length === 0 ? (
            <div className="p-6 text-gray-500">
              {searchTerm ? 'No posts found matching your search.' : 'You haven\'t created any posts yet.'}
            </div>
          ) : (
            filteredAndSortedPosts.map((post) => (
              <div key={post.id} className="group hover:bg-gray-50">
                <div className="px-6 py-4 flex items-center justify-between cursor-pointer" onClick={() => toggleExpand(post.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <ChevronDown className={`w-5 h-5 mr-2 text-gray-400 transform transition-transform ${expandedPostId === post.id ? 'rotate-180' : ''}`} />
                      <div>
                        <h3 className="font-medium text-gray-900 break-words pr-4">{post.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => handleEdit(post)}
                      className="p-1 text-gray-400 hover:text-blue-500"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setDeleteModal({ isOpen: true, postId: post.id, postTitle: post.title })}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {expandedPostId === post.id && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Text</h4>
                        <p className="mt-1 text-gray-900 whitespace-pre-wrap">{post.text}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">CTA</h4>
                        <p className="mt-1 text-gray-900">{post.cta}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {deleteModal.isOpen && (
        <Modal
          title="Delete Post"
          onClose={() => setDeleteModal({ isOpen: false, postId: null, postTitle: '' })}
        >
          <div className="space-y-4">
            <p className="text-gray-500">
              Are you sure you want to delete "{deleteModal.postTitle}"? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteModal({ isOpen: false, postId: null, postTitle: '' })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteModal.postId && handleDelete(deleteModal.postId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
} 