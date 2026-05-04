import { emailLayout } from './email';

const BRAND_GREEN = '#8bc440';
const BRAND_DARK = '#191919';
const SITE_DOMAIN = 'www.mobiletyrevancity.co.uk';
const PHONE = '0151 203 8500';
const ADDRESS = '5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL';

export interface EmailTemplate {
  id: string;
  label: string;
  description: string;
  subject: string;
  recipient: 'customer' | 'admin' | 'finance' | 'depot';
  group: 'Enquiry' | 'Spec' | 'Quote' | 'Finance' | 'Post-Sale' | 'Account';
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: 'enquiry-received-customer', label: 'Enquiry Received (Customer)', description: 'Sent to the customer when they complete the configurator', subject: "We've received your enquiry – Ref #ABC12345", recipient: 'customer', group: 'Enquiry' },
  { id: 'enquiry-received-admin', label: 'Enquiry Received (Internal)', description: 'Admin notification of a new configurator submission', subject: 'New configurator submission – John Smith – £18,000.00 – Ref #ABC12345', recipient: 'admin', group: 'Enquiry' },
  { id: 'lead-received-customer', label: 'Lead Received (Customer)', description: 'Sent to customer when they submit a general enquiry form', subject: "We've received your enquiry – Mobile Tyre Van City", recipient: 'customer', group: 'Enquiry' },
  { id: 'lead-received-admin', label: 'Lead Received (Internal)', description: 'Admin notification of a new general enquiry', subject: 'New enquiry – John Smith – 07712 345678 – Ref #XYZ98765', recipient: 'admin', group: 'Enquiry' },
  { id: 'spec-summary-single', label: 'Spec Summary (Single Van)', description: 'Sent to customer after admin discusses their specification', subject: 'Your Van Conversion Summary – Ref #ABC12345 – Mobile Tyre Van City', recipient: 'customer', group: 'Spec' },
  { id: 'spec-summary-comparison', label: 'Spec Summary (Comparison)', description: 'Spec summary with two options for the customer to choose between', subject: 'Your Van Conversion Options – Ref #ABC12345 – Mobile Tyre Van City', recipient: 'customer', group: 'Spec' },
  { id: 'option-chosen-admin', label: 'Option Chosen (Internal)', description: 'Admin notification when a customer selects their preferred option', subject: 'Customer chose Option A – John Smith – Ref #ABC12345', recipient: 'admin', group: 'Spec' },
  { id: 'quote-confirmation', label: 'Quote Confirmation', description: 'Sent to customer with a formal quote and confirmation link', subject: 'Your Van Conversion Quote #ABC12345 is Ready', recipient: 'customer', group: 'Quote' },
  { id: 'quote-spec-summary-single', label: 'Quote Spec Summary (Single Van)', description: 'Full spec summary sent after admin call — with discount, bespoke extras, and approval buttons', subject: 'Your Van Conversion Summary – Ref #ABC12345 – Mobile Tyre Van City', recipient: 'customer', group: 'Quote' },
  { id: 'quote-spec-summary-comparison', label: 'Quote Spec Summary (Comparison)', description: 'Two-option A/B spec summary — shows Option B with a CHOSEN badge after the customer selects', subject: 'Your Van Conversion Options – Ref #ABC12345 – Mobile Tyre Van City', recipient: 'customer', group: 'Quote' },
  { id: 'finance-submission', label: 'Finance Submission', description: 'Sent to the finance company with customer and vehicle details', subject: 'Finance Application – John Smith – £18,000.00 – Ref #ABC12345', recipient: 'finance', group: 'Finance' },
  { id: 'depot-invoice', label: 'Depot Invoice Request', description: 'Sent to the depot with full build spec for invoicing', subject: 'Invoice Request – Quote #ABC12345 – John Smith', recipient: 'depot', group: 'Post-Sale' },
  { id: 'testimonial-request', label: 'Review Request', description: 'Sent to customer after their conversion is complete', subject: 'Would you leave us a review? – Mobile Tyre Van City', recipient: 'customer', group: 'Post-Sale' },
  { id: 'welcome-email', label: 'New User Welcome', description: 'Sent to a new admin user with their login credentials', subject: 'Your Mobile Tyre Van City account has been created', recipient: 'admin', group: 'Account' },
  { id: 'set-password', label: 'Set Password (New User)', description: 'Sent to a new admin user with a link to set their password', subject: "You've been set up on Mobile Tyre Van City — set your password", recipient: 'admin', group: 'Account' },
  { id: 'password-reset', label: 'Password Reset', description: 'Sent when an admin user requests a password reset', subject: 'Reset your Mobile Tyre Van City password', recipient: 'admin', group: 'Account' },
];

const fmt = (p: number) => `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

const REF = 'ABC12345';
const CUSTOMER_NAME = 'John Smith';
const CUSTOMER_EMAIL = 'john.smith@example.com';
const CUSTOMER_PHONE = '07712 345678';
const QUOTE_ID = 'abc12345-0000-0000-0000-000000000000';
const VAN_TITLE = 'Ford Transit Custom 2023 2.0 EcoBlue';
const KIT_NAME = 'Silver Pack – 8 Wheel Tyre Changer';
const UPGRADES = ['Nitrogen Generator', 'Tyre Pressure Monitoring Display', 'Heavy Duty Drawer System'];
const SUBTOTAL = 1500000;
const VAT = 300000;
const TOTAL = 1800000;
const DEPOSIT = 270000;
const TERM = 60;
const MONTHLY = 30500;
const WEEKLY = 7040;
const SITE_BASE = `https://${SITE_DOMAIN}`;

const specTableCss = `
  .ref-box { background: #f3f4f6; border-left: 4px solid ${BRAND_GREEN}; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
  .ref-box p { margin: 0; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 13px; word-break: break-word; }
  td:first-child { color: #6b7280; width: 42%; }
  .total-row td { font-weight: bold; font-size: 15px; border-top: 2px solid ${BRAND_GREEN}; border-bottom: none; color: ${BRAND_DARK}; }
  .total-row td:last-child { color: ${BRAND_GREEN}; }
  .note-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px; }
  @media screen and (max-width: 600px) {
    td { padding: 7px 5px !important; }
    td:first-child { width: 44% !important; }
  }
`;

