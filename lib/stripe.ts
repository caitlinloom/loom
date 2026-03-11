import { initStripe, useStripe } from '@stripe/stripe-react-native';
import { supabase } from './supabase';

export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
export const PLAN_PRICE_ID          = process.env.EXPO_PUBLIC_STRIPE_PRICE_ID!;
export const SUBSCRIPTION_PRICE     = '$25.99 / month';

// Call once in app root after fonts load.
export function initializeStripe() {
  return initStripe({ publishableKey: STRIPE_PUBLISHABLE_KEY });
}

// Calls the `create-subscription` edge function which:
//  1. Creates (or retrieves) a Stripe customer tied to the user's email/phone
//  2. Creates a Stripe Subscription in `incomplete` status
//  3. Returns a PaymentIntent client_secret for the PaymentSheet
export async function createSubscriptionPaymentSheet(): Promise<{
  paymentIntent: string;
  ephemeralKey:  string;
  customer:      string;
}> {
  const { data, error } = await supabase.functions.invoke('create-subscription', {
    body: { priceId: PLAN_PRICE_ID },
  });

  if (error) throw new Error(error.message);
  return data as { paymentIntent: string; ephemeralKey: string; customer: string };
}
