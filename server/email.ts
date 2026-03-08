import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email};
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableSendGridClient() {
  const {apiKey, email} = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

// Send quote confirmation email to customer
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
  const { client, fromEmail } = await getUncachableSendGridClient();

  const formattedTotal = `£${(totalPrice / 100).toLocaleString()}`;
  const savings = discount ? `£${(discount / 100).toLocaleString()}` : null;

  const msg = {
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
    .header { background-color: #f97316; color: white; padding: 30px; text-align: center; }
    .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .price-box { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .button { display: inline-block; background-color: #f97316; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .savings { background-color: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; margin: 15px 0; font-weight: bold; }
    .notes { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Quote is Ready!</h1>
    </div>
    
    <div class="content">
      <p>Hi ${customerName},</p>
      
      <p>Thank you for requesting a quote for your mobile tyre van conversion. We've reviewed your configuration and are pleased to present your custom quote.</p>
      
      <div class="price-box">
        <h2 style="margin-top: 0;">Quote #${quoteId.slice(0, 8).toUpperCase()}</h2>
        ${savings ? `<div class="savings">Special Discount Applied - You Save ${savings}!</div>` : ''}
        <p style="font-size: 28px; font-weight: bold; color: #f97316; margin: 10px 0;">${formattedTotal}</p>
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
        <a href="${confirmationUrl}" class="button">Review & Confirm Quote</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
        This confirmation link is for one-time use and will expire after confirmation.
      </p>
      
      <p>If you have any questions or need to discuss your quote, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>The Mobile Tyre Van Team</p>
    </div>
    
    <div class="footer">
      <p>This email was sent regarding your quote request. If you didn't request this quote, please disregard this email.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Hi ${customerName},

Your Van Conversion Quote #${quoteId.slice(0, 8).toUpperCase()} is Ready!

Total Price: ${formattedTotal} (Including VAT)
${savings ? `Special Discount Applied - You Save ${savings}!` : ''}

${customerNotes ? `Note from our team:\n${customerNotes}\n\n` : ''}

To proceed with your order, please review and confirm your quote by visiting:
${confirmationUrl}

This confirmation link is for one-time use and will expire after confirmation.

If you have any questions or need to discuss your quote, please don't hesitate to contact us.

Best regards,
The Mobile Tyre Van Team
    `.trim(),
  };

  await client.send(msg);
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
  const { client, fromEmail } = await getUncachableSendGridClient();

  const ref = quote.id.slice(0, 8).toUpperCase();
  const total = `£${(quote.estTotal / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const subtotal = `£${(quote.estSubtotal / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;
  const vat = `£${(quote.estVAT / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

  const brandGreen = '#8bc440';
  const brandDark = '#191919';

  // ── 1. Customer confirmation ────────────────────────────────────────────────
  const customerMsg = {
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
  };

  // ── 2. Admin notification ───────────────────────────────────────────────────
  const adminMsg = {
    to: fromEmail,
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
  };

  await client.send(customerMsg);
  await client.send(adminMsg);
}

export async function sendLeadReceivedEmails(lead: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
}) {
  const { client, fromEmail } = await getUncachableSendGridClient();

  const ref = lead.id.slice(0, 8).toUpperCase();
  const brandGreen = '#8bc440';
  const brandDark = '#191919';

  // ── 1. Customer confirmation ────────────────────────────────────────────────
  const customerMsg = {
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
  };

  // ── 2. Admin notification ───────────────────────────────────────────────────
  const adminMsg = {
    to: fromEmail,
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
  };

  await client.send(customerMsg);
  await client.send(adminMsg);
}