function generateEnquiryReceivedCustomer(): string {
  const upgradesList = UPGRADES.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('');
  const body = `
    <p>Hi ${CUSTOMER_NAME},</p>
    <p>Thank you for completing our van configurator. We've received your enquiry and one of our team will be in touch within 24 hours to discuss your requirements.</p>
    <div class="ref-box">
      <p><strong>Your reference number:</strong> #${REF}</p>
      <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
    </div>
    <h3 style="margin-bottom: 8px;">Your Configuration Summary</h3>
    <table class="summary">
      <tr><td>Van</td><td>${VAN_TITLE}</td></tr>
      <tr><td>Pack</td><td>${KIT_NAME}</td></tr>
      <tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradesList}</ul></td></tr>
      <tr><td>Subtotal</td><td>${fmt(SUBTOTAL)}</td></tr>
      <tr><td>VAT (20%)</td><td>${fmt(VAT)}</td></tr>
      <tr class="total-row"><td>Total</td><td>${fmt(TOTAL)}</td></tr>
      <tr><td colspan="2" style="padding-top:12px;padding-bottom:4px;font-weight:bold;font-size:13px;color:${BRAND_DARK};border-top:2px solid #e5e7eb;">Finance Illustration (HP — 10.9% APR)</td></tr>
      <tr><td style="color:#6b7280;">Deposit</td><td>${fmt(DEPOSIT)}</td></tr>
      <tr><td style="color:#6b7280;">Term</td><td>${TERM} months (5 years)</td></tr>
      <tr><td style="color:#6b7280;">Est. Monthly</td><td style="font-weight:bold;color:${BRAND_GREEN};">${fmt(MONTHLY)}/month</td></tr>
      <tr><td style="color:#6b7280;">Est. Weekly</td><td>${fmt(WEEKLY)}/week (approx.)</td></tr>
    </table>
    <p>If you have any questions in the meantime, please call us on <strong>${PHONE}</strong> or reply to this email.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: `
      .ref-box { background: #f3f4f6; border-left: 4px solid ${BRAND_GREEN}; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
      .ref-box p { margin: 0; }
      .summary { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .summary td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; word-break: break-word; }
      .summary td:first-child { color: #6b7280; width: 40%; }
      .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid ${BRAND_GREEN}; border-bottom: none; }
    `,
    footerNote: 'If you did not submit this enquiry, please disregard this email.',
  });
}

function generateEnquiryReceivedAdmin(): string {
  const upgradesList = UPGRADES.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('');
  const body = `
    <h2 style="color:${BRAND_DARK}; border-bottom: 3px solid ${BRAND_GREEN}; padding-bottom: 8px;">New Configurator Submission</h2>
    <h3>Customer Details</h3>
    <table>
      <tr><td>Name</td><td>${CUSTOMER_NAME}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${CUSTOMER_EMAIL}">${CUSTOMER_EMAIL}</a></td></tr>
      <tr><td>Phone</td><td>${CUSTOMER_PHONE}</td></tr>
      <tr><td>Company</td><td>Smith Tyres Ltd</td></tr>
      <tr><td>Reference</td><td>#${REF}</td></tr>
    </table>
    <h3>Configuration</h3>
    <table>
      <tr><td>Van</td><td>${VAN_TITLE}</td></tr>
      <tr><td>Pack</td><td>${KIT_NAME}</td></tr>
      <tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradesList}</ul></td></tr>
    </table>
    <h3>Pricing</h3>
    <table>
      <tr><td>Subtotal (ex. VAT)</td><td>${fmt(SUBTOTAL)}</td></tr>
      <tr><td>VAT (20%)</td><td>${fmt(VAT)}</td></tr>
      <tr class="total"><td>Total (inc. VAT)</td><td>${fmt(TOTAL)}</td></tr>
      <tr><td colspan="2" style="padding-top:10px;padding-bottom:4px;font-weight:bold;font-size:13px;color:${BRAND_DARK};border-top:2px solid #e5e7eb;">Finance Illustration (HP — 10.9% APR)</td></tr>
      <tr><td>Deposit</td><td>${fmt(DEPOSIT)}</td></tr>
      <tr><td>Term</td><td>${TERM} months (5 years)</td></tr>
      <tr><td>Est. Monthly</td><td style="font-weight:bold;color:${BRAND_GREEN};">${fmt(MONTHLY)}/month</td></tr>
      <tr><td>Est. Weekly</td><td>${fmt(WEEKLY)}/week (approx.)</td></tr>
    </table>
  `;
  return emailLayout(body, {
    extraCss: `
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; word-break: break-word; }
      td:first-child { font-weight: bold; color: #6b7280; width: 35%; }
      .total td { font-weight: bold; font-size: 16px; border-top: 2px solid ${BRAND_GREEN}; }
    `,
  });
}

function generateSpecSummarySingle(): string {
  const upgradesList = UPGRADES.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('');
  const body = `
    <p>Hi ${CUSTOMER_NAME},</p>
    <p>Thank you for speaking with us today. As discussed, please find below a summary of your configured mobile tyre van conversion.</p>
    <div class="ref-box">
      <p><strong>Reference:</strong> #${REF}</p>
      <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
    </div>
    <h3 style="margin-bottom:8px;">Your Configuration</h3>
    <table>
      <tr><td>Van</td><td>${VAN_TITLE}</td></tr>
      <tr><td>Pack</td><td>${KIT_NAME}</td></tr>
      <tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradesList}</ul></td></tr>
      <tr><td>Bespoke Extras</td><td><ul style="margin:2px 0;padding-left:18px;"><li>Custom livery wrap — £850.00</li></ul></td></tr>
    </table>
    <h3 style="margin-bottom:8px;">Pricing</h3>
    <table>
      <tr><td>Subtotal (ex. VAT)</td><td>${fmt(SUBTOTAL)}</td></tr>
      <tr><td>VAT (20%)</td><td>${fmt(VAT)}</td></tr>
      <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(TOTAL)}</td></tr>
    </table>
    <h3 style="margin-bottom:8px; margin-top:24px;">Finance Option (HP — 10.9% APR)</h3>
    <table>
      <tr><td>Deposit</td><td>${fmt(DEPOSIT)}</td></tr>
      <tr><td>Finance Term</td><td>${TERM} months (5 years)</td></tr>
      <tr><td>Estimated Monthly Payment</td><td style="font-weight:bold; color:${BRAND_GREEN};">${fmt(MONTHLY)}/month</td></tr>
      <tr><td>Estimated Weekly Payment</td><td>${fmt(WEEKLY)}/week (approx.)</td></tr>
    </table>
    <p style="font-size:12px; color:#6b7280; margin-top:-8px;">Finance figures are estimates based on Hire Purchase at 10.9% APR. Subject to status and final agreement.</p>
    <div class="note-box"><strong>Note from our team:</strong><br>We've taken into account your preference for a manual racking system. This has been reflected in the specification above.</div>
    <div style="margin: 28px 0; padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; text-align: center;">
      <p style="font-size: 15px; font-weight: bold; margin: 0 0 6px;">Does this look correct?</p>
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">Please let us know whether the spec above is right, or if anything needs changing.</p>
      <a href="${SITE_BASE}/spec-approval/sample-token?status=approved"
         style="display:block; max-width:280px; margin:0 auto 12px; background:${BRAND_GREEN}; color:${BRAND_DARK}; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:4px; text-align:center; box-sizing:border-box;">
        This looks correct
      </a>
      <a href="${SITE_BASE}/spec-approval/sample-token?status=rejected"
         style="display:block; max-width:280px; margin:0 auto; background:#fff; color:#374151; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:4px; border:1px solid #d1d5db; text-align:center; box-sizing:border-box;">
        Something needs changing
      </a>
    </div>
    <p>If you have any questions or would like to make changes, please call us on <strong>${PHONE}</strong> or reply to this email.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: specTableCss,
    footerNote: 'If you did not request this summary, please disregard this email.',
  });
}

