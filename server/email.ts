import { Resend } from 'resend';

const INTERNAL_NOTIFY_EMAILS = ['carl@geg.co', 'graham@wirralvans.co.uk', 'sharon@geg.co', 'info@gfukgroup.co.uk'];

let connectionSettings: any;

async function getCredentials() {
  // Prefer the directly-stored API key (works with verified domain)
  if (process.env.RESEND_API_KEY) {
    return {
      apiKey: process.env.RESEND_API_KEY,
      fromEmail: 'Mobile Tyre Van City <noreply@mobiletyrevancity.co.uk>',
    };
  }

  // Fallback: use Replit connector
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: 'Mobile Tyre Van City <noreply@mobiletyrevancity.co.uk>',
  };
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

// ── Existing: send quote confirmation (admin manually triggers this) ──────────
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

  const formattedTotal = `£${(totalPrice / 100).toLocaleString()}`;
  const savings = discount ? `£${(discount / 100).toLocaleString()}` : null;

  await client.emails.send({
    to,
    from: fromEmail,
    subject: `Your Van Conversion Quote #${quoteId.slice(0, 8).toUpperCase()} is Ready`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #191919; color: white; padding: 30px; text-align: center; }
    .header h1 { color: #8bc440; margin: 0; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .price-box { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: block; max-width: 280px; margin: 20px auto; background-color: #8bc440; color: #191919; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; text-align: center; box-sizing: border-box; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .savings { background-color: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; margin: 15px 0; font-weight: bold; }
    .notes { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .header { padding: 24px 16px !important; }
      .content { padding: 20px 16px !important; }
      .button { max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Thank you for requesting a quote for your mobile tyre van conversion. We've reviewed your configuration and are pleased to present your custom quote.</p>
      <div class="price-box">
        <h2 style="margin-top: 0;">Quote #${quoteId.slice(0, 8).toUpperCase()}</h2>
        ${savings ? `<div class="savings">Special Discount Applied - You Save ${savings}!</div>` : ''}
        <p style="font-size: 28px; font-weight: bold; color: #8bc440; margin: 10px 0;">${formattedTotal}</p>
        <p style="color: #6b7280; margin: 0;">Including VAT</p>
      </div>
      ${customerNotes ? `
      <div class="notes">
        <h3 style="margin-top: 0; color: #1e40af;">Note from our team:</h3>
        <p style="margin: 0; white-space: pre-wrap;">${customerNotes}</p>
      </div>
      ` : ''}
      <p>To proceed with your order, please review and confirm your quote by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${confirmationUrl}" class="button">Review &amp; Confirm Quote</a>
      </div>
      <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
        This confirmation link is for one-time use and will expire after confirmation.
      </p>
      <p>If you have any questions, please call us on <strong>0151 203 8500</strong>.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you didn't request this quote, please disregard this email.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Hi ${customerName},\n\nYour Van Conversion Quote #${quoteId.slice(0, 8).toUpperCase()} is Ready!\n\nTotal Price: ${formattedTotal} (Including VAT)\n${savings ? `Special Discount Applied - You Save ${savings}!\n` : ''}\n${customerNotes ? `Note from our team:\n${customerNotes}\n\n` : ''}To confirm your quote visit:\n${confirmationUrl}\n\nCall us: 0151 203 8500\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
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
  approvalToken,
  siteBaseUrl,
  financeInfo,
  comparisonSlotB,
  chosenOption,
  customExtras = [],
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
  approvalToken?: string;
  siteBaseUrl?: string;
  financeInfo?: {
    depositAmount: number;
    termMonths: number;
    monthlyPayment: number;
    weeklyPayment: number;
  } | null;
  comparisonSlotB?: {
    vanTitle?: string | null;
    kitName?: string | null;
    upgradeNames?: string[];
    estSubtotal?: number;
    estVAT?: number;
    estTotal?: number;
    financeInfo?: {
      depositAmount: number;
      termMonths: number;
      monthlyPayment: number;
      weeklyPayment: number;
    } | null;
  } | null;
  chosenOption?: 'A' | 'B' | null;
  customExtras?: Array<{ id: string; description: string; pricePence: number }>;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const ref = quoteId.slice(0, 8).toUpperCase();
  const brandGreen = '#8bc440';
  const brandDark = '#191919';
  const isComparison = !!comparisonSlotB;
  const fmtPence = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const extrasHtmlRow = customExtras && customExtras.length > 0
    ? `<tr><td>Bespoke Extras</td><td><ul style="margin:2px 0;padding-left:18px;">${customExtras.map(e => `<li style="margin-bottom:2px;">${e.description} — ${fmtPence(e.pricePence)}</li>`).join('')}</ul></td></tr>`
    : '';
  const extrasTextBlock = customExtras && customExtras.length > 0
    ? `Bespoke Extras:\n${customExtras.map(e => `  - ${e.description} (${fmtPence(e.pricePence)})`).join('\n')}\n`
    : '';

  const fmt = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const totalAfterDiscount = discount && discount > 0 ? total - discount : total;
  const originalPriceLine = discount && discount > 0
    ? `<tr><td>Original Price (inc. VAT)</td><td>${fmt(total)}</td></tr>`
    : '';
  const discountLine = discount && discount > 0
    ? `<tr><td style="color:#166534;">Discount</td><td style="color:#166534;">-${fmt(discount)}</td></tr>`
    : '';

  const siteBase = siteBaseUrl || process.env.SITE_URL || 'https://www.mobiletyrevancity.co.uk';

  // Build a finance table block
  const financeBlock = (fi: typeof financeInfo) => fi ? `
    <h4 style="margin:12px 0 6px; color:#374151; font-size:13px;">Finance Option (HP — 10.9% APR)</h4>
    <table>
      <tr><td>Deposit</td><td>${fmt(fi.depositAmount)}</td></tr>
      <tr><td>Finance Term</td><td>${fi.termMonths} months${fi.termMonths % 12 === 0 ? ` (${fi.termMonths / 12} year${fi.termMonths / 12 !== 1 ? 's' : ''})` : ''}</td></tr>
      <tr><td>Monthly Payment (est.)</td><td style="font-weight:bold; color:${brandGreen};">${fmt(fi.monthlyPayment)}/month</td></tr>
      <tr><td>Weekly Payment (est.)</td><td>${fmt(fi.weeklyPayment)}/week</td></tr>
    </table>
    <p style="font-size:11px; color:#6b7280; margin-top:-8px;">Estimates based on Hire Purchase at 10.9% APR. Subject to status and final agreement.</p>
  ` : '';

  // ── COMPARISON MODE ────────────────────────────────────────────────────────
  if (isComparison && comparisonSlotB) {
    const slotB = comparisonSlotB;
    const chosenBadge = (opt: 'A' | 'B') =>
      chosenOption === opt
        ? ` <span style="background:${brandGreen};color:${brandDark};font-size:11px;padding:2px 8px;border-radius:4px;font-weight:bold;vertical-align:middle;">CHOSEN</span>`
        : '';

    const optionBlock = (opt: 'A' | 'B', oVanTitle: string | null | undefined, oKitName: string | null | undefined, oUpgradeNames: string[] | undefined, oSubtotal: number, oVAT: number, oTotal: number, oFinance: typeof financeInfo) => {
      const isChosen = chosenOption === opt;
      const borderStyle = isChosen ? `border:2px solid ${brandGreen};` : 'border:1px solid #e5e7eb;';
      const chooseBtn = !chosenOption
        ? `<div style="text-align:center; margin-top:16px;">
            <a href="${siteBase}/api/quotes/${quoteId}/choose-option?option=${opt}"
               style="display:block;max-width:240px;margin:0 auto;background:${brandGreen};color:${brandDark};font-weight:bold;font-size:15px;padding:13px 24px;border-radius:4px;text-decoration:none;text-align:center;box-sizing:border-box;">
              I choose Option ${opt}
            </a>
          </div>`
        : '';
      return `
        <div style="${borderStyle} border-radius:6px; padding:20px; margin-bottom:20px; background:#fff;">
          <p style="font-weight:bold; font-size:15px; margin:0 0 12px; color:${brandDark};">
            Option ${opt}${chosenBadge(opt)}
          </p>
          <table>
            ${oVanTitle ? `<tr><td>Van</td><td>${oVanTitle}</td></tr>` : ''}
            ${oKitName ? `<tr><td>Pack</td><td>${oKitName}</td></tr>` : ''}
            ${oUpgradeNames && oUpgradeNames.length > 0 ? `<tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${oUpgradeNames.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('')}</ul></td></tr>` : ''}
            ${extrasHtmlRow}
            <tr><td>Subtotal (ex. VAT)</td><td>${fmt(oSubtotal)}</td></tr>
            <tr><td>VAT (20%)</td><td>${fmt(oVAT)}</td></tr>
            <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(oTotal)}</td></tr>
          </table>
          ${financeBlock(oFinance)}
          ${chooseBtn}
        </div>`;
    };

    const introText = chosenOption
      ? `You have selected <strong>Option ${chosenOption}</strong> as your final choice. Our team will be in touch shortly to confirm next steps.`
      : `We've prepared two options for you to compare. Please review both below and click the button under the one you'd like to go ahead with — we'll be notified straight away.`;

    const chosenConfirmBlock = chosenOption ? `
      <div style="margin:24px 0; padding:20px; background:#f0fdf4; border:2px solid ${brandGreen}; border-radius:6px; text-align:center;">
        <p style="font-size:16px; font-weight:bold; color:#166534; margin:0 0 6px;">Option ${chosenOption} selected</p>
        <p style="font-size:13px; color:#166534; margin:0;">Our team will be in touch to confirm your order. Call us on <strong>0151 203 8500</strong> if you have any questions.</p>
      </div>` : '';

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; width: 100%; }
    .header { background-color: ${brandDark}; padding: 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 26px; }
    .header p { color: #ccc; margin: 6px 0 0; font-size: 14px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .ref-box { background: #f3f4f6; border-left: 4px solid ${brandGreen}; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; word-break: break-word; }
    td:first-child { color: #6b7280; width: 42%; }
    .total-row td { font-weight: bold; font-size: 15px; border-top: 2px solid ${brandGreen}; border-bottom: none; color: ${brandDark}; }
    .total-row td:last-child { color: ${brandGreen}; }
    .note-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .header { padding: 24px 16px !important; }
      .content { padding: 20px 16px !important; }
      td { padding: 7px 5px !important; }
      td:first-child { width: 44% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
      <p>www.mobiletyrevancity.co.uk</p>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>${introText}</p>
      <div class="ref-box">
        <p><strong>Reference:</strong> #${ref}</p>
        <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
      </div>
      ${chosenConfirmBlock}
      ${optionBlock('A', vanTitle, kitName, upgradeNames, subtotal, vat, totalAfterDiscount, financeInfo ?? null)}
      ${optionBlock('B', slotB.vanTitle, slotB.kitName, slotB.upgradeNames, slotB.estSubtotal ?? 0, slotB.estVAT ?? 0, slotB.estTotal ?? 0, slotB.financeInfo ?? null)}
      ${customerNote ? `<div class="note-box"><strong>Note from our team:</strong><br>${customerNote}</div>` : ''}
      <p>If you have any questions, please call us on <strong>0151 203 8500</strong> or reply to this email.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you did not request this summary, please disregard this email.</p>
    </div>
  </div>
</body>
</html>`;

    const textBody = `Hi ${customerName},\n\n${chosenOption ? `You have selected Option ${chosenOption}.` : 'We have prepared two options for you to compare. Please choose the one you prefer using the links below.'}\n\nReference: #${ref}\n\nOPTION A\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? `Upgrades:\n${upgradeNames.map(u => `  - ${u}`).join('\n')}\n` : ''}${extrasTextBlock}Subtotal: ${fmt(subtotal)}\nVAT: ${fmt(vat)}\nTotal: ${fmt(totalAfterDiscount)}\n${!chosenOption ? `\nChoose Option A: ${siteBase}/api/quotes/${quoteId}/choose-option?option=A\n` : ''}\nOPTION B\n${slotB.vanTitle ? `Van: ${slotB.vanTitle}\n` : ''}${slotB.kitName ? `Pack: ${slotB.kitName}\n` : ''}${slotB.upgradeNames && slotB.upgradeNames.length > 0 ? `Upgrades:\n${slotB.upgradeNames.map(u => `  - ${u}`).join('\n')}\n` : ''}${extrasTextBlock}${slotB.estSubtotal != null ? `Subtotal: ${fmt(slotB.estSubtotal)}\n` : ''}${slotB.estVAT != null ? `VAT: ${fmt(slotB.estVAT)}\n` : ''}${slotB.estTotal != null ? `Total: ${fmt(slotB.estTotal)}\n` : ''}${!chosenOption ? `\nChoose Option B: ${siteBase}/api/quotes/${quoteId}/choose-option?option=B\n` : ''}\n${customerNote ? `\nNote from our team: ${customerNote}\n` : ''}\nCall us: 0151 203 8500\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`;

    await client.emails.send({
      to,
      from: fromEmail,
      subject: `Your Van Conversion Options – Ref #${ref} – Mobile Tyre Van City`,
      html: htmlBody,
      text: textBody,
    });
    return;
  }

  // ── SINGLE-VAN MODE ────────────────────────────────────────────────────────
  const financeBlockSingle = financeInfo ? `
    <h3 style="margin-bottom:8px; margin-top:24px;">Finance Option (HP — 10.9% APR)</h3>
    <table>
      <tr><td>Deposit</td><td>${fmt(financeInfo.depositAmount)}</td></tr>
      <tr><td>Finance Term</td><td>${financeInfo.termMonths} months${financeInfo.termMonths % 12 === 0 ? ` (${financeInfo.termMonths / 12} year${financeInfo.termMonths / 12 !== 1 ? 's' : ''})` : ''}</td></tr>
      <tr><td>Estimated Monthly Payment</td><td style="font-weight:bold; color:${brandGreen};">${fmt(financeInfo.monthlyPayment)}/month</td></tr>
      <tr><td>Estimated Weekly Payment</td><td>${fmt(financeInfo.weeklyPayment)}/week (approx.)</td></tr>
    </table>
    <p style="font-size:12px; color:#6b7280; margin-top:-8px;">Finance figures are estimates based on Hire Purchase at 10.9% APR. Subject to status and final agreement.</p>
  ` : '';

  const financeText = financeInfo ? `\nFinance Option (HP — 10.9% APR)\nDeposit: ${fmt(financeInfo.depositAmount)}\nTerm: ${financeInfo.termMonths} months\nMonthly payment: ${fmt(financeInfo.monthlyPayment)}\nWeekly payment (approx.): ${fmt(financeInfo.weeklyPayment)}\n` : '';

  const approvalBlock = approvalToken ? `
    <div style="margin: 28px 0; padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; text-align: center;">
      <p style="font-size: 15px; font-weight: bold; margin: 0 0 6px;">Does this look correct?</p>
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">Please let us know whether the spec above is right, or if anything needs changing.</p>
      <a href="${siteBase}/spec-approval/${approvalToken}?status=approved"
         style="display:block; max-width:280px; margin:0 auto 12px; background:${brandGreen}; color:${brandDark}; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:4px; text-align:center; box-sizing:border-box;">
        This looks correct
      </a>
      <a href="${siteBase}/spec-approval/${approvalToken}?status=rejected"
         style="display:block; max-width:280px; margin:0 auto; background:#fff; color:#374151; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:4px; border:1px solid #d1d5db; text-align:center; box-sizing:border-box;">
        Something needs changing
      </a>
    </div>
  ` : '';

  await client.emails.send({
    to,
    from: fromEmail,
    subject: `Your Van Conversion Summary – Ref #${ref} – Mobile Tyre Van City`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; width: 100%; }
    .header { background-color: ${brandDark}; padding: 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 26px; }
    .header p { color: #ccc; margin: 6px 0 0; font-size: 14px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .ref-box { background: #f3f4f6; border-left: 4px solid ${brandGreen}; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; word-break: break-word; }
    td:first-child { color: #6b7280; width: 40%; }
    .total-row td { font-weight: bold; font-size: 18px; border-top: 2px solid ${brandGreen}; border-bottom: none; color: ${brandDark}; }
    .total-row td:last-child { color: ${brandGreen}; }
    .note-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .header { padding: 24px 16px !important; }
      .content { padding: 20px 16px !important; }
      td { padding: 8px 6px !important; }
      td:first-child { width: 45% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
      <p>www.mobiletyrevancity.co.uk</p>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Thank you for speaking with us today. As discussed, please find below a summary of your configured mobile tyre van conversion.</p>
      <div class="ref-box">
        <p><strong>Reference:</strong> #${ref}</p>
        <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
      </div>
      <h3 style="margin-bottom:8px;">Your Configuration</h3>
      <table>
        ${vanTitle ? `<tr><td>Van</td><td>${vanTitle}</td></tr>` : ''}
        ${kitName ? `<tr><td>Pack</td><td>${kitName}</td></tr>` : ''}
        ${upgradeNames && upgradeNames.length > 0 ? `<tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradeNames.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('')}</ul></td></tr>` : ''}
        ${extrasHtmlRow}
      </table>
      <h3 style="margin-bottom:8px;">Pricing</h3>
      <table>
        ${originalPriceLine}
        ${discountLine}
        <tr><td>Subtotal (ex. VAT)</td><td>${fmt(subtotal)}</td></tr>
        <tr><td>VAT (20%)</td><td>${fmt(vat)}</td></tr>
        <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(totalAfterDiscount)}</td></tr>
      </table>
      ${financeBlockSingle}
      ${customerNote ? `<div class="note-box"><strong>Note from our team:</strong><br>${customerNote}</div>` : ''}
      ${approvalBlock}
      <p>If you have any questions or would like to make changes, please call us on <strong>0151 203 8500</strong> or reply to this email.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you did not request this summary, please disregard this email.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Hi ${customerName},\n\nThank you for speaking with us. Here is your van conversion summary.\n\nReference: #${ref}\n\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? `Upgrades:\n${upgradeNames.map(u => `  - ${u}`).join('\n')}\n` : ''}${extrasTextBlock}\n${discount && discount > 0 ? `Original Price (inc. VAT): ${fmt(total)}\nDiscount: -${fmt(discount)}\n` : ''}Subtotal (ex. VAT): ${fmt(subtotal)}\nVAT (20%): ${fmt(vat)}\nTotal (inc. VAT): ${fmt(totalAfterDiscount)}\n${financeText}\n${customerNote ? `Note from our team: ${customerNote}\n\n` : ''}${approvalToken ? `Does this look correct? Visit: ${siteBase}/spec-approval/${approvalToken}\n\n` : ''}Call us: 0151 203 8500\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
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
  kitPrice,
  upgrades,
  upgradeNames,
  subtotal,
  vat,
  total,
  discount,
  customExtras = [],
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
  kitPrice?: number | null;
  upgrades?: Array<{ name: string; price: number }>;
  upgradeNames?: string[]; // legacy fallback
  subtotal: number;
  vat: number;
  total: number;
  discount?: number;
  customExtras?: Array<{ id: string; description: string; pricePence: number }>;
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
  const brandGreen = '#8bc440';
  const brandDark = '#191919';

  const fmt = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const totalAfterDiscount = discount && discount > 0 ? total - discount : total;
  const originalPriceLine = discount && discount > 0
    ? `<tr><td>Original Price (inc. VAT)</td><td>${fmt(total)}</td></tr>`
    : '';
  const discountLine = discount && discount > 0
    ? `<tr><td style="color:#166534;">Discount</td><td style="color:#166534;">-${fmt(discount)}</td></tr>`
    : '';

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 650px; margin: 0 auto; width: 100%; }
    .header { background-color: ${brandDark}; padding: 28px 30px; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 24px; }
    .header p { color: #ccc; margin: 4px 0 0; font-size: 13px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .section-title { font-size: 14px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid ${brandGreen}; padding-bottom: 6px; margin: 24px 0 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; word-break: break-word; }
    td:first-child { color: #6b7280; width: 40%; font-weight: 500; }
    .total-row td { font-weight: bold; font-size: 17px; border-top: 2px solid ${brandGreen}; border-bottom: none; }
    .total-row td:last-child { color: ${brandGreen}; }
    .footer { text-align: center; padding: 18px; color: #9ca3af; font-size: 12px; }
    .ref-pill { display: inline-block; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 12px; font-family: monospace; font-size: 14px; font-weight: bold; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .header { padding: 20px 16px !important; }
      .content { padding: 20px 16px !important; }
      td { padding: 8px 6px !important; }
      td:first-child { width: 45% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
      <p>Finance Application – Ref <span style="color:${brandGreen};">#${ref}</span></p>
    </div>
    <div class="content">
      <p>Please find below the details for a finance application from one of our customers who would like to proceed with a van conversion.</p>

      <div class="section-title">Customer Details</div>
      <table>
        <tr><td>Name</td><td>${customerName}</td></tr>
        <tr><td>Phone</td><td>${customerPhone}</td></tr>
        <tr><td>Email</td><td><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
        <tr><td>Reference</td><td><span class="ref-pill">#${ref}</span></td></tr>
      </table>

      <div class="section-title">Vehicle Details</div>
      <table>
        ${vanTitle ? `<tr><td>Van</td><td>${vanTitle}</td></tr>` : ''}
        ${vanRegistration ? `<tr><td>Registration</td><td><strong>${vanRegistration.toUpperCase()}</strong></td></tr>` : ''}
        ${vanMileage !== undefined && vanMileage !== null ? `<tr><td>Mileage</td><td>${vanMileage.toLocaleString('en-GB')} miles</td></tr>` : ''}
      </table>

      <div class="section-title">Conversion Specification (ex. VAT)</div>
      <table>
        ${(() => {
          const effectiveUpgrades = upgrades ?? (upgradeNames ? upgradeNames.map(n => ({ name: n, price: 0 })) : []);
          const rows: string[] = [];
          if (kitName) {
            const kitPriceStr = kitPrice != null ? `<span style="float:right;font-weight:600;">${fmt(kitPrice)}</span>` : '';
            rows.push(`<tr><td style="color:#111;font-weight:500;">Equipment Pack</td><td>${kitName}${kitPriceStr}</td></tr>`);
          }
          for (const u of effectiveUpgrades) {
            const priceStr = u.price > 0 ? `<span style="float:right;font-weight:600;">${fmt(u.price)}</span>` : '';
            rows.push(`<tr><td style="color:#111;font-weight:500;">Upgrade</td><td>${u.name}${priceStr}</td></tr>`);
          }
          for (const e of (customExtras || [])) {
            rows.push(`<tr><td style="color:#111;font-weight:500;">Bespoke Extra</td><td>${e.description}<span style="float:right;font-weight:600;">${fmt(e.pricePence)}</span></td></tr>`);
          }
          return rows.join('');
        })()}
      </table>

      <div class="section-title">Pricing</div>
      <table>
        ${originalPriceLine}
        ${discountLine}
        <tr><td>Subtotal (ex. VAT)</td><td>${fmt(subtotal)}</td></tr>
        <tr><td>VAT (20%)</td><td>${fmt(vat)}</td></tr>
        <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(totalAfterDiscount)}</td></tr>
      </table>

${financeDetails ? `
      <div class="section-title">Finance Details</div>
      <table>
        <tr><td>Plan Type</td><td>${financeDetails.planType}</td></tr>
        <tr><td>APR</td><td>${financeDetails.apr.toFixed(2)}%</td></tr>
        <tr><td>Deposit</td><td>${fmt(financeDetails.depositAmount)}</td></tr>
        <tr><td>Term</td><td>${financeDetails.termMonths} months</td></tr>
        <tr><td>Monthly Payment</td><td>${fmt(financeDetails.monthlyPayment)}</td></tr>
        <tr><td>Weekly Payment</td><td>${fmt(financeDetails.weeklyPayment)}</td></tr>
      </table>
` : ''}
      <p style="margin-top:24px;">Please contact the customer directly to progress the finance application. If you have any questions, please reply to this email or call us on <strong>0151 203 8500</strong>.</p>
      <p>Kind regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL<br>0151 203 8500</p>
    </div>
    <div class="footer">
      Sent on behalf of Mobile Tyre Van City &bull; www.mobiletyrevancity.co.uk
    </div>
  </div>
</body>
</html>`;

  const financeText = financeDetails ? `\nFinance Details:\nPlan Type: ${financeDetails.planType}\nAPR: ${financeDetails.apr.toFixed(2)}%\nDeposit: ${fmt(financeDetails.depositAmount)}\nTerm: ${financeDetails.termMonths} months\nMonthly Payment: ${fmt(financeDetails.monthlyPayment)}\nWeekly Payment: ${fmt(financeDetails.weeklyPayment)}\n` : '';

  const effectiveUpgradesText = upgrades ?? (upgradeNames ? upgradeNames.map(n => ({ name: n, price: 0 })) : []);
  const specLines: string[] = [];
  if (kitName) specLines.push(`  - Equipment Pack: ${kitName}${kitPrice != null ? ` (${fmt(kitPrice)} ex. VAT)` : ''}`);
  for (const u of effectiveUpgradesText) specLines.push(`  - Upgrade: ${u.name}${u.price > 0 ? ` (${fmt(u.price)} ex. VAT)` : ''}`);
  for (const e of (customExtras || [])) specLines.push(`  - Bespoke Extra: ${e.description} (${fmt(e.pricePence)} ex. VAT)`);
  const specText = specLines.length > 0 ? `Conversion Specification (ex. VAT):\n${specLines.join('\n')}\n` : '';

  const emailText = `Finance Application – Ref #${ref}\n\nCustomer Details:\nName: ${customerName}\nPhone: ${customerPhone}\nEmail: ${customerEmail}\n\nVehicle Details:\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${vanRegistration ? `Registration: ${vanRegistration.toUpperCase()}\n` : ''}${vanMileage !== undefined && vanMileage !== null ? `Mileage: ${vanMileage.toLocaleString('en-GB')} miles\n` : ''}\n${specText}\nPricing:\n${discount && discount > 0 ? `Original Price (inc. VAT): ${fmt(total)}\nDiscount: -${fmt(discount)}\n` : ''}Subtotal (ex. VAT): ${fmt(subtotal)}\nVAT (20%): ${fmt(vat)}\nTotal (inc. VAT): ${fmt(totalAfterDiscount)}\n${financeText}\nMobile Tyre Van City | 0151 203 8500\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`;

  await client.emails.send({
    to: financeCompanyEmail,
    cc: ['carl@geg.co'],
    from: fromEmail,
    replyTo: [fromEmail],
    subject: `Finance Application – ${customerName} – ${fmt(totalAfterDiscount)} – Ref #${ref}`,
    html: emailHtml,
    text: emailText,
  });
}

// ── Enquiry received: customer confirmation + admin notification ──────────────

export async function sendQuoteReceivedEmails({
  quote,
  vanTitle,
  kitName,
  upgradeNames,
  customExtras = [],
  comparisonSlotB,
  financeInfoA,
  financeInfoB,
  chosenOption,
  baseUrl,
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
    estDiscount?: number | null;
  };
  vanTitle?: string | null;
  kitName?: string | null;
  upgradeNames?: string[];
  customExtras?: Array<{ id: string; description: string; pricePence: number }>;
  comparisonSlotB?: {
    vanTitle?: string | null;
    kitName?: string | null;
    upgradeNames?: string[];
    estSubtotal?: number;
    estVAT?: number;
    estTotal?: number;
  } | null;
  /** Finance illustration for Option A (only shown in compare mode) */
  financeInfoA?: {
    depositAmount: number;
    termMonths: number;
    monthlyPayment: number;
    weeklyPayment: number;
  };
  /** Finance illustration for Option B (only shown in compare mode) */
  financeInfoB?: {
    depositAmount: number;
    termMonths: number;
    monthlyPayment: number;
    weeklyPayment: number;
  };
  /** When set, highlights the chosen option in the comparison sections */
  chosenOption?: 'A' | 'B' | null;
  /** Base URL for the choose-option links in comparison emails (e.g. https://mobiletyrevancity.co.uk) */
  baseUrl?: string;
}) {
  const { client, fromEmail } = await getUncachableResendClient();

  const ref = quote.id.slice(0, 8).toUpperCase();
  const discountAmountPence = quote.estDiscount || 0;
  const fmt = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const total = fmt(quote.estTotal);
  const subtotal = fmt(quote.estSubtotal);
  const vat = fmt(quote.estVAT);
  const originalTotal = discountAmountPence > 0 ? fmt(quote.estTotal + discountAmountPence) : null;
  const discountFmt = discountAmountPence > 0 ? fmt(discountAmountPence) : null;

  const brandGreen = '#8bc440';
  const brandDark = '#191919';

  const qrExtrasHtmlRow = customExtras && customExtras.length > 0
    ? `<tr><td>Bespoke Extras</td><td><ul style="margin:2px 0;padding-left:18px;">${customExtras.map(e => `<li style="margin-bottom:2px;">${e.description} — £${(e.pricePence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</li>`).join('')}</ul></td></tr>`
    : '';
  const qrExtrasTextBlock = customExtras && customExtras.length > 0
    ? `Bespoke Extras:\n${customExtras.map(e => `  - ${e.description} (£${(e.pricePence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })})`).join('\n')}\n`
    : '';

  // 1. Customer confirmation
  await client.emails.send({
    to: quote.email,
    from: fromEmail,
    subject: `We've received your enquiry – Ref #${ref}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; width: 100%; }
    .header { background-color: ${brandDark}; padding: 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 26px; }
    .header p { color: #ccc; margin: 6px 0 0; font-size: 14px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .ref-box { background: #f3f4f6; border-left: 4px solid ${brandGreen}; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
    .ref-box p { margin: 0; }
    .summary { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .summary td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; word-break: break-word; }
    .summary td:first-child { color: #6b7280; width: 40%; }
    .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid ${brandGreen}; border-bottom: none; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .header { padding: 24px 16px !important; }
      .content { padding: 20px 16px !important; }
      .summary td { padding: 8px 6px !important; }
      .summary td:first-child { width: 42% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
      <p>www.mobiletyrevancity.co.uk</p>
    </div>
    <div class="content">
      <p>Hi ${quote.userName},</p>
      <p>Thank you for completing our van configurator. We've received your enquiry and one of our team will be in touch within 24 hours to discuss your requirements.</p>
      <div class="ref-box">
        <p><strong>Your reference number:</strong> #${ref}</p>
        <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
      </div>
      <h3 style="margin-bottom: 8px;">Your Configuration Summary</h3>
      ${comparisonSlotB ? `<p style="font-size:13px;color:#6b7280;margin-bottom:8px;">You submitted two options for our team to compare. Both are shown below.${chosenOption ? ` <strong>Option ${chosenOption}</strong> has been selected as your final choice.` : ' If you already know which option you prefer, you can select it using the button below each option and we\'ll be notified straight away.'}</p>` : ''}
      ${comparisonSlotB
        ? `<p style="font-weight:bold;font-size:14px;margin-bottom:4px;color:#191919;">Option A${chosenOption === 'A' ? ' <span style="background:#8bc440;color:#191919;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:bold;vertical-align:middle;">CHOSEN</span>' : ''}</p>`
        : ''}
      <table class="summary" style="${comparisonSlotB && chosenOption === 'A' ? 'border:2px solid #8bc440;border-radius:4px;' : ''}">
        ${vanTitle ? `<tr><td>Van</td><td>${vanTitle}</td></tr>` : ''}
        ${kitName ? `<tr><td>Pack</td><td>${kitName}</td></tr>` : ''}
        ${upgradeNames && upgradeNames.length > 0 ? `<tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradeNames.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('')}</ul></td></tr>` : ''}
        ${qrExtrasHtmlRow}
        <tr><td>Subtotal</td><td>${subtotal}</td></tr>
        <tr><td>VAT (20%)</td><td>${vat}</td></tr>
        ${originalTotal ? `<tr><td style="color:#6b7280;">Before discount</td><td style="color:#6b7280;text-decoration:line-through;">${originalTotal}</td></tr>` : ''}
        ${discountFmt ? `<tr><td style="color:#166534;font-weight:bold;">Discount</td><td style="color:#166534;font-weight:bold;">-${discountFmt}</td></tr>` : ''}
        <tr class="total-row"><td>Total${discountAmountPence > 0 ? ' (after discount)' : ''}</td><td>${total}</td></tr>
        ${financeInfoA ? `
        <tr><td colspan="2" style="padding-top:12px;padding-bottom:4px;font-weight:bold;font-size:13px;color:#191919;border-top:2px solid #e5e7eb;">Finance Illustration (HP — 10.9% APR)</td></tr>
        <tr><td style="color:#6b7280;">Deposit</td><td>£${(financeInfoA.depositAmount / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td style="color:#6b7280;">Term</td><td>${financeInfoA.termMonths} months${financeInfoA.termMonths % 12 === 0 ? ` (${financeInfoA.termMonths / 12} yr${financeInfoA.termMonths / 12 !== 1 ? 's' : ''})` : ''}</td></tr>
        <tr><td style="color:#6b7280;">Est. Monthly</td><td style="font-weight:bold;color:#8bc440;">£${(financeInfoA.monthlyPayment / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}/month</td></tr>
        <tr><td style="color:#6b7280;">Est. Weekly</td><td>£${(financeInfoA.weeklyPayment / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}/week (approx.)</td></tr>
        ` : ''}
      </table>
      ${comparisonSlotB && !chosenOption && baseUrl ? `
      <div style="text-align:center;margin:12px 0 24px;">
        <a href="${baseUrl}/api/quotes/${quote.id}/choose-option?option=A" style="display:block;max-width:260px;margin:0 auto;background:#8bc440;color:#191919;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:4px;text-decoration:none;text-align:center;box-sizing:border-box;">I choose Option A</a>
      </div>` : ''}
      ${comparisonSlotB ? `
      <p style="font-weight:bold;font-size:14px;margin-top:20px;margin-bottom:4px;color:#191919;">Option B${chosenOption === 'B' ? ' <span style="background:#8bc440;color:#191919;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:bold;vertical-align:middle;">CHOSEN</span>' : ''}</p>
      <table class="summary" style="${chosenOption === 'B' ? 'border:2px solid #8bc440;border-radius:4px;' : ''}">
        ${comparisonSlotB.vanTitle ? `<tr><td>Van</td><td>${comparisonSlotB.vanTitle}</td></tr>` : ''}
        ${comparisonSlotB.kitName ? `<tr><td>Pack</td><td>${comparisonSlotB.kitName}</td></tr>` : ''}
        ${comparisonSlotB.upgradeNames && comparisonSlotB.upgradeNames.length > 0 ? `<tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${comparisonSlotB.upgradeNames.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('')}</ul></td></tr>` : ''}
        ${qrExtrasHtmlRow}
        ${comparisonSlotB.estSubtotal != null ? `<tr><td>Subtotal</td><td>£${(comparisonSlotB.estSubtotal / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>` : ''}
        ${comparisonSlotB.estVAT != null ? `<tr><td>VAT (20%)</td><td>£${(comparisonSlotB.estVAT / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>` : ''}
        ${comparisonSlotB.estTotal != null ? `<tr class="total-row"><td>Total</td><td>£${(comparisonSlotB.estTotal / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>` : ''}
        ${financeInfoB ? `
        <tr><td colspan="2" style="padding-top:12px;padding-bottom:4px;font-weight:bold;font-size:13px;color:#191919;border-top:2px solid #e5e7eb;">Finance Illustration (HP — 10.9% APR)</td></tr>
        <tr><td style="color:#6b7280;">Deposit</td><td>£${(financeInfoB.depositAmount / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td style="color:#6b7280;">Term</td><td>${financeInfoB.termMonths} months${financeInfoB.termMonths % 12 === 0 ? ` (${financeInfoB.termMonths / 12} yr${financeInfoB.termMonths / 12 !== 1 ? 's' : ''})` : ''}</td></tr>
        <tr><td style="color:#6b7280;">Est. Monthly</td><td style="font-weight:bold;color:#8bc440;">£${(financeInfoB.monthlyPayment / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}/month</td></tr>
        <tr><td style="color:#6b7280;">Est. Weekly</td><td>£${(financeInfoB.weeklyPayment / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}/week (approx.)</td></tr>
        ` : ''}
      </table>
      ${!chosenOption && baseUrl ? `
      <div style="text-align:center;margin:12px 0 24px;">
        <a href="${baseUrl}/api/quotes/${quote.id}/choose-option?option=B" style="display:block;max-width:260px;margin:0 auto;background:#8bc440;color:#191919;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:4px;text-decoration:none;text-align:center;box-sizing:border-box;">I choose Option B</a>
      </div>` : ''}
      ` : ''}
      <p>If you have any questions in the meantime, please call us on <strong>0151 203 8500</strong> or reply to this email.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you did not submit this enquiry, please disregard this email.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Hi ${quote.userName},\n\nThank you for completing our van configurator. We've received your enquiry and will be in touch within 24 hours.\n\nReference: #${ref}\n${comparisonSlotB ? `\nOPTION A\n` : ''}${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? `Upgrades:\n${upgradeNames.map(u => `  - ${u}`).join('\n')}\n` : ''}${qrExtrasTextBlock}Subtotal: ${subtotal}\nVAT: ${vat}\n${discountFmt ? `Before discount: ${originalTotal}\nDiscount: -${discountFmt}\n` : ''}Total${discountAmountPence > 0 ? ' (after discount)' : ''}: ${total}\n${financeInfoA ? `Finance (10.9% APR): £${(financeInfoA.monthlyPayment/100).toFixed(2)}/month, £${(financeInfoA.weeklyPayment/100).toFixed(2)}/week (${financeInfoA.termMonths} months, £${(financeInfoA.depositAmount/100).toFixed(0)} deposit)\n` : ''}${comparisonSlotB ? `\nOPTION B\n${comparisonSlotB.vanTitle ? `Van: ${comparisonSlotB.vanTitle}\n` : ''}${comparisonSlotB.kitName ? `Pack: ${comparisonSlotB.kitName}\n` : ''}${qrExtrasTextBlock}${comparisonSlotB.estSubtotal != null ? `Subtotal: £${(comparisonSlotB.estSubtotal/100).toFixed(2)}\n` : ''}${comparisonSlotB.estVAT != null ? `VAT: £${(comparisonSlotB.estVAT/100).toFixed(2)}\n` : ''}${comparisonSlotB.estTotal != null ? `Total: £${(comparisonSlotB.estTotal/100).toFixed(2)}\n` : ''}${financeInfoB ? `Finance (10.9% APR): £${(financeInfoB.monthlyPayment/100).toFixed(2)}/month, £${(financeInfoB.weeklyPayment/100).toFixed(2)}/week (${financeInfoB.termMonths} months, £${(financeInfoB.depositAmount/100).toFixed(0)} deposit)\n` : ''}` : ''}\nCall us: 0151 203 8500\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
  });

  // 2. Admin notification
  await client.emails.send({
    to: INTERNAL_NOTIFY_EMAILS,
    from: fromEmail,
    subject: `New configurator submission – ${quote.userName} – ${total} – Ref #${ref}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; width: 100%; box-sizing: border-box; }
    h2 { color: ${brandDark}; border-bottom: 3px solid ${brandGreen}; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; word-break: break-word; }
    td:first-child { font-weight: bold; color: #6b7280; width: 35%; }
    .total td { font-weight: bold; font-size: 16px; border-top: 2px solid ${brandGreen}; }
    @media screen and (max-width: 600px) {
      .container { padding: 14px !important; }
      td { padding: 8px 6px !important; }
      td:first-child { width: 40% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>New Configurator Submission</h2>
    <h3>Customer Details</h3>
    <table>
      <tr><td>Name</td><td>${quote.userName}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${quote.email}">${quote.email}</a></td></tr>
      <tr><td>Phone</td><td>${quote.phone}</td></tr>
      ${quote.company ? `<tr><td>Company</td><td>${quote.company}</td></tr>` : ''}
      <tr><td>Reference</td><td>#${ref}</td></tr>
    </table>
    <h3>${comparisonSlotB ? 'Option A — ' : ''}Configuration</h3>
    <table>
      ${vanTitle ? `<tr><td>Van</td><td>${vanTitle}</td></tr>` : ''}
      ${kitName ? `<tr><td>Pack</td><td>${kitName}</td></tr>` : ''}
      ${upgradeNames && upgradeNames.length > 0 ? `<tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradeNames.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('')}</ul></td></tr>` : ''}
      <tr><td>Subtotal</td><td>${subtotal}</td></tr>
      <tr><td>VAT (20%)</td><td>${vat}</td></tr>
      <tr class="total"><td>Total</td><td>${total}</td></tr>
      ${financeInfoA ? `<tr><td>Monthly (10.9% APR)</td><td style="color:#8bc440;font-weight:bold;">£${(financeInfoA.monthlyPayment/100).toLocaleString('en-GB',{minimumFractionDigits:2})}/month</td></tr><tr><td>Weekly</td><td>£${(financeInfoA.weeklyPayment/100).toLocaleString('en-GB',{minimumFractionDigits:2})}/week approx.</td></tr>` : ''}
    </table>
    ${comparisonSlotB ? `
    <h3>Option B — Configuration</h3>
    <table>
      ${comparisonSlotB.vanTitle ? `<tr><td>Van</td><td>${comparisonSlotB.vanTitle}</td></tr>` : ''}
      ${comparisonSlotB.kitName ? `<tr><td>Pack</td><td>${comparisonSlotB.kitName}</td></tr>` : ''}
      ${comparisonSlotB.upgradeNames && comparisonSlotB.upgradeNames.length > 0 ? `<tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${comparisonSlotB.upgradeNames.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('')}</ul></td></tr>` : ''}
      ${comparisonSlotB.estSubtotal != null ? `<tr><td>Subtotal</td><td>£${(comparisonSlotB.estSubtotal/100).toLocaleString('en-GB',{minimumFractionDigits:2})}</td></tr>` : ''}
      ${comparisonSlotB.estVAT != null ? `<tr><td>VAT (20%)</td><td>£${(comparisonSlotB.estVAT/100).toLocaleString('en-GB',{minimumFractionDigits:2})}</td></tr>` : ''}
      ${comparisonSlotB.estTotal != null ? `<tr class="total"><td>Total</td><td>£${(comparisonSlotB.estTotal/100).toLocaleString('en-GB',{minimumFractionDigits:2})}</td></tr>` : ''}
      ${financeInfoB ? `<tr><td>Monthly (10.9% APR)</td><td style="color:#8bc440;font-weight:bold;">£${(financeInfoB.monthlyPayment/100).toLocaleString('en-GB',{minimumFractionDigits:2})}/month</td></tr><tr><td>Weekly</td><td>£${(financeInfoB.weeklyPayment/100).toLocaleString('en-GB',{minimumFractionDigits:2})}/week approx.</td></tr>` : ''}
    </table>` : ''}
  </div>
</body>
</html>`,
    text: `New configurator submission\n\nName: ${quote.userName}\nEmail: ${quote.email}\nPhone: ${quote.phone}\n${quote.company ? `Company: ${quote.company}\n` : ''}Reference: #${ref}\n${comparisonSlotB ? '\nOPTION A\n' : ''}${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? `Upgrades:\n${upgradeNames.map(u => `  - ${u}`).join('\n')}\n` : ''}Subtotal: ${subtotal}\nVAT: ${vat}\nTotal: ${total}${financeInfoA ? `\nMonthly (10.9% APR): £${(financeInfoA.monthlyPayment/100).toFixed(2)}/month, £${(financeInfoA.weeklyPayment/100).toFixed(2)}/week` : ''}${comparisonSlotB ? `\n\nOPTION B\n${comparisonSlotB.vanTitle ? `Van: ${comparisonSlotB.vanTitle}\n` : ''}${comparisonSlotB.kitName ? `Pack: ${comparisonSlotB.kitName}\n` : ''}${comparisonSlotB.estSubtotal != null ? `Subtotal: £${(comparisonSlotB.estSubtotal/100).toFixed(2)}\n` : ''}${comparisonSlotB.estVAT != null ? `VAT: £${(comparisonSlotB.estVAT/100).toFixed(2)}\n` : ''}${comparisonSlotB.estTotal != null ? `Total: £${(comparisonSlotB.estTotal/100).toFixed(2)}\n` : ''}${financeInfoB ? `Monthly (10.9% APR): £${(financeInfoB.monthlyPayment/100).toFixed(2)}/month, £${(financeInfoB.weeklyPayment/100).toFixed(2)}/week` : ''}` : ''}`,
  });
}

// ── Customer chose an option from a comparison quote ─────────────────────────

export async function sendOptionChosenAdminNotification({
  quoteId,
  customerName,
  customerEmail,
  customerPhone,
  chosenOption,
  optionDetails,
}: {
  quoteId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  chosenOption: 'A' | 'B';
  optionDetails: {
    vanTitle?: string | null;
    kitName?: string | null;
    upgradeNames?: string[];
    estTotal?: number;
  };
}) {
  const { client, fromEmail } = await getUncachableResendClient();

  const ref = quoteId.slice(0, 8).toUpperCase();
  const brandGreen = '#8bc440';
  const brandDark = '#191919';
  const totalStr = optionDetails.estTotal != null
    ? `£${(optionDetails.estTotal / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
    : null;

  await client.emails.send({
    to: INTERNAL_NOTIFY_EMAILS,
    from: fromEmail,
    subject: `Customer chose Option ${chosenOption} – ${customerName} – Ref #${ref}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: ${brandDark}; padding: 24px 30px; border-radius: 4px 4px 0 0; }
    .header h2 { color: ${brandGreen}; margin: 0; font-size: 20px; }
    .header p { color: #ccc; margin: 4px 0 0; font-size: 13px; }
    .body { background: #fff; padding: 24px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 4px 4px; }
    .badge { display: inline-block; background: ${brandGreen}; color: ${brandDark}; font-weight: bold; font-size: 13px; padding: 4px 14px; border-radius: 4px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    td:first-child { font-weight: bold; color: #6b7280; width: 35%; }
    .total td { font-weight: bold; font-size: 15px; border-top: 2px solid ${brandGreen}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Customer Option Selection</h2>
      <p>A customer has chosen their preferred option from a comparison quote.</p>
    </div>
    <div class="body">
      <p class="badge">Option ${chosenOption} Selected</p>
      <h3 style="margin-top:0;">Customer Details</h3>
      <table>
        <tr><td>Name</td><td>${customerName}</td></tr>
        <tr><td>Email</td><td><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
        <tr><td>Phone</td><td>${customerPhone}</td></tr>
        <tr><td>Reference</td><td>#${ref}</td></tr>
      </table>
      <h3>Chosen Configuration (Option ${chosenOption})</h3>
      <table>
        ${optionDetails.vanTitle ? `<tr><td>Van</td><td>${optionDetails.vanTitle}</td></tr>` : ''}
        ${optionDetails.kitName ? `<tr><td>Pack</td><td>${optionDetails.kitName}</td></tr>` : ''}
        ${optionDetails.upgradeNames && optionDetails.upgradeNames.length > 0 ? `<tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${optionDetails.upgradeNames.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('')}</ul></td></tr>` : ''}
        ${totalStr ? `<tr class="total"><td>Total (inc. VAT)</td><td>${totalStr}</td></tr>` : ''}
      </table>
      <p style="margin-top:16px;font-size:13px;color:#6b7280;">Log in to the admin panel to view the full quote and continue the build process.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Customer Option Selection\n\nA customer has selected Option ${chosenOption} from their comparison quote.\n\nName: ${customerName}\nEmail: ${customerEmail}\nPhone: ${customerPhone}\nReference: #${ref}\n${optionDetails.vanTitle ? `Van: ${optionDetails.vanTitle}\n` : ''}${optionDetails.kitName ? `Pack: ${optionDetails.kitName}\n` : ''}${optionDetails.upgradeNames && optionDetails.upgradeNames.length > 0 ? `Upgrades:\n${optionDetails.upgradeNames.map(u => `  - ${u}`).join('\n')}\n` : ''}${totalStr ? `Total: ${totalStr}\n` : ''}`,
  });
}

export async function sendLeadReceivedEmails(lead: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
}) {
  const { client, fromEmail } = await getUncachableResendClient();

  const ref = lead.id.slice(0, 8).toUpperCase();
  const brandGreen = '#8bc440';
  const brandDark = '#191919';

  // 1. Customer confirmation
  await client.emails.send({
    to: lead.email,
    from: fromEmail,
    subject: `We've received your enquiry – Mobile Tyre Van City`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: ${brandDark}; padding: 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 26px; }
    .header p { color: #ccc; margin: 6px 0 0; font-size: 14px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .ref-box { background: #f3f4f6; border-left: 4px solid ${brandGreen}; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
      <p>www.mobiletyrevancity.co.uk</p>
    </div>
    <div class="content">
      <p>Hi ${lead.name},</p>
      <p>Thank you for getting in touch with Mobile Tyre Van City. We've received your enquiry and one of our team will be in touch with you shortly.</p>
      <div class="ref-box">
        <p><strong>Your reference number:</strong> #${ref}</p>
        <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
      </div>
      ${lead.message ? `<p><strong>Your message:</strong><br><em>"${lead.message}"</em></p>` : ''}
      <p>If you need to speak to us urgently, please call <strong>0151 203 8500</strong>.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you did not submit this enquiry, please disregard this email.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Hi ${lead.name},\n\nThank you for getting in touch. We've received your enquiry and will be in touch shortly.\n\nReference: #${ref}\n${lead.message ? `Your message: "${lead.message}"\n` : ''}\nCall us: 0151 203 8500\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
  });

  // 2. Admin notification
  await client.emails.send({
    to: INTERNAL_NOTIFY_EMAILS,
    from: fromEmail,
    subject: `New enquiry – ${lead.name}${lead.phone ? ` – ${lead.phone}` : ''} – Ref #${ref}`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h2 { color: ${brandDark}; border-bottom: 3px solid ${brandGreen}; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    td:first-child { font-weight: bold; color: #6b7280; width: 35%; }
    .message-box { background: #f9fafb; padding: 15px; border-radius: 4px; border-left: 4px solid ${brandGreen}; margin-top: 16px; white-space: pre-wrap; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>New Enquiry Received</h2>
    <table>
      <tr><td>Name</td><td>${lead.name}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${lead.email}">${lead.email}</a></td></tr>
      ${lead.phone ? `<tr><td>Phone</td><td>${lead.phone}</td></tr>` : ''}
      <tr><td>Reference</td><td>#${ref}</td></tr>
    </table>
    ${lead.message ? `<p><strong>Message:</strong></p><div class="message-box">${lead.message}</div>` : '<p><em>No message provided.</em></p>'}
  </div>
</body>
</html>`,
    text: `New enquiry\n\nName: ${lead.name}\nEmail: ${lead.email}\n${lead.phone ? `Phone: ${lead.phone}\n` : ''}Reference: #${ref}\n${lead.message ? `\nMessage:\n${lead.message}` : ''}`,
  });
}

export async function sendNewUserWelcomeEmail({
  toEmail,
  firstName,
  username,
  password,
  loginUrl,
}: {
  toEmail: string;
  firstName?: string | null;
  username: string;
  password: string;
  loginUrl: string;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const brandGreen = '#8bc440';
  const brandDark = '#191919';
  const displayName = firstName || username;

  await client.emails.send({
    to: toEmail,
    from: fromEmail,
    subject: `Your Mobile Tyre Van City account has been created`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: ${brandDark}; padding: 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 26px; }
    .header p { color: #ccc; margin: 6px 0 0; font-size: 14px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .credentials-box { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 20px 24px; margin: 20px 0; }
    .credentials-box table { width: 100%; border-collapse: collapse; }
    .credentials-box td { padding: 6px 0; font-size: 15px; }
    .credentials-box td:first-child { color: #6b7280; width: 38%; font-weight: 500; }
    .credentials-box td:last-child { font-weight: bold; font-family: monospace; font-size: 15px; }
    .cta-btn { display: block; max-width: 240px; margin: 16px auto; background-color: ${brandGreen}; color: #191919; text-decoration: none; padding: 13px 28px; border-radius: 4px; font-weight: bold; font-size: 15px; text-align: center; box-sizing: border-box; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .header { padding: 24px 16px !important; }
      .content { padding: 20px 16px !important; }
      .cta-btn { max-width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
      <p>www.mobiletyrevancity.co.uk</p>
    </div>
    <div class="content">
      <p>Hi ${displayName},</p>
      <p>An account has been created for you on the Mobile Tyre Van City portal. You can use the details below to sign in.</p>
      <div class="credentials-box">
        <table>
          <tr><td>Username</td><td>${username}</td></tr>
          <tr><td>Password</td><td>${password}</td></tr>
        </table>
      </div>
      <a href="${loginUrl}" class="cta-btn">Sign In Now</a>
      <p style="color:#6b7280; font-size:13px;">For your security, we recommend changing your password after your first login. If you have any trouble accessing your account, please call us on <strong>0151 203 8500</strong> or reply to this email.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you did not expect this email, please contact us immediately on 0151 203 8500.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Hi ${displayName},\n\nAn account has been created for you on the Mobile Tyre Van City portal.\n\nUsername: ${username}\nPassword: ${password}\n\nSign in at: ${loginUrl}\n\nFor your security, we recommend changing your password after your first login.\n\nIf you need help, call us on 0151 203 8500.\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
  });
}

export async function sendNewUserSetPasswordEmail({
  toEmail,
  firstName,
  username,
  setPasswordUrl,
}: {
  toEmail: string;
  firstName?: string | null;
  username: string;
  setPasswordUrl: string;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const brandGreen = '#8bc440';
  const brandDark = '#191919';
  const displayName = firstName || username;

  await client.emails.send({
    to: toEmail,
    from: fromEmail,
    subject: `You've been set up on Mobile Tyre Van City — set your password`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: ${brandDark}; padding: 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 26px; }
    .header p { color: #ccc; margin: 6px 0 0; font-size: 14px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .info-box { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 20px 24px; margin: 20px 0; }
    .info-box table { width: 100%; border-collapse: collapse; }
    .info-box td { padding: 6px 0; font-size: 15px; }
    .info-box td:first-child { color: #6b7280; width: 38%; font-weight: 500; }
    .info-box td:last-child { font-weight: bold; }
    .cta-btn { display: inline-block; background-color: ${brandGreen}; color: #191919; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .expiry-note { color: #6b7280; font-size: 13px; margin-top: 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
      <p>www.mobiletyrevancity.co.uk</p>
    </div>
    <div class="content">
      <p>Hi ${displayName},</p>
      <p>You've been set up as an admin on the <strong>Mobile Tyre Van City</strong> portal. To get started, you'll need to set your own password using the button below.</p>
      <div class="info-box">
        <table>
          <tr><td>Username</td><td>${username}</td></tr>
        </table>
      </div>
      <p style="text-align:center;">
        <a href="${setPasswordUrl}" class="cta-btn">Set Your Password</a>
      </p>
      <p class="expiry-note">This link will expire in <strong>24 hours</strong>. If you weren't expecting this email, you can ignore it safely — no account access will be granted without setting a password.</p>
      <p>If the button above doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break:break-all; font-size:13px; color:#6b7280;">${setPasswordUrl}</p>
      <p>If you have any trouble, call us on <strong>0151 203 8500</strong> or reply to this email.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you did not expect this email, please contact us on 0151 203 8500.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Hi ${displayName},\n\nYou've been set up as an admin on the Mobile Tyre Van City portal.\n\nYour username is: ${username}\n\nTo activate your account, please set your password here:\n${setPasswordUrl}\n\nThis link expires in 24 hours.\n\nIf you need help, call us on 0151 203 8500.\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
  });
}

export async function sendPasswordResetEmail({
  toEmail,
  firstName,
  username,
  resetUrl,
}: {
  toEmail: string;
  firstName?: string | null;
  username: string;
  resetUrl: string;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const brandGreen = '#8bc440';
  const brandDark = '#191919';
  const displayName = firstName || username;

  await client.emails.send({
    to: toEmail,
    from: fromEmail,
    subject: `Reset your Mobile Tyre Van City password`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: ${brandDark}; padding: 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 26px; }
    .header p { color: #ccc; margin: 6px 0 0; font-size: 14px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .cta-btn { display: inline-block; background-color: ${brandGreen}; color: #191919; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-weight: bold; font-size: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 13px; }
    .url-box { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px 16px; margin: 16px 0; font-family: monospace; font-size: 12px; word-break: break-all; color: #374151; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
      <p>www.mobiletyrevancity.co.uk</p>
    </div>
    <div class="content">
      <p>Hi ${displayName},</p>
      <p>We received a request to reset the password for your account (<strong>${username}</strong>). Click the button below to set a new password.</p>
      <p style="text-align:center;">
        <a href="${resetUrl}" class="cta-btn">Reset My Password</a>
      </p>
      <p style="color:#6b7280; font-size:13px;">If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="url-box">${resetUrl}</div>
      <p style="color:#6b7280; font-size:13px;"><strong>This link will expire in 1 hour.</strong> If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you need help, call us on 0151 203 8500.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Hi ${displayName},\n\nWe received a request to reset the password for your account (${username}).\n\nReset your password here:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request a password reset, you can safely ignore this email.\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
  });
}

export async function sendDepotInvoiceEmail({
  quoteId,
  customerName,
  customerPhone,
  customerEmail,
  vanDetails,
  kitName,
  upgradeNames,
  customExtras,
  subtotal,
  vat,
  discount,
  total,
  financeInfo,
}: {
  quoteId: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  vanDetails: {
    make?: string | null;
    model?: string | null;
    year?: number | null;
    registration?: string | null;
    mileage?: number | null;
    transmission?: string | null;
    fuelType?: string | null;
    title?: string | null;
    isCustom?: boolean;
    customDescription?: string | null;
  };
  kitName?: string | null;
  upgradeNames?: string[];
  customExtras?: Array<{ id: string; description: string; pricePence: number }>;
  subtotal: number;
  vat: number;
  discount?: number;
  total: number;
  financeInfo?: {
    depositAmount: number;
    termMonths: number;
    monthlyPayment: number;
    weeklyPayment: number;
  } | null;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const ref = quoteId.slice(0, 8).toUpperCase();
  const brandGreen = '#8bc440';
  const brandDark = '#191919';
  const fmt = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

  const totalAfterDiscount = discount && discount > 0 ? total - discount : total;

  const vanDescriptionLines: string[] = [];
  if (vanDetails.isCustom) {
    vanDescriptionLines.push(vanDetails.customDescription || 'Customer-supplied van');
  } else {
    if (vanDetails.title) vanDescriptionLines.push(vanDetails.title);
    else if (vanDetails.make || vanDetails.model || vanDetails.year) {
      vanDescriptionLines.push([vanDetails.year, vanDetails.make, vanDetails.model].filter(Boolean).join(' '));
    }
  }
  if (vanDetails.registration) vanDescriptionLines.push(`Reg: ${vanDetails.registration.toUpperCase()}`);
  if (vanDetails.mileage != null) vanDescriptionLines.push(`Mileage: ${vanDetails.mileage.toLocaleString('en-GB')} miles`);
  if (vanDetails.transmission) vanDescriptionLines.push(`Transmission: ${vanDetails.transmission}`);
  if (vanDetails.fuelType) vanDescriptionLines.push(`Fuel: ${vanDetails.fuelType}`);

  const vanTableRows = vanDescriptionLines.map(l => `<tr><td colspan="2" style="padding:5px 12px; font-size:14px; color:#374151;">${l}</td></tr>`).join('');

  const upgradesList = upgradeNames && upgradeNames.length > 0
    ? `<ul style="margin:4px 0; padding-left:18px;">${upgradeNames.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('')}</ul>`
    : '<em style="color:#6b7280;">None</em>';

  const extrasList = customExtras && customExtras.length > 0
    ? `<ul style="margin:4px 0; padding-left:18px;">${customExtras.map(e => `<li style="margin-bottom:2px;">${e.description} &mdash; ${fmt(e.pricePence)}</li>`).join('')}</ul>`
    : '';

  const financeRows = financeInfo ? `
    <tr><td colspan="2" style="padding:10px 12px 4px; font-weight:bold; font-size:13px; color:${brandDark}; border-top:1px solid #e5e7eb;">Finance (HP – 10.9% APR est.)</td></tr>
    <tr><td>Deposit</td><td>${fmt(financeInfo.depositAmount)}</td></tr>
    <tr><td>Term</td><td>${financeInfo.termMonths} months${financeInfo.termMonths % 12 === 0 ? ` (${financeInfo.termMonths / 12} yr)` : ''}</td></tr>
    <tr><td>Monthly (est.)</td><td style="font-weight:bold; color:${brandGreen};">${fmt(financeInfo.monthlyPayment)}/month</td></tr>
    <tr><td>Weekly (est.)</td><td>${fmt(financeInfo.weeklyPayment)}/week</td></tr>
  ` : '';

  const financeText = financeInfo
    ? `\nFinance (HP – 10.9% APR est.)\nDeposit: ${fmt(financeInfo.depositAmount)}\nTerm: ${financeInfo.termMonths} months\nMonthly: ${fmt(financeInfo.monthlyPayment)}\nWeekly: ${fmt(financeInfo.weeklyPayment)}\n`
    : '';

  const extrasText = customExtras && customExtras.length > 0
    ? `Bespoke Extras:\n${customExtras.map(e => `  - ${e.description} (${fmt(e.pricePence)})`).join('\n')}\n`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 620px; margin: 0 auto; width: 100%; }
    .header { background-color: ${brandDark}; padding: 28px 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 24px; }
    .header p { color: #ccc; margin: 4px 0 0; font-size: 13px; }
    .content { background: #fff; padding: 28px 30px; border: 1px solid #e5e7eb; }
    .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 20px 0 6px; }
    .ref-box { background: #f3f4f6; border-left: 4px solid ${brandGreen}; padding: 12px 18px; border-radius: 4px; margin-bottom: 20px; font-size: 15px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin: 0 0 12px; }
    td { padding: 7px 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; word-break: break-word; }
    td:first-child { color: #6b7280; width: 42%; }
    .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid ${brandGreen}; border-bottom: none; color: ${brandDark}; }
    .total-row td:last-child { color: ${brandGreen}; }
    .footer { text-align: center; padding: 18px; color: #6b7280; font-size: 12px; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .header, .content { padding: 20px 16px !important; }
      td { padding: 6px 8px !important; }
      td:first-child { width: 44% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Mobile Tyre Van City</h1>
      <p>Depot Invoice Request</p>
    </div>
    <div class="content">
      <p style="margin-top:0;">Please raise an invoice for the following build.</p>
      <div class="ref-box">Quote Reference: #${ref}</div>

      <p class="section-title">Customer Details</p>
      <table>
        <tr><td>Name</td><td>${customerName}</td></tr>
        ${customerPhone ? `<tr><td>Phone</td><td>${customerPhone}</td></tr>` : ''}
        ${customerEmail ? `<tr><td>Email</td><td>${customerEmail}</td></tr>` : ''}
      </table>

      <p class="section-title">Van Details</p>
      <table>
        ${vanTableRows || `<tr><td colspan="2" style="padding:5px 12px; color:#6b7280; font-size:14px;"><em>No van details recorded</em></td></tr>`}
      </table>

      <p class="section-title">Build Specification</p>
      <table>
        ${kitName ? `<tr><td>Conversion Pack</td><td>${kitName}</td></tr>` : ''}
        <tr><td valign="top">Upgrades</td><td>${upgradesList}</td></tr>
        ${extrasList ? `<tr><td valign="top">Bespoke Extras</td><td>${extrasList}</td></tr>` : ''}
      </table>

      <p class="section-title">Pricing</p>
      <table>
        ${discount && discount > 0 ? `<tr><td>Original Price (inc. VAT)</td><td>${fmt(total)}</td></tr>` : ''}
        ${discount && discount > 0 ? `<tr><td style="color:#166534;">Discount</td><td style="color:#166534;">-${fmt(discount)}</td></tr>` : ''}
        <tr><td>Subtotal (ex. VAT)</td><td>${fmt(subtotal)}</td></tr>
        <tr><td>VAT (20%)</td><td>${fmt(vat)}</td></tr>
        <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(totalAfterDiscount)}</td></tr>
        ${financeRows}
      </table>

      <p style="font-size:13px; color:#6b7280; margin-top:16px;">Please reply to this email or call the office if you have any questions.</p>
      <p style="margin-bottom:0;">Mobile Tyre Van City<br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL<br>0151 203 8500</p>
    </div>
    <div class="footer">
      <p>This is an internal invoice request — please do not forward externally.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `DEPOT INVOICE REQUEST — Quote #${ref}

CUSTOMER
Name: ${customerName}${customerPhone ? `\nPhone: ${customerPhone}` : ''}${customerEmail ? `\nEmail: ${customerEmail}` : ''}

VAN DETAILS
${vanDescriptionLines.join('\n') || 'No van details recorded'}

BUILD SPECIFICATION
${kitName ? `Conversion Pack: ${kitName}\n` : ''}Upgrades:
${upgradeNames && upgradeNames.length > 0 ? upgradeNames.map(u => `  - ${u}`).join('\n') : '  None'}
${extrasText}
PRICING
${discount && discount > 0 ? `Original Price (inc. VAT): ${fmt(total)}\nDiscount: -${fmt(discount)}\n` : ''}Subtotal (ex. VAT): ${fmt(subtotal)}
VAT (20%): ${fmt(vat)}
Total (inc. VAT): ${fmt(totalAfterDiscount)}
${financeText}
Mobile Tyre Van City | 0151 203 8500
5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`;

  await client.emails.send({
    to: 'sharon@geg.co',
    from: fromEmail,
    subject: `Invoice Request – Quote #${ref} – ${customerName}`,
    html,
    text,
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const recipients = Array.isArray(to) ? to : [to];
  await client.emails.send({
    from: fromEmail,
    to: recipients,
    subject,
    html,
    ...(text ? { text } : {}),
  });
}
