import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Link,
  Hr,
} from '@react-email/components';

const BRAND_GREEN = '#8bc440';
const BRAND_DARK = '#191919';
const BRAND_DARK_SECONDARY = '#2a2a2a';
const GRAY_TEXT = '#6b7280';
const BORDER_COLOR = '#e5e7eb';

export interface BaseEmailProps {
  previewText: string;
  eyebrow?: string;
  children: React.ReactNode;
}

export function BaseEmail({ previewText, eyebrow = 'Custom-Built & Ready to Earn', children }: BaseEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* Header */}
          <Section style={headerStyle}>
            {eyebrow && (
              <Text style={eyebrowStyle}>{eyebrow}</Text>
            )}
            <Text style={logoStyle}>Mobile Tyre Van City</Text>
            <Text style={headerSubStyle}>www.mobiletyrevancity.co.uk</Text>
          </Section>

          {/* Main card */}
          <Section style={cardStyle}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Hr style={footerDivider} />
            <Text style={footerBrand}>Mobile Tyre Van City</Text>
            <Text style={footerAddress}>
              5–7 Bassendale Road, Bromborough, Wirral, CH62 3QL
            </Text>
            <Text style={footerPhone}>
              <Link href="tel:01512038500" style={footerLinkStyle}>0151 203 8500</Link>
            </Text>
            <Row style={footerLinksRow}>
              <Column>
                <Link href="https://www.mobiletyrevancity.co.uk/vans" style={footerLinkStyle}>Our Vans</Link>
              </Column>
              <Column>
                <Text style={footerDotSep}>&bull;</Text>
              </Column>
              <Column>
                <Link href="https://www.mobiletyrevancity.co.uk/configurator" style={footerLinkStyle}>Van Configurator</Link>
              </Column>
              <Column>
                <Text style={footerDotSep}>&bull;</Text>
              </Column>
              <Column>
                <Link href="https://www.mobiletyrevancity.co.uk/finance" style={footerLinkStyle}>Finance</Link>
              </Column>
            </Row>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ── Shared component helpers ──────────────────────────────────────────────────

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return <Text style={headingStyle}>{children}</Text>;
}

export function EmailParagraph({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <Text style={{ ...paragraphStyle, ...style }}>{children}</Text>;
}

export function EmailCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={ctaSectionStyle}>
      <Link href={href} style={ctaButtonStyle}>{children}</Link>
    </Section>
  );
}

export function EmailRefBox({ reference, subText }: { reference: string; subText?: string }) {
  return (
    <Section style={refBoxStyle}>
      <Text style={refBoxTextStyle}><strong>Reference:</strong> #{reference}</Text>
      {subText && <Text style={refBoxSubStyle}>{subText}</Text>}
    </Section>
  );
}

export function EmailSectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={sectionTitleStyle}>{children}</Text>;
}

export function EmailTable({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <Section style={tableContainerStyle}>
      {rows.map(([label, value], i) => (
        <Row key={i} style={tableRowStyle}>
          <Column style={tableLabelStyle}>{label}</Column>
          <Column style={tableValueStyle}>{value}</Column>
        </Row>
      ))}
    </Section>
  );
}

export function EmailTotalRow({ label, value }: { label: string; value: string }) {
  return (
    <Section style={totalRowContainerStyle}>
      <Row>
        <Column style={totalLabelStyle}>{label}</Column>
        <Column style={totalValueStyle}>{value}</Column>
      </Row>
    </Section>
  );
}

export function EmailNote({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Section style={noteBoxStyle}>
      {title && <Text style={noteTitleStyle}>{title}</Text>}
      <Text style={noteBodyStyle}>{children}</Text>
    </Section>
  );
}

export function EmailSavingsBadge({ children }: { children: React.ReactNode }) {
  return (
    <Section style={savingsBadgeStyle}>
      <Text style={savingsTextStyle}>{children}</Text>
    </Section>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f0f0f0',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: '32px 0',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: BRAND_DARK,
  padding: '32px 40px 24px',
  textAlign: 'center',
  borderRadius: '8px 8px 0 0',
};

const eyebrowStyle: React.CSSProperties = {
  color: BRAND_GREEN,
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  margin: '0 0 8px',
};

const logoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '26px',
  fontWeight: '800',
  margin: '0',
  letterSpacing: '-0.5px',
};

