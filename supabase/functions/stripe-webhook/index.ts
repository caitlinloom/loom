// ── Loom: stripe-webhook Edge Function ───────────────────────────────────────
// Receives Stripe webhook events and keeps the subscriptions table in sync.
// Endpoint to register in Stripe dashboard:
//   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
//
// Events to enable in Stripe dashboard:
//   customer.subscription.updated
//   customer.subscription.deleted
//   invoice.payment_succeeded
//   invoice.payment_failed
//
// Deploy: supabase functions deploy stripe-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-04-10',
    httpClient: Stripe.createFetchHttpClient(),
  });

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    );
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, { status: 400 });
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date().toISOString();

  try {
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await adminClient
          .from('subscriptions')
          .update({
            status:             sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at:         now,
          })
          .eq('stripe_subscription_id', sub.id);

        // If subscription is no longer active, reset onboarding step so the
        // user sees the paywall again on next open.
        if (!['active', 'trialing'].includes(sub.status)) {
          const { data: subRow } = await adminClient
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', sub.id)
            .single();
          if (subRow?.user_id) {
            await adminClient
              .from('profiles')
              .update({ onboarding_step: 0, updated_at: now })
              .eq('id', subRow.user_id);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        await adminClient
          .from('subscriptions')
          .update({
            status:             sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at:         now,
          })
          .eq('stripe_subscription_id', sub.id);

        // Advance onboarding to step 1 (subscribed) if still at 0
        const { data: subRow } = await adminClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single();
        if (subRow?.user_id) {
          await adminClient
            .from('profiles')
            .update({ onboarding_step: 1, updated_at: now })
            .eq('id', subRow.user_id)
            .eq('onboarding_step', 0);   // only advance if still at 0
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        await adminClient
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: now })
          .eq('stripe_subscription_id', invoice.subscription as string);
        break;
      }

      default:
        // Unhandled event — log and return 200 to prevent Stripe retrying
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status:  200,
    });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    );
  }
});
