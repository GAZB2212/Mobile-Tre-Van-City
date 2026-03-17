import * as React from 'react';
import {
  BaseEmail,
  EmailHeading,
  EmailParagraph,
  EmailSectionTitle,
  EmailTable,
  EmailTotalRow,
  paragraphStyle,
} from './BaseEmail';
import { Section, Text, Link } from '@react-email/components';

export interface FinanceFollowUpProps {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  reference: string;
  vanTitle?: string | null;
  vanRegistration?: string | null;
  vanMileage?: number | null;
  kitName?: string | null;
  upgradeNames?: string[];
  subtotal: string;
  vat: string;
  total: string;
  discount?: string | null;
  financeDetails?: {
    planType: string;
    apr: string;
    depositAmount: string;
    termMonths: number;
    monthlyPayment: string;
    weeklyPayment: string;
  };
  phoneNumber?: string;
  financeLink?: string;
}

export function FinanceFollowUp({
  customerName,
  customerPhone,
  customerEmail,
  reference,
  vanTitle,
  vanRegistration,
  vanMileage,
  kitName,
  upgradeNames = [],
  subtotal,
  vat,
  total,
  discount,
  financeDetails,
  phoneNumber = '0151 203 8500',
  financeLink,
}: FinanceFollowUpProps) {
  const customerRows: Array<[string, React.ReactNode]> = [
    ['Name', customerName],
    ['Phone', customerPhone],
    ['Email', <Link href={`mailto:${customerEmail}`} style={{ color: '#8bc440' }}>{customerEmail}</Link>],
    ['Reference', `#${reference}`],
  ];

  const vehicleRows: Array<[string, string]> = [];
  if (vanTitle) vehicleRows.push(['Van', vanTitle]);
  if (vanRegistration) vehicleRows.push(['Registration', vanRegistration.toUpperCase()]);
  if (vanMileage != null) vehicleRows.push(['Mileage', `${vanMileage.toLocaleString('en-GB')} miles`]);

  const conversionRows: Array<[string, string]> = [];
  if (kitName) conversionRows.push(['Equipment Pack', kitName]);
  upgradeNames.forEach(u => conversionRows.push(['Upgrade', u]));

  const pricingRows: Array<[string, string]> = [['Subtotal (ex. VAT)', subtotal]];
  if (discount) pricingRows.push(['Discount', discount]);
  pricingRows.push(['VAT (20%)', vat]);

  const financeRows: Array<[string, string]> = financeDetails ? [
    ['Plan Type', financeDetails.planType],
    ['APR', financeDetails.apr],
    ['Deposit', financeDetails.depositAmount],
    ['Term', `${financeDetails.termMonths} months`],
    ['Monthly Payment', financeDetails.monthlyPayment],
    ['Weekly Payment', financeDetails.weeklyPayment],
  ] : [];

  return (
    <BaseEmail
      previewText={`Finance Application — ${customerName} — Ref #${reference}`}
      eyebrow="Finance Application"
    >
      <EmailHeading>Finance Application — Ref #{reference}</EmailHeading>

      <EmailParagraph>
        Please find below the details for a finance application from one of our customers who would like to proceed with a van conversion.
      </EmailParagraph>

      <EmailSectionTitle>Customer Details</EmailSectionTitle>
      <EmailTable rows={customerRows} />

      {vehicleRows.length > 0 && (
        <>
          <EmailSectionTitle>Vehicle Details</EmailSectionTitle>
          <EmailTable rows={vehicleRows} />
        </>
      )}

      {conversionRows.length > 0 && (
        <>
          <EmailSectionTitle>Conversion Specification</EmailSectionTitle>
          <EmailTable rows={conversionRows} />
        </>
      )}

      <EmailSectionTitle>Pricing</EmailSectionTitle>
      <EmailTable rows={pricingRows} />
      <EmailTotalRow label="Total (inc. VAT)" value={total} />

      {financeDetails && financeRows.length > 0 && (
        <>
          <EmailSectionTitle>Finance Details</EmailSectionTitle>
          <EmailTable rows={financeRows} />
        </>
      )}

      {financeLink && (
        <Section style={{ margin: '20px 0', padding: '16px', backgroundColor: '#f8f8f8', borderRadius: '6px' }}>
          <Text style={{ color: '#333', fontSize: '13px', margin: '0 0 8px' }}>
            Finance application link:
          </Text>
          <Link href={financeLink} style={{ color: '#8bc440', fontSize: '13px', wordBreak: 'break-all' }}>
            {financeLink}
          </Link>
        </Section>
      )}

      <Section style={{ margin: '28px 0 0' }}>
        <Text style={paragraphStyle}>
          Please contact the customer directly to progress the finance application. If you have any questions, please reply to this email or call us on{' '}
          <Link href={`tel:${phoneNumber.replace(/\s/g, '')}`} style={{ color: '#8bc440' }}>
            {phoneNumber}
          </Link>.
        </Text>
        <Text style={paragraphStyle}>
          Kind regards,<br />
          <strong>Mobile Tyre Van City</strong><br />
          5–7 Bassendale Road, Bromborough, Wirral, CH62 3QL<br />
          {phoneNumber}
        </Text>
      </Section>

      <Section style={{ borderTop: '1px solid #e5e7eb', marginTop: '24px', paddingTop: '16px' }}>
        <Text style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
          Sent on behalf of Mobile Tyre Van City &bull; www.mobiletyrevancity.co.uk
        </Text>
      </Section>
    </BaseEmail>
  );
}