function generateSpecSummaryComparison(): string {
  const upgradesList = UPGRADES.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('');
  const optionBlock = (opt: 'A' | 'B', van: string, kit: string, sub: number, v: number, tot: number) => `
    <div style="border:1px solid #e5e7eb; border-radius:6px; padding:20px; margin-bottom:20px; background:#fff;">
      <p style="font-weight:bold; font-size:15px; margin:0 0 12px; color:${BRAND_DARK};">Option ${opt}</p>
      <table>
        <tr><td>Van</td><td>${van}</td></tr>
        <tr><td>Pack</td><td>${kit}</td></tr>
        <tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradesList}</ul></td></tr>
        <tr><td>Subtotal (ex. VAT)</td><td>${fmt(sub)}</td></tr>
        <tr><td>VAT (20%)</td><td>${fmt(v)}</td></tr>
        <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(tot)}</td></tr>
      </table>
      <h4 style="margin:12px 0 6px; color:#374151; font-size:13px;">Finance Option (HP — 10.9% APR)</h4>
      <table>
        <tr><td>Deposit</td><td>${fmt(DEPOSIT)}</td></tr>
        <tr><td>Finance Term</td><td>${TERM} months (5 years)</td></tr>
        <tr><td>Monthly Payment (est.)</td><td style="font-weight:bold; color:${BRAND_GREEN};">${fmt(opt === 'A' ? MONTHLY : 27800)}/month</td></tr>
        <tr><td>Weekly Payment (est.)</td><td>${fmt(opt === 'A' ? WEEKLY : 6420)}/week</td></tr>
      </table>
      <div style="text-align:center; margin-top:16px;">
        <a href="${SITE_BASE}/api/quotes/${QUOTE_ID}/choose-option?option=${opt}"
           style="display:block;max-width:240px;margin:0 auto;background:${BRAND_GREEN};color:${BRAND_DARK};font-weight:bold;font-size:15px;padding:13px 24px;border-radius:4px;text-decoration:none;text-align:center;box-sizing:border-box;">
          I choose Option ${opt}
        </a>
      </div>
    </div>`;

  const body = `
    <p>Hi ${CUSTOMER_NAME},</p>
    <p>We've prepared two options for you to compare. Please review both below and click the button under the one you'd like to go ahead with — we'll be notified straight away.</p>
    <div class="ref-box">
      <p><strong>Reference:</strong> #${REF}</p>
      <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
    </div>
    ${optionBlock('A', VAN_TITLE, KIT_NAME, SUBTOTAL, VAT, TOTAL)}
    ${optionBlock('B', 'Mercedes-Benz Sprinter 316 CDi 2023', 'Gold Pack – 10 Wheel Tyre Changer', 1300000, 260000, 1560000)}
    <div class="note-box"><strong>Note from our team:</strong><br>Option B includes our premium racking system which gives you more storage capacity for a busy mobile operation.</div>
    <p>If you have any questions, please call us on <strong>${PHONE}</strong> or reply to this email.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: specTableCss,
    footerNote: 'If you did not request this summary, please disregard this email.',
  });
}

function generateQuoteConfirmation(): string {
  const body = `
    <p>Hi ${CUSTOMER_NAME},</p>
    <p>Thank you for requesting a quote for your mobile tyre van conversion. We've reviewed your configuration and are pleased to present your custom quote.</p>
    <div class="price-box">
      <h2 style="margin-top: 0;">Quote #${REF}</h2>
      <div class="savings">Special Discount Applied — You Save £500.00!</div>
      <p style="font-size: 28px; font-weight: bold; color: ${BRAND_GREEN}; margin: 10px 0;">${fmt(TOTAL - 50000)}</p>
      <p style="color: #6b7280; margin: 0;">Including VAT</p>
    </div>
    <div class="note-box">
      <h3 style="margin-top: 0; color: #1e40af;">Note from our team:</h3>
      <p style="margin: 0; white-space: pre-wrap;">We've applied your loyalty discount and have matched the finance rate you enquired about. Looking forward to getting you on the road!</p>
    </div>
    <p>To proceed with your order, please review and confirm your quote by clicking the button below:</p>
    <div style="text-align: center;">
      <a href="${SITE_BASE}/quote/confirm/sample-token" class="cta-btn">Review &amp; Confirm Quote</a>
    </div>
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">This confirmation link is for one-time use and will expire after confirmation.</p>
    <p>If you have any questions, please call us on <strong>${PHONE}</strong>.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: `
      .price-box { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .cta-btn { display: block; max-width: 280px; margin: 20px auto; background-color: ${BRAND_GREEN}; color: ${BRAND_DARK}; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; text-align: center; box-sizing: border-box; }
      .savings { background-color: #dcfce7; color: #166534; padding: 15px; border-radius: 8px; margin: 15px 0; font-weight: bold; }
      .note-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; }
      @media screen and (max-width: 600px) { .cta-btn { max-width: 100% !important; } }
    `,
    footerNote: "If you didn't request this quote, please disregard this email.",
  });
}

