import { useEffect } from "react";

const SITE_URL = "https://www.mobiletyrevancity.co.uk";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  structuredData?: object | object[];
}

export default function SEO({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  structuredData
}: SEOProps) {
  const fullTitle = `${title} | Tyre Van City`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : (typeof window !== 'undefined' ? `${SITE_URL}${window.location.pathname}` : SITE_URL);

  useEffect(() => {
    document.title = fullTitle;

    const metaTags: Array<{ name?: string; property?: string; content: string }> = [
      { name: 'description', content: description },
      { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: ogImage },
      { property: 'og:site_name', content: 'Tyre Van City' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage }
    ];

    metaTags.forEach(({ name, property, content }) => {
      const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement | null;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (name) meta.setAttribute('name', name);
        if (property) meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    });

    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalUrl);

    // Remove any existing ld+json scripts
    document.querySelectorAll('script[type="application/ld+json"]').forEach(s => s.remove());
    
    if (structuredData) {
      const items = Array.isArray(structuredData) ? structuredData : [structuredData];
      items.forEach(data => {
        const script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
      });
    }
  }, [fullTitle, description, canonicalUrl, ogType, ogImage, noindex, structuredData]);

  return null;
}

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "AutomotiveBusiness",
  "name": "Tyre Van City",
  "description": "Premium mobile tyre van conversions and equipment specialists in the UK",
  "url": SITE_URL,
  "logo": `${SITE_URL}/logo.png`,
  "telephone": "+44-151-203-8500",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+44-151-203-8500",
    "contactType": "Sales",
    "areaServed": "GB",
    "availableLanguage": "English"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "5-7 Bassendale Road",
    "addressLocality": "Bromborough",
    "addressRegion": "Wirral",
    "postalCode": "CH62 3QL",
    "addressCountry": "GB"
  },
  "sameAs": []
};

export function createVehicleStructuredData(van: {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  slug: string;
  heroImage?: string | null;
  images?: string[];
  specs?: { fuel?: string; transmission?: string };
  description?: string;
}) {
  const vanName = `${van.year} ${van.make} ${van.model}`;
  const metaDescription = `For sale: ${vanName}. A fully equipped mobile tyre van conversion${van.mileage ? ` with ${van.mileage.toLocaleString()} miles` : ''}. ${van.specs?.transmission || ''}, ${van.specs?.fuel || ''}. Finance available. Enquire now!`;
  const image = van.heroImage || (van.images && van.images[0]) || `${SITE_URL}/og-image.jpg`;
  const pageUrl = `${SITE_URL}/stock/${van.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "name": vanName,
    "description": van.description || metaDescription,
    "image": image,
    "brand": {
      "@type": "Brand",
      "name": van.make
    },
    "model": van.model,
    "vehicleModelDate": String(van.year),
    ...(van.mileage && {
      "mileageFromOdometer": {
        "@type": "QuantitativeValue",
        "value": van.mileage,
        "unitCode": "SMI"
      }
    }),
    ...(van.specs?.fuel && { "fuelType": van.specs.fuel }),
    ...(van.specs?.transmission && { "vehicleTransmission": van.specs.transmission }),
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": van.price / 100,
      "availability": "https://schema.org/InStock",
      "url": pageUrl
    }
  };
}

export function createProductStructuredData(van: {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
  description?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${van.year} ${van.make} ${van.model} - Mobile Tyre Van Conversion`,
    "description": van.description || `Professional mobile tyre van conversion based on ${van.year} ${van.make} ${van.model}`,
    "image": van.image || `${SITE_URL}/og-image.jpg`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": van.price / 100,
      "availability": "https://schema.org/InStock",
      "url": `${SITE_URL}/stock/${van.id}`
    },
    "brand": {
      "@type": "Brand",
      "name": van.make
    }
  };
}

export function createBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${SITE_URL}${item.url}`
    }))
  };
}
