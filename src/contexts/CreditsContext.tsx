import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CreditsContextType {
  credits: number | null;
  loading: boolean;
  error: string | null;
  useCredit: () => Promise<boolean>;
  fetchCredits: () => Promise<void>;
  setCredits: (credits: number) => void;
}

const CreditsContext = createContext<CreditsContextType>({
  credits: null,
  loading: true,
  error: null,
  useCredit: async () => false,
  fetchCredits: async () => {},
  setCredits: () => {},
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      setCredits(data?.credits_remaining ?? null);
      setError(null);
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError('Failed to load credits');
    } finally {
      setLoading(false);
    }
  };

  const useCredit = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data: creditResponse, error } = await supabase.rpc('use_credit', {
        user_id_input: user.id
      });

      if (error) throw error;
      
      if (creditResponse === true) {
        setCredits(prev => prev !== null ? prev - 1 : null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error using credit:', err);
      setError('Failed to use credit');
      return false;
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  return (
    <CreditsContext.Provider 
      value={{ 
        credits, 
        loading, 
        error, 
        useCredit, 
        fetchCredits,
        setCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
}

export const useCredits = () => useContext(CreditsContext); 