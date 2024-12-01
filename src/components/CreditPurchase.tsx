import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useCredits } from '../contexts/CreditsContext';
import { useSearchParams } from 'react-router-dom';

const STRIPE_CONFIG = {
  development: {
    paymentLink: 'https://buy.stripe.com/test_00geYm4KI2vi0Y8dQQ',
  },
  production: {
    paymentLink: '', // TODO: Live Payment Link
  }
};

export function CreditPurchase() {
  const { user } = useAuth();
  const { fetchCredits } = useCredits();
  const [searchParams] = useSearchParams();
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      fetchCredits();
    }
  }, [searchParams, fetchCredits]);

  const handlePurchase = () => {
    const clientReferenceId = encodeURIComponent(user?.id || '');
    const checkoutUrl = `${STRIPE_CONFIG[isDevelopment ? 'development' : 'production'].paymentLink}?client_reference_id=${clientReferenceId}`;
    window.location.href = checkoutUrl;
  };

  return (
    <div className="text-center">
      <button
        onClick={handlePurchase}
        className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
      >
        Purchase Credits
      </button>
    </div>
  );
} 