const headerSubStyle: React.CSSProperties = {
  color: '#888888',
  fontSize: '13px',
  margin: '6px 0 0',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '36px 40px',
  borderLeft: '1px solid ' + BORDER_COLOR,
  borderRight: '1px solid ' + BORDER_COLOR,
};

const footerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '0 40px 32px',
  textAlign: 'center',
  borderLeft: '1px solid ' + BORDER_COLOR,
  borderRight: '1px solid ' + BORDER_COLOR,
  borderBottom: '1px solid ' + BORDER_COLOR,
  borderRadius: '0 0 8px 8px',
};

const footerDivider: React.CSSProperties = {
  borderColor: BORDER_COLOR,
  margin: '0 0 20px',
};

const footerBrand: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '13px',
  fontWeight: '700',
  margin: '0 0 4px',
};

const footerAddress: React.CSSProperties = {
  color: GRAY_TEXT,
  fontSize: '12px',
  margin: '0 0 4px',
};

const footerPhone: React.CSSProperties = {
  color: GRAY_TEXT,
  fontSize: '12px',
  margin: '0 0 12px',
};

const footerLinksRow: React.CSSProperties = {
  textAlign: 'center',
};

const footerLinkStyle: React.CSSProperties = {
  color: BRAND_GREEN,
  fontSize: '12px',
  textDecoration: 'none',
};

const footerDotSep: React.CSSProperties = {
  color: GRAY_TEXT,
  fontSize: '12px',
  margin: '0 4px',
};

export const headingStyle: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '22px',
  fontWeight: '800',
  margin: '0 0 16px',
  letterSpacing: '-0.3px',
};

export const paragraphStyle: React.CSSProperties = {
  color: '#333333',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0',
};

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: BRAND_GREEN,
  color: BRAND_DARK,
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: '700',
  padding: '14px 40px',
  borderRadius: '6px',
  textDecoration: 'none',
  letterSpacing: '0.01em',
};

const refBoxStyle: React.CSSProperties = {
  backgroundColor: '#f8f8f8',
  borderLeft: `4px solid ${BRAND_GREEN}`,
  padding: '14px 20px',
  borderRadius: '4px',
  margin: '20px 0',
};

const refBoxTextStyle: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '14px',
  margin: '0',
};

const refBoxSubStyle: React.CSSProperties = {
  color: GRAY_TEXT,
  fontSize: '12px',
  margin: '6px 0 0',
};

const sectionTitleStyle: React.CSSProperties = {
  color: GRAY_TEXT,
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  borderBottom: `2px solid ${BRAND_GREEN}`,
  paddingBottom: '6px',
  margin: '28px 0 12px',
};

const tableContainerStyle: React.CSSProperties = {
  width: '100%',
  margin: '0 0 8px',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid ' + BORDER_COLOR,
};

const tableLabelStyle: React.CSSProperties = {
  color: GRAY_TEXT,
  fontSize: '13px',
  padding: '8px 12px 8px 0',
  width: '40%',
  verticalAlign: 'top',
};

const tableValueStyle: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '13px',
  padding: '8px 0',
  fontWeight: '500',
};

const totalRowContainerStyle: React.CSSProperties = {
  borderTop: `2px solid ${BRAND_GREEN}`,
  margin: '4px 0 0',
  paddingTop: '4px',
};

const totalLabelStyle: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '16px',
  fontWeight: '700',
  padding: '10px 12px 10px 0',
};

const totalValueStyle: React.CSSProperties = {
  color: BRAND_GREEN,
  fontSize: '20px',
  fontWeight: '800',
  padding: '10px 0',
};

const noteBoxStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #3b82f6',
  padding: '14px 18px',
  borderRadius: '4px',
  margin: '20px 0',
};

const noteTitleStyle: React.CSSProperties = {
  color: '#1e40af',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0 0 6px',
};

const noteBodyStyle: React.CSSProperties = {
  color: '#1e3a8a',
  fontSize: '13px',
  margin: '0',
  lineHeight: '1.6',
};

const savingsBadgeStyle: React.CSSProperties = {
  backgroundColor: '#dcfce7',
  padding: '12px 18px',
  borderRadius: '6px',
  margin: '16px 0',
};

const savingsTextStyle: React.CSSProperties = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0',
};
