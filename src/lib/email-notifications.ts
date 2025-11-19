import { supabase } from "@/integrations/supabase/client";

interface EmailNotificationParams {
  to: string;
  type: 'order_submitted' | 'order_confirmed' | 'order_planned' | 'order_delivered' | 'invoice_issued';
  orderNumber?: string;
  invoiceNumber?: string;
  orderData?: any;
  scheduledDate?: string;
}

/**
 * Send email notification using Supabase Edge Function or external service
 * Note: This requires setting up email functionality in your Supabase project
 * or using a service like Resend, SendGrid, etc.
 */
export async function sendEmailNotification(params: EmailNotificationParams): Promise<void> {
  try {
    // Option 1: Use Supabase Edge Function for emails
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: params.to,
        type: params.type,
        orderNumber: params.orderNumber,
        invoiceNumber: params.invoiceNumber,
        orderData: params.orderData,
        scheduledDate: params.scheduledDate,
      },
    });

    if (error) {
      console.error('Email notification error:', error);
      // Don't throw - email failures shouldn't break the workflow
    }

    // Option 2: If using a direct email service, you can implement it here
    // For now, we'll log the notification requirement
    
    console.log('Email notification requested:', params);
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Silently fail - email is not critical for order processing
  }
}

/**
 * Get email templates (Dutch as per requirement)
 */
export function getEmailTemplate(type: EmailNotificationParams['type']): {
  subject: string;
  body: string;
} {
  const templates = {
    order_submitted: {
      subject: 'Bestelling ontvangen - Order #{orderNumber}',
      body: `Beste klant,

Uw bestelling #{orderNumber} is ontvangen en wordt nu beoordeeld.

U ontvangt binnenkort een bevestiging wanneer de bestelling is goedgekeurd.

Met vriendelijke groet,
Immoaura Team`,
    },
    order_confirmed: {
      subject: 'Bestelling bevestigd - Order #{orderNumber}',
      body: `Beste klant,

Uw bestelling #{orderNumber} is bevestigd.

{SCHEDULED_INFO}

U ontvangt binnenkort een factuur.

Met vriendelijke groet,
Immoaura Team`,
    },
    order_planned: {
      subject: 'Bestelling gepland - Order #{orderNumber}',
      body: `Beste klant,

Uw bestelling #{orderNumber} is gepland.

Het tijdslot is nu vergrendeld.

Herinnering: U ontvangt 24 uur voorafgaand aan de geplande datum een herinnering.

Met vriendelijke groet,
Immoaura Team`,
    },
    order_delivered: {
      subject: 'Bestelling geleverd - Order #{orderNumber}',
      body: `Beste klant,

Uw bestelling #{orderNumber} is geleverd.

Download links en bestanden zijn beschikbaar in uw client portal.

Vergeet niet uw factuur te betalen.

Met vriendelijke groet,
Immoaura Team`,
    },
    invoice_issued: {
      subject: 'Factuur uitgegeven - #{invoiceNumber}',
      body: `Beste klant,

Er is een nieuwe factuur uitgegeven voor bestelling #{orderNumber}.

Factuurnummer: #{invoiceNumber}
Bedrag: €{amount}

U kunt de factuur downloaden vanuit uw client portal.

Met vriendelijke groet,
Immoaura Team`,
    },
  };

  return templates[type];
}

/**
 * Notify client and admin when order is submitted
 */
export async function notifyOrderSubmitted(orderNumber: string, clientEmail: string, adminEmail: string, orderData: any): Promise<void> {
  await Promise.all([
    sendEmailNotification({
      to: clientEmail,
      type: 'order_submitted',
      orderNumber,
      orderData,
    }),
    sendEmailNotification({
      to: adminEmail,
      type: 'order_submitted',
      orderNumber,
      orderData,
    }),
  ]);
}

/**
 * Notify client when order status changes
 */
export async function notifyOrderStatusChange(
  orderNumber: string,
  clientEmail: string,
  status: 'confirmed' | 'planned' | 'delivered',
  scheduledDate?: string
): Promise<void> {
  const typeMap = {
    confirmed: 'order_confirmed' as const,
    planned: 'order_planned' as const,
    delivered: 'order_delivered' as const,
  };

  await sendEmailNotification({
    to: clientEmail,
    type: typeMap[status],
    orderNumber,
    scheduledDate,
  });
}

/**
 * Notify client when invoice is issued
 */
export async function notifyInvoiceIssued(
  invoiceNumber: string,
  orderNumber: string,
  clientEmail: string,
  amount: number
): Promise<void> {
  await sendEmailNotification({
    to: clientEmail,
    type: 'invoice_issued',
    invoiceNumber,
    orderNumber,
    orderData: { amount },
  });
}

