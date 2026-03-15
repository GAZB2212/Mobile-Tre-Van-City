import { useEffect } from "react";

const SITE_URL = "https://www.mobiletyrevancity.co.uk";
const SITE_NAME = "Mobile Tyre Van City";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  keywords?: string;
  structuredData?: object | object[];
}

export default function SEO({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  keywords,
  structuredData
}: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : (typeof window !== 'undefined' ? `${SITE_URL}${window.location.pathname}` : SITE_URL);

  useEffect(() => {
    document.title = fullTitle;

    const metaTags: Array<{ name?: string; property?: string; content: string }> = [
      { name: 'description', content: description },
      { name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' },
      { name: 'author', content: SITE_NAME },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:type', content: ogType },
      { property: 'og:url', content: canonicalUrl },
      { property: 'og:image', content: ogImage },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:locale', content: 'en_GB' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: ogImage },
    ];

    if (keywords) {
      metaTags.push({ name: 'keywords', content: keywords });
    }

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

    let linkHreflang = document.querySelector('link[rel="alternate"][hreflang="en-gb"]') as HTMLLinkElement | null;
    if (!linkHreflang) {
      linkHreflang = document.createElement('link');
      linkHreflang.setAttribute('rel', 'alternate');
      linkHreflang.setAttribute('hreflang', 'en-gb');
      document.head.appendChild(linkHreflang);
    }
    linkHreflang.setAttribute('href', canonicalUrl);

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
  }, [fullTitle, description, canonicalUrl, ogType, ogImage, noindex, keywords, structuredData]);

  return null;
}

export const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "AutomotiveBusiness",
  "name": SITE_NAME,
  "alternateName": "MTVC",
  "description": "The UK's leading mobile tyre van conversion specialists. Custom-built mobile tyre vans, fully equipped and ready to earn from day one. Nationwide delivery across the UK.",
  "url": SITE_URL,
  "logo": `${SITE_URL}/favicon.png`,
  "image": `${SITE_URL}/og-image.jpg`,
  "telephone": "+44-151-203-8500",
  "priceRange": "££",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "17:30"
    }
  ],
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
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "53.3328",
    "longitude": "-2.9888"
  },
  "areaServed": {
    "@type": "Country",
    "name": "United Kingdom"
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Mobile Tyre Van Conversions",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Mobile Tyre Van Conversion",
          "description": "Professional mobile tyre van conversions with full equipment fit-out, custom branding, and nationwide delivery."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Van Finance",
          "description": "Flexible finance options for mobile tyre van purchases. FCA authorised credit broker."
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Tyre Fitting Training",
          "description": "Professional tyre fitting and REACT motorway certification training programmes."
        }
      }
    ]
  },
  "sameAs": []
};

export const homeFaqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does a mobile tyre van conversion cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our mobile tyre van conversions start from a competitively priced base package and vary depending on the van model, equipment specification, and upgrades selected. Use our online configurator to build your ideal van and get an instant price. Finance is available subject to status."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer nationwide delivery?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, we offer nationwide delivery across the whole of the UK. All vans are fully built and tested at our Wirral workshop before being delivered directly to you."
      }
    },
    {
      "@type": "Question",
      "name": "Can I finance a mobile tyre van?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. We work with a panel of lenders and are an FCA authorised credit broker. We offer flexible finance options including hire purchase and lease agreements, allowing you to spread the cost of your new mobile tyre van."
      }
    },
    {
      "@type": "Question",
      "name": "What equipment is included with the van conversion?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Our van conversions include a professional equipment kit fitted to your chosen van, including tyre fitting equipment, compressors, racking systems, and more. You can customise the specification using our online configurator to add upgrades and optional extras."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer training for mobile tyre fitting?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. We offer a comprehensive training programme including professional tyre fitting courses and REACT motorway safety certification, so you can operate safely and legally from day one."
      }
    },
    {
      "@type": "Question",
      "name": "Where are you based?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We are based at 5-7 Bassendale Road, Bromborough, Wirral, CH62 3QL. You can call us on 0151 203 8500 or use our online configurator to start your build from anywhere in the UK."
      }
    }
  ]
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
  const metaDescription = `For sale: ${vanName} mobile tyre van conversion. Fully equipped and ready to earn${van.mileage ? ` — ${van.mileage.toLocaleString()} miles` : ''}. ${van.specs?.transmission || ''} ${van.specs?.fuel || ''}. Finance available. UK delivery.`;
  const image = van.heroImage || (van.images && van.images[0]) || `${SITE_URL}/og-image.jpg`;
  const pageUrl = `${SITE_URL}/stock/${van.slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "name": `${vanName} - Mobile Tyre Van Conversion`,
    "description": van.description || metaDescription,
    "image": image,
    "brand": {
      "@type": "Brand",
      "name": van.make
    },
    "model": van.model,
    "vehicleModelDate": String(van.year),
    "vehicleSpecialUsage": "Commercial",
    ...(van.mileage && {
      "mileageFromOdometer": {
        "@type": "QuantitativeValue",
        "value": van.mileage,
        "unitCode": "SMI"
      }
    }),
    ...(van.specs?.fuel && { "fuelType": van.specs.fuel }),
    ...(van.specs?.transmission && { "vehicleTransmission": van.specs.transmission }),
    "seller": {
      "@type": "AutomotiveBusiness",
      "name": SITE_NAME,
      "telephone": "+44-151-203-8500",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "5-7 Bassendale Road",
        "addressLocality": "Bromborough",
        "addressRegion": "Wirral",
        "postalCode": "CH62 3QL",
        "addressCountry": "GB"
      }
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": van.price / 100,
      "availability": "https://schema.org/InStock",
      "url": pageUrl,
      "seller": {
        "@type": "AutomotiveBusiness",
        "name": SITE_NAME
      }
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
    "description": van.description || `Professional mobile tyre van conversion based on ${van.year} ${van.make} ${van.model}. Fully equipped and ready for work.`,
    "image": van.image || `${SITE_URL}/og-image.jpg`,
    "brand": {
      "@type": "Brand",
      "name": van.make
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": van.price / 100,
      "availability": "https://schema.org/InStock",
      "url": `${SITE_URL}/stock/${van.id}`
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

export function createServiceStructuredData(service: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": service.name,
    "name": service.name,
    "description": service.description,
    "url": `${SITE_URL}${service.url}`,
    "provider": {
      "@type": "AutomotiveBusiness",
      "name": SITE_NAME,
      "telephone": "+44-151-203-8500",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "5-7 Bassendale Road",
        "addressLocality": "Bromborough",
        "addressRegion": "Wirral",
        "postalCode": "CH62 3QL",
        "addressCountry": "GB"
      }
    },
    "areaServed": {
      "@type": "Country",
      "name": "United Kingdom"
    }
  };
}
