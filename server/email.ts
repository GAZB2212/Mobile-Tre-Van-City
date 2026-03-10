import { Resend } from 'resend';

const INTERNAL_NOTIFY_EMAILS = ['carl@geg.co', 'info@gfukgroup.co.uk'];

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
    .button { display: inline-block; background-color: #8bc440; color: #191919; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .savings { background-color: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; margin: 15px 0; font-weight: bold; }
    .notes { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
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
  const brandGreen = '#8bc440';
  const brandDark = '#191919';

  const fmt = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const discountLine = discount && discount > 0
    ? `<tr><td style="color:#166534;">Discount</td><td style="color:#166534;">-${fmt(discount)}</td></tr>`
    : '';
  const totalAfterDiscount = discount && discount > 0 ? total - discount : total;

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
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: ${brandDark}; padding: 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 26px; }
    .header p { color: #ccc; margin: 6px 0 0; font-size: 14px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .ref-box { background: #f3f4f6; border-left: 4px solid ${brandGreen}; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    td:first-child { color: #6b7280; width: 40%; }
    .total-row td { font-weight: bold; font-size: 18px; border-top: 2px solid ${brandGreen}; border-bottom: none; color: ${brandDark}; }
    .total-row td:last-child { color: ${brandGreen}; }
    .note-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
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
        ${upgradeNames && upgradeNames.length > 0 ? upgradeNames.map(u => `<tr><td>Upgrade</td><td>${u}</td></tr>`).join('') : ''}
      </table>
      <h3 style="margin-bottom:8px;">Pricing</h3>
      <table>
        <tr><td>Subtotal (ex. VAT)</td><td>${fmt(subtotal)}</td></tr>
        ${discountLine}
        <tr><td>VAT (20%)</td><td>${fmt(vat)}</td></tr>
        <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(totalAfterDiscount)}</td></tr>
      </table>
      ${customerNote ? `<div class="note-box"><strong>Note from our team:</strong><br>${customerNote}</div>` : ''}
      <p>If you have any questions or would like to make changes, please call us on <strong>0151 203 8500</strong> or reply to this email.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you did not request this summary, please disregard this email.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Hi ${customerName},\n\nThank you for speaking with us. Here is your van conversion summary.\n\nReference: #${ref}\n\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? upgradeNames.map(u => `Upgrade: ${u}`).join('\n') + '\n' : ''}\nSubtotal (ex. VAT): ${fmt(subtotal)}\n${discount && discount > 0 ? `Discount: -${fmt(discount)}\n` : ''}VAT (20%): ${fmt(vat)}\nTotal (inc. VAT): ${fmt(totalAfterDiscount)}\n\n${customerNote ? `Note from our team: ${customerNote}\n\n` : ''}Call us: 0151 203 8500\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
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
}) {
  const { client, fromEmail } = await getUncachableResendClient();
  const ref = quoteId.slice(0, 8).toUpperCase();
  const brandGreen = '#8bc440';
  const brandDark = '#191919';

  const fmt = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const discountLine = discount && discount > 0
    ? `<tr><td style="color:#166534;">Discount</td><td style="color:#166534;">-${fmt(discount)}</td></tr>`
    : '';
  const totalAfterDiscount = discount && discount > 0 ? total - discount : total;

  const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 650px; margin: 0 auto; }
    .header { background-color: ${brandDark}; padding: 28px 30px; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 24px; }
    .header p { color: #ccc; margin: 4px 0 0; font-size: 13px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .section-title { font-size: 14px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid ${brandGreen}; padding-bottom: 6px; margin: 24px 0 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    td:first-child { color: #6b7280; width: 40%; font-weight: 500; }
    .total-row td { font-weight: bold; font-size: 17px; border-top: 2px solid ${brandGreen}; border-bottom: none; }
    .total-row td:last-child { color: ${brandGreen}; }
    .footer { text-align: center; padding: 18px; color: #9ca3af; font-size: 12px; }
    .ref-pill { display: inline-block; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 12px; font-family: monospace; font-size: 14px; font-weight: bold; }
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

      <div class="section-title">Conversion Specification</div>
      <table>
        ${kitName ? `<tr><td>Equipment Pack</td><td>${kitName}</td></tr>` : ''}
        ${upgradeNames && upgradeNames.length > 0 ? upgradeNames.map(u => `<tr><td>Upgrade</td><td>${u}</td></tr>`).join('') : ''}
      </table>

      <div class="section-title">Pricing</div>
      <table>
        <tr><td>Subtotal (ex. VAT)</td><td>${fmt(subtotal)}</td></tr>
        ${discountLine}
        <tr><td>VAT (20%)</td><td>${fmt(vat)}</td></tr>
        <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(totalAfterDiscount)}</td></tr>
      </table>

      <p style="margin-top:24px;">Please contact the customer directly to progress the finance application. If you have any questions, please reply to this email or call us on <strong>0151 203 8500</strong>.</p>
      <p>Kind regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL<br>0151 203 8500</p>
    </div>
    <div class="footer">
      Sent on behalf of Mobile Tyre Van City &bull; www.mobiletyrevancity.co.uk
    </div>
  </div>
</body>
</html>`;

  const emailText = `Finance Application – Ref #${ref}\n\nCustomer Details:\nName: ${customerName}\nPhone: ${customerPhone}\nEmail: ${customerEmail}\n\nVehicle Details:\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${vanRegistration ? `Registration: ${vanRegistration.toUpperCase()}\n` : ''}${vanMileage !== undefined && vanMileage !== null ? `Mileage: ${vanMileage.toLocaleString('en-GB')} miles\n` : ''}\nConversion Specification:\n${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? upgradeNames.map(u => `Upgrade: ${u}`).join('\n') + '\n' : ''}\nPricing:\nSubtotal (ex. VAT): ${fmt(subtotal)}\n${discount && discount > 0 ? `Discount: -${fmt(discount)}\n` : ''}VAT (20%): ${fmt(vat)}\nTotal (inc. VAT): ${fmt(totalAfterDiscount)}\n\nMobile Tyre Van City | 0151 203 8500\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`;

  await client.emails.send({
    to: financeCompanyEmail,
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
  const total = `£${(quote.estTotal / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const subtotal = `£${(quote.estSubtotal / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const vat = `£${(quote.estVAT / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

  const brandGreen = '#8bc440';
  const brandDark = '#191919';

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
    .container { max-width: 600px; margin: 0 auto; }
    .header { background-color: ${brandDark}; padding: 30px; text-align: center; }
    .header h1 { color: ${brandGreen}; margin: 0; font-size: 26px; }
    .header p { color: #ccc; margin: 6px 0 0; font-size: 14px; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
    .ref-box { background: #f3f4f6; border-left: 4px solid ${brandGreen}; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
    .ref-box p { margin: 0; }
    .summary { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .summary td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .summary td:first-child { color: #6b7280; width: 40%; }
    .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid ${brandGreen}; border-bottom: none; }
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
      <p>Hi ${quote.userName},</p>
      <p>Thank you for completing our van configurator. We've received your enquiry and one of our team will be in touch within 24 hours to discuss your requirements.</p>
      <div class="ref-box">
        <p><strong>Your reference number:</strong> #${ref}</p>
        <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
      </div>
      <h3 style="margin-bottom: 8px;">Your Configuration Summary</h3>
      <table class="summary">
        ${vanTitle ? `<tr><td>Van</td><td>${vanTitle}</td></tr>` : ''}
        ${kitName ? `<tr><td>Pack</td><td>${kitName}</td></tr>` : ''}
        ${upgradeNames && upgradeNames.length > 0 ? `<tr><td>Upgrades</td><td>${upgradeNames.join(', ')}</td></tr>` : ''}
        <tr><td>Subtotal</td><td>${subtotal}</td></tr>
        <tr><td>VAT (20%)</td><td>${vat}</td></tr>
        <tr class="total-row"><td>Total</td><td>${total}</td></tr>
      </table>
      <p>If you have any questions in the meantime, please call us on <strong>0151 203 8500</strong> or reply to this email.</p>
      <p>Best regards,<br><strong>Mobile Tyre Van City</strong><br>5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL</p>
    </div>
    <div class="footer">
      <p>If you did not submit this enquiry, please disregard this email.</p>
    </div>
  </div>
</body>
</html>`,
    text: `Hi ${quote.userName},\n\nThank you for completing our van configurator. We've received your enquiry and will be in touch within 24 hours.\n\nReference: #${ref}\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? `Upgrades: ${upgradeNames.join(', ')}\n` : ''}Subtotal: ${subtotal}\nVAT: ${vat}\nTotal: ${total}\n\nCall us: 0151 203 8500\n\nMobile Tyre Van City\n5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL`,
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
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h2 { color: ${brandDark}; border-bottom: 3px solid ${brandGreen}; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    td:first-child { font-weight: bold; color: #6b7280; width: 35%; }
    .total td { font-weight: bold; font-size: 16px; border-top: 2px solid ${brandGreen}; }
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
    <h3>Configuration</h3>
    <table>
      ${vanTitle ? `<tr><td>Van</td><td>${vanTitle}</td></tr>` : ''}
      ${kitName ? `<tr><td>Pack</td><td>${kitName}</td></tr>` : ''}
      ${upgradeNames && upgradeNames.length > 0 ? `<tr><td>Upgrades</td><td>${upgradeNames.join('<br>')}</td></tr>` : ''}
      <tr><td>Subtotal</td><td>${subtotal}</td></tr>
      <tr><td>VAT (20%)</td><td>${vat}</td></tr>
      <tr class="total"><td>Total</td><td>${total}</td></tr>
    </table>
  </div>
</body>
</html>`,
    text: `New configurator submission\n\nName: ${quote.userName}\nEmail: ${quote.email}\nPhone: ${quote.phone}\n${quote.company ? `Company: ${quote.company}\n` : ''}Reference: #${ref}\n${vanTitle ? `Van: ${vanTitle}\n` : ''}${kitName ? `Pack: ${kitName}\n` : ''}${upgradeNames && upgradeNames.length > 0 ? `Upgrades: ${upgradeNames.join(', ')}\n` : ''}Subtotal: ${subtotal}\nVAT: ${vat}\nTotal: ${total}`,
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
    .cta-btn { display: inline-block; background-color: ${brandGreen}; color: #191919; text-decoration: none; padding: 12px 28px; border-radius: 4px; font-weight: bold; font-size: 15px; margin: 16px 0; }
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
      <p>An account has been created for you on the Mobile Tyre Van City portal. You can use the details below to sign in.</p>
      <div class="credentials-box">
        <table>
          <tr><td>Username</td><td>${username}</td></tr>
          <tr><td>Password</td><td>${password}</td></tr>
        </table>
      </div>
      <p style="text-align:center;">
        <a href="${loginUrl}" class="cta-btn">Sign In Now</a>
      </p>
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
