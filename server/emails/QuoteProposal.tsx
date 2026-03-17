import * as React from 'react';
import {
  BaseEmail,
  EmailHeading,
  EmailParagraph,
  EmailRefBox,
  EmailSectionTitle,
  EmailTable,
  EmailTotalRow,
  EmailCta,
  EmailNote,
  EmailSavingsBadge,
  paragraphStyle,
} from './BaseEmail';
import { Section, Text, Link } from '@react-email/components';

export interface QuoteProposalProps {
  customerName: string;
  reference: string;
  vanTitle?: string | null;
  kitName?: string | null;
  upgradeNames?: string[];
  subtotal: string;
  vat: string;
  total: string;
  discount?: string | null;
  customerNote?: string | null;
  ctaUrl?: string;
  phoneNumber?: string;
}

export function QuoteProposal({
  customerName,
  reference,
  vanTitle,
  kitName,
  upgradeNames = [],
  subtotal,
  vat,
  total,
  discount,
  customerNote,
  ctaUrl,
  phoneNumber = '0151 203 8500',
}: QuoteProposalProps) {
  const configRows: Array<[string, string]> = [];
  if (vanTitle) configRows.push(['Van', vanTitle]);
  if (kitName) configRows.push(['Equipment Pack', kitName]);
  upgradeNames.forEach(u => configRows.push(['Upgrade', u]));

  const pricingRows: Array<[string, string]> = [['Subtotal (ex. VAT)', subtotal]];
  if (discount) pricingRows.push(['Discount Applied', discount]);
  pricingRows.push(['VAT (20%)', vat]);

  return (
    <BaseEmail previewText={`Your van conversion summary — Ref #${reference}`}>
      <EmailHeading>Your Van Conversion Summary</EmailHeading>

      <EmailParagraph>Hi {customerName},</EmailParagraph>
      <EmailParagraph>
        Thank you for speaking with us. As discussed, please find below a summary of your configured mobile tyre van conversion.
      </EmailParagraph>

      <EmailRefBox
        reference={reference}
        subText="Please quote this reference in any future correspondence."
      />

      {discount && (
        <EmailSavingsBadge>Special Discount Applied — You Save {discount}</EmailSavingsBadge>
      )}

      {configRows.length > 0 && (
        <>
          <EmailSectionTitle>Your Configuration</EmailSectionTitle>
          <EmailTable rows={configRows} />
        </>
      )}

      <EmailSectionTitle>Pricing</EmailSectionTitle>
      <EmailTable rows={pricingRows} />
      <EmailTotalRow label="Total (inc. VAT)" value={total} />

      {customerNote && (
        <EmailNote title="Note from our team">
          {customerNote}
        </EmailNote>
      )}

      {ctaUrl && (
        <EmailCta href={ctaUrl}>Review &amp; Confirm Quote</EmailCta>
      )}

      <Section style={{ margin: '24px 0 0' }}>
        <Text style={paragraphStyle}>
          If you have any questions or would like to make changes, please call us on{' '}
          <Link href={`tel:${phoneNumber.replace(/\s/g, '')}`} style={{ color: '#8bc440' }}>
            {phoneNumber}
          </Link>{' '}
          or reply to this email.
        </Text>
        <Text style={paragraphStyle}>
          Best regards,<br />
          <strong>Mobile Tyre Van City</strong><br />
          5–7 Bassendale Road, Bromborough, Wirral, CH62 3QL
        </Text>
      </Section>

      <Section style={{ borderTop: '1px solid #e5e7eb', marginTop: '24px', paddingTop: '16px' }}>
        <Text style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
          If you did not request this summary, please disregard this email.
        </Text>
      </Section>
    </BaseEmail>
  );
}
