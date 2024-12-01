import Stripe from 'stripe';
import { supabase } from '../lib/supabase-server.js';

export async function handleStripeWebhook(event: Stripe.Event) {
  console.log('Received webhook event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    
    console.log('Session data:', {
      userId,
      amount: session.amount_total,
      sessionId: session.id
    });
    
    if (!userId) {
      console.warn('No user ID provided in session');
      return { success: true, message: 'No user ID in session' };
    }

    const creditsToAdd = Math.floor(session.amount_total! / 100);
    console.log('Processing payment for user:', userId, 'credits:', creditsToAdd);

    try {
      // Update credits with raw SQL
      const { data: updateResult, error: updateError } = await supabase
        .rpc('add_credits', {
          p_user_id: userId,
          p_credits: creditsToAdd
        });

      if (updateError) {
        console.error('Error updating credits:', updateError);
        return { success: false, error: 'Failed to update credits' };
      }

      console.log('Successfully updated credits:', updateResult);

      // Log transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert([{
          user_id: userId,
          amount: creditsToAdd,
          type: 'purchase',
          stripe_session_id: session.id,
          created_at: new Date().toISOString()
        }]);

      if (transactionError) {
        console.error('Transaction logging error:', transactionError);
      }

      return { 
        success: true,
        details: {
          creditsAdded: creditsToAdd,
          userId,
          sessionId: session.id
        }
      };

    } catch (error) {
      console.error('Error in webhook handler:', error);
      return { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      };
    }
  }

  // Erfolgreich alle anderen Event-Typen bestätigen
  return { 
    success: true, 
    message: `Event ${event.type} received but not processed` 
  };
} 