function generateFinanceSubmission(): string {
  const rows = UPGRADES.map(u => `<tr><td style="color:#111;font-weight:500;">Upgrade</td><td>${u}</td></tr>`).join('');
  const body = `
    <p>Please find below the details for a finance application from one of our customers who would like to proceed with a van conversion.</p>

    <div class="section-title">Customer Details</div>
    <table>
      <tr><td>Name</td><td>${CUSTOMER_NAME}</td></tr>
      <tr><td>Phone</td><td>${CUSTOMER_PHONE}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${CUSTOMER_EMAIL}">${CUSTOMER_EMAIL}</a></td></tr>
      <tr><td>Reference</td><td><span class="ref-pill">#${REF}</span></td></tr>
    </table>

    <div class="section-title">Vehicle Details</div>
    <table>
      <tr><td>Van</td><td>${VAN_TITLE}</td></tr>
      <tr><td>Registration</td><td><strong>AB23 CDE</strong></td></tr>
      <tr><td>Mileage</td><td>24,500 miles</td></tr>
    </table>

    <div class="section-title">Conversion Specification (ex. VAT)</div>
    <table>
      <tr><td style="color:#111;font-weight:500;">Equipment Pack</td><td>${KIT_NAME}<span style="float:right;font-weight:600;">${fmt(SUBTOTAL - 150000)}</span></td></tr>
      ${rows}
    </table>

    <div class="section-title">Pricing</div>
    <table>
      <tr><td>Subtotal (ex. VAT)</td><td>${fmt(SUBTOTAL)}</td></tr>
      <tr><td>VAT (20%)</td><td>${fmt(VAT)}</td></tr>
      <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(TOTAL)}</td></tr>
    </table>

    <div class="section-title">Finance Details</div>
    <table>
      <tr><td>Plan Type</td><td>Hire Purchase (HP)</td></tr>
      <tr><td>APR</td><td>10.90%</td></tr>
      <tr><td>Deposit</td><td>${fmt(DEPOSIT)}</td></tr>
      <tr><td>Term</td><td>${TERM} months</td></tr>
      <tr><td>Monthly Payment</td><td>${fmt(MONTHLY)}</td></tr>
      <tr><td>Weekly Payment</td><td>${fmt(WEEKLY)}</td></tr>
    </table>

    <p style="margin-top:24px;">Please contact the customer directly to progress the finance application. If you have any questions, please reply to this email or call us on <strong>${PHONE}</strong>.</p>
    <p>Kind regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    maxWidth: 650,
    extraCss: `
      .section-title { font-size: 14px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid ${BRAND_GREEN}; padding-bottom: 6px; margin: 24px 0 12px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; word-break: break-word; }
      td:first-child { color: #6b7280; width: 40%; font-weight: 500; }
      .total-row td { font-weight: bold; font-size: 17px; border-top: 2px solid ${BRAND_GREEN}; border-bottom: none; }
      .total-row td:last-child { color: ${BRAND_GREEN}; }
      .ref-pill { display: inline-block; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px 12px; font-family: monospace; font-size: 14px; font-weight: bold; }
    `,
  });
}

function generateOptionChosenAdmin(): string {
  const upgradesList = UPGRADES.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('');
  const body = `
    <div style="display:inline-block; background:${BRAND_GREEN}; color:${BRAND_DARK}; font-weight:bold; font-size:13px; padding:4px 14px; border-radius:4px; margin-bottom:16px;">Option A Selected</div>
    <h3 style="margin-top:0;">Customer Details</h3>
    <table>
      <tr><td>Name</td><td>${CUSTOMER_NAME}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${CUSTOMER_EMAIL}">${CUSTOMER_EMAIL}</a></td></tr>
      <tr><td>Phone</td><td>${CUSTOMER_PHONE}</td></tr>
      <tr><td>Reference</td><td>#${REF}</td></tr>
    </table>
    <h3>Chosen Configuration (Option A)</h3>
    <table>
      <tr><td>Van</td><td>${VAN_TITLE}</td></tr>
      <tr><td>Pack</td><td>${KIT_NAME}</td></tr>
      <tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradesList}</ul></td></tr>
      <tr class="total"><td>Total (inc. VAT)</td><td>${fmt(TOTAL)}</td></tr>
    </table>
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">Log in to the admin panel to view the full quote and continue the build process.</p>
  `;
  return emailLayout(body, {
    extraCss: `
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
      td:first-child { font-weight: bold; color: #6b7280; width: 35%; }
      .total td { font-weight: bold; font-size: 15px; border-top: 2px solid ${BRAND_GREEN}; }
    `,
  });
}

function generateLeadReceivedCustomer(): string {
  const body = `
    <p>Hi ${CUSTOMER_NAME},</p>
    <p>Thank you for getting in touch with Mobile Tyre Van City. We've received your enquiry and one of our team will be in touch with you shortly.</p>
    <div class="ref-box">
      <p><strong>Your reference number:</strong> #XYZ98765</p>
      <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
    </div>
    <p><strong>Your message:</strong><br><em>"I'm interested in setting up a mobile tyre fitting business and would like to discuss the different van conversion packages you offer. Could you give me a call when convenient?"</em></p>
    <p>If you need to speak to us urgently, please call <strong>${PHONE}</strong>.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: `
      .ref-box { background: #f3f4f6; border-left: 4px solid ${BRAND_GREEN}; padding: 15px 20px; border-radius: 4px; margin: 20px 0; }
      .ref-box p { margin: 0; }
    `,
    footerNote: 'If you did not submit this enquiry, please disregard this email.',
  });
}

