import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Receipt, Globe2 } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { useCredits } from '../../contexts/CreditsContext';
import { CreditPurchase } from '../../components/CreditPurchase';

const COUNTRIES = [
  { code: 'DE', flag: '🇩🇪', name: 'German' },
  { code: 'US', flag: '🇺🇸', name: 'English' },
  { code: 'FR', flag: '🇫🇷', name: 'French' },
  { code: 'ES', flag: '🇪🇸', name: 'Spanish' },
  { code: 'IT', flag: '🇮🇹', name: 'Italian' }
];

interface StripePayment {
  id: string;
  amount: number;
  status: string;
  created: number;
  receipt_url?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { credits } = useCredits();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(user?.user_metadata?.preferred_language || 'DE');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [payments, setPayments] = useState<StripePayment[]>([]);

  useEffect(() => {
    setSelectedLanguage(user?.user_metadata?.preferred_language || 'DE');
  }, [user]);

  useEffect(() => {
    async function fetchPaymentHistory() {
      if (!user) return;

      try {
        const response = await fetch('/api/stripe-payments', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch payment history');
        const data = await response.json();
        setPayments(data.payments);
      } catch (error) {
        console.error('Error fetching payment history:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentHistory();
  }, [user]);

  const updateLanguage = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: { 
          ...user?.user_metadata,
          preferred_language: selectedLanguage 
        }
      });

      if (error) throw error;
      setSuccessMessage('Default language updated successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      alert('Error updating language preference');
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayName = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName }
      });

      if (error) throw error;
      setSuccessMessage('Display name updated successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      alert('Error updating display name');
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        email: email
      });

      if (error) throw error;
      setSuccessMessage('Please check your new email address for a confirmation link.');
      setShowSuccessModal(true);
    } catch (error) {
      alert('Error updating email');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      setPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password updated successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      alert('Error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Column - Account Settings */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Account Settings</h2>
        
        <div className="space-y-6">
          {/* Language Settings Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Globe2 className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Default Language</h3>
            </div>
            <div className="space-y-4">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white"
              >
                {COUNTRIES.map(({ code, flag, name }) => (
                  <option key={code} value={code}>
                    {flag} {name}
                  </option>
                ))}
              </select>
              <button
                onClick={updateLanguage}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Language'}
              </button>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Display Name</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter display name"
              />
              <button
                onClick={updateDisplayName}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Display Name'}
              </button>
            </div>
          </div>

          {/* Email Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Address</h3>
            <div className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter new email"
              />
              <button
                onClick={updateEmail}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Email'}
              </button>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Enter new password"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Confirm new password"
              />
              <button
                onClick={updatePassword}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Credits & Billing */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Credits & Billing</h2>
        
        {/* Credit Balance - Updated with real credits and monthly info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">Credit Balance</h3>
            <span className="text-2xl font-bold text-blue-600">
              {credits === null ? '...' : credits}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            (Free: 25 credits are added monthly, equivalent to 125 posts)
          </p>
          <CreditPurchase />
        </div>

        {/* Billing History */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Receipt className="w-5 h-5 mr-2 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Billing History</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <div key={payment.id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(payment.created * 1000).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">${(payment.amount / 100).toFixed(2)}</div>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'succeeded'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <Modal
          title="Success"
          onClose={() => setShowSuccessModal(false)}
        >
          <div className="space-y-4">
            <p className="text-gray-600">{successMessage}</p>
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