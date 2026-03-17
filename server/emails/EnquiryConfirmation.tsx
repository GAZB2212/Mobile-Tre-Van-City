import * as React from 'react';
import {
  BaseEmail,
  EmailHeading,
  EmailParagraph,
  EmailRefBox,
  EmailSectionTitle,
  EmailTable,
  EmailTotalRow,
  paragraphStyle,
} from './BaseEmail';
import { Section, Text, Link } from '@react-email/components';

export interface EnquiryConfirmationProps {
  customerName: string;
  reference: string;
  vanTitle?: string | null;
  kitName?: string | null;
  upgradeNames?: string[];
  subtotal: string;
  vat: string;
  total: string;
  phoneNumber?: string;
  configuratorLink?: string;
}

export function EnquiryConfirmation({
  customerName,
  reference,
  vanTitle,
  kitName,
  upgradeNames = [],
  subtotal,
  vat,
  total,
  phoneNumber = '0151 203 8500',
  configuratorLink = 'https://www.mobiletyrevancity.co.uk/configurator',
}: EnquiryConfirmationProps) {
  const configRows: Array<[string, string]> = [];
  if (vanTitle) configRows.push(['Van', vanTitle]);
  if (kitName) configRows.push(['Equipment Pack', kitName]);
  if (upgradeNames.length > 0) configRows.push(['Upgrades', upgradeNames.join(', ')]);

  return (
    <BaseEmail previewText={`We've received your enquiry — Ref #${reference}`}>
      <EmailHeading>We've received your enquiry</EmailHeading>

      <EmailParagraph>Hi {customerName},</EmailParagraph>
      <EmailParagraph>
        Thank you for completing our van configurator. We've received your enquiry and one of our team will be in touch within 24 hours to discuss your requirements.
      </EmailParagraph>

      <EmailRefBox
        reference={reference}
        subText="Please quote this reference in any correspondence with us."
      />

      {configRows.length > 0 && (
        <>
          <EmailSectionTitle>Your Configuration</EmailSectionTitle>
          <EmailTable rows={configRows} />
        </>
      )}

      <EmailSectionTitle>Estimated Pricing</EmailSectionTitle>
      <EmailTable
        rows={[
          ['Subtotal (ex. VAT)', subtotal],
          ['VAT (20%)', vat],
        ]}
      />
      <EmailTotalRow label="Total (inc. VAT)" value={total} />

      <Section style={{ margin: '28px 0 0' }}>
        <Text style={paragraphStyle}>
          If you have any questions in the meantime, please call us on{' '}
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
          If you did not submit this enquiry, please disregard this email.
        </Text>
      </Section>
    </BaseEmail>
  );
}