function generateLeadReceivedAdmin(): string {
  const body = `
    <h2 style="color:${BRAND_DARK}; border-bottom: 3px solid ${BRAND_GREEN}; padding-bottom: 8px;">New Enquiry Received</h2>
    <table>
      <tr><td>Name</td><td>${CUSTOMER_NAME}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${CUSTOMER_EMAIL}">${CUSTOMER_EMAIL}</a></td></tr>
      <tr><td>Phone</td><td>${CUSTOMER_PHONE}</td></tr>
      <tr><td>Reference</td><td>#XYZ98765</td></tr>
    </table>
    <p><strong>Message:</strong></p>
    <div class="message-box">I'm interested in setting up a mobile tyre fitting business and would like to discuss the different van conversion packages you offer. Could you give me a call when convenient?</div>
  `;
  return emailLayout(body, {
    extraCss: `
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
      td:first-child { font-weight: bold; color: #6b7280; width: 35%; }
      .message-box { background: #f9fafb; padding: 15px; border-radius: 4px; border-left: 4px solid ${BRAND_GREEN}; margin-top: 16px; white-space: pre-wrap; font-size: 14px; }
    `,
  });
}

function generateWelcomeEmail(): string {
  const body = `
    <p>Hi Sarah,</p>
    <p>An account has been created for you on the Mobile Tyre Van City portal. You can use the details below to sign in.</p>
    <div class="credentials-box">
      <table>
        <tr><td>Username</td><td>sarah.jones</td></tr>
        <tr><td>Password</td><td>TempPass#2024!</td></tr>
      </table>
    </div>
    <div style="text-align:center;">
      <a href="${SITE_BASE}/login" class="cta-btn">Sign In Now</a>
    </div>
    <p style="color:#6b7280; font-size:13px; margin-top:20px;">For your security, we recommend changing your password after your first login. If you have any trouble accessing your account, please call us on <strong>${PHONE}</strong> or reply to this email.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: `
      .credentials-box { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 20px 24px; margin: 20px 0; }
      .credentials-box table { width: 100%; border-collapse: collapse; }
      .credentials-box td { padding: 6px 0; font-size: 15px; }
      .credentials-box td:first-child { color: #6b7280; width: 38%; font-weight: 500; }
      .credentials-box td:last-child { font-weight: bold; font-family: monospace; font-size: 15px; }
      .cta-btn { display: block; max-width: 240px; margin: 16px auto; background-color: ${BRAND_GREEN}; color: ${BRAND_DARK}; text-decoration: none; padding: 13px 28px; border-radius: 4px; font-weight: bold; font-size: 15px; text-align: center; box-sizing: border-box; }
    `,
    footerNote: `If you did not expect this email, please contact us immediately on ${PHONE}.`,
  });
}

function generateSetPassword(): string {
  const setPasswordUrl = `${SITE_BASE}/reset-password/sample-token-12345`;
  const body = `
    <p>Hi Sarah,</p>
    <p>You've been set up as an admin on the <strong>Mobile Tyre Van City</strong> portal. To get started, you'll need to set your own password using the button below.</p>
    <div class="info-box">
      <table>
        <tr><td>Username</td><td>sarah.jones</td></tr>
      </table>
    </div>
    <p style="text-align:center;">
      <a href="${setPasswordUrl}" class="cta-btn">Set Your Password</a>
    </p>
    <p class="expiry-note">This link will expire in <strong>24 hours</strong>. If you weren't expecting this email, you can ignore it safely — no account access will be granted without setting a password.</p>
    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break:break-all; font-size:13px; color:#6b7280;">${setPasswordUrl}</p>
    <p>If you have any trouble, call us on <strong>${PHONE}</strong> or reply to this email.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: `
      .info-box { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 20px 24px; margin: 20px 0; }
      .info-box table { width: 100%; border-collapse: collapse; }
      .info-box td { padding: 6px 0; font-size: 15px; }
      .info-box td:first-child { color: #6b7280; width: 38%; font-weight: 500; }
      .info-box td:last-child { font-weight: bold; }
      .cta-btn { display: inline-block; background-color: ${BRAND_GREEN}; color: ${BRAND_DARK}; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-weight: bold; font-size: 16px; margin: 20px 0; }
      .expiry-note { color: #6b7280; font-size: 13px; margin-top: 0; }
    `,
    footerNote: `If you did not expect this email, please contact us on ${PHONE}.`,
  });
}

