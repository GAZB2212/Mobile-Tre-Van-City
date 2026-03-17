import * as React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { EnquiryConfirmation } from './emails/EnquiryConfirmation';
import { QuoteProposal } from './emails/QuoteProposal';
import { FinanceFollowUp } from './emails/FinanceFollowUp';

const INTERNAL_NOTIFY_EMAILS = ['carl@geg.co', 'info@gfukgroup.co.uk'];

const fmt = (p: number) =>
  `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

async function getCredentials() {
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: 'Mobile Tyre Van City <noreply@mobiletyrevancity.co.uk>',
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken,
      },
    },
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: 'Mobile Tyre Van City <noreply@mobiletyrevancity.co.uk>',
  };
}

// WARNING: Never cache this client. Access tokens expire.
export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}

// ── Enquiry received: customer confirmation + admin notification ──────────────
export async function sendQuoteReceivedEmails({
  quote,
  vanTitle,
  kitName,
  upgradeNames,
}: {
  quote: {
    id: string;
    userName: string;
    email: string;
    phone: string;
    company?: string | null;
    estTotal: number;
    estSubtotal: number;
    estVAT: number;
  };
  vanTitle?: string | null;
  kitName?: string | null;
  upgradeNames?: string[];
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const ref = quote.id.slice(0, 8).toUpperCase();

  // 1. Branded customer confirmation
  const customerHtml = await render(
    React.createElement(EnquiryConfirmation, {
      customerName: quote.userName,
      reference: ref,
      vanTitle,
      kitName,
      upgradeNames,
      subtotal: fmt(quote.estSubtotal),
      vat: fmt(quote.estVAT),
      total: fmt(quote.estTotal),
    }),
  );

  await client.emails.send({
    to: quote.email,
    from: fromEmail,
    subject: `We've received your enquiry – Ref #${ref}`,
    html: customerHtml,
    text: `Hi ${quote.userName},\n\nThank you for completing our van configurator. We've received your enquiry and will be in touch within 24 hours.\n\nReference: #${ref}\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? `Upgrades: ${upgradeNames.join(', ')}\n` : ''}Subtotal: ${fmt(quote.estSubtotal)}\nVAT: ${fmt(quote.estVAT)}\nTotal: ${fmt(quote.estTotal)}\n\nCall us: 0151 203 8500\n\nMobile Tyre Van City\n5–7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
  });

  // 2. Plain admin notification (internal — no branding needed)
  const brandGreen = '#8bc440';
  const brandDark = '#191919';
  await client.emails.send({
    to: INTERNAL_NOTIFY_EMAILS,
    from: fromEmail,
    subject: `New configurator submission – ${quote.userName} – ${fmt(quote.estTotal)} – Ref #${ref}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333}.container{max-width:600px;margin:0 auto;padding:20px}h2{color:${brandDark};border-bottom:3px solid ${brandGreen};padding-bottom:8px}table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px}td:first-child{font-weight:bold;color:#6b7280;width:35%}.total td{font-weight:bold;font-size:16px;border-top:2px solid ${brandGreen}}</style></head><body><div class="container"><h2>New Configurator Submission</h2><h3>Customer Details</h3><table><tr><td>Name</td><td>${quote.userName}</td></tr><tr><td>Email</td><td><a href="mailto:${quote.email}">${quote.email}</a></td></tr><tr><td>Phone</td><td>${quote.phone}</td></tr>${quote.company ? `<tr><td>Company</td><td>${quote.company}</td></tr>` : ''}<tr><td>Reference</td><td>#${ref}</td></tr></table><h3>Configuration</h3><table>${vanTitle ? `<tr><td>Van</td><td>${vanTitle}</td></tr>` : ''}${kitName ? `<tr><td>Pack</td><td>${kitName}</td></tr>` : ''}${upgradeNames && upgradeNames.length > 0 ? upgradeNames.map(u => `<tr><td>Upgrade</td><td>${u}</td></tr>`).join('') : ''}</table><h3>Pricing</h3><table><tr><td>Subtotal (ex. VAT)</td><td>${fmt(quote.estSubtotal)}</td></tr><tr><td>VAT (20%)</td><td>${fmt(quote.estVAT)}</td></tr><tr class="total"><td>Total (inc. VAT)</td><td>${fmt(quote.estTotal)}</td></tr></table></div></body></html>`,
    text: `New Submission – #${ref}\n\n${quote.userName}\n${quote.email}\n${quote.phone}\n${quote.company ? `Company: ${quote.company}\n` : ''}\nRef: #${ref}\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? upgradeNames.map(u => `Upgrade: ${u}`).join('\n') + '\n' : ''}\nSubtotal: ${fmt(quote.estSubtotal)}\nVAT: ${fmt(quote.estVAT)}\nTotal: ${fmt(quote.estTotal)}`,
  });
}

