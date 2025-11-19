// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Expected payload shape from the client
interface EmailPayload {
  to: string;
  type: 'order_submitted' | 'order_confirmed' | 'order_planned' | 'order_delivered' | 'invoice_issued';
  orderNumber?: string;
  invoiceNumber?: string;
  orderData?: any;
  scheduledDate?: string;
}

function getTemplate(type: EmailPayload['type'], payload: EmailPayload) {
  const t = {
    order_submitted: {
      subject: `Bestelling ontvangen - Order #${payload.orderNumber}`,
      body: `Beste klant,\n\nUw bestelling #${payload.orderNumber} is ontvangen en wordt nu beoordeeld.\n\nU ontvangt binnenkort een bevestiging wanneer de bestelling is goedgekeurd.\n\nMet vriendelijke groet,\nImmoaura Team`,
    },
    order_confirmed: {
      subject: `Bestelling bevestigd - Order #${payload.orderNumber}`,
      body: `Beste klant,\n\nUw bestelling #${payload.orderNumber} is bevestigd.\n\n${payload.scheduledDate ? `Geplande datum: ${payload.scheduledDate}\n\n` : ''}U ontvangt binnenkort een factuur.\n\nMet vriendelijke groet,\nImmoaura Team`,
    },
    order_planned: {
      subject: `Bestelling gepland - Order #${payload.orderNumber}`,
      body: `Beste klant,\n\nUw bestelling #${payload.orderNumber} is gepland.\nHet tijdslot is nu vergrendeld.\n\nHerinnering: U ontvangt 24 uur voorafgaand aan de geplande datum een herinnering.\n\nMet vriendelijke groet,\nImmoaura Team`,
    },
    order_delivered: {
      subject: `Bestelling geleverd - Order #${payload.orderNumber}`,
      body: `Beste klant,\n\nUw bestelling #${payload.orderNumber} is geleverd.\n\nDownload links en bestanden zijn beschikbaar in uw client portal.\n\nVergeet niet uw factuur te betalen.\n\nMet vriendelijke groet,\nImmoaura Team`,
    },
    invoice_issued: {
      subject: `Factuur uitgegeven - #${payload.invoiceNumber}`,
      body: `Beste klant,\n\nEr is een nieuwe factuur uitgegeven voor bestelling #${payload.orderNumber}.\n\nFactuurnummer: #${payload.invoiceNumber}\n\nU kunt de factuur downloaden vanuit uw client portal.\n\nMet vriendelijke groet,\nImmoaura Team`,
    },
  } as const;
  return t[type];
}

function textToHtml(text: string) {
  return text
    .split('\n')
    .map((line) => (line.trim() === '' ? '<br/>' : `<p>${line}</p>`))
    .join('\n');
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'no-reply@yourdomain.com';

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing RESEND_API_KEY' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = (await req.json()) as EmailPayload;

    if (!payload?.to || !payload?.type) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { subject, body } = getTemplate(payload.type, payload);
    const html = textToHtml(body);

    // Send via Resend API
    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.to,
        subject,
        html,
      }),
    });

    if (!resendResp.ok) {
      const errText = await resendResp.text();
      console.error('Resend error:', errText);
      return new Response(JSON.stringify({ error: 'Email provider error', details: errText }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await resendResp.json();
    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('send-email error:', e);
    return new Response(JSON.stringify({ error: 'Unhandled error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