function generatePasswordReset(): string {
  const resetUrl = `${SITE_BASE}/reset-password/sample-reset-token-abc`;
  const body = `
    <p>Hi ${CUSTOMER_NAME},</p>
    <p>We received a request to reset the password for your account (<strong>john.smith</strong>). Click the button below to set a new password.</p>
    <p style="text-align:center;">
      <a href="${resetUrl}" class="cta-btn">Reset My Password</a>
    </p>
    <p style="color:#6b7280; font-size:13px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <div class="url-box">${resetUrl}</div>
    <p style="color:#6b7280; font-size:13px;"><strong>This link will expire in 1 hour.</strong> If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: `
      .cta-btn { display: inline-block; background-color: ${BRAND_GREEN}; color: ${BRAND_DARK}; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-weight: bold; font-size: 15px; margin: 20px 0; }
      .url-box { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 12px 16px; margin: 16px 0; font-family: monospace; font-size: 12px; word-break: break-all; color: #374151; }
    `,
    footerNote: `If you need help, call us on ${PHONE}.`,
  });
}

function generateDepotInvoice(): string {
  const upgradesList = UPGRADES.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('');
  const body = `
    <div class="ref-box">Invoice Request — Quote <strong>#${REF}</strong></div>

    <div class="section-title">Customer</div>
    <table>
      <tr><td>Name</td><td>${CUSTOMER_NAME}</td></tr>
      <tr><td>Phone</td><td>${CUSTOMER_PHONE}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${CUSTOMER_EMAIL}">${CUSTOMER_EMAIL}</a></td></tr>
    </table>

    <div class="section-title">Van Details</div>
    <table>
      <tr><td colspan="2" style="padding:5px 12px; font-size:14px; color:#374151;">${VAN_TITLE}</td></tr>
      <tr><td colspan="2" style="padding:5px 12px; font-size:14px; color:#374151;">Reg: AB23 CDE</td></tr>
      <tr><td colspan="2" style="padding:5px 12px; font-size:14px; color:#374151;">Mileage: 24,500 miles</td></tr>
      <tr><td colspan="2" style="padding:5px 12px; font-size:14px; color:#374151;">Transmission: Manual</td></tr>
      <tr><td colspan="2" style="padding:5px 12px; font-size:14px; color:#374151;">Fuel: Diesel</td></tr>
    </table>

    <div class="section-title">Build Specification</div>
    <table>
      <tr><td style="font-weight:500;">Conversion Pack</td><td>${KIT_NAME}</td></tr>
      <tr><td style="font-weight:500;">Upgrades</td><td><ul style="margin:4px 0; padding-left:18px;">${upgradesList}</ul></td></tr>
      <tr><td style="font-weight:500;">Bespoke Extras</td><td><ul style="margin:4px 0; padding-left:18px;"><li>Custom livery wrap — £850.00</li></ul></td></tr>
    </table>

    <div class="section-title">Pricing</div>
    <table>
      <tr><td>Subtotal (ex. VAT)</td><td>${fmt(SUBTOTAL)}</td></tr>
      <tr><td>VAT (20%)</td><td>${fmt(VAT)}</td></tr>
      <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(TOTAL)}</td></tr>
      <tr><td colspan="2" style="padding:10px 12px 4px; font-weight:bold; font-size:13px; color:${BRAND_DARK}; border-top:1px solid #e5e7eb;">Finance (HP – 10.9% APR est.)</td></tr>
      <tr><td>Deposit</td><td>${fmt(DEPOSIT)}</td></tr>
      <tr><td>Term</td><td>${TERM} months (5 yr)</td></tr>
      <tr><td>Monthly (est.)</td><td style="font-weight:bold; color:${BRAND_GREEN};">${fmt(MONTHLY)}/month</td></tr>
      <tr><td>Weekly (est.)</td><td>${fmt(WEEKLY)}/week</td></tr>
    </table>
  `;
  return emailLayout(body, {
    maxWidth: 620,
    extraCss: `
      .ref-box { background: #f3f4f6; border-left: 4px solid ${BRAND_GREEN}; padding: 12px 18px; border-radius: 4px; margin-bottom: 20px; font-size: 15px; }
      .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 20px 0 6px; }
      table { width: 100%; border-collapse: collapse; margin: 0 0 12px; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; word-break: break-word; }
      td:first-child { color: #6b7280; width: 38%; }
      .total-row td { font-weight: bold; font-size: 15px; border-top: 2px solid ${BRAND_GREEN}; border-bottom: none; }
      .total-row td:last-child { color: ${BRAND_GREEN}; }
    `,
  });
}

function generateTestimonialRequest(): string {
  const body = `
    <p>Hi ${CUSTOMER_NAME},</p>
    <p>Thank you for choosing Mobile Tyre Van City. We hope you're delighted with your new mobile tyre van.</p>
    <p>We'd be really grateful if you could spare 2 minutes to leave us a quick review. It helps other people make confident decisions and means a lot to our team.</p>
    <div class="stars">&#9733; &#9733; &#9733; &#9733; &#9733;</div>
    <div style="text-align:center;">
      <a href="${SITE_BASE}/testimonial/sample-token" class="cta-btn">Leave a review</a>
    </div>
    <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top:12px;">Or copy this link into your browser:<br />${SITE_BASE}/testimonial/sample-token</p>
  `;
  return emailLayout(body, {
    extraCss: `
      .cta-btn { display: block; max-width: 260px; margin: 24px auto; background-color: ${BRAND_GREEN}; color: ${BRAND_DARK}; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; text-align: center; box-sizing: border-box; }
      .stars { font-size: 28px; letter-spacing: 4px; text-align: center; margin: 16px 0; color: ${BRAND_GREEN}; }
    `,
    footerNote: 'This link is personal to you and can only be used once.',
  });
}

function generateQuoteSpecSummarySingle(): string {
  const upgradesList = UPGRADES.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('');
  const DISCOUNT = 50000;
  const TOTAL_AFTER_DISCOUNT = TOTAL - DISCOUNT;
  const body = `
    <p>Hi ${CUSTOMER_NAME},</p>
    <p>Thank you for speaking with us today. As discussed, please find below a summary of your configured mobile tyre van conversion.</p>
    <div class="ref-box">
      <p><strong>Reference:</strong> #${REF}</p>
      <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
    </div>
    <h3 style="margin-bottom:8px;">Your Configuration</h3>
    <table>
      <tr><td>Van</td><td>${VAN_TITLE}</td></tr>
      <tr><td>Pack</td><td>${KIT_NAME}</td></tr>
      <tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradesList}</ul></td></tr>
      <tr><td>Bespoke Extras</td><td><ul style="margin:2px 0;padding-left:18px;"><li style="margin-bottom:2px;">Custom livery wrap — £850.00</li><li style="margin-bottom:2px;">Roof rack system — £420.00</li></ul></td></tr>
    </table>
    <h3 style="margin-bottom:8px;">Pricing</h3>
    <table>
      <tr><td>Original Price (inc. VAT)</td><td>${fmt(TOTAL)}</td></tr>
      <tr><td style="color:#166534;">Discount</td><td style="color:#166534;">-${fmt(DISCOUNT)}</td></tr>
      <tr><td>Subtotal (ex. VAT)</td><td>${fmt(SUBTOTAL)}</td></tr>
      <tr><td>VAT (20%)</td><td>${fmt(VAT)}</td></tr>
      <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(TOTAL_AFTER_DISCOUNT)}</td></tr>
    </table>
    <h3 style="margin-bottom:8px; margin-top:24px;">Finance Option (HP — 10.9% APR)</h3>
    <table>
      <tr><td>Deposit</td><td>${fmt(DEPOSIT)}</td></tr>
      <tr><td>Finance Term</td><td>${TERM} months (5 years)</td></tr>
      <tr><td>Estimated Monthly Payment</td><td style="font-weight:bold; color:${BRAND_GREEN};">${fmt(MONTHLY)}/month</td></tr>
      <tr><td>Estimated Weekly Payment</td><td>${fmt(WEEKLY)}/week (approx.)</td></tr>
    </table>
    <p style="font-size:12px; color:#6b7280; margin-top:-8px;">Finance figures are estimates based on Hire Purchase at 10.9% APR. Subject to status and final agreement.</p>
    <div class="note-box"><strong>Note from our team:</strong><br>We've applied a loyalty discount and factored in your preference for a manual racking system. This is reflected in the specification above.</div>
    <div style="margin: 28px 0; padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; text-align: center;">
      <p style="font-size: 15px; font-weight: bold; margin: 0 0 6px;">Does this look correct?</p>
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 20px;">Please let us know whether the spec above is right, or if anything needs changing.</p>
      <a href="${SITE_BASE}/spec-approval/sample-token?status=approved"
         style="display:block; max-width:280px; margin:0 auto 12px; background:${BRAND_GREEN}; color:${BRAND_DARK}; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:4px; text-align:center; box-sizing:border-box;">
        This looks correct
      </a>
      <a href="${SITE_BASE}/spec-approval/sample-token?status=rejected"
         style="display:block; max-width:280px; margin:0 auto; background:#fff; color:#374151; font-weight:bold; font-size:15px; text-decoration:none; padding:14px 28px; border-radius:4px; border:1px solid #d1d5db; text-align:center; box-sizing:border-box;">
        Something needs changing
      </a>
    </div>
    <p>If you have any questions or would like to make changes, please call us on <strong>${PHONE}</strong> or reply to this email.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: specTableCss,
    footerNote: 'If you did not request this summary, please disregard this email.',
  });
}