// ── Spec summary email: sent by admin after discussing with customer ──────────
export async function sendQuoteSpecSummaryEmail({
  to,
  customerName,
  quoteId,
  vanTitle,
  kitName,
  upgradeNames,
  subtotal,
  vat,
  total,
  discount,
  customerNote,
}: {
  to: string;
  customerName: string;
  quoteId: string;
  vanTitle?: string | null;
  kitName?: string | null;
  upgradeNames?: string[];
  subtotal: number;
  vat: number;
  total: number;
  discount?: number;
  customerNote?: string | null;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const ref = quoteId.slice(0, 8).toUpperCase();
  const totalAfterDiscount = discount && discount > 0 ? total - discount : total;

  const html = await render(
    React.createElement(QuoteProposal, {
      customerName,
      reference: ref,
      vanTitle,
      kitName,
      upgradeNames,
      subtotal: fmt(subtotal),
      vat: fmt(vat),
      total: fmt(totalAfterDiscount),
      discount: discount && discount > 0 ? fmt(discount) : undefined,
      customerNote,
    }),
  );

  await client.emails.send({
    to,
    from: fromEmail,
    subject: `Your Van Conversion Summary – Ref #${ref} – Mobile Tyre Van City`,
    html,
    text: `Hi ${customerName},\n\nThank you for speaking with us. Here is your van conversion summary.\n\nReference: #${ref}\n\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? upgradeNames.map(u => `Upgrade: ${u}`).join('\n') + '\n' : ''}\nSubtotal (ex. VAT): ${fmt(subtotal)}\n${discount && discount > 0 ? `Discount: -${fmt(discount)}\n` : ''}VAT (20%): ${fmt(vat)}\nTotal (inc. VAT): ${fmt(totalAfterDiscount)}\n\n${customerNote ? `Note from our team: ${customerNote}\n\n` : ''}Call us: 0151 203 8500\n\nMobile Tyre Van City\n5–7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
  });
}

// ── Quote confirmation: admin manually triggers after reviewing ───────────────
export async function sendQuoteConfirmationEmail({
  to,
  customerName,
  quoteId,
  confirmationUrl,
  totalPrice,
  discount,
  customerNotes,
}: {
  to: string;
  customerName: string;
  quoteId: string;
  confirmationUrl: string;
  totalPrice: number;
  discount?: number;
  customerNotes?: string;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const ref = quoteId.slice(0, 8).toUpperCase();
  const savings = discount ? fmt(discount) : undefined;
  const total = fmt(totalPrice);

  const html = await render(
    React.createElement(QuoteProposal, {
      customerName,
      reference: ref,
      subtotal: total,
      vat: '—',
      total,
      discount: savings,
      customerNote: customerNotes,
      ctaUrl: confirmationUrl,
    }),
  );

  await client.emails.send({
    to,
    from: fromEmail,
    subject: `Your Van Conversion Quote #${ref} is Ready`,
    html,
    text: `Hi ${customerName},\n\nYour Van Conversion Quote #${ref} is Ready!\n\nTotal Price: ${total} (Including VAT)\n${savings ? `Special Discount Applied - You Save ${savings}!\n` : ''}\n${customerNotes ? `Note from our team:\n${customerNotes}\n\n` : ''}To confirm your quote visit:\n${confirmationUrl}\n\nCall us: 0151 203 8500\n\nMobile Tyre Van City\n5–7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
  });
}

// ── Finance submission email: sent to finance company by admin ────────────────
export async function sendFinanceSubmissionEmail({
  financeCompanyEmail,
  customerName,
  customerPhone,
  customerEmail,
  quoteId,
  vanTitle,
  vanRegistration,
  vanMileage,
  kitName,
  upgradeNames,
  subtotal,
  vat,
  total,
  discount,
  financeDetails,
}: {
  financeCompanyEmail: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  quoteId: string;
  vanTitle?: string | null;
  vanRegistration?: string | null;
  vanMileage?: number | null;
  kitName?: string | null;
  upgradeNames?: string[];
  subtotal: number;
  vat: number;
  total: number;
  discount?: number;
  financeDetails?: {
    planType: string;
    apr: number;
    depositAmount: number;
    termMonths: number;
    monthlyPayment: number;
    weeklyPayment: number;
  };
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const ref = quoteId.slice(0, 8).toUpperCase();
  const totalAfterDiscount = discount && discount > 0 ? total - discount : total;

  const html = await render(
    React.createElement(FinanceFollowUp, {
      customerName,
      customerPhone,
      customerEmail,
      reference: ref,
      vanTitle,
      vanRegistration,
      vanMileage,
      kitName,
      upgradeNames,
      subtotal: fmt(subtotal),
      vat: fmt(vat),
      total: fmt(totalAfterDiscount),
      discount: discount && discount > 0 ? `-${fmt(discount)}` : undefined,
      financeDetails: financeDetails
        ? {
            planType: financeDetails.planType,
            apr: `${financeDetails.apr.toFixed(2)}%`,
            depositAmount: fmt(financeDetails.depositAmount),
            termMonths: financeDetails.termMonths,
            monthlyPayment: fmt(financeDetails.monthlyPayment),
            weeklyPayment: fmt(financeDetails.weeklyPayment),
          }
        : undefined,
    }),
  );

  const financeText = financeDetails
    ? `\nFinance Details:\nPlan Type: ${financeDetails.planType}\nAPR: ${financeDetails.apr.toFixed(2)}%\nDeposit: ${fmt(financeDetails.depositAmount)}\nTerm: ${financeDetails.termMonths} months\nMonthly Payment: ${fmt(financeDetails.monthlyPayment)}\nWeekly Payment: ${fmt(financeDetails.weeklyPayment)}\n`
    : '';

  const emailText = `Finance Application – Ref #${ref}\n\nCustomer Details:\nName: ${customerName}\nPhone: ${customerPhone}\nEmail: ${customerEmail}\n\nVehicle Details:\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${vanRegistration ? `Registration: ${vanRegistration.toUpperCase()}\n` : ''}${vanMileage != null ? `Mileage: ${vanMileage.toLocaleString('en-GB')} miles\n` : ''}\nConversion Specification:\n${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? upgradeNames.map(u => `Upgrade: ${u}`).join('\n') + '\n' : ''}\nPricing:\nSubtotal (ex. VAT): ${fmt(subtotal)}\n${discount && discount > 0 ? `Discount: -${fmt(discount)}\n` : ''}VAT (20%): ${fmt(vat)}\nTotal (inc. VAT): ${fmt(totalAfterDiscount)}\n${financeText}\nMobile Tyre Van City | 0151 203 8500\n5–7 Bassendale Road, Bromborough, Wirral, CH62 3QL`;

  await client.emails.send({
    to: financeCompanyEmail,
    cc: ['carl@geg.co'],
    from: fromEmail,
    replyTo: [fromEmail],
    subject: `Finance Application – ${customerName} – ${fmt(totalAfterDiscount)} – Ref #${ref}`,
    html,
    text: emailText,
  });
}
