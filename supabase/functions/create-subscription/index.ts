// ── Loom: create-subscription Edge Function ───────────────────────────────────
// Creates (or retrieves) a Stripe customer for the authenticated user,
// creates a Subscription in `incomplete` state, and returns the data needed
// by Stripe's PaymentSheet on the client.
//
// Deploy: supabase functions deploy create-subscription

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { priceId } = await req.json() as { priceId: string };
    if (!priceId) throw new Error('priceId is required');

    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (authErr || !user) throw new Error('Unauthorized');

    // Service-role client to read/write subscriptions
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-04-10',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // ── Find or create Stripe customer ───────────────────────────────────────
    const { data: subRow } = await adminClient
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId: string;

    if (subRow?.stripe_customer_id) {
      customerId = subRow.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        metadata: { supabase_user_id: user.id },
        phone:    user.phone ?? undefined,
        email:    user.email ?? undefined,
      });
      customerId = customer.id;

      await adminClient.from('subscriptions').upsert({
        user_id:           user.id,
        stripe_customer_id: customerId,
        status:            'incomplete',
        updated_at:        new Date().toISOString(),
      });
    }

    // ── Create Stripe subscription (incomplete, needs payment) ────────────────
    const subscription = await stripe.subscriptions.create({
      customer:          customerId,
      items:             [{ price: priceId }],
      payment_behavior:  'default_incomplete',
      payment_settings:  { save_default_payment_method: 'on_subscription' },
      expand:            ['latest_invoice.payment_intent', 'pending_setup_intent'],
    });

    await adminClient.from('subscriptions').upsert({
      user_id:                user.id,
      stripe_customer_id:     customerId,
      stripe_subscription_id: subscription.id,
      status:                 subscription.status,
      updated_at:             new Date().toISOString(),
    });

    // ── Return PaymentSheet params ────────────────────────────────────────────
    const invoice       = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-04-10' },
    );

    return new Response(
      JSON.stringify({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey:  ephemeralKey.secret,
        customer:      customerId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