function generateQuoteSpecSummaryComparison(): string {
  const upgradesListA = UPGRADES.map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('');
  const upgradesListB = ['Nitrogen Generator', 'Heavy Duty Drawer System', 'Wheel Balancer Upgrade'].map(u => `<li style="margin-bottom:2px;">${u}</li>`).join('');

  const chosenOption = 'B';
  const SUBTOTAL_B = 1300000;
  const VAT_B = 260000;
  const TOTAL_B = 1560000;
  const MONTHLY_B = 27800;
  const WEEKLY_B = 6420;

  const chosenBadge = (opt: 'A' | 'B') =>
    chosenOption === opt
      ? ` <span style="background:${BRAND_GREEN};color:${BRAND_DARK};font-size:11px;padding:2px 8px;border-radius:4px;font-weight:bold;vertical-align:middle;">CHOSEN</span>`
      : '';

  const optionBlock = (
    opt: 'A' | 'B',
    vanTitle: string,
    kitName: string,
    upgradesList: string,
    sub: number,
    v: number,
    tot: number,
    monthly: number,
    weekly: number,
  ) => {
    const isChosen = chosenOption === opt;
    const borderStyle = isChosen ? `border:2px solid ${BRAND_GREEN};` : 'border:1px solid #e5e7eb;';
    return `
      <div style="${borderStyle} border-radius:6px; padding:20px; margin-bottom:20px; background:#fff;">
        <p style="font-weight:bold; font-size:15px; margin:0 0 12px; color:${BRAND_DARK};">
          Option ${opt}${chosenBadge(opt)}
        </p>
        <table>
          <tr><td>Van</td><td>${vanTitle}</td></tr>
          <tr><td>Pack</td><td>${kitName}</td></tr>
          <tr><td>Upgrades</td><td><ul style="margin:2px 0;padding-left:18px;">${upgradesList}</ul></td></tr>
          <tr><td>Subtotal (ex. VAT)</td><td>${fmt(sub)}</td></tr>
          <tr><td>VAT (20%)</td><td>${fmt(v)}</td></tr>
          <tr class="total-row"><td>Total (inc. VAT)</td><td>${fmt(tot)}</td></tr>
        </table>
        <h4 style="margin:12px 0 6px; color:#374151; font-size:13px;">Finance Option (HP — 10.9% APR)</h4>
        <table>
          <tr><td>Deposit</td><td>${fmt(DEPOSIT)}</td></tr>
          <tr><td>Finance Term</td><td>${TERM} months (5 years)</td></tr>
          <tr><td>Monthly Payment (est.)</td><td style="font-weight:bold; color:${BRAND_GREEN};">${fmt(monthly)}/month</td></tr>
          <tr><td>Weekly Payment (est.)</td><td>${fmt(weekly)}/week</td></tr>
        </table>
      </div>`;
  };

  const chosenConfirmBlock = `
    <div style="margin:24px 0; padding:20px; background:#f0fdf4; border:2px solid ${BRAND_GREEN}; border-radius:6px; text-align:center;">
      <p style="font-size:16px; font-weight:bold; color:#166534; margin:0 0 6px;">Option ${chosenOption} selected</p>
      <p style="font-size:13px; color:#166534; margin:0;">Our team will be in touch to confirm your order. Call us on <strong>${PHONE}</strong> if you have any questions.</p>
    </div>`;

  const body = `
    <p>Hi ${CUSTOMER_NAME},</p>
    <p>You have selected <strong>Option ${chosenOption}</strong> as your final choice. Our team will be in touch shortly to confirm next steps.</p>
    <div class="ref-box">
      <p><strong>Reference:</strong> #${REF}</p>
      <p style="margin-top:6px; color:#6b7280; font-size:13px;">Please quote this reference in any correspondence with us.</p>
    </div>
    ${chosenConfirmBlock}
    ${optionBlock('A', VAN_TITLE, KIT_NAME, upgradesListA, SUBTOTAL, VAT, TOTAL, MONTHLY, WEEKLY)}
    ${optionBlock('B', 'Mercedes-Benz Sprinter 316 CDi 2023', 'Gold Pack – 10 Wheel Tyre Changer', upgradesListB, SUBTOTAL_B, VAT_B, TOTAL_B, MONTHLY_B, WEEKLY_B)}
    <div class="note-box"><strong>Note from our team:</strong><br>Option B includes our premium racking system which gives you more storage capacity for a busy mobile operation.</div>
    <p>If you have any questions, please call us on <strong>${PHONE}</strong> or reply to this email.</p>
    <p>Best regards,<br><strong>Mobile Tyre Van City</strong></p>
  `;
  return emailLayout(body, {
    extraCss: specTableCss,
    footerNote: 'If you did not request this summary, please disregard this email.',
  });
}

