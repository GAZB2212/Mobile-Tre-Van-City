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
const GRAY_TEXT = '#6b7280';
const BORDER_COLOR = '#e5e7eb';
const BG_LIGHT = '#f5f5f5';

export interface BaseEmailProps {
  previewText: string;
  eyebrow?: string;
  children: React.ReactNode;
}

export function BaseEmail({ previewText, eyebrow = 'Custom-Built & Ready to Earn', children }: BaseEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          a { color: ${BRAND_GREEN}; }
          .footer-link { color: ${BRAND_GREEN} !important; text-decoration: underline !important; }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>

          {/* ── Header ─────────────────────────────────────────── */}
          <Section style={headerStyle}>
            <Text style={eyebrowStyle}>{eyebrow}</Text>
            <Text style={logoStyle}>Mobile Tyre Van City</Text>
            <Text style={headerSubStyle}>
              <Link href="https://www.mobiletyrevancity.co.uk" style={headerLinkStyle}>
                www.mobiletyrevancity.co.uk
              </Link>
            </Text>
          </Section>

          {/* ── Main card ──────────────────────────────────────── */}
          <Section style={cardStyle}>
            {children}
          </Section>

          {/* ── Footer ─────────────────────────────────────────── */}
          <Section style={footerWrap}>
            <Hr style={footerHr} />
            <Text style={footerBrandText}>Mobile Tyre Van City</Text>
            <Text style={footerDetailText}>5–7 Bassendale Road, Bromborough, Wirral, CH62 3QL</Text>
            <Text style={footerDetailText}>
              <Link href="tel:01512038500" style={footerInlineLinkStyle}>0151 203 8500</Link>
            </Text>
            <Text style={footerNavText}>
              <Link href="https://www.mobiletyrevancity.co.uk/vans" style={footerInlineLinkStyle}>Our Vans</Link>
              {'  ·  '}
              <Link href="https://www.mobiletyrevancity.co.uk/configurator" style={footerInlineLinkStyle}>Van Configurator</Link>
              {'  ·  '}
              <Link href="https://www.mobiletyrevancity.co.uk/finance" style={footerInlineLinkStyle}>Finance</Link>
            </Text>
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
      <Text style={refBoxHeadStyle}>
        Reference: <strong style={{ color: BRAND_DARK }}>#{reference}</strong>
      </Text>
      {subText && <Text style={refBoxSubStyle}>{subText}</Text>}
    </Section>
  );
}

export function EmailSectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={sectionTitleStyle}>{children}</Text>;
}

export function EmailTable({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <Section style={tableWrapStyle}>
      {rows.map(([label, value], i) => (
        <Row key={i} style={i < rows.length - 1 ? tableRowStyle : tableRowLastStyle}>
          <Column style={tableLabelStyle}>{label}</Column>
          <Column style={tableValueStyle}>{value}</Column>
        </Row>
      ))}
    </Section>
  );
}

export function EmailTotalRow({ label, value }: { label: string; value: string }) {
  return (
    <Section style={totalWrapStyle}>
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
  backgroundColor: '#ebebeb',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  margin: 0,
  padding: '40px 0',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  borderRadius: '10px',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: BRAND_DARK,
  padding: '36px 48px 28px',
  textAlign: 'center',
};

const eyebrowStyle: React.CSSProperties = {
  color: BRAND_GREEN,
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  margin: '0 0 10px',
};

const logoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '800',
  margin: '0 0 8px',
  letterSpacing: '-0.5px',
  lineHeight: '1.2',
};

const headerSubStyle: React.CSSProperties = {
  margin: '0',
  fontSize: '13px',
};

const headerLinkStyle: React.CSSProperties = {
  color: '#888888',
  textDecoration: 'none',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '40px 48px',
};

const footerWrap: React.CSSProperties = {
  backgroundColor: '#f9f9f9',
  padding: '4px 48px 32px',
  borderTop: `3px solid ${BRAND_GREEN}`,
  textAlign: 'center',
};

const footerHr: React.CSSProperties = {
  borderColor: BORDER_COLOR,
  margin: '0 0 20px',
};

const footerBrandText: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '13px',
  fontWeight: '700',
  margin: '0 0 4px',
};

const footerDetailText: React.CSSProperties = {
  color: GRAY_TEXT,
  fontSize: '12px',
  margin: '0 0 4px',
  lineHeight: '1.5',
};

const footerNavText: React.CSSProperties = {
  color: GRAY_TEXT,
  fontSize: '12px',
  margin: '12px 0 0',
  lineHeight: '1.5',
};

const footerInlineLinkStyle: React.CSSProperties = {
  color: BRAND_GREEN,
  textDecoration: 'underline',
  fontWeight: '500',
};

export const headingStyle: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '24px',
  fontWeight: '800',
  margin: '0 0 20px',
  letterSpacing: '-0.4px',
  lineHeight: '1.3',
};

export const paragraphStyle: React.CSSProperties = {
  color: '#333333',
  fontSize: '15px',
  lineHeight: '1.7',
  margin: '0 0 16px',
};

const ctaSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '32px 0',
};

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: BRAND_GREEN,
  color: BRAND_DARK,
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: '700',
  padding: '16px 48px',
  borderRadius: '6px',
  textDecoration: 'none',
  letterSpacing: '0.01em',
};

const refBoxStyle: React.CSSProperties = {
  backgroundColor: '#f0f7e6',
  borderLeft: `4px solid ${BRAND_GREEN}`,
  padding: '14px 20px',
  borderRadius: '4px',
  margin: '20px 0',
};

const refBoxHeadStyle: React.CSSProperties = {
  color: GRAY_TEXT,
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
  fontSize: '10px',
  fontWeight: '800',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  borderBottom: `2px solid ${BRAND_GREEN}`,
  paddingBottom: '6px',
  margin: '32px 0 12px',
};

const tableWrapStyle: React.CSSProperties = {
  width: '100%',
  margin: '0 0 4px',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid ' + BORDER_COLOR,
};

const tableRowLastStyle: React.CSSProperties = {};

const tableLabelStyle: React.CSSProperties = {
  color: GRAY_TEXT,
  fontSize: '13px',
  padding: '9px 12px 9px 0',
  width: '42%',
  verticalAlign: 'top',
};

const tableValueStyle: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '13px',
  padding: '9px 0',
  fontWeight: '500',
  verticalAlign: 'top',
};

const totalWrapStyle: React.CSSProperties = {
  borderTop: `2px solid ${BRAND_GREEN}`,
  marginTop: '4px',
  paddingTop: '2px',
};

const totalLabelStyle: React.CSSProperties = {
  color: BRAND_DARK,
  fontSize: '15px',
  fontWeight: '700',
  padding: '12px 12px 12px 0',
};

const totalValueStyle: React.CSSProperties = {
  color: BRAND_GREEN,
  fontSize: '22px',
  fontWeight: '800',
  padding: '10px 0',
};

const noteBoxStyle: React.CSSProperties = {
  backgroundColor: '#eff6ff',
  borderLeft: '4px solid #3b82f6',
  padding: '14px 18px',
  borderRadius: '4px',
  margin: '24px 0',
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
  margin: '16px 0 24px',
};

const savingsTextStyle: React.CSSProperties = {
  color: '#166534',
  fontSize: '14px',
  fontWeight: '700',
  margin: '0',
};
