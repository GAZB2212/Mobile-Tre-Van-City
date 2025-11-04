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