export const SPEC_SUMMARY_TEST_ARGS = {
  single: {
    customerName: CUSTOMER_NAME,
    quoteId: QUOTE_ID,
    vanTitle: VAN_TITLE,
    kitName: KIT_NAME,
    upgradeNames: [...UPGRADES],
    subtotal: SUBTOTAL,
    vat: VAT,
    total: TOTAL,
    customerNote: "We've taken into account your preference for a manual racking system. This has been reflected in the specification above.",
    approvalToken: 'sample-token',
    financeInfo: { depositAmount: DEPOSIT, termMonths: TERM, monthlyPayment: MONTHLY, weeklyPayment: WEEKLY },
    customExtras: [
      { id: 'e1', description: 'Custom livery wrap', pricePence: 85000 },
    ],
  },
  comparison: {
    customerName: CUSTOMER_NAME,
    quoteId: QUOTE_ID,
    vanTitle: VAN_TITLE,
    kitName: KIT_NAME,
    upgradeNames: [...UPGRADES],
    subtotal: SUBTOTAL,
    vat: VAT,
    total: TOTAL,
    customerNote: 'Option B includes our premium racking system which gives you more storage capacity for a busy mobile operation.',
    financeInfo: { depositAmount: DEPOSIT, termMonths: TERM, monthlyPayment: MONTHLY, weeklyPayment: WEEKLY },
    comparisonSlotB: {
      vanTitle: 'Mercedes-Benz Sprinter 316 CDi 2023',
      kitName: 'Gold Pack – 10 Wheel Tyre Changer',
      upgradeNames: [...UPGRADES],
      estSubtotal: 1300000,
      estVAT: 260000,
      estTotal: 1560000,
      financeInfo: { depositAmount: DEPOSIT, termMonths: TERM, monthlyPayment: 27800, weeklyPayment: 6420 },
    },
  },
};

export const QUOTE_SPEC_SUMMARY_TEST_ARGS = {
  single: {
    customerName: CUSTOMER_NAME,
    quoteId: QUOTE_ID,
    vanTitle: VAN_TITLE,
    kitName: KIT_NAME,
    upgradeNames: [...UPGRADES],
    subtotal: SUBTOTAL,
    vat: VAT,
    total: TOTAL,
    discount: 50000,
    customerNote: "We've applied a loyalty discount and factored in your preference for a manual racking system. This is reflected in the specification above.",
    approvalToken: 'sample-token',
    financeInfo: { depositAmount: DEPOSIT, termMonths: TERM, monthlyPayment: MONTHLY, weeklyPayment: WEEKLY },
    customExtras: [
      { id: 'e1', description: 'Custom livery wrap', pricePence: 85000 },
      { id: 'e2', description: 'Roof rack system', pricePence: 42000 },
    ],
  },
  comparison: {
    customerName: CUSTOMER_NAME,
    quoteId: QUOTE_ID,
    vanTitle: VAN_TITLE,
    kitName: KIT_NAME,
    upgradeNames: [...UPGRADES],
    subtotal: SUBTOTAL,
    vat: VAT,
    total: TOTAL,
    customerNote: 'Option B includes our premium racking system which gives you more storage capacity for a busy mobile operation.',
    financeInfo: { depositAmount: DEPOSIT, termMonths: TERM, monthlyPayment: MONTHLY, weeklyPayment: WEEKLY },
    comparisonSlotB: {
      vanTitle: 'Mercedes-Benz Sprinter 316 CDi 2023',
      kitName: 'Gold Pack – 10 Wheel Tyre Changer',
      upgradeNames: ['Nitrogen Generator', 'Heavy Duty Drawer System', 'Wheel Balancer Upgrade'],
      estSubtotal: 1300000,
      estVAT: 260000,
      estTotal: 1560000,
      financeInfo: { depositAmount: DEPOSIT, termMonths: TERM, monthlyPayment: 27800, weeklyPayment: 6420 },
    },
    chosenOption: 'B' as const,
  },
};

export function generatePreviewHtml(templateId: string): string | null {
  switch (templateId) {
    case 'enquiry-received-customer': return generateEnquiryReceivedCustomer();
    case 'enquiry-received-admin': return generateEnquiryReceivedAdmin();
    case 'spec-summary-single': return generateSpecSummarySingle();
    case 'spec-summary-comparison': return generateSpecSummaryComparison();
    case 'quote-confirmation': return generateQuoteConfirmation();
    case 'finance-submission': return generateFinanceSubmission();
    case 'option-chosen-admin': return generateOptionChosenAdmin();
    case 'lead-received-customer': return generateLeadReceivedCustomer();
    case 'lead-received-admin': return generateLeadReceivedAdmin();
    case 'welcome-email': return generateWelcomeEmail();
    case 'set-password': return generateSetPassword();
    case 'password-reset': return generatePasswordReset();
    case 'depot-invoice': return generateDepotInvoice();
    case 'testimonial-request': return generateTestimonialRequest();
    case 'quote-spec-summary-single': return generateQuoteSpecSummarySingle();
    case 'quote-spec-summary-comparison': return generateQuoteSpecSummaryComparison();
    default: return null;
  }
}
